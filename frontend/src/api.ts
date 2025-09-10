import axios from "axios";
import type { Trip } from "./types";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
});

export const createTrip = (data: Partial<Trip>) => API.post("/trips/", data);
export const getTrips = () => API.get<Trip[]>("/trips/");
export const generateLogs = (tripId: number) =>
    API.post(`/trips/${tripId}/generate_logs/`);
