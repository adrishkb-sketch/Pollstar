'use client';

import { useState } from 'react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area
} from 'recharts';
import { 
  Trophy, TrendingUp, BarChart3, HelpCircle, 
  Percent, ArrowRight, ShieldCheck, Award, Layers 
} from 'lucide-react';

interface PollChartProps {
  questionId: string;
  questionText: string;
  type: 'SINGLE' | 'RANKED' | 'KNOCKOUT';
  stats: Record<string, { text: string; count: number }>;
  votesList?: any[];
  optionsList?: any[];
  settings?: any;
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

export default function PollChart({ questionId, questionText, type, stats, votesList = [], optionsList = [], settings = {} }: PollChartProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');

  // ----------------------------------------------------
  // KNOCKOUT TOURNAMENT: Bracket Analysis & Points System
  // ----------------------------------------------------
  const getKnockoutAnalytics = () => {
    let totalWins: Record<string, number> = {};
    let survivalCounts: Record<string, number[]> = {};
    let points: Record<string, number> = {}; // Tournament Points

    optionsList.forEach(opt => {
      totalWins[opt.id] = 0;
      points[opt.id] = 0;
      survivalCounts[opt.id] = [0, 0, 0, 0, 0]; // R1, R2, Semis, Finals, Champion
    });

    votesList.forEach(v => {
      try {
        const parsed = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
        const knockoutData = parsed[questionId];
        if (!knockoutData || !knockoutData.rounds) return;

        // Ultimate Champion
        if (knockoutData.winner && totalWins[knockoutData.winner] !== undefined) {
          survivalCounts[knockoutData.winner][4] = (survivalCounts[knockoutData.winner][4] || 0) + 1;
          points[knockoutData.winner] += 50; // Bonus for winning the whole tournament
        }

        knockoutData.rounds.forEach((roundMatches: any[], roundIndex: number) => {
          roundMatches.forEach((match: any) => {
            if (match.winner && totalWins[match.winner] !== undefined) {
              totalWins[match.winner] = (totalWins[match.winner] || 0) + 1;
              points[match.winner] += (roundIndex + 1) * 10; // Increasing points for advancing rounds
            }

            // Participants in this round match
            if (match.c1 && survivalCounts[match.c1.id]) {
              survivalCounts[match.c1.id][roundIndex] = (survivalCounts[match.c1.id][roundIndex] || 0) + 1;
            }
            if (match.c2 && survivalCounts[match.c2.id]) {
              survivalCounts[match.c2.id][roundIndex] = (survivalCounts[match.c2.id][roundIndex] || 0) + 1;
            }
          });
        });
      } catch {}
    });

    return { totalWins, survivalCounts, points };
  };

  const knockoutData = type === 'KNOCKOUT' ? getKnockoutAnalytics() : null;

  // Parse stats object into Recharts-friendly arrays
  const overviewData = type === 'KNOCKOUT' && knockoutData
    ? optionsList.map(o => ({
        name: o.text,
        value: knockoutData.points[o.id] || 0,
      })).sort((a, b) => b.value - a.value)
    : Object.keys(stats).map((key) => ({
        name: stats[key].text,
        value: stats[key].count,
      })).sort((a, b) => b.value - a.value);

  const statsTotal = Object.values(stats).reduce((sum, item) => sum + (item.count || 0), 0);
  const totalVotes = votesList.length > 0 ? votesList.length : statsTotal;

  if (totalVotes === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/2 border border-white/5 rounded-2xl h-48 text-center text-gray-500 text-xs">
        <HelpCircle className="w-8 h-8 text-gray-600 mb-2 animate-bounce" />
        <span>No votes recorded yet for this question. Analytics will populate live as ballots are cast.</span>
      </div>
    );
  }

  // ----------------------------------------------------
  // SINGLE CHOICE: Turnout Velocity Chart Data
  // ----------------------------------------------------
  const getVelocityData = () => {
    // Group votes by hour explicitly in Asia/Kolkata (IST) timezone
    const countsByHour: Record<string, number> = {};
    votesList.forEach(v => {
      const date = new Date(v.createdAt);
      const hourStr = date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
      countsByHour[hourStr] = (countsByHour[hourStr] || 0) + 1;
    });

    let runningTotal = 0;
    return Object.keys(countsByHour).map(time => {
      runningTotal += countsByHour[time];
      return {
        time,
        ballots: countsByHour[time],
        cumulative: runningTotal
      };
    });
  };

  // ----------------------------------------------------
  // RANKED CHOICE: Borda Face-Off Matrix & IRV Rounds
  // ----------------------------------------------------
  const getIRVRounds = () => {
    if (type !== 'RANKED' || optionsList.length === 0) return [];
    
    let rounds: any[] = [];
    let activeOptionIds = optionsList.map(o => o.id);
    let eliminatedIds: string[] = [];

    // Extract preference arrays from votesList
    const ballots = votesList.map(v => {
      try {
        const parsed = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
        const ranking = parsed[questionId];
        return Array.isArray(ranking) ? ranking : [];
      } catch {
        return [];
      }
    }).filter(b => b.length > 0);

    let roundNum = 1;
    while (activeOptionIds.length > 0 && roundNum <= 8) {
      let counts: Record<string, number> = {};
      activeOptionIds.forEach(id => { counts[id] = 0; });

      ballots.forEach(ballot => {
        const choice = ballot.find((id: string) => activeOptionIds.includes(id));
        if (choice) {
          counts[choice] = (counts[choice] || 0) + 1;
        }
      });

      const roundStats = activeOptionIds.map(id => ({
        id,
        text: optionsList.find(o => o.id === id)?.text || 'Unknown',
        votes: counts[id]
      })).sort((a, b) => b.votes - a.votes);

      const totalActiveRoundVotes = roundStats.reduce((s, a) => s + a.votes, 0);

      rounds.push({
        roundNumber: roundNum,
        stats: roundStats,
        totalVotes: totalActiveRoundVotes
      });

      if (totalActiveRoundVotes === 0 || roundStats.length <= 1) {
        break;
      }

      // Check majority
      if (roundStats[0].votes / totalActiveRoundVotes > 0.5) {
        break;
      }

      // Eliminate lowest candidate
      const lowest = roundStats[roundStats.length - 1];
      eliminatedIds.push(lowest.id);
      activeOptionIds = activeOptionIds.filter(id => id !== lowest.id);
      roundNum++;
    }

    return rounds;
  };

  const getRankedMatrix = () => {
    if (type !== 'RANKED' || optionsList.length === 0) return {};

    const matrix: Record<string, Record<string, number>> = {};
    optionsList.forEach(o1 => {
      matrix[o1.id] = {};
      optionsList.forEach(o2 => {
        matrix[o1.id][o2.id] = 0;
      });
    });

    votesList.forEach(v => {
      try {
        const parsed = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
        const ranking = parsed[questionId];
        if (!Array.isArray(ranking)) return;

        for (let i = 0; i < ranking.length; i++) {
          for (let j = i + 1; j < ranking.length; j++) {
            const preferred = ranking[i];
            const deferred = ranking[j];
            if (matrix[preferred] && matrix[preferred][deferred] !== undefined) {
              matrix[preferred][deferred]++;
            }
          }
        }
      } catch {}
    });

    return matrix;
  };

  // ----------------------------------------------------
  // SINGLE CHOICE: Conviction Score per Option
  // ----------------------------------------------------
  const getConvictionScores = () => {
    if (type !== 'SINGLE') return {};
    
    const scores: Record<string, { total: number; count: number; avg: number; label: string }> = {};
    optionsList.forEach(o => {
      scores[o.id] = { total: 0, count: 0, avg: 0, label: o.text };
    });

    votesList.forEach(v => {
      try {
        const parsed = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
        const confidence = parsed.__confidence;
        if (!confidence) return;
        // Each key in __confidence maps a questionId -> confidence %
        Object.entries(confidence).forEach(([, conf]: [string, any]) => {
          // Also need to know which option the voter chose
          const optId = Object.entries(parsed).find(([k]) => k !== '__confidence')?.[1] as string;
          if (optId && scores[optId] !== undefined) {
            scores[optId].total += Number(conf);
            scores[optId].count++;
          }
        });
      } catch {}
    });

    // Match confidence to the voter's chosen option per question
    votesList.forEach(v => {
      try {
        const parsed = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
        const confidence = parsed.__confidence;
        if (!confidence) return;
        
        // For each question, find the chosen option
        Object.entries(parsed).forEach(([qid, optId]: [string, any]) => {
          if (qid === '__confidence' || !confidence[qid]) return;
          if (scores[optId] !== undefined) {
            scores[optId].total += Number(confidence[qid]);
            scores[optId].count++;
          }
        });
      } catch {}
    });

    // Calculate averages
    Object.keys(scores).forEach(optId => {
      const s = scores[optId];
      s.avg = s.count > 0 ? Math.round(s.total / s.count) : 0;
      
      if (s.avg >= 80) s.label = `${optionsList.find(o => o.id === optId)?.text} 🔥`;
      else if (s.avg >= 60) s.label = optionsList.find(o => o.id === optId)?.text;
      else if (s.avg > 0) s.label = `${optionsList.find(o => o.id === optId)?.text} 🤔`;
      else s.label = optionsList.find(o => o.id === optId)?.text || optId;
    });

    return scores;
  };

  const convictionScores = getConvictionScores();
  const hasConvictionData = Object.values(convictionScores).some((s: any) => s.count > 0);
  const leader = overviewData[0];
  const runnerUp = overviewData[1];
  const leaderShare = statsTotal > 0 && leader ? Math.round((leader.value / statsTotal) * 100) : 0;
  const runnerUpShare = statsTotal > 0 && runnerUp ? Math.round((runnerUp.value / statsTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Title & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-4 gap-4">
        <div className="text-center md:text-left">
          <span className="text-indigo-400 text-[10px] uppercase font-bold tracking-widest block mb-1">
            {type === 'SINGLE' ? 'Single Choice Ballot' : type === 'RANKED' ? 'Ranked Priority Ballot' : 'Tournament Knockout Bracket'}
          </span>
          <h4 className="text-white text-lg font-black leading-snug">{questionText}</h4>
        </div>

        {/* Dynamic Tab Toggles */}
        <div className="flex bg-[#0b0f19] border border-white/5 p-1 rounded-xl self-center md:self-auto shadow-inner">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'overview'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Overview Results</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'analytics'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Deep Insights</span>
          </button>
        </div>
      </div>

      {settings?.enableSmartDebrief && leader && (
        <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/5 space-y-2">
          <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Smart Debrief</span>
          <p className="text-gray-300 text-sm leading-relaxed">
            {leader.name} is currently leading this question
            {statsTotal > 0 ? ` with ${leaderShare}% of the measured result weight` : ''}.
            {runnerUp
              ? ` The closest challenger is ${runnerUp.name} at ${runnerUpShare}%, leaving a ${Math.max(0, leaderShare - runnerUpShare)} point gap.`
              : ' No close challenger has emerged yet.'}
            {' '}This summary updates with the live report data as more ballots are recorded.
          </p>
        </div>
      )}

      {settings?.enableHotStreaks && leader && (
        <div className="glass-card rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-4">
          <div>
            <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Hot Streak Momentum</span>
            <p className="text-gray-300 text-sm mt-1">
              {leader.name} has the strongest current momentum in this report.
            </p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-black">
            Leading
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 1: OVERVIEW RESULTS
         ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* General Stats Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center space-x-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block">Total Ballots Cast</span>
                <span className="text-white text-lg font-black">{totalVotes}</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center space-x-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block">Current Leader</span>
                <span className="text-white text-sm font-extrabold truncate max-w-[120px] block">
                  {type === 'KNOCKOUT' && knockoutData
                    ? optionsList.find(o => o.id === Object.keys(knockoutData.totalWins).reduce((a, b) => knockoutData.totalWins[a] > knockoutData.totalWins[b] ? a : b, ''))?.text || 'None'
                    : overviewData[0]?.name || 'None'}
                </span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center space-x-4">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block">Winner Share Margin</span>
                <span className="text-white text-lg font-black">
                  {type === 'KNOCKOUT'
                    ? 'Tourney Standings'
                    : totalVotes > 0 && overviewData.length > 1
                    ? `${(((overviewData[0].value - (overviewData[1]?.value || 0)) / totalVotes) * 100).toFixed(1)}%`
                    : '100%'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Pie Chart */}
            <div className="glass-card border border-white/5 p-6 rounded-2xl h-80 flex flex-col items-center justify-center relative">
              <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest absolute top-6 left-6">
                {type === 'RANKED' ? 'Weighted Priority Shares' : type === 'KNOCKOUT' ? 'Champion Share Ratio' : 'Vote Distribution Pie'}
              </span>
              
              <div className="w-full h-full pt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overviewData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {overviewData.map((entry, index) => (
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
                      iconSize={8} 
                      iconType="circle" 
                      formatter={(val) => <span className="text-[10px] text-gray-400 font-bold truncate max-w-[80px] inline-block">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="glass-card border border-white/5 p-6 rounded-2xl h-80 flex flex-col items-center justify-center relative">
              <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest absolute top-6 left-6">
                {type === 'RANKED' ? 'Borda Points Totals' : type === 'KNOCKOUT' && knockoutData ? 'Cumulative Match Wins' : 'Ballot Totals'}
              </span>

              <div className="w-full h-full pt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={overviewData} 
                    margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
                  >
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#9ca3af', fontSize: 9 }} 
                      axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} 
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#9ca3af', fontSize: 9 }} 
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
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {overviewData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: DEEP INSIGHTS
         ======================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in">

          {/* ────────────────────────────────────────────────────────
              1. SINGLE CHOICE DEEP ANALYTICS: VELOCITY TIMELINE
             ──────────────────────────────────────────────────────── */}
          {type === 'SINGLE' && (
            <div className="space-y-6">
              <div className="glass-card border border-white/5 p-6 rounded-2xl h-80 relative">
                <div className="absolute top-6 left-6">
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider">Turnout Velocity Timeline</h4>
                  <p className="text-gray-500 text-[10px] mt-0.5">Live visualization of cumulative and periodic ballot casting velocity.</p>
                </div>

                <div className="w-full h-full pt-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getVelocityData()} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 8 }} tickLine={false} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 8 }} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)' }} />
                      <Area type="monotone" dataKey="cumulative" stroke="#6366f1" fillOpacity={1} fill="url(#colorVelocity)" name="Cumulative Ballots" />
                      <Area type="monotone" dataKey="ballots" stroke="#10b981" fill="none" name="Votes Cast" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Standings list */}
              <div className="glass-card border border-white/5 p-6 rounded-2xl space-y-4">
                <span className="text-white text-xs font-bold uppercase tracking-wider block">Standings Heat-Map</span>
                <div className="space-y-3">
                  {overviewData.map((cand, idx) => {
                    const percentage = totalVotes > 0 ? ((cand.value / totalVotes) * 100).toFixed(1) : '0';
                    return (
                      <div key={cand.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-gray-300">
                          <span className="flex items-center space-x-2">
                            <span className="text-gray-500 font-mono">#{idx + 1}</span>
                            <span>{cand.name}</span>
                          </span>
                          <span>{cand.value} votes</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              KNOCKOUT STANDINGS (Shared Component)
             ──────────────────────────────────────────────────────── */}
          {type === 'KNOCKOUT' && (
            <div className="glass-card border border-white/5 p-6 rounded-2xl space-y-4">
              <span className="text-white text-xs font-bold uppercase tracking-wider block flex items-center gap-2">
                <Trophy className="w-4 h-4 text-indigo-400" /> Standings Heat-Map
              </span>
              <div className="space-y-3">
                {overviewData.map((cand, idx) => {
                  const maxPoints = overviewData[0]?.value || 1;
                  const percentage = maxPoints > 0 ? ((cand.value / maxPoints) * 100).toFixed(1) : '0';
                  return (
                    <div key={cand.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-gray-300">
                        <span className="flex items-center space-x-2">
                          <span className="text-gray-500 font-mono">#{idx + 1}</span>
                          <span>{cand.name}</span>
                        </span>
                        <span>{cand.value} tournament points</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              2. RANKED CHOICE DEEP ANALYTICS: IRV ROUNDS & MATRIX
             ──────────────────────────────────────────────────────── */}
          {type === 'RANKED' && (
            <div className="space-y-8 animate-fade-in">
              {/* Dynamic Instant Runoff Rounds Visualizer */}
              <div className="glass-card border border-white/5 p-6 rounded-2xl space-y-4">
                <div>
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span>Instant Runoff Voting (IRV) Elimination Rounds</span>
                  </h4>
                  <p className="text-gray-500 text-[10px] mt-0.5">
                    Calculated by iteratively eliminating the lowest candidate and re-routing their ballots to voters' subsequent choices until a 50% majority winner is resolved.
                  </p>
                </div>

                <div className="space-y-6 pt-2">
                  {getIRVRounds().map((round, rIdx) => (
                    <div key={round.roundNumber} className="border-l-2 border-purple-500/20 pl-4 space-y-3">
                      <span className="text-purple-300 text-xs font-extrabold uppercase">Round {round.roundNumber} Standings</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {round.stats.map((c: any, cIdx: number) => {
                          const pct = round.totalVotes > 0 ? ((c.votes / round.totalVotes) * 100).toFixed(1) : '0';
                          return (
                            <div key={c.id} className="p-3 bg-white/2 rounded-xl border border-white/5 flex items-center justify-between text-xs text-gray-300">
                              <span className="font-semibold flex items-center space-x-2">
                                <span className="text-[10px] text-gray-500 font-mono">#{cIdx + 1}</span>
                                <span className="truncate max-w-[120px]">{c.text}</span>
                              </span>
                              <div className="text-right">
                                <span className="font-bold text-white block">{c.votes} votes</span>
                                <span className="text-[9px] text-purple-400 font-black">{pct}% of round</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pairwise Matrix Faceoffs */}
              <div className="glass-card border border-white/5 p-6 rounded-2xl space-y-4">
                <div>
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider">Pairwise Head-to-Head Preference Matrix</h4>
                  <p className="text-gray-500 text-[10px] mt-0.5">
                    Represents the number of times the candidate in the **Row** was preferred over the candidate in the **Column** across all ballots.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs text-gray-300">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="py-2.5 font-bold text-gray-500 uppercase">Preferred \ Opponent</th>
                        {optionsList.map(o => (
                          <th key={o.id} className="py-2.5 px-2 font-bold text-gray-400 truncate max-w-[80px]">{o.text}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {optionsList.map(rowOpt => {
                        const matrix = getRankedMatrix();
                        return (
                          <tr key={rowOpt.id}>
                            <td className="py-3 font-bold text-white max-w-[100px] truncate">{rowOpt.text}</td>
                            {optionsList.map(colOpt => {
                              if (rowOpt.id === colOpt.id) {
                                return <td key={colOpt.id} className="py-3 px-2 text-gray-600 bg-white/2 font-mono text-center">-</td>;
                              }
                              const val = matrix[rowOpt.id]?.[colOpt.id] || 0;
                              return <td key={colOpt.id} className="py-3 px-2 font-mono font-bold text-indigo-400">{val}</td>;
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
              3. KNOCKOUT DEEP ANALYTICS: SURVIVAL RATE HEATMAP
             ──────────────────────────────────────────────────────── */}
          {type === 'KNOCKOUT' && knockoutData && (
            <div className="space-y-6">
              <div>
                <h4 className="text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
                  <Trophy className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>Bracket Tournament Survival Heatmap</span>
                </h4>
                <p className="text-gray-500 text-[10px] mt-0.5">
                  Tracks what percentage of all cast voter tournament brackets each candidate successfully reached at every round.
                </p>
              </div>

              <div className="space-y-4">
                {optionsList.map(opt => {
                  const survival = knockoutData.survivalCounts[opt.id] || [0, 0, 0, 0, 0];
                  
                  return (
                    <div key={opt.id} className="glass-card rounded-2xl p-4 border border-white/5 space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-white flex items-center space-x-2">
                          🏆
                          <span>{opt.text}</span>
                        </span>
                        <span className="text-amber-400">
                          Champion in {survival[4]} brackets ({totalVotes > 0 ? ((survival[4] / totalVotes) * 100).toFixed(0) : '0'}%)
                        </span>
                      </div>

                      {/* Display a grid of horizontal progress steps representing survival rate */}
                      <div className="grid grid-cols-5 gap-2">
                        {['Round 1', 'Round 2', 'Semis', 'Finals', 'Champion'].map((roundName, rIdx) => {
                          const reachedCount = survival[rIdx] || 0;
                          const pct = totalVotes > 0 ? (reachedCount / totalVotes) * 100 : 0;
                          
                          return (
                            <div key={roundName} className="bg-white/2 border border-white/5 rounded-xl p-2 text-center space-y-1 relative overflow-hidden">
                              <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block">{roundName}</span>
                              <span className="text-xs font-bold text-white block">{pct.toFixed(0)}%</span>
                              
                              {/* Survival indicator bar background */}
                              <div 
                                className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 transition-all" 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
