// src/types.ts

export interface DutySegment {
    status: "OFF" | "SB" | "D" | "ON";
    start: string;  // e.g. "09:00"
    end: string;    // e.g. "11:30"
    note: string;
}
export interface Trip {
    id: number;
    current_location: string;
    pickup_location: string;
    dropoff_location: string;
    current_cycle_hours: number;
    created_at: string;
}

export interface DailyLog {
    id: number;
    trip: number;
    day: number;
    driving_hours: number;
    on_duty_hours: number;
    off_duty_hours: number;
    sleeper_hours: number;
    duty_segments: DutySegment[],
}

export interface Stop {
    type: "Rest Break" | "Fuel Stop";
    position: [number, number];
}
