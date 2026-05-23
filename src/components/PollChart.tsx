'use client';

import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

interface PollChartProps {
  questionId: string;
  questionText: string;
  type: 'SINGLE' | 'RANKED';
  stats: Record<string, { text: string; count: number }>;
}

const COLORS = [
  '#6366f1', // indigo-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
];

export default function PollChart({ questionText, type, stats }: PollChartProps) {
  // Parse stats object into Recharts-friendly arrays
  const data: ChartData[] = Object.keys(stats).map((key) => ({
    name: stats[key].text,
    value: stats[key].count,
  }));

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/2 border border-white/5 rounded-2xl h-48 text-center text-gray-500 text-xs">
        <span>No votes recorded yet for this question.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <h4 className="font-outfit text-sm font-bold text-gray-400 uppercase tracking-widest">Question Overview</h4>
        <p className="text-white text-base font-semibold mt-1 leading-snug">{questionText}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Pie Chart / Vote Share */}
        <div className="h-64 flex flex-col items-center justify-center">
          <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-2">
            {type === 'RANKED' ? 'Weighted Priority Shares' : 'Vote Distribution'}
          </span>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(11, 15, 25, 0.95)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconSize={10} 
                iconType="circle" 
                formatter={(val) => <span className="text-[11px] text-gray-400 font-semibold">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart / Exact Counts */}
        <div className="h-64 flex flex-col items-center justify-center">
          <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-2">
            {type === 'RANKED' ? 'Borda Points Total' : 'Raw Vote Count'}
          </span>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#9ca3af', fontSize: 10 }} 
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} 
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#9ca3af', fontSize: 10 }} 
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(11, 15, 25, 0.95)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
