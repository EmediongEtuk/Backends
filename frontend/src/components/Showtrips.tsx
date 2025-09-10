import type { Trip, DailyLog } from "../types";
import { getTrips, generateLogs } from "../api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ShowtripsProps {
    setLogs: React.Dispatch<React.SetStateAction<DailyLog[]>>;
    setTrip: React.Dispatch<React.SetStateAction<Trip | null>>;
}

export default function Showtrips({ setLogs, setTrip }: ShowtripsProps) {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false); // ✅ add loading state
    const tripsPerPage = 5;
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const res = await getTrips();
                setTrips(res.data);
            } catch (err) {
                console.error("Error fetching trips:", err);
            }
        };
        fetchTrips();
    }, []);

    const handleGenerateLogs = async (trp: Trip) => {
        console.log("Selected trip for logs:", trp);
        setTrip(trp);
        setLoading(true); // ✅ start loading
        try {
            const res = await generateLogs(trp.id);
            setLogs(res.data);
            console.log("Generated logs:", res.data);
            navigate(`/logs`);
        } catch (err) {
            console.error("Error generating logs:", err);
        } finally {
            setLoading(false); // ✅ stop loading
        }
    };

    // pagination logic
    const indexOfLastTrip = currentPage * tripsPerPage;
    const indexOfFirstTrip = indexOfLastTrip - tripsPerPage;
    const currentTrips = trips.slice(indexOfFirstTrip, indexOfLastTrip);
    const totalPages = Math.ceil(trips.length / tripsPerPage);

    return (
        <div style={{ position: "relative" }}>
            <h3 className="mb-3">Trips</h3>
            <hr />

            {/* ✅ Loading Overlay */}
            {loading && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(255,255,255,0.8)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                >
                    <div className="spinner-border text-primary" role="status" />
                    <p className="mt-2">Generating logs...</p>
                </div>
            )}

            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>Current Location</th>
                        <th>Pickup Location</th>
                        <th>Dropoff Location</th>
                        <th>Current Cycle Hours</th>
                        <th>Logs</th>
                    </tr>
                </thead>
                <tbody>
                    {currentTrips.map((trip) => (
                        <tr key={trip.id}>
                            <td>{trip.current_location}</td>
                            <td>{trip.pickup_location}</td>
                            <td>{trip.dropoff_location}</td>
                            <td>{trip.current_cycle_hours}</td>
                            <td>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleGenerateLogs(trip)}
                                >
                                    Logs
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination controls */}
            <nav>
                <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button
                            className="page-link"
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                    </li>

                    {Array.from({ length: totalPages }, (_, i) => (
                        <li
                            key={i}
                            className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                        >
                            <button
                                className="page-link"
                                onClick={() => setCurrentPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        </li>
                    ))}

                    <li
                        className={`page-item ${currentPage === totalPages ? "disabled" : ""
                            }`}
                    >
                        <button
                            className="page-link"
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
}
