import React, { useMemo } from 'react';

interface ActivityGraphProps {
  data?: { date: string; count: number }[];
  mixedData?: { date: string; blueCount: number; emeraldCount: number }[];
  theme?: 'emerald' | 'blue' | 'mixed';
}

// Helper to format Date as "YYYY-MM-DD" in IST
const getISTDateString = (d: Date) => {
  // Add 5 hours and 30 minutes to UTC to get IST
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (3600000 * 5.5));
  
  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, '0');
  const day = String(ist.getDate()).padStart(2, '0');
  
  return { dateStr: `${year}-${month}-${day}`, monthObj: ist.getMonth(), yearObj: ist.getFullYear() };
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ActivityGraph({ data = [], mixedData = [], theme = 'emerald' }: ActivityGraphProps) {
  // Generate last 365 days in IST
  const { days, months } = useMemo(() => {
    const todayLocal = new Date();
    // Start by finding today in IST
    const utcToday = todayLocal.getTime() + (todayLocal.getTimezoneOffset() * 60000);
    const todayIST = new Date(utcToday + (3600000 * 5.5));
    
    const lastYearIST = new Date(todayIST.getFullYear(), todayIST.getMonth(), todayIST.getDate() - 364);
    
    const dataMap = new Map<string, number>();
    data.forEach(d => dataMap.set(d.date, d.count));

    const mixedMap = new Map<string, { blueCount: number; emeraldCount: number }>();
    mixedData.forEach(d => mixedMap.set(d.date, { blueCount: d.blueCount, emeraldCount: d.emeraldCount }));

    const result = [];
    const monthLabels: { label: string; colIndex: number }[] = [];
    let currentMonth = -1;
    let colIndex = 0;

    // We'll pad the beginning of the first week so it starts on Sunday
    const startDay = lastYearIST.getDay();
    let currentWeekLen = startDay;

    for (let d = new Date(lastYearIST); d <= todayIST; d.setDate(d.getDate() + 1)) {
      const { dateStr, monthObj } = getISTDateString(d);
      
      // If it's a new month and it's near the start of the week, or the very first item, track the month
      if (monthObj !== currentMonth) {
        monthLabels.push({ label: MONTH_NAMES[monthObj], colIndex });
        currentMonth = monthObj;
      }

      if (theme === 'mixed') {
        const m = mixedMap.get(dateStr) || { blueCount: 0, emeraldCount: 0 };
        result.push({
          date: dateStr,
          count: m.blueCount + m.emeraldCount,
          blueCount: m.blueCount,
          emeraldCount: m.emeraldCount,
        });
      } else {
        result.push({
          date: dateStr,
          count: dataMap.get(dateStr) || 0,
          blueCount: 0,
          emeraldCount: 0,
        });
      }

      currentWeekLen++;
      if (currentWeekLen === 7) {
        currentWeekLen = 0;
        colIndex++;
      }
    }
    return { days: result, months: monthLabels };
  }, [data, mixedData, theme]);

  // Group into weeks for the CSS grid
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

  // Determine color intensity based on count
  const getColor = (day: any) => {
    if (theme === 'mixed') {
      if (day.blueCount === 0 && day.emeraldCount === 0) return 'bg-white/5 border border-white/5';
      if (day.blueCount > 0 && day.emeraldCount > 0) return 'bg-gradient-to-br from-blue-500 to-emerald-500 border border-emerald-400/50';
      if (day.blueCount > 0) {
        if (day.blueCount <= 2) return 'bg-blue-900 border border-blue-800';
        if (day.blueCount <= 5) return 'bg-blue-700 border border-blue-600';
        if (day.blueCount <= 10) return 'bg-blue-500 border border-blue-400';
        return 'bg-blue-400 border border-blue-300';
      }
      if (day.emeraldCount > 0) {
        if (day.emeraldCount <= 2) return 'bg-emerald-900 border border-emerald-800';
        if (day.emeraldCount <= 5) return 'bg-emerald-700 border border-emerald-600';
        if (day.emeraldCount <= 10) return 'bg-emerald-500 border border-emerald-400';
        return 'bg-emerald-400 border border-emerald-300';
      }
    }

    if (day.count === 0) return 'bg-white/5 border border-white/5';
    if (theme === 'blue') {
      if (day.count <= 2) return 'bg-blue-900 border border-blue-800';
      if (day.count <= 5) return 'bg-blue-700 border border-blue-600';
      if (day.count <= 10) return 'bg-blue-500 border border-blue-400';
      return 'bg-blue-400 border border-blue-300';
    } else {
      if (day.count <= 2) return 'bg-emerald-900 border border-emerald-800';
      if (day.count <= 5) return 'bg-emerald-700 border border-emerald-600';
      if (day.count <= 10) return 'bg-emerald-500 border border-emerald-400';
      return 'bg-emerald-400 border border-emerald-300';
    }
  };

  const getTooltip = (day: any) => {
    if (theme === 'mixed') {
      const parts = [];
      if (day.blueCount > 0) parts.push(`${day.blueCount} tests`);
      if (day.emeraldCount > 0) parts.push(`${day.emeraldCount} questions`);
      if (parts.length === 0) return `0 activities on ${day.date}`;
      return `${parts.join(' and ')} on ${day.date}`;
    }
    return `${day.count} activities on ${day.date}`;
  };

  return (
    <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
      <div className="min-w-max">
        {/* Months Row */}
        <div className="flex text-[10px] text-zinc-500 mb-1 relative h-4">
          {months.map((m, i) => (
            <div 
              key={i} 
              className="absolute top-0" 
              style={{ left: `${m.colIndex * 16}px` }} // 12px width + 4px gap = 16px per column
            >
              {m.label}
            </div>
          ))}
        </div>
        
        {/* Graph Grid */}
        <div className="flex gap-1">
          {weeks.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-1 w-3">
              {week.map((day, dIndex) => {
                if (!day) return <div key={dIndex} className="w-3 h-3 rounded-sm opacity-0" />;
                return (
                  <div
                    key={day.date}
                    title={getTooltip(day)}
                    className={`w-3 h-3 rounded-sm transition-all hover:scale-125 hover:ring-1 hover:ring-white/50 cursor-pointer ${getColor(day)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-zinc-500">
        {theme === 'mixed' ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500 border border-blue-400" />
              <span>Tests</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-400" />
              <span>Questions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-500 to-emerald-500 border border-emerald-400/50" />
              <span>Both</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-white/5 border border-white/5" />
              <div className={`w-3 h-3 rounded-sm ${theme === 'blue' ? 'bg-blue-900 border-blue-800' : 'bg-emerald-900 border-emerald-800'} border`} />
              <div className={`w-3 h-3 rounded-sm ${theme === 'blue' ? 'bg-blue-700 border-blue-600' : 'bg-emerald-700 border-emerald-600'} border`} />
              <div className={`w-3 h-3 rounded-sm ${theme === 'blue' ? 'bg-blue-500 border-blue-400' : 'bg-emerald-500 border-emerald-400'} border`} />
              <div className={`w-3 h-3 rounded-sm ${theme === 'blue' ? 'bg-blue-400 border-blue-300' : 'bg-emerald-400 border-emerald-300'} border`} />
            </div>
            <span>More</span>
          </div>
        )}
      </div>
    </div>
  );
}
