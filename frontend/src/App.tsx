import { useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import TripForm from "./components/TripForm";
import MapView from "./components/MapView";
import LogSheet from "./components/LogSheet";
import Showtrips from "./components/Showtrips";
import LogSheetchart from "./components/LogSheetChart";
import { generateLogs } from "./api";
import type { Trip, DailyLog } from "./types";

function App() {
    const [trip, setTrip] = useState<Trip | null>(null);
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const navigate = useNavigate();

    const handleGenerateLogs = async () => {
        if (trip) {
            const res = await generateLogs(trip.id);
            setLogs(res.data);
        }
    };

    return (
        <div className="container py-4">
            <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
                <Link to="/" className="navbar-brand">🚛 Trip Planner</Link>
                <div className="navbar-nav">
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/trips" className="nav-link">Trips</Link>
                    <Link to="/map" className="nav-link">Map</Link>
                    <Link to="/logs" className="nav-link">Logs</Link>
                   
                </div>
            </nav>

            <Routes>
                <Route
                    path="/"
                    element={<TripForm onTripCreated={(t) => { setTrip(t); navigate("/map"); }} />}
                />
                <Route path="/map" element={<MapView trip={trip} />} />
                <Route path="/logs" element={<LogSheet logs={logs} trp={trip} />} />
                <Route path="/trips" element={<Showtrips setLogs={setLogs} setTrip={setTrip} />} />

              

            </Routes>

        
        </div>
    );
}

export default App;
