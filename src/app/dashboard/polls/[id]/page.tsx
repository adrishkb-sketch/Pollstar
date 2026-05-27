'use client';

import { useEffect, useState, useRef, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Vote, ArrowLeft, Loader2, AlertCircle, Calendar, 
  Trash2, ShieldCheck, Download, Check, FileDown, 
  Users, AlertTriangle, Eye, ShieldAlert, BarChart3,
  Brain, TrendingUp, Gauge, Zap, Award, MonitorPlay,
  Unlock, Timer, MessageSquare, Send, Mail,
  Layers, Filter, PieChart, Hash
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
  const [velocityNow, setVelocityNow] = useState(0);

  // Action status loading
  const [actionLoading, setActionLoading] = useState(false);

  // Live Ticker states
  const [prevPercentages, setPrevPercentages] = useState<Record<string, number>>({});
  const [tickerChanges, setTickerChanges] = useState<Record<string, { direction: 'UP' | 'DOWN', diff: string }>>({});
  const [tickerFlashState, setTickerFlashState] = useState<Record<string, 'UP' | 'DOWN' | null>>({});

  // Analytics Inbox & Messaging states
  const [activeTab, setActiveTab] = useState<'analytics' | 'inbox'>('analytics');
  const [inboxMessages, setInboxMessages] = useState<any[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [inboxSearch, setInboxSearch] = useState('');

  // Fetch direct messages on mount and poll when active
  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setInboxMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Failed to load messages inbox:', err);
      }
    };

    fetchInbox();
    const interval = setInterval(fetchInbox, 4000);
    return () => clearInterval(interval);
  }, [pollId]);

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
        setVelocityNow(Date.now());
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
          setPoll((prev: any) => prev ? {
            ...prev,
            allowedVoters: data.poll.allowedVoters || prev.allowedVoters,
            settings: data.poll.settings || prev.settings,
            status: data.poll.status,
            totalVotes: data.poll.totalVotes,
          } : data.poll);
          setLiveStats(data.poll.stats || {});
          setLiveTotalVotes(data.poll.totalVotes || 0);
          setLiveVotesList(data.poll.votes || []);
          setVelocityNow(Date.now());
        }
      } catch (err) {
        console.error('Creator Insights sync error:', err);
      }
    }, 4000); // Refresh every 4 seconds

    return () => clearInterval(interval);
  }, [poll, pollId]);

  // Live Ticker percentage calculation & change detection hook
  useEffect(() => {
    if (!poll || !liveStats || !poll.questions?.[0]) return;
    const activeQ = poll.questions[0];
    const qStats = liveStats[activeQ.id] || {};
    const total = Object.values(qStats).reduce((acc: number, cur: any) => acc + (cur.count || 0), 0) as number;
    
    if (total === 0) return;

    const newPercentages: Record<string, number> = {};
    const changes: Record<string, { direction: 'UP' | 'DOWN', diff: string }> = {};
    const flashes: Record<string, 'UP' | 'DOWN' | null> = {};
    let hasChanged = false;

    activeQ.options.forEach((opt: any) => {
      const optStats = qStats[opt.id] || { count: 0 };
      const currentPct = (optStats.count / total) * 100;
      newPercentages[opt.id] = currentPct;

      const prevPct = prevPercentages[opt.id];
      if (prevPct !== undefined && Math.abs(currentPct - prevPct) > 0.01) {
        hasChanged = true;
        const direction = currentPct > prevPct ? 'UP' : 'DOWN';
        const diff = Math.abs(currentPct - prevPct).toFixed(1);
        changes[opt.id] = { direction, diff };
        flashes[opt.id] = direction;
      }
    });

    if (hasChanged) {
      setTickerChanges(prev => ({ ...prev, ...changes }));
      setTickerFlashState(prev => ({ ...prev, ...flashes }));
      setPrevPercentages(newPercentages);

      // Reset flash state after 1.5 seconds
      const timer = setTimeout(() => {
        setTickerFlashState({});
      }, 1500);
      return () => clearTimeout(timer);
    } else if (Object.keys(prevPercentages).length === 0) {
      setPrevPercentages(newPercentages);
    }
  }, [liveStats, poll, prevPercentages]);

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

  const handleToggleGranularVisibility = async (field: string, val: any) => {
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

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoter || !replyInput.trim()) return;

    setSendingReply(true);
    const text = replyInput;
    setReplyInput('');

    try {
      const res = await fetch(`/api/polls/${pollId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voterIdentifier: selectedVoter,
          isFromCreator: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInboxMessages((prev) => [...prev, data.message]);
      } else {
        setReplyInput(text); // restore
      }
    } catch (err) {
      console.error(err);
      setReplyInput(text);
    } finally {
      setSendingReply(false);
    }
  };

  // 4. Trigger print styling (window.print() with Print stylesheet overrides)
  const handleExportPDF = () => {
    window.print();
  };

  // 5. Grant 30-second OTP Bypass to a specific voter (timestamp-based stable timer)
  const [bypassCountdowns, setBypassCountdowns] = useState<Record<string, number>>({});
  const bypassDeadlinesRef = useRef<Record<string, number>>({});

  // Stable countdown tick from the server-provided expiry timestamp.
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const deadlines = bypassDeadlinesRef.current;
      const keys = Object.keys(deadlines);

      const next: Record<string, number> = {};
      const nextDeadlines: Record<string, number> = {};
      for (const vid of keys) {
        const remaining = Math.ceil((deadlines[vid] - now) / 1000);
        if (remaining > 0) {
          next[vid] = remaining;
          nextDeadlines[vid] = deadlines[vid];
        }
      }
      bypassDeadlinesRef.current = nextDeadlines;
      setBypassCountdowns(next);
    };
    tick();
    const intervalId = setInterval(tick, 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleGrantBypass = useCallback(async (voterId: string) => {
    try {
      const res = await fetch(`/api/polls/${pollId}/grant-bypass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to grant bypass');

      const deadline = data.bypassOtpUntil ? new Date(data.bypassOtpUntil).getTime() : Date.now() + 30000;
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      bypassDeadlinesRef.current = { ...bypassDeadlinesRef.current, [voterId]: deadline };
      setBypassCountdowns((prev) => ({ ...prev, [voterId]: remaining }));
    } catch (e: any) {
      alert(e.message);
    }
  }, [pollId]);

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
  const bypassRequestNow = velocityNow || new Date(poll.startTime).getTime();
  const activeBypassRequests = (poll.allowedVoters || []).filter((v: any) => {
    const requestExpiry = v.bypassOtpUntil ? Date.parse(v.bypassOtpUntil) : 0;
    return v.bypassRequested && requestExpiry > bypassRequestNow;
  });

  // Hourly Velocity
  const getVotingVelocity = () => {
    const hourlyGroups: Record<string, number> = {};
    const now = velocityNow || new Date(poll.endTime || poll.startTime).getTime();
    
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
    let tablet = 0;
    let desktop = 0;
    liveVotesList.forEach((v) => {
      if (v.device === 'Mobile') mobile++;
      else if (v.device === 'Tablet') tablet++;
      else desktop++;
    });
    const total = liveVotesList.length || 1;
    return {
      mobilePercent: Math.round((mobile / total) * 100),
      tabletPercent: Math.round((tablet / total) * 100),
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

    const deviceChoices: Record<string, Record<string, number>> = { Desktop: {}, Mobile: {}, Tablet: {} };
    liveVotesList.forEach(v => {
      const dev = v.device === 'Tablet' ? 'Tablet' : (v.device === 'Mobile' ? 'Mobile' : 'Desktop');
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
    const tDom = getDominant(deviceChoices.Tablet);

    if (dDom.best && mDom.best) {
      if (dDom.best === mDom.best) {
        insights.push(`🎯 Strong platform alignment: Both desktop (${dDom.percent}%) and mobile (${mDom.percent}%) voters overwhelmingly prefer "${dDom.best}".`);
      } else {
        insights.push(`🎭 Device usage divergence: Desktop voters prefer "${dDom.best}" (${dDom.percent}%), while mobile users skew towards "${mDom.best}" (${mDom.percent}%).`);
      }
    }
    if (tDom.best && tDom.best !== dDom.best && tDom.best !== mDom.best) {
        insights.push(`📱 Tablet Anomaly: Tablet users have a unique dominant preference for "${tDom.best}" (${tDom.percent}%).`);
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

  // Extract and group direct messages into active voter threads
  const threadsMap: Record<string, { lastMessage: any; unread: boolean; messagesCount: number }> = {};
  inboxMessages.forEach((m) => {
    const id = m.senderIdentifier;
    if (!threadsMap[id]) {
      threadsMap[id] = { lastMessage: m, unread: false, messagesCount: 0 };
    }
    threadsMap[id].messagesCount++;
    if (new Date(m.createdAt).getTime() > new Date(threadsMap[id].lastMessage.createdAt).getTime()) {
      threadsMap[id].lastMessage = m;
    }
    if (!m.isFromCreator) {
      threadsMap[id].unread = true;
    }
  });

  const threadsList = Object.entries(threadsMap).map(([id, info]) => ({
    identifier: id,
    ...info,
  })).sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

  const filteredThreads = threadsList.filter((t) =>
    t.identifier.toLowerCase().includes(inboxSearch.toLowerCase()) ||
    t.lastMessage.text.toLowerCase().includes(inboxSearch.toLowerCase())
  );

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

      {/* Premium Tab Selector */}
      <div className="flex border-b border-white/5 pb-1 gap-6 print:hidden">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'analytics' ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>🗳️ Analytics & Insights</span>
          {activeTab === 'analytics' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`pb-4 text-sm font-bold transition-all relative flex items-center space-x-1.5 ${
            activeTab === 'inbox' ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>📬 Voter Inbox</span>
          {inboxMessages.some(m => m.isFromCreator === false) && (
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          )}
          {activeTab === 'inbox' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Analytics Inbox (Conditional early return) */}
      {activeTab === 'inbox' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[550px] animate-fade-in print:hidden">
          {/* Left panel: Threads list */}
          <div className="md:col-span-4 glass-card rounded-2xl border border-white/5 bg-[#080d1a] p-4 flex flex-col space-y-4 h-[550px]">
            <div className="flex flex-col gap-1">
              <h3 className="font-outfit text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <MessageSquare className="w-4.5 h-4.5 text-indigo-400" />
                <span>Conversations</span>
              </h3>
              <p className="text-gray-500 text-[10px]">Direct threads with voters submitting feedback.</p>
            </div>

            {/* Thread Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search threads by identifier..."
                value={inboxSearch}
                onChange={(e) => setInboxSearch(e.target.value)}
                className="w-full bg-[#030712] border border-white/8 hover:border-white/12 focus:border-indigo-500/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 no-scrollbar">
              {filteredThreads.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-gray-500 text-xs py-8">
                  {inboxSearch ? 'No matching threads found.' : 'No voter messages received yet.'}
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isActive = selectedVoter === thread.identifier;
                  const isLastMe = thread.lastMessage.isFromCreator;
                  return (
                    <button
                      key={thread.identifier}
                      onClick={() => {
                        setSelectedVoter(thread.identifier);
                        setReplyInput('');
                      }}
                      className={`w-full p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        isActive
                          ? 'border-indigo-500/50 bg-indigo-500/10'
                          : 'border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full gap-2">
                        <span className="text-xs font-bold text-white truncate max-w-[140px]">{thread.identifier}</span>
                        <span className="text-[8px] text-gray-500 font-mono shrink-0">
                          {new Date(thread.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center w-full gap-2">
                        <p className="text-[10px] text-gray-400 truncate max-w-[160px]">
                          {isLastMe && <span className="text-indigo-400 font-semibold mr-0.5">You: </span>}
                          {thread.lastMessage.text}
                        </p>
                        {!isLastMe && thread.unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: Active chat window */}
          <div className="md:col-span-8 glass-card rounded-2xl border border-white/5 bg-[#080d1a] flex flex-col justify-between h-[550px] overflow-hidden">
            {selectedVoter ? (
              <>
                {/* Active Thread Header */}
                <div className="border-b border-white/5 p-4 flex items-center justify-between bg-white/1">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center font-bold text-xs text-indigo-400 font-mono">
                      {selectedVoter.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white">{selectedVoter}</span>
                      <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Direct Voter Thread
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedVoter(null)}
                    className="text-gray-400 hover:text-white transition-all text-xs border border-white/8 hover:border-white/15 px-2.5 py-1 rounded-lg bg-white/2"
                  >
                    Clear Thread Selection
                  </button>
                </div>

                {/* Messages feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-white/0.5 no-scrollbar">
                  {inboxMessages
                    .filter((m) => m.senderIdentifier === selectedVoter)
                    .map((msg, idx) => {
                      const isMe = msg.isFromCreator;
                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-lg ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white/5 border border-white/5 text-gray-200 rounded-tl-none'
                          }`}>
                            <p className="break-words font-medium">{msg.text}</p>
                            <span className="block text-[8px] text-white/50 text-right mt-1.5 font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Reply box */}
                <form onSubmit={handleSendReply} className="border-t border-white/5 p-4 flex gap-2.5 bg-white/1">
                  <input
                    type="text"
                    required
                    placeholder={`Write a direct reply to ${selectedVoter}...`}
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    className="flex-1 bg-[#030712] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyInput.trim()}
                    className="px-4 py-3 rounded-xl gradient-btn text-white transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
                  >
                    {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 animate-bounce">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div className="max-w-xs space-y-1.5">
                  <h4 className="font-outfit text-sm font-bold text-white">Select a voter thread</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Select a thread from the conversations list on the left to read voter feedback and reply to them in real time.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Wall Street Live Ticker */}
          {poll.settings?.enableLiveTicker && activeQuestion && (
        <div className="glass-card rounded-2xl border border-white/5 bg-slate-950/40 p-4 flex items-center overflow-hidden relative select-none animate-fade-in print:hidden mb-6">
          <div className="flex items-center space-x-2 border-r border-white/10 pr-4 shrink-0 bg-slate-950/80 backdrop-blur z-10">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">LIVE TICKER</span>
          </div>
          <div className="flex items-center space-x-6 pl-6 overflow-x-auto no-scrollbar py-1">
            {activeQuestion.options.map((opt: any) => {
              const optStats = (liveStats[activeQuestion.id] || {})[opt.id] || { count: 0 };
              const total = Object.values(liveStats[activeQuestion.id] || {}).reduce((acc: number, cur: any) => acc + (cur.count || 0), 0) as number;
              const percentage = total > 0 ? (optStats.count / total) * 100 : 0;
              const flash = tickerFlashState[opt.id];
              const change = tickerChanges[opt.id];

              let bgClass = "bg-white/2 border-white/5";
              if (flash === 'UP') bgClass = "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold scale-105 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
              if (flash === 'DOWN') bgClass = "bg-red-500/20 border-red-500/40 text-red-400 font-bold scale-105 shadow-[0_0_10px_rgba(239,68,68,0.2)]";

              return (
                <div 
                  key={opt.id} 
                  className={`inline-flex items-center space-x-2 border rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${bgClass}`}
                >
                  <span className="text-gray-300 font-medium truncate max-w-[120px]">{opt.text}</span>
                  <span className="text-white font-mono">{percentage.toFixed(1)}%</span>
                  {change && (
                    <span className={`inline-flex items-center text-[10px] font-extrabold transition-all duration-300 ${
                      change.direction === 'UP' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {change.direction === 'UP' ? '▲' : '▼'} {change.diff}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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

          {/* Beast Mode Options */}
          <div className="border-t border-white/5 pt-6 mt-6 col-span-1 sm:col-span-2">
            <h4 className="font-outfit font-extrabold text-amber-400 text-sm mb-4 uppercase tracking-wider flex items-center space-x-2">
              <Zap className="w-4 h-4 animate-pulse text-amber-400" />
              <span>Beast Mode Configurations</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Drag and Drop Podium Toggle (Ranked choice only) */}
              {poll.questions && poll.questions.some((q: any) => q.type === 'RANKED') && (
                <div className="flex items-center justify-between border border-white/5 rounded-xl p-3 bg-white/2">
                  <div>
                    <h5 className="font-outfit font-bold text-white text-xs">Drag & Drop Podium</h5>
                    <p className="text-[10px] text-gray-500">Enable physical 3D podiums.</p>
                  </div>
                  <button
                    onClick={() => handleToggleGranularVisibility('enableDragAndDropPodium', !poll.settings?.enableDragAndDropPodium)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      poll.settings?.enableDragAndDropPodium
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    {poll.settings?.enableDragAndDropPodium ? 'Active' : 'Disabled'}
                  </button>
                </div>
              )}

              {/* Hot Streak Momentum */}
              {poll.questions && poll.questions.some((q: any) => ['SINGLE', 'RANKED'].includes(q.type)) && (
                <div className="flex items-center justify-between border border-white/5 rounded-xl p-3 bg-white/2">
                  <div>
                    <h5 className="font-outfit font-bold text-white text-xs">Hot Streak Momentum</h5>
                    <p className="text-[10px] text-gray-500">Show option fire indicators 🔥.</p>
                  </div>
                  <button
                    onClick={() => handleToggleGranularVisibility('enableHotStreaks', !poll.settings?.enableHotStreaks)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      poll.settings?.enableHotStreaks
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    {poll.settings?.enableHotStreaks ? 'Active' : 'Disabled'}
                  </button>
                </div>
              )}

              {/* Live Ticker */}
              <div className="flex items-center justify-between border border-white/5 rounded-xl p-3 bg-white/2">
                <div>
                  <h5 className="font-outfit font-bold text-white text-xs">Live Dashboard Ticker</h5>
                  <p className="text-[10px] text-gray-500">Show percentage shifts.</p>
                </div>
                <button
                  onClick={() => handleToggleGranularVisibility('enableLiveTicker', !poll.settings?.enableLiveTicker)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    poll.settings?.enableLiveTicker
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  {poll.settings?.enableLiveTicker ? 'Active' : 'Disabled'}
                </button>
              </div>

              {/* Smart Debrief */}
              <div className="flex items-center justify-between border border-white/5 rounded-xl p-3 bg-white/2">
                <div>
                  <h5 className="font-outfit font-bold text-white text-xs">Smart Debrief</h5>
                  <p className="text-[10px] text-gray-500">Analytical text results.</p>
                </div>
                <button
                  onClick={() => handleToggleGranularVisibility('enableSmartDebrief', !poll.settings?.enableSmartDebrief)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    poll.settings?.enableSmartDebrief
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  {poll.settings?.enableSmartDebrief ? 'Active' : 'Disabled'}
                </button>
              </div>

              {/* Leaderboard Visibility (dropdown) */}
              <div className="flex items-center justify-between border border-white/5 rounded-xl p-3 bg-white/2 col-span-1 sm:col-span-2 md:col-span-1">
                <div>
                  <h5 className="font-outfit font-bold text-white text-xs">Leaderboard Visibility</h5>
                  <p className="text-[10px] text-gray-500">Define viewer permission.</p>
                </div>
                <select
                  value={poll.settings?.leaderboardVisibility || 'HIDDEN'}
                  onChange={(e) => handleToggleGranularVisibility('leaderboardVisibility', e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold text-white outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="HIDDEN">Hidden</option>
                  <option value="SHOWN_AFTER_VOTE">After Vote</option>
                  <option value="LIVE">Live</option>
                </select>
              </div>
 
               {poll.questions && poll.questions.some((q: any) => q.type === 'RANKED') && (
                <div className="col-span-1 sm:col-span-2 md:col-span-3 border-t border-white/5 pt-6 mt-4">
                  <h5 className="font-outfit font-extrabold text-purple-400 text-xs mb-3 uppercase tracking-wider">
                    Ranked Poll Beast Features
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      ['enablePreferenceFlowMap', 'Preference Flow Map', 'Iterative IRV rounds'],
                      ['enableHeadToHeadMatrix', 'Head-to-Head Duel Matrix', 'Pairwise voter preferences'],
                      ['enableConsensusScore', 'Consensus Score', 'Broad acceptability indexing'],
                      ['enablePolarizationDetector', 'Polarization Detector', 'First vs last rank split'],
                      ['enableKingmakerAnalysis', 'Kingmaker Analysis', 'Transfers from first eliminated'],
                      ['enableRankHeatmap', 'Rank Distribution Heatmap', 'Complete rank density matrix'],
                      ['enableRankConfidence', 'Voter Confidence by Rank', 'Average confidence per rank option'],
                      ['enableScenarioSimulator', 'Scenario Simulator', 'Remove candidate point simulator'],
                      ['enableTieBreakerEngine', 'Tie-Breaker Engine', 'Auto tie-break calculations'],
                      ['enableRankCompleteness', 'Rank Completeness Rules', 'Force full or partial ranking'],
                      ['enablePodiumResults', 'Podium Result Mode', '3D gold/silver/bronze podiums'],
                      ['enableCoalitionFinder', 'Preference Coalition Finder', 'Common priority voter pairs'],
                      ['enableMinorityProtection', 'Minority Protection Score', 'Protects least ranked options'],
                      ['enableAuditReplay', 'Audit Replay', 'Verifies full round calculations'],
                    ].map(([key, label, desc]) => (
                      <div key={key} className="flex items-center justify-between border border-white/5 rounded-xl p-3 bg-white/2">
                        <div>
                          <h6 className="font-outfit font-bold text-white text-[11px]">{label}</h6>
                          <p className="text-[9px] text-gray-500">{desc}</p>
                        </div>
                        <button
                          onClick={() => handleToggleGranularVisibility(key, !poll.settings?.[key])}
                          className={`px-3 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                            poll.settings?.[key]
                              ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                              : 'bg-white/5 border-white/10 text-gray-400'
                          }`}
                        >
                          {poll.settings?.[key] ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {poll.questions && poll.questions.some((q: any) => q.type === 'SINGLE') && (
                <div className="col-span-1 sm:col-span-2 md:col-span-3 border-t border-white/5 pt-6 mt-4">
                  <h5 className="font-outfit font-extrabold text-indigo-400 text-xs mb-3 uppercase tracking-wider">
                    Single Choice Advanced Features
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      ['enableQuadraticVoting', 'Quadratic Voting (Point-based)', 'Voters divide 100 points, costs are squared.'],
                      ['enableAiProjection', 'AI Vote Projection', 'Predicts outcome early based on speed/patterns.'],
                      ['enableCohortCrossTab', 'Voter Group Comparison', 'Filters results by groups like age or department.'],
                      ['enableSentimentChat', 'Opinion Chatbox', 'Adds a live chat sidebar with sentiment tags.'],
                      ['enableSwingMap', 'Voter Shift Map', 'Shows voter preference shifts over time.'],
                    ].map(([key, label, desc]) => (
                      <div key={key} className="flex items-center justify-between border border-white/5 rounded-xl p-3 bg-white/2">
                        <div>
                          <h6 className="font-outfit font-bold text-white text-[11px]">{label}</h6>
                          <p className="text-[9px] text-gray-500">{desc}</p>
                        </div>
                        <button
                          onClick={() => handleToggleGranularVisibility(key, !poll.settings?.[key])}
                          className={`px-3 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                            poll.settings?.[key]
                              ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                              : 'bg-white/5 border-white/10 text-gray-400'
                          }`}
                        >
                          {poll.settings?.[key] ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {poll.questions && poll.questions.some((q: any) => q.type === 'KNOCKOUT') && (
                <div className="col-span-1 sm:col-span-2 md:col-span-3 border-t border-white/5 pt-6 mt-4">
                  <h5 className="font-outfit font-extrabold text-amber-500 text-xs mb-3 uppercase tracking-wider">
                    Knockout Advanced Features
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      ['enableBracketPredictions', 'Playoff Bracket Guessing', 'Voters guess the bracket winner for points.'],
                      ['enableDoubleElimination', 'Double Elimination', 'Options must lose twice before knockout.'],
                      ['enableUnderdogTracker', 'Underdog Tracker', 'Highlights lower-seeded wins.'],
                      ['enableOptionStatsCards', 'Option Factsheets', 'Shows option statistics directly on ballot.'],
                      ['enableSuddenDeath', 'Sudden Death Overtime', 'Breaks matchup ties instantly.'],
                    ].map(([key, label, desc]) => (
                      <div key={key} className="flex items-center justify-between border border-white/5 rounded-xl p-3 bg-white/2">
                        <div>
                          <h6 className="font-outfit font-bold text-white text-[11px]">{label}</h6>
                          <p className="text-[9px] text-gray-500">{desc}</p>
                        </div>
                        <button
                          onClick={() => handleToggleGranularVisibility(key, !poll.settings?.[key])}
                          className={`px-3 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                            poll.settings?.[key]
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : 'bg-white/5 border-white/10 text-gray-400'
                          }`}
                        >
                          {poll.settings?.[key] ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
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
                <span className="text-gray-400">📱 Mobile Phone</span>
                <span className="text-white">{devices.mobilePercent}%</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${devices.mobilePercent}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-gray-400">📟 Tablet Device</span>
                <span className="text-white">{devices.tabletPercent}%</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${devices.tabletPercent}%` }} />
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
            settings={poll.settings}
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

      {/* ── Phase 8: Drop-off / Abandonment Funnel ─────────────────────── */}
      {poll.settings?.enableDropOffTracking && poll.questions?.length > 1 && (
        <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/5 space-y-6 print:hidden">
          <div className="flex items-center space-x-3 border-b border-white/5 pb-4">
            <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-outfit text-xl font-bold text-white leading-tight">Drop-off & Abandonment Funnel</h3>
              <p className="text-gray-500 text-xs mt-0.5">Identifies exactly where respondents abandon the survey. Lower bars indicate higher attrition.</p>
            </div>
          </div>

          {(() => {
            const pages = poll.questions.reduce((acc: Record<number, { page: number; questions: any[] }>, q: any) => {
              const p = q.pageNumber || 1;
              if (!acc[p]) acc[p] = { page: p, questions: [] };
              acc[p].questions.push(q);
              return acc;
            }, {} as Record<number, { page: number; questions: any[] }>);

            const sortedPages = Object.values(pages).sort((a: any, b: any) => a.page - b.page) as { page: number; questions: any[] }[];
            const totalStarted = liveVotesList.length || 1;

            // Calculate how many voters answered at least one question on each page
            const pageCounts = sortedPages.map((pg) => {
              let count = 0;
              liveVotesList.forEach((v) => {
                try {
                  const ans = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
                  const answeredAny = pg.questions.some((q: any) => ans?.[q.id] !== undefined && ans?.[q.id] !== null && ans?.[q.id] !== '');
                  if (answeredAny) count++;
                } catch (e) {}
              });
              return { page: pg.page, count, percent: Math.round((count / totalStarted) * 100) };
            });

            const maxCount = Math.max(...pageCounts.map(p => p.count), 1);

            return (
              <div className="space-y-5">
                {/* Funnel Bars */}
                <div className="space-y-3">
                  {pageCounts.map((pg, idx) => {
                    const dropOff = idx > 0 ? pageCounts[idx - 1].count - pg.count : 0;
                    const dropPercent = idx > 0 && pageCounts[idx - 1].count > 0 ? Math.round((dropOff / pageCounts[idx - 1].count) * 100) : 0;
                    const barWidth = Math.max(8, Math.round((pg.count / maxCount) * 100));
                    const isWorst = dropPercent > 0 && dropPercent === Math.max(...pageCounts.slice(1).map((p, i) => {
                      const prev = pageCounts[i].count;
                      return prev > 0 ? Math.round(((prev - p.count) / prev) * 100) : 0;
                    }));

                    return (
                      <div key={pg.page} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white">Page {pg.page}</span>
                            <span className="text-gray-500 text-[10px]">({sortedPages[idx]?.questions.length || 0} questions)</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-white font-bold">{pg.count} <span className="text-gray-500 font-normal">responses</span></span>
                            {idx > 0 && dropOff > 0 && (
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                                isWorst
                                  ? 'bg-red-500/15 border-red-500/30 text-red-400 animate-pulse'
                                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              }`}>
                                ↓ {dropOff} ({dropPercent}% drop)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-white/3 rounded-full h-4 overflow-hidden border border-white/5">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isWorst ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-indigo-600 to-purple-500'
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Stat Row */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                  <div className="text-center space-y-1">
                    <span className="text-2xl font-extrabold text-white">{pageCounts[0]?.count || 0}</span>
                    <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Started</span>
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-2xl font-extrabold text-white">{pageCounts[pageCounts.length - 1]?.count || 0}</span>
                    <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Completed</span>
                  </div>
                  <div className="text-center space-y-1">
                    <span className={`text-2xl font-extrabold ${
                      pageCounts[0]?.count > 0 && pageCounts[pageCounts.length - 1]?.count < pageCounts[0]?.count * 0.5 ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {pageCounts[0]?.count > 0 ? Math.round((pageCounts[pageCounts.length - 1]?.count / pageCounts[0]?.count) * 100) : 100}%
                    </span>
                    <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Completion Rate</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Phase 8: Semantic Text Analysis (Sentiment Grouping) ───────── */}
      {liveVotesList.length > 0 && poll.questions?.some((q: any) => q.type === 'TEXT') && (
        <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/5 space-y-6 print:hidden">
          <div className="flex items-center space-x-3 border-b border-white/5 pb-4">
            <div className="p-2.5 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400">
              <Hash className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-outfit text-xl font-bold text-white leading-tight">Semantic Text Analysis</h3>
              <p className="text-gray-500 text-xs mt-0.5">Auto-grouped sentiment classification of free-text responses using keyword pattern matching.</p>
            </div>
          </div>

          {(() => {
            const textQuestions = poll.questions.filter((q: any) => q.type === 'TEXT');
            const positiveWords = ['love', 'great', 'excellent', 'good', 'best', 'amazing', 'awesome', 'wonderful', 'fantastic', 'happy', 'perfect', 'satisfied', 'helpful', 'brilliant', 'superb', 'outstanding'];
            const negativeWords = ['hate', 'bad', 'terrible', 'worst', 'awful', 'horrible', 'poor', 'disappointed', 'useless', 'unhappy', 'broken', 'frustrating', 'annoying', 'boring', 'slow', 'ugly'];

            const allResponses: { text: string; sentiment: string; questionText: string }[] = [];

            textQuestions.forEach((q: any) => {
              liveVotesList.forEach((v) => {
                try {
                  const ans = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
                  const textVal = ans?.[q.id];
                  if (textVal && typeof textVal === 'string' && textVal.trim()) {
                    const lower = textVal.toLowerCase();
                    let posScore = 0, negScore = 0;
                    positiveWords.forEach(w => { if (lower.includes(w)) posScore++; });
                    negativeWords.forEach(w => { if (lower.includes(w)) negScore++; });
                    const sentiment = posScore > negScore ? 'POSITIVE' : negScore > posScore ? 'NEGATIVE' : 'NEUTRAL';
                    allResponses.push({ text: textVal, sentiment, questionText: q.questionText });
                  }
                } catch (e) {}
              });
            });

            const posCount = allResponses.filter(r => r.sentiment === 'POSITIVE').length;
            const negCount = allResponses.filter(r => r.sentiment === 'NEGATIVE').length;
            const neuCount = allResponses.filter(r => r.sentiment === 'NEUTRAL').length;
            const total = allResponses.length || 1;

            return (
              <div className="space-y-5">
                {/* Sentiment Distribution Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <span>Sentiment Distribution</span>
                    <span>{allResponses.length} text responses analyzed</span>
                  </div>
                  <div className="w-full h-5 rounded-full overflow-hidden flex border border-white/5">
                    {posCount > 0 && <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(posCount / total) * 100}%` }} />}
                    {neuCount > 0 && <div className="bg-gray-500 h-full transition-all duration-500" style={{ width: `${(neuCount / total) * 100}%` }} />}
                    {negCount > 0 && <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${(negCount / total) * 100}%` }} />}
                  </div>
                  <div className="flex items-center justify-center gap-6 text-[10px]">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Positive ({posCount})</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-500" /> Neutral ({neuCount})</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Negative ({negCount})</span>
                  </div>
                </div>

                {/* Response Cards */}
                {allResponses.length > 0 && (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                    {allResponses.slice(0, 20).map((r, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/2 border border-white/5 text-xs">
                        <span className={`mt-0.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 border ${
                          r.sentiment === 'POSITIVE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : r.sentiment === 'NEGATIVE' ? 'bg-red-500/10 border-red-500/20 text-red-400'
                          : 'bg-gray-500/10 border-gray-500/20 text-gray-400'
                        }`}>
                          {r.sentiment === 'POSITIVE' ? '😊' : r.sentiment === 'NEGATIVE' ? '😡' : '😐'} {r.sentiment}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-200 leading-relaxed break-words">&ldquo;{r.text}&rdquo;</p>
                          <span className="text-[9px] text-gray-500 mt-1 block">Q: {r.questionText}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Phase 8: Demographic Cross-tabulation ─────────────────────── */}
      {poll.settings?.enableCrossTabulation && liveVotesList.length > 0 && (
        <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/5 space-y-6 print:hidden">
          <div className="flex items-center space-x-3 border-b border-white/5 pb-4">
            <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
              <Filter className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-outfit text-xl font-bold text-white leading-tight">Demographic Cross-Tabulation</h3>
              <p className="text-gray-500 text-xs mt-0.5">Slice survey results by demographic segments collected from respondents (age, gender, region).</p>
            </div>
          </div>

          {(() => {
            // Extract demographic answers from page 0 (demographic questions)
            const demoQuestions = (poll.questions || []).filter((q: any) => (q.pageNumber || 1) === 0);
            if (demoQuestions.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500 text-xs border border-dashed border-white/8 rounded-2xl">
                  No demographic questions found. Demographic questions appear on page 0 when cross-tabulation is enabled.
                </div>
              );
            }

            // For each demographic question, group votes by selected demographic option and show vote distribution
            return (
              <div className="space-y-8">
                {demoQuestions.map((dq: any) => {
                  const segments: Record<string, Record<string, number>> = {};
                  const segmentTotals: Record<string, number> = {};

                  liveVotesList.forEach((v) => {
                    try {
                      const ans = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
                      const demoChoice = ans?.[dq.id];
                      if (!demoChoice) return;

                      const demoLabel = Array.isArray(demoChoice) ? demoChoice[0] : demoChoice;
                      const demoOpt = dq.options?.find((o: any) => o.id === demoLabel);
                      const demoText = demoOpt ? demoOpt.text : String(demoLabel);

                      if (!segments[demoText]) segments[demoText] = {};
                      if (!segmentTotals[demoText]) segmentTotals[demoText] = 0;
                      segmentTotals[demoText]++;

                      // Track main question vote
                      if (activeQuestion) {
                        const mainChoice = ans?.[activeQuestion.id];
                        if (mainChoice) {
                          const mainId = Array.isArray(mainChoice) ? mainChoice[0] : mainChoice;
                          const mainOpt = activeQuestion.options?.find((o: any) => o.id === mainId);
                          const mainText = mainOpt ? mainOpt.text : String(mainId);
                          segments[demoText][mainText] = (segments[demoText][mainText] || 0) + 1;
                        }
                      }
                    } catch (e) {}
                  });

                  const segmentEntries = Object.entries(segments).sort((a, b) => (segmentTotals[b[0]] || 0) - (segmentTotals[a[0]] || 0));

                  return (
                    <div key={dq.id} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-cyan-400 shrink-0" />
                        <h4 className="font-outfit text-sm font-bold text-white">{dq.questionText}</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {segmentEntries.map(([segName, choices]) => {
                          const total = segmentTotals[segName] || 1;
                          const sortedChoices = Object.entries(choices).sort((a, b) => b[1] - a[1]);
                          const topChoice = sortedChoices[0];
                          const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

                          return (
                            <div key={segName} className="bg-white/2 rounded-2xl p-4 border border-white/5 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-white">{segName}</span>
                                <span className="text-[10px] text-gray-500 font-bold">{total} respondents</span>
                              </div>

                              {/* Mini bar chart */}
                              <div className="space-y-1.5">
                                {sortedChoices.slice(0, 4).map(([name, count], cIdx) => {
                                  const pct = Math.round((count / total) * 100);
                                  return (
                                    <div key={name} className="space-y-0.5">
                                      <div className="flex justify-between text-[9px] font-bold">
                                        <span className="text-gray-300 truncate max-w-[120px]">{name}</span>
                                        <span className="text-white">{pct}%</span>
                                      </div>
                                      <div className="w-full bg-white/3 rounded-full h-1.5 overflow-hidden">
                                        <div className={`${colors[cIdx % colors.length]} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {topChoice && (
                                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px]">
                                  <span className="text-gray-500 font-bold uppercase tracking-wider">Top Pick</span>
                                  <span className="text-indigo-400 font-bold truncate max-w-[100px]">{topChoice[0]}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Request-only OTP bypass management */}
      {isOwner && !poll.isOpenVoting && activeBypassRequests.length > 0 && (
        <div className="space-y-3 print:hidden">
          <h3 className="font-outfit text-xl font-bold text-amber-500 flex items-center space-x-2 animate-pulse">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span>Registered Voter Management</span>
          </h3>
          <p className="text-gray-400 text-xs">
            Only voters who requested OTP bypass appear here. Requests expire automatically after 5 minutes if you do not grant the 30-second bypass.
          </p>
          <div className="glass-card rounded-2xl border border-white/5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/5 text-gray-400 font-bold border-b border-white/10 uppercase tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Identifier</th>
                  <th className="py-3 px-4">Name / Confirmer</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4 text-center">OTP Bypass</th>
                </tr>
              </thead>
              <tbody>
                {activeBypassRequests.map((voter: any, idx: number) => {
                  const countdown = bypassCountdowns[voter.id];
                  const requestSecondsLeft = Math.max(0, Math.ceil((Date.parse(voter.bypassOtpUntil) - bypassRequestNow) / 1000));
                  return (
                    <tr key={voter.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="py-3 px-4 text-gray-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-white">{voter.identifier}</td>
                      <td className="py-3 px-4 text-gray-300">{voter.confirmer1}</td>
                      <td className="py-3 px-4 text-gray-400">{voter.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          {Math.floor(requestSecondsLeft / 60)}m {requestSecondsLeft % 60}s
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {countdown ? (
                          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs">
                            <Timer className="w-3 h-3 animate-pulse" />
                            <span>{countdown}s remaining</span>
                          </div>
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
                      <td className="py-3 px-4 text-gray-400 print:text-gray-700 font-semibold">{v.device === 'Tablet' ? '📟 Tablet' : (v.device === 'Mobile' ? '📱 Mobile' : '🖥️ Desktop')}</td>
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
        </>
      )}

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
