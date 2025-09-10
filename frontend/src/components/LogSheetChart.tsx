import type { DailyLog, DutySegment } from "../types";

interface Props {
    log: DailyLog;
}

const statusToY: Record<DutySegment["status"], number> = {
    OFF: 0,
    SB: 1,
    D: 2,
    ON: 3,
};

export default function LogSheetChart({ log }: Props) {
    const hours = Array.from({ length: 25 }, (_, i) => i);

    // Convert "HH:MM" -> float hours
    const parseTime = (time: string) => {
        if (!time) return 0;
        const [h, m] = time.split(":").map((n) => parseInt(n, 10));
        return h + (m || 0) / 60;
    };

    return (
        <div className="card my-3">
            <div className="card-body">
                <h5 className="card-title">Day {log.day}</h5>
                <svg
                    width="100%"
                    height="250"
                    viewBox="0 0 24 4"
                    preserveAspectRatio="none"
                >
                    {/* Grid lines */}
                    {hours.map((h) => (
                        <line
                            key={h}
                            x1={h}
                            y1={0}
                            x2={h}
                            y2={4}
                            stroke="#ccc"
                            strokeWidth="0.002"
                        />
                    ))}
                    {[0, 1, 2, 3, 4].map((y) => (
                        <line
                            key={y}
                            x1={0}
                            y1={y}
                            x2={24}
                            y2={y}
                            stroke="#000"
                            strokeWidth="0.03"
                        />
                    ))}

                    {/* Duty Segments */}
                    {log.duty_segments.map((seg, idx) => {
                        const y = statusToY[seg.status];
                        const x1 = parseTime(seg.start);
                        const x2 = parseTime(seg.end);

                        return (
                            <g key={idx}>
                                {/* Horizontal line for segment */}
                                <line
                                    x1={x1}
                                    y1={y + 0.5}
                                    x2={x2}
                                    y2={y + 0.5}
                                    stroke="red"
                                    strokeWidth="0.15"
                                    strokeLinecap="round"
                                />

                                {/* Vertical connector if status changed */}
                                {idx > 0 && (() => {
                                    const prev = log.duty_segments[idx - 1];
                                    const prevY = statusToY[prev.status];
                                    const prevX2 = parseTime(prev.end);
                                    if (prevX2 === x1 && prevY !== y) {
                                        return (
                                            <line
                                                x1={x1}
                                                y1={prevY + 0.5}
                                                x2={x1}
                                                y2={y + 0.5}
                                                stroke="red"
                                                strokeWidth="0.15"
                                            />
                                        );
                                    }
                                    return null;
                                })()}

                                {/*  segment with note */}
                                <text
                                    x={(x1 + x2) / 2}
                                    y={y + 0.2}
                                    fontSize="0.2"
                                    textAnchor="middle"
                                    fill="black"
                                >
                                    {seg.note}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Legend */}
                <div className="mt-2">
                    <span className="badge bg-secondary me-2">OFF</span>
                    <span className="badge bg-secondary me-2">SB</span>
                    <span className="badge bg-secondary me-2">D</span>
                    <span className="badge bg-secondary me-2">ON</span>
                </div>
            </div>
        </div>
    );
}
