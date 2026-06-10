import React, { useMemo } from 'react';

interface ActivityGraphProps {
  data?: { date: string; count: number }[];
}

export default function ActivityGraph({ data = [] }: ActivityGraphProps) {
  // Generate last 365 days
  const days = useMemo(() => {
    const today = new Date();
    const lastYear = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 364);
    
    const dataMap = new Map<string, number>();
    data.forEach(d => dataMap.set(d.date, d.count));

    const result = [];
    for (let d = new Date(lastYear); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: dataMap.get(dateStr) || 0
      });
    }
    return result;
  }, [data]);

  // Determine color intensity based on count
  const getColor = (count: number) => {
    if (count === 0) return 'bg-white/5 border border-white/5';
    if (count <= 2) return 'bg-emerald-900 border border-emerald-800';
    if (count <= 5) return 'bg-emerald-700 border border-emerald-600';
    if (count <= 10) return 'bg-emerald-500 border border-emerald-400';
    return 'bg-emerald-400 border border-emerald-300';
  };

  // Group into weeks for the CSS grid
  // A standard Github graph has 52 weeks (columns) and 7 days (rows)
  const weeks = useMemo(() => {
    const wks = [];
    let currentWeek: (any | null)[] = [];
    
    // Pad the first week to start on Sunday
    const startDay = new Date(days[0].date).getDay();
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null);
    }

    days.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        wks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      wks.push(currentWeek);
    }
    return wks;
  }, [days]);

  return (
    <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, wIndex) => (
          <div key={wIndex} className="flex flex-col gap-1">
            {week.map((day, dIndex) => {
              if (!day) return <div key={dIndex} className="w-3 h-3 rounded-sm opacity-0" />;
              return (
                <div
                  key={day.date}
                  title={`${day.count} questions on ${day.date}`}
                  className={`w-3 h-3 rounded-sm transition-all hover:scale-125 hover:ring-1 hover:ring-white/50 cursor-pointer ${getColor(day.count)}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-zinc-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-white/5 border border-white/5" />
          <div className="w-3 h-3 rounded-sm bg-emerald-900 border border-emerald-800" />
          <div className="w-3 h-3 rounded-sm bg-emerald-700 border border-emerald-600" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-400" />
          <div className="w-3 h-3 rounded-sm bg-emerald-400 border border-emerald-300" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
