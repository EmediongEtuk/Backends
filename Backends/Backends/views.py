from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, viewsets
from .models import Trip, DailyLog
from .serializers import TripSerializer, DailyLogSerializer
import requests

class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all().order_by("-created_at")
    serializer_class = TripSerializer

    @action(detail=True, methods=["post"])
    def generate_logs(self, request, pk=None):
        trip = self.get_object()
        DailyLog.objects.filter(trip=trip).delete()

        # --- Geocode ---
        def geocode(address):
            url = "https://nominatim.openstreetmap.org/search"
            params = {"q": address, "format": "json", "limit": 1}
            headers = {"User-Agent": "BackendsApp/1.0 (contact: emediong.etuks@gmail.com)"}
            res = requests.get(url, params=params, headers=headers, timeout=10)
            res.raise_for_status()
            data = res.json()
            if not data:
                raise ValueError(f"Address not found: {address}")
            return float(data[0]["lat"]), float(data[0]["lon"])

        try:
            pickup_coords = geocode(trip.pickup_location)
            dropoff_coords = geocode(trip.dropoff_location)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # --- OSRM ---
        osrm_url = f"https://router.project-osrm.org/route/v1/driving/{pickup_coords[1]},{pickup_coords[0]};{dropoff_coords[1]},{dropoff_coords[0]}"
        params = {"overview": "false", "geometries": "geojson"}
        osrm_res = requests.get(osrm_url, params=params)
        if osrm_res.status_code != 200:
            return Response({"error": "Failed to fetch route"}, status=502)

        route_data = osrm_res.json()
        if not route_data.get("routes"):
            return Response({"error": "No route found"}, status=404)

        distance_meters = route_data["routes"][0]["distance"]
        distance_miles = distance_meters / 1609.34
        avg_speed = 55
        total_hours = distance_miles / avg_speed

        # --- HOS Simulation ---
        hours_remaining = total_hours
        day = 1
        logs = []
        miles_driven = 0

        while hours_remaining > 0:
            duty_segments = []
            driving_today = 0
            on_duty_today = 0
            off_duty_today = 0

            # Start day with pickup if day 1
            if day == 1:
                duty_segments.append({"status": "ON", "start": "00:00", "end": "01:00", "note": "Pickup"})
                on_duty_today += 1

            time_cursor = 1.0 if day == 1 else 0.0  # track hours of the day

            # Driving + breaks
            while driving_today < 11 and hours_remaining > 0 and time_cursor < 14:
                # Drive segment
                drive_time = min(11 - driving_today, hours_remaining, 8)  # max 8h before break
                start_time = time_cursor
                end_time = time_cursor + drive_time
                duty_segments.append({
                    "status": "D",
                    "start": f"{int(start_time):02d}:00",
                    "end": f"{int(end_time):02d}:00",
                    "note": "Driving"
                })
                driving_today += drive_time
                hours_remaining -= drive_time
                miles_driven += drive_time * avg_speed
                time_cursor = end_time

                # Insert rest break after 8h driving if more left
                if driving_today >= 8 and hours_remaining > 0:
                    duty_segments.append({
                        "status": "OFF",
                        "start": f"{int(time_cursor):02d}:00",
                        "end": f"{int(time_cursor+0.5):02d}:30",
                        "note": "30-min Break"
                    })
                    off_duty_today += 0.5
                    time_cursor += 0.5
                    driving_today = 0  # reset counter after break

                # Insert fuel stop every 1000 miles
                if miles_driven >= 1000:
                    duty_segments.append({
                        "status": "ON",
                        "start": f"{int(time_cursor):02d}:00",
                        "end": f"{int(time_cursor+0.5):02d}:30",
                        "note": "Fuel Stop"
                    })
                    on_duty_today += 0.5
                    time_cursor += 0.5
                    miles_driven = 0

            # Dropoff on last day
            if hours_remaining <= 0:
                duty_segments.append({
                    "status": "ON",
                    "start": f"{int(time_cursor):02d}:00",
                    "end": f"{int(time_cursor+1):02d}:00",
                    "note": "Dropoff"
                })
                on_duty_today += 1
                time_cursor += 1

            # Off duty rest
            duty_segments.append({
                "status": "OFF",
                "start": f"{int(time_cursor):02d}:00",
                "end": "24:00",
                "note": "Daily Rest"
            })
            off_duty_today += 24 - time_cursor

            log = DailyLog.objects.create(
                trip=trip,
                day=day,
                driving_hours=driving_today,
                on_duty_hours=on_duty_today,
                off_duty_hours=off_duty_today,
                sleeper_hours=0,
                duty_segments=duty_segments
            )
            logs.append(log)
            day += 1

        return Response(DailyLogSerializer(logs, many=True).data, status=201)
