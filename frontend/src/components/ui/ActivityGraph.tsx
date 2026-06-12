import React, { useMemo, useState } from 'react';

interface ActivityGraphProps {
  data?: { date: string; count: number; details?: { type: string; count: number }[] }[];
  userName?: string;
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

export default function ActivityGraph({ data = [], userName }: ActivityGraphProps) {
  // Generate last 6 months in IST
  const days = useMemo(() => {
    const todayLocal = new Date();
    // Start by finding today in IST
    const utcToday = todayLocal.getTime() + (todayLocal.getTimezoneOffset() * 60000);
    const todayIST = new Date(utcToday + (3600000 * 5.5));
    
    const lastYearIST = new Date(todayIST.getFullYear(), todayIST.getMonth(), todayIST.getDate() - 179);
    
    const dataMap = new Map<string, { count: number; details?: { type: string; count: number }[] }>();
    data.forEach(d => dataMap.set(d.date, { count: d.count, details: d.details }));

    const result = [];

    for (let d = new Date(lastYearIST); d <= todayIST; d.setDate(d.getDate() + 1)) {
      const { dateStr } = getISTDateString(d);
      const dData = dataMap.get(dateStr) || { count: 0, details: [] };
      result.push({
        date: dateStr,
        count: dData.count,
        details: dData.details,
      });
    }
    return result;
  }, [data]);

  // Group into months, then weeks
  const monthBlocks = useMemo(() => {
    const blocks: { monthLabel: string; weeks: (any | null)[][] }[] = [];
    let currentMonthStr = "";
    let currentWeeks: (any | null)[][] = [];
    let currentWeek: (any | null)[] = [];

    days.forEach((day) => {
      const d = new Date(day.date);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      if (mStr !== currentMonthStr) {
        if (currentWeek.length > 0) {
          while (currentWeek.length < 7) currentWeek.push(null);
          currentWeeks.push(currentWeek);
        }
        if (currentMonthStr !== "") {
          const monthIndex = parseInt(currentMonthStr.split('-')[1], 10) - 1;
          blocks.push({ monthLabel: MONTH_NAMES[monthIndex], weeks: currentWeeks });
        }
        currentMonthStr = mStr;
        currentWeeks = [];
        currentWeek = [];
        const startDay = d.getDay();
        for (let i = 0; i < startDay; i++) currentWeek.push(null);
      }

      currentWeek.push(day);
      if (currentWeek.length === 7) {
        currentWeeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      currentWeeks.push(currentWeek);
    }
    if (currentMonthStr !== "") {
      const monthIndex = parseInt(currentMonthStr.split('-')[1], 10) - 1;
      blocks.push({ monthLabel: MONTH_NAMES[monthIndex], weeks: currentWeeks });
    }

    return blocks;
  }, [days]);

  // Determine color intensity based on count
  const getColor = (day: any) => {
    if (day.count === 0) return 'bg-white/5 border border-white/5';
    if (day.count <= 2) return 'bg-emerald-900 border border-emerald-800';
    if (day.count <= 5) return 'bg-emerald-700 border border-emerald-600';
    if (day.count <= 10) return 'bg-emerald-500 border border-emerald-400';
    return 'bg-emerald-400 border border-emerald-300';
  };

  const [hoveredDay, setHoveredDay] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent, day: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    setHoveredDay(day);
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const getTooltip = (day: any) => {
    const d = new Date(day.date);
    const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (day.count === 0) {
      return (
        <div className="text-zinc-400">
          No activity on {formattedDate}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1.5 min-w-[140px]">
        <div className="font-semibold text-zinc-300 border-b border-white/10 pb-1.5 mb-0.5">
          {formattedDate}
        </div>
        {day.details && day.details.length > 0 ? (
          <ul className="space-y-1">
            {day.details.map((detail: any, idx: number) => (
              <li key={idx} className="flex justify-between items-center text-[11px] gap-3">
                <span className="text-zinc-400 capitalize">{detail.type.replace('_', ' ')}</span>
                <span className="font-medium text-emerald-400">{detail.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-emerald-400 font-medium">
            {day.count} {day.count === 1 ? 'activity' : 'activities'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
      <div className="min-w-max flex gap-2">
        {/* Day Labels */}
        <div className="flex flex-col gap-1 text-[10px] text-zinc-500 mt-5 pt-[2px]">
          <div className="h-4 leading-[16px]"></div>
          <div className="h-4 leading-[16px]">Mon</div>
          <div className="h-4 leading-[16px]"></div>
          <div className="h-4 leading-[16px]">Wed</div>
          <div className="h-4 leading-[16px]"></div>
          <div className="h-4 leading-[16px]">Fri</div>
          <div className="h-4 leading-[16px]"></div>
        </div>

        <div className="flex gap-4">
          {monthBlocks.map((block, bIndex) => (
            <div key={bIndex} className="flex flex-col">
              {/* Month Label */}
              <div className="text-[10px] text-zinc-500 mb-1 h-4 pl-1">
                {block.monthLabel}
              </div>
              
              {/* Graph Grid for this month */}
              <div className="flex gap-1">
                {block.weeks.map((week, wIndex) => (
                  <div key={wIndex} className="flex flex-col gap-1 w-4">
                    {week.map((day, dIndex) => {
                      if (!day) return <div key={dIndex} className="w-4 h-4 rounded-sm opacity-0" />;
                      const dayNum = parseInt(day.date.split('-')[2], 10);
                      return (
                        <div
                          key={day.date}
                          onMouseEnter={(e) => handleMouseEnter(e, day)}
                          onMouseLeave={handleMouseLeave}
                          className={`group w-4 h-4 rounded-sm transition-all hover:ring-2 hover:ring-zinc-400 hover:z-10 relative cursor-pointer flex items-center justify-center ${getColor(day)}`}
                        >
                          <span className="text-[8px] font-medium opacity-0 group-hover:opacity-100 text-white drop-shadow-md">{dayNum}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded-sm bg-white/5 border border-white/5" />
            <div className="w-4 h-4 rounded-sm bg-emerald-900 border-emerald-800 border" />
            <div className="w-4 h-4 rounded-sm bg-emerald-700 border-emerald-600 border" />
            <div className="w-4 h-4 rounded-sm bg-emerald-500 border-emerald-400 border" />
            <div className="w-4 h-4 rounded-sm bg-emerald-400 border-emerald-300 border" />
          </div>
          <span>More</span>
        </div>
      </div>

      {hoveredDay && (
        <div 
          className="fixed z-50 pointer-events-none px-3 py-2 text-xs font-medium text-zinc-200 bg-zinc-900 border border-white/10 rounded-md shadow-2xl whitespace-nowrap"
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -120%)'
          }}
        >
          {getTooltip(hoveredDay)}
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-zinc-900 border-r border-b border-white/10 rotate-45" />
        </div>
      )}
    </div>
  );
}
