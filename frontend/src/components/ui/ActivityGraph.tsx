import React, { useMemo, useState } from 'react';

interface ActivityGraphProps {
  data?: { date: string; count: number }[];
  mixedData?: { date: string; blueCount: number; emeraldCount: number }[];
  theme?: 'emerald' | 'blue' | 'mixed';
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

export default function ActivityGraph({ data = [], mixedData = [], theme = 'emerald', userName }: ActivityGraphProps) {
  // Generate last 6 months in IST
  const days = useMemo(() => {
    const todayLocal = new Date();
    // Start by finding today in IST
    const utcToday = todayLocal.getTime() + (todayLocal.getTimezoneOffset() * 60000);
    const todayIST = new Date(utcToday + (3600000 * 5.5));
    
    const lastYearIST = new Date(todayIST.getFullYear(), todayIST.getMonth(), todayIST.getDate() - 179);
    
    const dataMap = new Map<string, number>();
    data.forEach(d => dataMap.set(d.date, d.count));

    const mixedMap = new Map<string, { blueCount: number; emeraldCount: number }>();
    mixedData.forEach(d => mixedMap.set(d.date, { blueCount: d.blueCount, emeraldCount: d.emeraldCount }));

    const result = [];

    for (let d = new Date(lastYearIST); d <= todayIST; d.setDate(d.getDate() + 1)) {
      const { dateStr } = getISTDateString(d);

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
    }
    return result;
  }, [data, mixedData, theme]);

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
    const prefix = userName ? `${userName}: ` : "";
    if (theme === 'mixed') {
      const parts = [];
      if (day.blueCount > 0) parts.push(`${day.blueCount} tests`);
      if (day.emeraldCount > 0) parts.push(`${day.emeraldCount} questions`);
      if (parts.length === 0) return `${prefix}0 activities on ${day.date}`;
      return `${prefix}${parts.join(' and ')} on ${day.date}`;
    }
    return `${prefix}${day.count} activities on ${day.date}`;
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
                          className={`group w-4 h-4 rounded-sm transition-all hover:scale-125 hover:ring-1 hover:ring-white/50 cursor-pointer flex items-center justify-center ${getColor(day)}`}
                        >
                          <span className="text-[8px] font-medium opacity-60 group-hover:opacity-100 mix-blend-plus-lighter">{dayNum}</span>
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
        {theme === 'mixed' ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-sm bg-blue-500 border border-blue-400" />
              <span>Tests</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-sm bg-emerald-500 border border-emerald-400" />
              <span>Questions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-blue-500 to-emerald-500 border border-emerald-400/50" />
              <span>Both</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded-sm bg-white/5 border border-white/5" />
              <div className={`w-4 h-4 rounded-sm ${theme === 'blue' ? 'bg-blue-900 border-blue-800' : 'bg-emerald-900 border-emerald-800'} border`} />
              <div className={`w-4 h-4 rounded-sm ${theme === 'blue' ? 'bg-blue-700 border-blue-600' : 'bg-emerald-700 border-emerald-600'} border`} />
              <div className={`w-4 h-4 rounded-sm ${theme === 'blue' ? 'bg-blue-500 border-blue-400' : 'bg-emerald-500 border-emerald-400'} border`} />
              <div className={`w-4 h-4 rounded-sm ${theme === 'blue' ? 'bg-blue-400 border-blue-300' : 'bg-emerald-400 border-emerald-300'} border`} />
            </div>
            <span>More</span>
          </div>
        )}
      </div>

      {/* Floating Tooltip */}
      {hoveredDay && (
        <div 
          className="fixed z-50 pointer-events-none px-3 py-2 text-xs font-medium text-white bg-zinc-800 border border-white/10 rounded shadow-xl whitespace-nowrap"
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {getTooltip(hoveredDay)}
        </div>
      )}
    </div>
  );
}
