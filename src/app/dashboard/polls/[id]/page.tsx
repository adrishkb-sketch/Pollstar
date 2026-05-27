'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Vote, ArrowLeft, Loader2, AlertCircle, Calendar, 
  Trash2, ShieldCheck, Download, Check, FileDown, 
  Users, AlertTriangle, Eye, ShieldAlert, BarChart3,
  Brain, TrendingUp, Gauge, Zap, Award, MonitorPlay,
  Unlock, Timer
} from 'lucide-react';
import PollChart from '@/components/PollChart';
import PollMap from '@/components/PollMap';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PollInsights({ params }: PageProps) {
  const { id: pollId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [poll, setPoll] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Real-time dynamic states
  const [liveStats, setLiveStats] = useState<Record<string, any>>({});
  const [liveTotalVotes, setLiveTotalVotes] = useState(0);
  const [liveVotesList, setLiveVotesList] = useState<any[]>([]);

  // Action status loading
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Fetch Poll Details on Mount
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch poll insights');
        }

        setPoll(data.poll);
        setIsOwner(data.isOwner);
        setLiveStats(data.poll.stats || {});
        setLiveTotalVotes(data.poll.totalVotes || 0);
        setLiveVotesList(data.poll.votes || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [pollId]);

  // 2. Real-Time Serverless Polling Connection
  useEffect(() => {
    if (!poll) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}`);
        const data = await res.json();
        if (res.ok && data.poll) {
          setLiveStats(data.poll.stats || {});
          setLiveTotalVotes(data.poll.totalVotes || 0);
          setLiveVotesList(data.poll.votes || []);
        }
      } catch (err) {
        console.error('Creator Insights sync error:', err);
      }
    }, 4000); // Refresh every 4 seconds

    return () => clearInterval(interval);
  }, [poll, pollId]);

  // 3. Status transitions & Visibility Controls
  const handleUpdateStatus = async (newStatus: 'ACTIVE' | 'ENDED') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status transition failed');
      
      setPoll((prev: any) => ({ ...prev, status: newStatus }));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePublicVisibility = async (val: boolean) => {
    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResultPublic: val }),
      });
      if (!res.ok) throw new Error('Visibility update failed');
      
      setPoll((prev: any) => ({ ...prev, isResultPublic: val }));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleGranularVisibility = async (field: string, val: boolean) => {
    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: val }),
      });
      if (!res.ok) throw new Error(`${field} update failed`);
      
      setPoll((prev: any) => ({
        ...prev,
        settings: {
          ...(prev.settings || {}),
          [field]: val
        }
      }));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeletePoll = async () => {
    if (!confirm('Are you absolutely sure you want to delete this poll and all its recorded votes? This action is permanent.')) {
      return;
    }
    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete poll');
      
      router.push('/dashboard');
    } catch (e: any) {
      alert(e.message);
    }
  };

  // 4. Trigger print styling (window.print() with Print stylesheet overrides)
  const handleExportPDF = () => {
    window.print();
  };

  // 5. Grant 30-second OTP Bypass to a specific voter
  const [bypassCountdowns, setBypassCountdowns] = useState<Record<string, number>>({});

  const handleGrantBypass = async (voterId: string) => {
    try {
      const res = await fetch(`/api/polls/${pollId}/grant-bypass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId }),
      });
      if (!res.ok) throw new Error('Failed to grant bypass');
      
      // Start a local 30-second countdown for this voter
      setBypassCountdowns((prev) => ({ ...prev, [voterId]: 30 }));
      const intervalId = setInterval(() => {
        setBypassCountdowns((prev) => {
          const current = prev[voterId] ?? 0;
          if (current <= 1) {
            clearInterval(intervalId);
            const copy = { ...prev };
            delete copy[voterId];
            return copy;
          }
          return { ...prev, [voterId]: current - 1 };
        });
      }, 1000);
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="text-gray-400 text-sm mt-4 font-semibold">Generating analytical report...</span>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center px-6 text-center">
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="font-outfit text-xl font-bold text-white mb-2">Access Denied</h3>
        <p className="text-gray-400 text-sm max-w-md leading-relaxed">{error}</p>
        <Link href="/dashboard" className="mt-6 px-5 py-2.5 rounded-xl font-semibold gradient-btn text-white text-xs">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const activeQuestion = poll.questions[0];
  const suspiciousVotesCount = liveVotesList.filter((v) => v.flaggedSuspicious).length;

  // Turnout Stats
  const allowedCount = poll.allowedVoters?.length || 0;
  const turnoutPercent = allowedCount > 0 ? Math.round((liveTotalVotes / allowedCount) * 100) : 0;

  // Hourly Velocity
  const getVotingVelocity = () => {
    const hourlyGroups: Record<string, number> = {};
    const now = Date.now();
    
    // Initialize 6 hourly buckets in IST
    const buckets: { start: number; end: number; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now - i * 60 * 60 * 1000);
      const label = d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
      
      const bucketStart = now - (i + 0.5) * 60 * 60 * 1000;
      const bucketEnd = now - (i - 0.5) * 60 * 60 * 1000;
      
      buckets.push({ start: bucketStart, end: bucketEnd, label });
      hourlyGroups[label] = 0;
    }

    liveVotesList.forEach((v) => {
      try {
        const voteTime = new Date(v.createdAt).getTime();
        const matchingBucket = buckets.find(b => voteTime >= b.start && voteTime < b.end);
        if (matchingBucket) {
          hourlyGroups[matchingBucket.label]++;
        }
      } catch (e) {}
    });

    return Object.entries(hourlyGroups).map(([hour, count]) => ({ hour, count }));
  };

  const velocityData = getVotingVelocity();

  // Device partitioning breakdown using database records
  const getDeviceBreakdown = () => {
    let mobile = 0;
    let desktop = 0;
    liveVotesList.forEach((v) => {
      if (v.device === 'Mobile') mobile++;
      else desktop++;
    });
    const total = liveVotesList.length || 1;
    return {
      mobilePercent: Math.round((mobile / total) * 100),
      desktopPercent: Math.round((desktop / total) * 100),
    };
  };

  const devices = getDeviceBreakdown();

  // Alphanumeric Prefix & Numeric Range Trend segmentation calculator
  const getRollNumberTrends = () => {
    const groups: Record<string, { total: number; choices: Record<string, number> }> = {};

    liveVotesList.forEach((v) => {
      const roll = (v.userIdentifier || '').trim().toUpperCase();
      if (!roll) return;

      // 1. Group roll numbers by department prefix (alphanumeric) or numeric bins
      let groupKey = 'Other';
      const alphaMatch = roll.match(/^([A-Z]+|\d+[A-Z]+)/);
      if (alphaMatch) {
        groupKey = alphaMatch[0];
      } else {
        const numVal = parseInt(roll);
        if (!isNaN(numVal)) {
          const binStart = Math.floor(numVal / 50) * 50;
          groupKey = `Range ${binStart}-${binStart + 49}`;
        }
      }

      if (!groups[groupKey]) {
        groups[groupKey] = { total: 0, choices: {} };
      }
      groups[groupKey].total++;

      // 2. Resolve vote choices
      try {
        const ansObj = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
        const selection = ansObj?.[activeQuestion.id];
        if (selection) {
          const optionId = Array.isArray(selection) ? selection[0] : selection;
          const optText = activeQuestion.options.find((o: any) => o.id === optionId)?.text || optionId;
          groups[groupKey].choices[optText] = (groups[groupKey].choices[optText] || 0) + 1;
        }
      } catch (e) {}
    });

    return Object.entries(groups)
      .map(([groupName, data]) => {
        const sortedChoices = Object.entries(data.choices).sort((a, b) => b[1] - a[1]);
        const topChoice = sortedChoices[0] ? sortedChoices[0][0] : 'N/A';
        const topCount = sortedChoices[0] ? sortedChoices[0][1] : 0;
        const marginPercent = Math.round((topCount / data.total) * 100);

        return {
          groupName,
          total: data.total,
          topChoice,
          marginPercent,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 4); // Display top 4 dominant segments
  };

  // 1. Time & Speed Analytics Engine
  const getTimeAnalytics = () => {
    if (liveVotesList.length === 0) return { peakHour: 'N/A', avgInterval: 'N/A', acceleration: 'Stable' };
    
    const sortedVotes = [...liveVotesList].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    let totalDiff = 0;
    for (let i = 1; i < sortedVotes.length; i++) {
      totalDiff += new Date(sortedVotes[i].createdAt).getTime() - new Date(sortedVotes[i - 1].createdAt).getTime();
    }
    const avgSec = sortedVotes.length > 1 ? Math.round(totalDiff / (sortedVotes.length - 1) / 1000) : 0;
    const avgInterval = avgSec > 60 ? `${Math.round(avgSec / 60)}m ${avgSec % 60}s` : `${avgSec}s`;
    
    const hours: Record<number, number> = {};
    liveVotesList.forEach(v => {
      const hr = new Date(v.createdAt).getHours();
      hours[hr] = (hours[hr] || 0) + 1;
    });
    let peakHr = -1;
    let peakCount = 0;
    Object.entries(hours).forEach(([hr, cnt]) => {
      if (cnt > peakCount) {
        peakCount = cnt;
        peakHr = parseInt(hr);
      }
    });
    const peakHourLabel = peakHr !== -1 ? `${peakHr.toString().padStart(2, '0')}:00 - ${peakHr.toString().padStart(2, '0')}:59` : 'N/A';

    let acceleration = 'Stable';
    if (sortedVotes.length > 5) {
      const lastSegmentCount = Math.max(2, Math.floor(sortedVotes.length * 0.2));
      const segmentStartIndex = sortedVotes.length - lastSegmentCount;
      const recentDiff = new Date(sortedVotes[sortedVotes.length - 1].createdAt).getTime() - new Date(sortedVotes[segmentStartIndex].createdAt).getTime();
      const recentAvgSec = recentDiff / (lastSegmentCount - 1) / 1000;
      if (recentAvgSec < avgSec * 0.5) {
        acceleration = '💥 Accelerating';
      } else if (recentAvgSec > avgSec * 1.5) {
        acceleration = '📉 Decelerating';
      }
    }
    
    return { peakHour: peakHourLabel, avgInterval, acceleration };
  };

  const timeAnalytics = getTimeAnalytics();

  // 2. Correlation Engine (Cross-tabulation & Pattern Finder)
  const getCorrelationInsights = () => {
    const insights: string[] = [];
    if (liveVotesList.length < 3) return ['Gathering more data to establish statistical correlation patterns...'];

    const deviceChoices: Record<string, Record<string, number>> = { Desktop: {}, Mobile: {} };
    liveVotesList.forEach(v => {
      const dev = v.device === 'Mobile' ? 'Mobile' : 'Desktop';
      try {
        const ansObj = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
        const selection = ansObj?.[activeQuestion.id];
        if (selection) {
          const optionId = Array.isArray(selection) ? selection[0] : selection;
          const optText = activeQuestion.options.find((o: any) => o.id === optionId)?.text || 'Unknown';
          deviceChoices[dev][optText] = (deviceChoices[dev][optText] || 0) + 1;
        }
      } catch (e) {}
    });

    const getDominant = (map: Record<string, number>) => {
      let best = '';
      let max = 0;
      let total = 0;
      Object.entries(map).forEach(([k, v]) => {
        total += v;
        if (v > max) {
          max = v;
          best = k;
        }
      });
      return { best, percent: total > 0 ? Math.round((max / total) * 100) : 0 };
    };

    const dDom = getDominant(deviceChoices.Desktop);
    const mDom = getDominant(deviceChoices.Mobile);

    if (dDom.best && mDom.best) {
      if (dDom.best === mDom.best) {
        insights.push(`🎯 Strong platform alignment: Both desktop (${dDom.percent}%) and mobile (${mDom.percent}%) voters overwhelmingly prefer "${dDom.best}".`);
      } else {
        insights.push(`🎭 Device usage divergence: Desktop voters prefer "${dDom.best}" (${dDom.percent}%), while mobile users skew towards "${mDom.best}" (${mDom.percent}%).`);
      }
    }

    const ispCounts: Record<string, number> = {};
    liveVotesList.forEach(v => {
      const provider = v.isp || 'Local ISP';
      ispCounts[provider] = (ispCounts[provider] || 0) + 1;
    });
    const sortedIsps = Object.entries(ispCounts).sort((a, b) => b[1] - a[1]);
    if (sortedIsps[0] && sortedIsps[0][1] > liveVotesList.length * 0.4) {
      insights.push(`⚠️ Network density anomaly: ${Math.round((sortedIsps[0][1] / liveVotesList.length) * 100)}% of all traffic originates from the same network provider ("${sortedIsps[0][0]}").`);
    }

    const batchCounts: Record<string, number> = {};
    liveVotesList.forEach(v => {
      const roll = (v.userIdentifier || '').trim().toUpperCase();
      const alphaMatch = roll.match(/^([A-Z]+|\d+[A-Z]+)/);
      if (alphaMatch) {
        batchCounts[alphaMatch[0]] = (batchCounts[alphaMatch[0]] || 0) + 1;
      }
    });
    const sortedBatches = Object.entries(batchCounts).sort((a, b) => b[1] - a[1]);
    if (sortedBatches[0]) {
      insights.push(`👥 Batch influence: Segment "${sortedBatches[0][0]}" is the most active group, accounting for ${Math.round((sortedBatches[0][1] / liveVotesList.length) * 100)}% of the total turnout.`);
    }

    if (insights.length === 0) {
      insights.push('📊 Vote choices are evenly distributed with no statistically significant cross-network skewing detected.');
    }

    return insights;
  };

  const correlationInsights = getCorrelationInsights();

  // 3. Advanced Security & Anomaly Audit
  const getSecurityAudit = () => {
    if (liveVotesList.length === 0) return { ipCollisions: 0, concurrentBursts: 0 };

    const ipMap: Record<string, string[]> = {};
    liveVotesList.forEach(v => {
      if (!ipMap[v.ipAddress]) ipMap[v.ipAddress] = [];
      if (v.userIdentifier) ipMap[v.ipAddress].push(v.userIdentifier);
    });
    let ipCollisions = 0;
    Object.values(ipMap).forEach(arr => {
      if (arr.length > 1) ipCollisions++;
    });

    const sortedTimes = liveVotesList.map(v => new Date(v.createdAt).getTime()).sort((a, b) => a - b);
    let concurrentBursts = 0;
    for (let i = 0; i < sortedTimes.length; i++) {
      let burstCount = 0;
      for (let j = i + 1; j < sortedTimes.length; j++) {
        if (sortedTimes[j] - sortedTimes[i] <= 5000) {
          burstCount++;
        } else {
          break;
        }
      }
      if (burstCount >= 4) {
        concurrentBursts++;
        i += burstCount;
      }
    }

    return { ipCollisions, concurrentBursts };
  };

  const securityAuditVal = getSecurityAudit();

  // 4. Polarization & Electoral Margin Index
  const getConsensusIndex = () => {
    if (liveVotesList.length === 0) return { gap: 0, polarization: 'Uniform Distribution', polarizationColor: 'text-gray-400' };

    const choiceCounts: Record<string, number> = {};
    liveVotesList.forEach(v => {
      try {
        const ansObj = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
        const selection = ansObj?.[activeQuestion.id];
        if (selection) {
          const optionId = Array.isArray(selection) ? selection[0] : selection;
          choiceCounts[optionId] = (choiceCounts[optionId] || 0) + 1;
        }
      } catch (e) {}
    });

    const sortedChoices = Object.entries(choiceCounts).sort((a, b) => b[1] - a[1]);
    const total = liveVotesList.length;
    
    if (sortedChoices.length === 0) {
      return { gap: 0, polarization: 'No votes recorded', polarizationColor: 'text-gray-400' };
    }

    const firstPercent = Math.round((sortedChoices[0][1] / total) * 100);
    const secondPercent = sortedChoices[1] ? Math.round((sortedChoices[1][1] / total) * 100) : 0;
    const gap = firstPercent - secondPercent;

    let polarization = 'Mild Consensus';
    let polarizationColor = 'text-indigo-400';
    if (firstPercent > 60) {
      polarization = '⚡ Absolute Consensus (Landslide)';
      polarizationColor = 'text-emerald-400';
    } else if (gap < 8 && sortedChoices.length > 1) {
      polarization = '⚖️ Highly Polarized (Dead Heat)';
      polarizationColor = 'text-red-400';
    } else if (sortedChoices.length > 2) {
      polarization = '🧩 Distributed Preferences';
      polarizationColor = 'text-purple-400';
    }

    return { gap, polarization, polarizationColor };
  };

  const consensusIndex = getConsensusIndex();

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-8 print:p-0 print:m-0">
      
      {/* Print-only Header (hidden on web, shown on print PDF) */}
      <div className="hidden print:block border-b-2 border-gray-900 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-black uppercase tracking-wide">Official Election Analytics Report</h1>
        <p className="text-gray-600 text-xs mt-1">Generated by Pollstar Platform on {new Date().toLocaleString()}</p>
      </div>

      {/* Breadcrumbs Action bar (hidden on print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center space-x-3">
          <Link
            href={`/dashboard/polls/${poll.id}/present`}
            target="_blank"
            className="px-4 py-2.5 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition-all flex items-center space-x-2"
          >
            <MonitorPlay className="w-4 h-4" />
            <span>Live Presentation Mode</span>
          </Link>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold transition-all flex items-center space-x-2"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Report as PDF</span>
          </button>
        </div>
      </div>

      {/* Main Insights Header Card */}
      <div className="glass-card rounded-3xl p-8 border border-white/5 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between print:border-0 print:p-0 print:bg-transparent">
        <div className="space-y-3">
          <div className="flex items-center space-x-3 print:hidden">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold border border-white/10 bg-white/5 text-gray-300">
              {poll.isOpenVoting ? 'Open Public' : 'Closed Register'}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold border border-indigo-500/30 bg-indigo-500/5 text-indigo-400">
              {poll.isAnonymous ? 'Anonymous' : 'Known Identity'}
            </span>
          </div>
          <h1 className="font-outfit text-3xl font-extrabold text-white leading-tight print:text-black">
            {poll.title}
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-2xl print:text-gray-700">
            {poll.description}
          </p>
        </div>

        {/* Action controllers (hidden on print) */}
        {isOwner && (
          <div className="flex flex-wrap items-center gap-3 shrink-0 print:hidden">
            {poll.status === 'DRAFT' && (
              <button
                onClick={() => handleUpdateStatus('ACTIVE')}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold gradient-btn text-white"
              >
                Launch Poll (Active)
              </button>
            )}

            {poll.status === 'ACTIVE' && (
              <button
                onClick={() => handleUpdateStatus('ENDED')}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all animate-pulse-glow"
              >
                End Poll Early
              </button>
            )}

            <button
              onClick={handleDeletePoll}
              className="p-3 rounded-xl border border-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
              title="Delete Poll"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>
        )}
      </div>

      {/* Settings Panel & Aggregates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 flex items-center justify-between print:border-gray-200 print:bg-white print:text-black">
          <div>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1 print:text-gray-600">Total Votes Logged</span>
            <span className="font-outfit text-3xl font-extrabold text-white print:text-black">{liveTotalVotes}</span>
          </div>
          <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 print:hidden">
            <Users className="w-7 h-7" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center justify-between print:border-gray-200 print:bg-white print:text-black">
          <div>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1 print:text-gray-600">Device Anomalies (IP/ISP)</span>
            <span className="font-outfit text-3xl font-extrabold text-white print:text-black">{suspiciousVotesCount}</span>
          </div>
          <div className={`p-4 rounded-2xl shrink-0 print:hidden ${
            suspiciousVotesCount > 0 ? 'bg-red-500/10 text-red-400 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            {suspiciousVotesCount > 0 ? <AlertTriangle className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center justify-between print:border-gray-200 print:bg-white print:text-black">
          <div>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1 print:text-gray-600">Timeline Schedule</span>
            <span className="font-outfit text-xs font-bold text-white block mt-1.5 leading-relaxed print:text-black">
              Start: {new Date(poll.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}<br/>
              End: {new Date(poll.endTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
          <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400 print:hidden">
            <Calendar className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Dynamic toggle switches for Creator dashboard */}
      {isOwner && (
        <div className="glass-card rounded-2xl p-5 border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-6 print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-outfit font-bold text-white text-sm">Public Results Visibility</h4>
              <p className="text-gray-500 text-[10px] mt-0.5">Let voters view charts and geolocations in real time.</p>
            </div>
            <button
              onClick={() => handleTogglePublicVisibility(!poll.isResultPublic)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                poll.isResultPublic 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}
            >
              {poll.isResultPublic ? '✓ Public Results' : 'Private Results'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-outfit font-bold text-white text-sm">Strict Anonymity Mode</h4>
              <p className="text-gray-500 text-[10px] mt-0.5">Masks names, identifiers, and choices inside log sheets.</p>
            </div>
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-white/10 bg-white/3 text-gray-400 select-none">
              {poll.isAnonymous ? 'Strictly Anonymous' : 'Open Registration'}
            </span>
          </div>

          {/* Granular Analytics Toggles */}
          {poll.isResultPublic && (
            <div className="col-span-1 sm:col-span-2 border-t border-white/5 pt-6 mt-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-outfit font-bold text-white text-sm">Show Total Stats</h4>
                  <p className="text-gray-500 text-[10px] mt-0.5">Let voters view aggregate statistics.</p>
                </div>
                <button
                  onClick={() => handleToggleGranularVisibility('publicShowStats', poll.settings?.publicShowStats === false ? true : false)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    poll.settings?.publicShowStats !== false 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  {poll.settings?.publicShowStats !== false ? '✓ Visible' : 'Hidden'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-outfit font-bold text-white text-sm">Show Analytics Charts</h4>
                  <p className="text-gray-500 text-[10px] mt-0.5">Let voters view pie and bar charts.</p>
                </div>
                <button
                  onClick={() => handleToggleGranularVisibility('publicShowCharts', poll.settings?.publicShowCharts === false ? true : false)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    poll.settings?.publicShowCharts !== false 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  {poll.settings?.publicShowCharts !== false ? '✓ Visible' : 'Hidden'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-outfit font-bold text-white text-sm">Show Geolocations Map</h4>
                  <p className="text-gray-500 text-[10px] mt-0.5">Let voters view global voter maps.</p>
                </div>
                <button
                  onClick={() => handleToggleGranularVisibility('publicShowMaps', poll.settings?.publicShowMaps === false ? true : false)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    poll.settings?.publicShowMaps !== false 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  {poll.settings?.publicShowMaps !== false ? '✓ Visible' : 'Hidden'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Advanced Analytical Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Insight Card 1: Turnout and Engagement */}
        {!poll.isOpenVoting && (
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h4 className="font-outfit text-xs font-bold text-white uppercase tracking-wider">Voter Participation Rate</h4>
              <span className="text-[10px] font-bold text-indigo-400">{turnoutPercent}% Turnout</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center rounded-full border-4 border-white/5">
                <div 
                  className="absolute inset-0 rounded-full border-4 border-indigo-500 transition-all duration-500" 
                  style={{ clipPath: `polygon(50% 50%, -50% -50%, ${turnoutPercent >= 50 ? '150%' : '50%'} ${turnoutPercent >= 25 ? '150%' : '-50%'}, 150% 150%, -50% 150%)`, transform: 'rotate(-45deg)' }}
                />
                <span className="text-xs font-bold text-white z-10">{liveTotalVotes}/{allowedCount}</span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                {liveTotalVotes === allowedCount 
                  ? 'Incredible! 100% participation achieved for this election.' 
                  : `Currently waiting on ${allowedCount - liveTotalVotes} registered voters to submit their choices.`
                }
              </p>
            </div>
          </div>
        )}

        {/* Insight Card 2: Hourly Voting Speed (Velocity) */}
        <div className={`glass-card rounded-2xl p-6 border border-white/5 space-y-4 ${poll.isOpenVoting ? 'md:col-span-2' : ''}`}>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h4 className="font-outfit text-xs font-bold text-white uppercase tracking-wider">Voting Velocity Momentum</h4>
            <span className="text-[10px] font-bold text-purple-400">Past 6 Hours</span>
          </div>
          <div className="flex items-end justify-between h-16 pt-2">
            {velocityData.map((d, idx) => {
              const maxCount = Math.max(...velocityData.map(v => v.count)) || 1;
              const heightPercent = Math.max(10, Math.round((d.count / maxCount) * 100));

              return (
                <div key={idx} className="flex flex-col items-center flex-1 space-y-1">
                  <div 
                    className="w-4 bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-sm transition-all duration-500" 
                    style={{ height: `${heightPercent * 0.4}px` }}
                    title={`${d.count} votes cast`}
                  />
                  <span className="text-[8px] text-gray-500 scale-90 truncate max-w-[40px]">{d.hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insight Card 3: Platform Device Partitioning */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h4 className="font-outfit text-xs font-bold text-white uppercase tracking-wider">Device Source Distribution</h4>
            <span className="text-[10px] font-bold text-emerald-400">Verified Platform</span>
          </div>
          <div className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-400">🖥️ Desktop Client</span>
                <span className="text-white">{devices.desktopPercent}%</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${devices.desktopPercent}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-400">📱 Mobile Device</span>
                <span className="text-white">{devices.mobilePercent}%</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${devices.mobilePercent}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: AI Deep Pattern Intelligence Hub */}
      {liveVotesList.length > 0 && (
        <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/5 space-y-6">
          <div className="flex items-center space-x-3 border-b border-white/5 pb-4">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-outfit text-xl font-bold text-white leading-tight">AI Trend & Pattern Intelligence</h3>
              <p className="text-gray-500 text-xs mt-0.5">Statistical correlation models resolving vote density anomalies, demographic skewing, and pace accelerations.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pattern Metric 1: Momentum */}
            <div className="bg-white/2 rounded-2xl p-5 border border-white/5 space-y-3">
              <div className="flex items-center space-x-2 text-purple-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Velocity Dynamics</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-extrabold text-white">{timeAnalytics.avgInterval}</div>
                <div className="text-gray-500 text-[10px]">Average interval between submissions</div>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between text-[10px] font-bold">
                <span className="text-gray-400">Peak Hour:</span>
                <span className="text-white">{timeAnalytics.peakHour}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-400">Status:</span>
                <span className="text-white">{timeAnalytics.acceleration}</span>
              </div>
            </div>

            {/* Pattern Metric 2: Polarization */}
            <div className="bg-white/2 rounded-2xl p-5 border border-white/5 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Gauge className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Consensus Index</span>
              </div>
              <div className="space-y-1">
                <div className={`text-sm font-extrabold truncate ${consensusIndex.polarizationColor}`}>
                  {consensusIndex.polarization}
                </div>
                <div className="text-gray-500 text-[10px]">Consensus and preference polarization rating</div>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between text-[10px] font-bold">
                <span className="text-gray-400">Winner Lead Margin:</span>
                <span className="text-indigo-400 font-extrabold">{consensusIndex.gap}% lead gap</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-400">Confidence Interval:</span>
                <span className="text-white">{consensusIndex.gap > 20 ? '🏆 Decisive Lead' : '⚖️ High Contestation'}</span>
              </div>
            </div>

            {/* Pattern Metric 3: Security & IP Density */}
            <div className="bg-white/2 rounded-2xl p-5 border border-white/5 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Security & Concurrency</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-extrabold text-white">{suspiciousVotesCount}</div>
                <div className="text-gray-500 text-[10px]">Total flagged anomalies detected</div>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between text-[10px] font-bold">
                <span className="text-gray-400">Multi-Device IP Overlaps:</span>
                <span className={`font-extrabold ${securityAuditVal.ipCollisions > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {securityAuditVal.ipCollisions} IPs
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-400">Concurrent Bursts (5s):</span>
                <span className={`font-extrabold ${securityAuditVal.concurrentBursts > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                  {securityAuditVal.concurrentBursts} bursts
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Correlation Observation Bullet Points */}
          <div className="border-t border-white/5 pt-4 space-y-2.5">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Statistical Pattern Observations</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {correlationInsights.map((insight, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-gray-300 bg-white/2 p-3 rounded-xl border border-white/5">
                  <span className="text-indigo-400 font-bold"># {idx + 1}</span>
                  <p className="leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics Graphs */}
      <div className="space-y-3">
        <h3 className="font-outfit text-xl font-bold text-white flex items-center space-x-2 print:text-black">
          <BarChart3 className="w-5 h-5 text-indigo-400 print:hidden" />
          <span>Visual Distribution Analytics</span>
        </h3>
        
        <div className="glass-card rounded-3xl p-8 border border-white/5 print:border-gray-200 print:bg-white print:text-black">
          <PollChart
            questionId={activeQuestion.id}
            questionText={activeQuestion.questionText}
            type={activeQuestion.type}
            stats={liveStats[activeQuestion.id] || {}}
            votesList={liveVotesList}
            optionsList={activeQuestion.options}
          />
        </div>
      </div>

      {/* Voter Segment Preferences Trend analysis (Roll Number Ranges / Prefix) */}
      {liveVotesList.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-outfit text-xl font-bold text-white flex items-center space-x-2 print:text-black">
            <Users className="w-5 h-5 text-indigo-400 print:hidden" />
            <span>Voter Segment Preference Trends</span>
          </h3>
          <p className="text-gray-500 text-xs print:text-gray-600">
            A comprehensive batch trend resolution identifying batch clusters, roll number prefixes, or numeric ranges alongside their dominant preferences.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {getRollNumberTrends().map((trend, index) => (
              <div key={index} className="glass-card rounded-2xl p-5 border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Segment: {trend.groupName}
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold">{trend.total} {trend.total === 1 ? 'ballot' : 'ballots'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 text-[10px] block">Dominant Preference</span>
                  <span className="text-white font-bold text-sm block truncate" title={trend.topChoice}>
                    {trend.topChoice}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-bold">
                  <span className="text-gray-400">Margin</span>
                  <span className="text-indigo-400">{trend.marginPercent}% preference</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Geolocation plot maps (hidden on print unless already rendered) */}
      <div className="space-y-3 print:hidden">
        <h3 className="font-outfit text-xl font-bold text-white flex items-center space-x-2">
          <span>Global Voter Geolocations</span>
        </h3>
        
        {liveVotesList.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 border border-white/5 rounded-2xl">
            Map is inactive until first votes are received.
          </div>
        ) : (
          <PollMap 
            locations={liveVotesList.map((v) => ({
              ipAddress: v.ipAddress,
              isp: v.isp,
              lat: v.latitude || 22.5726,
              lon: v.longitude || 88.3639,
              flaggedSuspicious: v.flaggedSuspicious,
            }))}
          />
        )}
      </div>

      {/* Voter Management Panel (OTP Bypass) — Closed polls only */}
      {isOwner && !poll.isOpenVoting && poll.allowedVoters && poll.allowedVoters.length > 0 && (
        <div className="space-y-3 print:hidden">
          <h3 className="font-outfit text-xl font-bold text-white flex items-center space-x-2">
            <Unlock className="w-5 h-5 text-amber-400" />
            <span>Registered Voter Management</span>
          </h3>
          <p className="text-gray-500 text-xs">
            If a high-priority voter cannot access their email to receive the OTP, click <strong className="text-amber-400">Grant 30s Bypass</strong> next to their name. They will have exactly 30 seconds to enter their credentials and be let in without needing an OTP code.
          </p>
          <div className="glass-card rounded-2xl border border-white/5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/5 text-gray-400 font-bold border-b border-white/10 uppercase tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Identifier</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Voted</th>
                  <th className="py-3 px-4 text-center">OTP Bypass</th>
                </tr>
              </thead>
              <tbody>
                {poll.allowedVoters.map((voter: any, idx: number) => {
                  const countdown = bypassCountdowns[voter.id];
                  return (
                    <tr key={voter.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="py-3 px-4 text-gray-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-white">{voter.identifier}</td>
                      <td className="py-3 px-4 text-gray-400">{voter.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          voter.voted
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : 'bg-white/5 border border-white/10 text-gray-500'
                        }`}>
                          {voter.voted ? '✓ Voted' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {countdown ? (
                          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs">
                            <Timer className="w-3 h-3 animate-pulse" />
                            <span>{countdown}s remaining</span>
                          </div>
                        ) : voter.voted ? (
                          <span className="text-gray-600 text-[10px] font-semibold">Already voted</span>
                        ) : (
                          <button
                            onClick={() => handleGrantBypass(voter.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all"
                          >
                            Grant 30s Bypass
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Voter registration logs */}
      <div className="space-y-3">
        <h3 className="font-outfit text-xl font-bold text-white flex items-center space-x-2 print:text-black">
          <ShieldAlert className="w-5 h-5 text-indigo-400 print:hidden" />
          <span>Individual Vote Audit Sheet</span>
        </h3>
        <p className="text-gray-500 text-xs print:text-gray-600">A detailed chronological audit list of all submissions. In anonymous polls, individual identities and selection answers are strictly masked.</p>

        {liveVotesList.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center text-gray-500 text-sm border border-white/5">
            No votes have been cast in this session yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-white/5 rounded-2xl print:border-gray-200 print:bg-white print:text-black">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/5 text-gray-400 font-bold border-b border-white/10 uppercase tracking-wider print:bg-gray-100 print:text-black">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Identifier</th>
                  <th className="py-3.5 px-4">Email</th>
                  {!poll.isAnonymous && <th className="py-3.5 px-4">Cast Selection</th>}
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4">Internet Provider (ISP)</th>
                  <th className="py-3.5 px-4">Device</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {liveVotesList.map((v, idx) => {
                  let choiceText = 'N/A';
                  try {
                    const ansObj = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
                    const selection = ansObj?.[activeQuestion.id];
                    if (selection) {
                      const optionId = Array.isArray(selection) ? selection[0] : selection;
                      const opt = activeQuestion.options.find((o: any) => o.id === optionId);
                      choiceText = opt ? opt.text : optionId;
                    }
                  } catch (e) {}

                  return (
                    <tr key={v.id} className="border-b border-white/5 hover:bg-white/2 transition-colors print:border-gray-200">
                      <td className="py-3 px-4 text-center font-mono text-gray-500 print:text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-white print:text-black">
                        {poll.isAnonymous ? `Anonymous Voter #${idx + 1}` : v.userIdentifier}
                      </td>
                      <td className="py-3 px-4 text-gray-400 print:text-gray-700">
                        {poll.isAnonymous ? '••••••••••••••••' : v.email}
                      </td>
                      {!poll.isAnonymous && (
                        <td className="py-3 px-4 font-semibold text-indigo-400 print:text-indigo-600">
                          {choiceText}
                        </td>
                      )}
                      <td className="py-3 px-4 font-mono text-gray-400 print:text-gray-700">{v.ipAddress}</td>
                      <td className="py-3 px-4 text-gray-400 print:text-gray-700">{v.isp || 'Local ISP'}</td>
                      <td className="py-3 px-4 text-gray-400 print:text-gray-700 font-semibold">{v.device === 'Mobile' ? '📱 Mobile' : '🖥️ Desktop'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          v.flaggedSuspicious 
                            ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        }`}>
                          {v.flaggedSuspicious ? 'FLAGGED' : 'SECURE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500 print:text-gray-600">
                        {new Date(v.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* customized printing overrides style */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, sans-serif !important;
          }
          .glass-card {
            background: #ffffff !important;
            border: 1px solid #d1d5db !important;
            box-shadow: none !important;
            color: #000000 !important;
            border-radius: 8px !important;
            padding: 16px !important;
            margin-bottom: 24px !important;
          }
          h1, h2, h3, h4, span, strong, td, th {
            color: #000000 !important;
          }
          .print\\:hidden, .print-hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
