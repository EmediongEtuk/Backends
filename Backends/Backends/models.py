from django.db import models

class Trip(models.Model):
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_hours = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.pickup_location} → {self.dropoff_location}"


class DailyLog(models.Model):
    trip = models.ForeignKey(Trip, related_name="logs", on_delete=models.CASCADE)
    day = models.PositiveIntegerField()
    driving_hours = models.FloatField(default=0)
    on_duty_hours = models.FloatField(default=0)
    off_duty_hours = models.FloatField(default=0)
    sleeper_hours = models.FloatField(default=0)

    # ✅ New: structured duty segments (list of blocks)
    duty_segments = models.JSONField(default=list)

    def __str__(self):
        return f"Day {self.day} - Trip {self.trip.id}"
