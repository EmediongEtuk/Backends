import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { geocodeAddress } from "../utils/geocode";
import type { Trip, Stop } from "../types";

export default function MapView({ trip }: { trip: Trip | null }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!trip || !mapRef.current) return;

        // clear container for fresh render
        mapRef.current.innerHTML = "";

      
        // init map
        const map = L.map(mapRef.current).setView([37.0902, -95.7129], 5); // default USA center

        // add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        const fetchRoute = async () => {
            try {
                setLoading(true);
                // 1. geocode pickup & dropoff
                const pickup = await geocodeAddress(trip.pickup_location);
                const dropoff = await geocodeAddress(trip.dropoff_location);

                // 2. fetch OSRM route
                const res = await axios.get(
                    `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${dropoff[1]},${dropoff[0]}`,
                    { params: { overview: "full", geometries: "geojson" } }
                );

                const routeCoords: [number, number][] = res.data.routes[0].geometry.coordinates.map(
                    (c: number[]) => [c[1], c[0]]
                );

                // 3. add route polyline
                const routeLine = L.polyline(routeCoords, { color: "blue", weight: 4 }).addTo(map);
                map.fitBounds(routeLine.getBounds());

                // 4. add pickup/dropoff markers
                L.marker(pickup).addTo(map).bindPopup(`🚚 Pickup: ${trip.pickup_location}`);
                L.marker(dropoff).addTo(map).bindPopup(`🏁 Dropoff: ${trip.dropoff_location}`);

                // 5. generate rest/fuel stops
                const stops: Stop[] = generateStops(routeCoords);
                stops.forEach((stop) => {
                    L.marker(stop.position).addTo(map).bindPopup(
                        stop.type === "Fuel Stop" ? "⛽ Fuel Stop" : "🛑 Rest Break"
                    );
                });
            } catch (err) {
                console.error("OSRM fetch error:", err);
            }
            finally {
                setLoading(false);
            }
        };

        fetchRoute();

      

        return () => {
            map.remove();
        };
    }, [trip]);

    // === stop logic ===
    const generateStops = (coordinates: [number, number][]): Stop[] => {
        const stops: Stop[] = [];
        let drivenMiles = 0;
        let hoursDriven = 0;
        const avgSpeed = 60;

        for (let i = 1; i < coordinates.length; i++) {
            const seg = haversine(
                coordinates[i - 1][0],
                coordinates[i - 1][1],
                coordinates[i][0],
                coordinates[i][1]
            );

            drivenMiles += seg;
            hoursDriven += seg / avgSpeed;

            if (drivenMiles >= 1000) {
                stops.push({ type: "Fuel Stop", position: coordinates[i] });
                drivenMiles = 0;
            }

            if (hoursDriven >= 8) {
                stops.push({ type: "Rest Break", position: coordinates[i] });
                hoursDriven = 0;
            }
        }
        return stops;
    };

    // haversine formula
    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 3958.8;
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

        return 2 * R * Math.asin(Math.sqrt(a));
    };

    return (
        <div className="card mt-4">
            <div className="card-body">
                <h2 className="h5 mb-3">🗺️ Trip Map</h2>
                <div ref={mapRef} style={{ height: "500px", width: "100%" }} />
                {loading && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "rgba(255,255,255,0.7)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1000,
                            flexDirection: "column",
                        }}
                    >
                        <div className="spinner-border text-primary" role="status" />
                        <p className="mt-2">Loading route...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
