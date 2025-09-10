import { useState } from "react";
import { createTrip } from "../api";
import type { Trip } from "../types";

interface Props {
    onTripCreated: (trip: Trip) => void;
}

export default function TripForm({ onTripCreated }: Props) {
    const [form, setForm] = useState<Partial<Trip>>({
        current_location: "",
        pickup_location: "",
        dropoff_location: "",
        current_cycle_hours: 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await createTrip(form);
        onTripCreated(res.data);
    };

    return (

        <div className="row">

            <h2 className="h4 mb-3">🚚 Plan a New Trip</h2>
            <hr/>

            <div className="col-md-5">


                <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
                  

                    {["current_location", "pickup_location", "dropoff_location"].map((field) => (
                        <div className="mb-3" key={field}>
                            <label className="form-label text-capitalize">{field.replace("_", " ")}</label>
                            <input
                                name={field}
                                placeholder={field.replace("_", " ")}
                                onChange={handleChange}
                                className="form-control"
                            />
                        </div>
                    ))}

                    <div className="mb-3">
                        <label className="form-label">Current Cycle Hours</label>
                        <input
                            name="current_cycle_hours"
                            type="number"
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div>

                    <button className="btn btn-primary w-100">Create Trip</button>
                </form>

            </div>

        </div>


    );
}
