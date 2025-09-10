import type { DailyLog , Trip} from "../types";
import LogSheetChart from "./LogSheetChart";

interface Props {
    logs: DailyLog[];
    trp: Trip | null;
}

export default function LogSheet({ logs ,trp}: Props) {
    if (!logs?.length) return <p className="text-muted mt-3">No logs available</p>;
    if (!trp) return <p className="text-muted mt-3">No trip selected</p>;
    return (
        <div>
            <h3 className="mb-3">📑 Daily Log Sheets for {trp.pickup_location} to {trp.dropoff_location}</h3>
            {logs.map((log) => (
                <LogSheetChart key={log.id} log={log} />
            ))}
        </div>
    );
}
