"use client";

import { useEffect, useMemo, useState } from "react";

type TestTimerProps = {
  durationMinutes: number;
  startedAt?: Date;
  onExpire?: () => void;
};

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function TestTimer({
  durationMinutes,
  startedAt,
  onExpire,
}: TestTimerProps) {
  const totalSeconds = durationMinutes * 60;
  const baseStartedAt = useMemo(() => startedAt ?? new Date(), [startedAt]);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.floor((now.getTime() - baseStartedAt.getTime()) / 1000);
  const remaining = totalSeconds - elapsed;

  useEffect(() => {
    if (remaining <= 0 && onExpire) onExpire();
  }, [remaining, onExpire]);

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
      <div className="text-xs uppercase tracking-[0.2em] text-red-200/70">
        Time left
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">
        {formatTime(remaining)}
      </div>
    </div>
  );
}
