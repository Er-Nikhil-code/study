"use client";

import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Panel from "./Panel";

type MarksHistory = {
  attempt_id: string;
  test_title: string;
  score: number;
  max_score: number;
  percentage: number;
  submitted_at: string;
  attempt_no: number;
  course_id?: string;
  course_name?: string;
};

type WeakTopic = {
  topic_id: string;
  topic_name: string;
  chapter: string;
  subject: string;
  wrong_count: number;
};

export default function MarksGraph({ 
  history, 
  weakTopics, 
  enrolledCourses 
}: { 
  history: MarksHistory[], 
  weakTopics: WeakTopic[], 
  enrolledCourses: any[] 
}) {
  const [selectedCourse, setSelectedCourse] = useState<string>("ALL");
  const [showFirstAttempts, setShowFirstAttempts] = useState(true);
  const [showReattempts, setShowReattempts] = useState(true);

  // Derive course list (only those user is enrolled in)
  const courses = [{ id: "ALL", name: "All Enrolled Courses" }, ...enrolledCourses];

  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      // Must belong to a known course
      if (!h.course_id) return false;
      
      // Course filter
      if (selectedCourse !== "ALL" && h.course_id !== selectedCourse) return false;

      // Attempt filter
      if (h.attempt_no === 1 && !showFirstAttempts) return false;
      if (h.attempt_no > 1 && !showReattempts) return false;

      return true;
    });
  }, [history, selectedCourse, showFirstAttempts, showReattempts]);

  const topWeak = weakTopics.slice(0, 3);
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-white/10 p-3 rounded-lg shadow-xl text-xs z-50">
          <div className="font-medium text-white mb-1">{data.test_title}</div>
          <div className="text-zinc-400">Score: <span className="text-white font-semibold">{data.score}/{data.max_score}</span> ({data.percentage}%)</div>
          <div className="text-zinc-400">Date: {new Date(data.submitted_at).toLocaleDateString()}</div>
          <div className="text-zinc-400">Attempt: {data.attempt_no === 1 ? "1st" : `Re #${data.attempt_no}`}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <Panel className="flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-500 font-semibold shrink-0">Performance Curve</h3>
          
          <div className="flex flex-wrap items-center justify-end gap-3 text-xs w-full">
            <select 
              value={selectedCourse} 
              onChange={e => setSelectedCourse(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-zinc-300 focus:outline-none focus:border-red-500/50 max-w-[150px] truncate"
            >
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-400 hover:text-white transition">
              <input type="checkbox" checked={showFirstAttempts} onChange={e => setShowFirstAttempts(e.target.checked)} className="accent-red-500" />
              1st Attempts
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-400 hover:text-white transition">
              <input type="checkbox" checked={showReattempts} onChange={e => setShowReattempts(e.target.checked)} className="accent-red-500" />
              Re-attempts
            </label>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-sm text-zinc-500 min-h-[250px]">
            <span className="text-2xl mb-2 opacity-50">📉</span>
            No data available for the selected filters.
          </div>
        ) : (
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="test_title" 
                  stroke="#ffffff30" 
                  tick={{ fill: '#ffffff60', fontSize: 10 }}
                  tickFormatter={(val) => val.length > 12 ? val.substring(0, 12) + '...' : val}
                  tickMargin={10}
                />
                <YAxis 
                  stroke="#ffffff30" 
                  tick={{ fill: '#ffffff60', fontSize: 10 }} 
                  domain={[0, 100]} 
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff20', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#000' }}
                  activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff' }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      {/* Weak Areas Heatmap Tile */}
      {topWeak.length > 0 && (
        <Panel accent className="shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-lg">⚠️</span>
              <h3 className="text-sm font-semibold text-white">Suggested Focus Areas</h3>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mb-4">Based on your recent performance, we highly suggest reviewing these topics:</p>
          <div className="space-y-2">
            {topWeak.map((w, i) => {
              // Calculate a simple intensity heatmap color based on wrong count
              const maxWrong = Math.max(...topWeak.map(x => x.wrong_count));
              const intensity = maxWrong > 0 ? (w.wrong_count / maxWrong) * 100 : 0;
              const bgOpacity = (intensity / 100) * 0.3; // Max 30% opacity
              
              return (
                <div key={w.topic_id} className="relative overflow-hidden rounded-lg border border-white/5 bg-white/[0.02] p-3 flex items-center justify-between group">
                  <div 
                    className="absolute inset-0 bg-red-500 pointer-events-none transition-opacity duration-500" 
                    style={{ opacity: bgOpacity }} 
                  />
                  <div className="relative z-10 flex flex-col">
                    <span className="text-sm font-medium text-white group-hover:text-red-400 transition">{w.topic_name}</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">{w.subject}</span>
                  </div>
                  <div className="relative z-10 flex items-center gap-2">
                    <span className="text-xs font-bold text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">{w.wrong_count} Mistakes</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
