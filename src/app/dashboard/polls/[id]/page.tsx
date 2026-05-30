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
  Layers, Filter, PieChart, Hash, History
} from 'lucide-react';
import PollChart from '@/components/PollChart';
import PollMap from '@/components/PollMap';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Helper to parse confirmer2 into department and classYear
const parseConfirmer2 = (val: string) => {
  if (!val) return { department: 'General', classYear: 'General' };
  
  // Try splitting by common delimiters like comma, slash, hyphen
  const parts = val.split(/[,\/-]/).map(s => s.trim()).filter(Boolean);
  
  let department = 'General';
  let classYear = 'General';
  
  if (parts.length >= 2) {
    department = parts[0];
    classYear = parts[1];
  } else if (parts.length === 1) {
    const part = parts[0];
    // Check if it contains year indicator
    if (/\b(year|1st|2nd|3rd|4th|5th|\d{4})\b/i.test(part)) {
      classYear = part;
    } else {
      department = part;
    }
  }
  
  return { department, classYear };
};

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
  const [activeTab, setActiveTab] = useState<'analytics' | 'inbox' | 'grades' | 'collaborators' | 'proctor' | 'edit'>('analytics');
  const [inboxMessages, setInboxMessages] = useState<any[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [inboxSearch, setInboxSearch] = useState('');

  // Class & Department gradebook filters
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedClassYear, setSelectedClassYear] = useState<string>('ALL');
  
  // Real-time Proctoring mock telemetry
  const [proctorTelemetry, setProctorTelemetry] = useState<Record<string, { status: 'ACTIVE' | 'OFFLINE', alert: string, lastActive: string }>>({});

  // Collaborators States
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [collabError, setCollabError] = useState('');

  // Co-editing, Live presence, logs, and layout states
  const [collaboratorRole, setCollaboratorRole] = useState<string>('VIEWER');
  const [activeCollaborators, setActiveCollaborators] = useState<any[]>([]);
  const [focusedField, setFocusedField] = useState<string>('');
  const [creatorCollaborationAllowed, setCreatorCollaborationAllowed] = useState(true);
  const [userCollaborationAllowed, setUserCollaborationAllowed] = useState(true);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editQuestions, setEditQuestions] = useState<any[]>([]);
  const [savingDraft, setSavingDraft] = useState(false);

  const [logs, setLogs] = useState<any[]>([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  // Exam Grades Panel & Inspector states
  const [gradeInspectorVote, setGradeInspectorVote] = useState<any | null>(null);
  const [manualMarks, setManualMarks] = useState<Record<string, number>>({});
  const [manualFeedback, setManualFeedback] = useState<Record<string, string>>({});
  const [isSavingOverride, setIsSavingOverride] = useState(false);
  const [releasingResults, setReleasingResults] = useState(false);
  const [gradesSearchQuery, setGradesSearchQuery] = useState('');
  const [gradesFilterStatus, setGradesFilterStatus] = useState<'ALL' | 'VOTED' | 'PENDING'>('ALL');
  const [gradesFilterIntegrity, setGradesFilterIntegrity] = useState<'ALL' | 'FLAGGED' | 'CLEAN'>('ALL');
  const [gradesSubTab, setGradesSubTab] = useState<'roster' | 'ai-insights' | 'questions' | 'proctor-logs'>('roster');

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

  const planFeatures = poll?.creator?.plan?.features || {};
  const isProctoringLocked = !planFeatures.liveWebcamProctoring && poll?.creator?.role !== 'ADMIN';

  // Periodic proctoring mock updates
  useEffect(() => {
    if (activeTab !== 'proctor' || isProctoringLocked || !poll?.allowedVoters) return;
    
    // Initialize
    const initTelemetry: Record<string, any> = {};
    poll.allowedVoters.forEach((v: any) => {
      initTelemetry[v.id] = {
        status: Math.random() > 0.15 ? 'ACTIVE' : 'OFFLINE',
        alert: '🟢 Focus Active (No anomalies)',
        lastActive: 'Just now'
      };
    });
    setProctorTelemetry(initTelemetry);

    const interval = setInterval(() => {
      setProctorTelemetry((prev) => {
        const next = { ...prev };
        const keys = Object.keys(next);
        if (keys.length === 0) return prev;
        
        // Randomly select one student to trigger a mock proctor alert
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const alerts = [
          '🟢 Focus Active (No anomalies)',
          '🟢 Focus Active (No anomalies)',
          '🟢 Focus Active (No anomalies)',
          '⚠️ Focus Lost (Examinee switched tabs)',
          '⚠️ Multiple Faces Detected (Check webcam feed)',
          '⚠️ Face Missing (Candidate out of frame)',
        ];
        const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
        const isOffline = Math.random() > 0.9;
        
        next[randomKey] = {
          status: isOffline ? 'OFFLINE' : 'ACTIVE',
          alert: isOffline ? '🔴 Disconnected' : randomAlert,
          lastActive: isOffline ? '2 minutes ago' : 'Just now'
        };
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [activeTab, isProctoringLocked, poll]);

  // 1. Fetch Poll Details on Mount
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}?focus=${encodeURIComponent(focusedField)}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch poll insights');
        }

        setPoll(data.poll);
        setIsOwner(data.isOwner);
        setCollaboratorRole(data.collaboratorRole || 'VIEWER');
        setActiveCollaborators(data.activeCollaborators || []);
        setCreatorCollaborationAllowed(data.creatorCollaborationAllowed !== false);
        setUserCollaborationAllowed(data.userCollaborationAllowed !== false);
        setLiveStats(data.poll.stats || {});
        setLiveTotalVotes(data.poll.totalVotes || 0);
        setLiveVotesList(data.poll.votes || []);
        setVelocityNow(Date.now());

        // Initialize draft form states
        setEditTitle(data.poll.title || '');
        setEditDescription(data.poll.description || '');
        setEditQuestions(data.poll.questions || []);
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
        const res = await fetch(`/api/polls/${pollId}?focus=${encodeURIComponent(focusedField)}`);
        const data = await res.json();
        if (res.ok && data.poll) {
          setPoll((prev: any) => prev ? {
            ...prev,
            title: data.poll.title,
            description: data.poll.description,
            questions: data.poll.questions,
            allowedVoters: data.poll.allowedVoters || prev.allowedVoters,
            settings: data.poll.settings || prev.settings,
            status: data.poll.status,
            totalVotes: data.poll.totalVotes,
          } : data.poll);
          setCollaboratorRole(data.collaboratorRole || 'VIEWER');
          setActiveCollaborators(data.activeCollaborators || []);
          setCreatorCollaborationAllowed(data.creatorCollaborationAllowed !== false);
          setUserCollaborationAllowed(data.userCollaborationAllowed !== false);
          setLiveStats(data.poll.stats || {});
          setLiveTotalVotes(data.poll.totalVotes || 0);
          setLiveVotesList(data.poll.votes || []);
          setVelocityNow(Date.now());

          // Live layout sync: update the values if we are a viewer
          if (data.collaboratorRole === 'VIEWER') {
            setEditTitle(data.poll.title || '');
            setEditDescription(data.poll.description || '');
            setEditQuestions(data.poll.questions || []);
          } else {
            // Owner/Editor: only sync fields that we are not actively focused on to prevent cursor jumping
            if (focusedField !== 'title') setEditTitle(data.poll.title || '');
            if (focusedField !== 'description') setEditDescription(data.poll.description || '');
            // Only overwrite questions if we aren't editing them (no focus on questions elements)
            if (!focusedField.startsWith('questions')) {
              setEditQuestions(data.poll.questions || []);
            }
          }
        }
      } catch (err) {
        console.error('Creator Insights sync error:', err);
      }
    }, 4000); // Refresh every 4 seconds

    return () => clearInterval(interval);
  }, [poll, pollId, focusedField]);

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

  const fetchActivityLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Failed to load logs:', e);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          questions: editQuestions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save draft layout');
      }
      alert('Draft layout saved successfully!');
      setPoll((prev: any) => ({
        ...prev,
        title: data.poll.title,
        description: data.poll.description,
        questions: data.poll.questions,
      }));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleAddQuestion = () => {
    const newQ = {
      id: 'temp_' + Math.random().toString(36).substring(2, 9),
      questionText: 'New Question',
      type: 'SINGLE',
      pageNumber: 1,
      order: editQuestions.length + 1,
      options: ['Option 1', 'Option 2'],
      correctAnswer: '',
      correctAnswers: [],
      marks: 1.0,
      inputConstraint: 'NONE',
      enableWhiteboard: false,
    };
    setEditQuestions([...editQuestions, newQ]);
  };

  const handleUpdateQuestion = (index: number, fields: any) => {
    const updated = [...editQuestions];
    updated[index] = { ...updated[index], ...fields };
    setEditQuestions(updated);
  };

  const handleDeleteQuestionLocal = (index: number) => {
    const updated = editQuestions.filter((_, idx) => idx !== index);
    const reordered = updated.map((q, idx) => ({ ...q, order: idx + 1 }));
    setEditQuestions(reordered);
  };

  const handleMoveQuestion = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === editQuestions.length - 1) return;

    const newIndex = direction === 'UP' ? index - 1 : index + 1;
    const updated = [...editQuestions];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    const reordered = updated.map((q, idx) => ({ ...q, order: idx + 1 }));
    setEditQuestions(reordered);
  };

  const handleAddOptionLocal = (qIndex: number) => {
    const updated = [...editQuestions];
    const opts = [...(updated[qIndex].options || [])];
    opts.push(`Option ${opts.length + 1}`);
    updated[qIndex].options = opts;
    setEditQuestions(updated);
  };

  const handleUpdateOptionLocal = (qIndex: number, oIndex: number, text: string) => {
    const updated = [...editQuestions];
    const opts = [...(updated[qIndex].options || [])];
    opts[oIndex] = text;
    updated[qIndex].options = opts;
    setEditQuestions(updated);
  };

  const handleDeleteOptionLocal = (qIndex: number, oIndex: number) => {
    const updated = [...editQuestions];
    const opts = (updated[qIndex].options || []).filter((_: any, idx: number) => idx !== oIndex);
    updated[qIndex].options = opts;
    setEditQuestions(updated);
  };

  const handleDeletePoll = async () => {
    if (!confirm(`Are you absolutely sure you want to delete this ${poll?.pollType === 'SURVEY' ? 'survey and all its recorded responses' : 'poll and all its recorded votes'}? This action is permanent.`)) {
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

  const handleToggleReleaseResults = async () => {
    if (!poll) return;
    setReleasingResults(true);
    const targetState = !poll.settings?.resultsReleased;

    try {
      let res;
      if (targetState) {
        // Release: call the email broadcaster endpoint
        res = await fetch(`/api/polls/${poll.id}/release-results`, {
          method: 'POST',
        });
      } else {
        // Retract: standard patch to settings
        res = await fetch(`/api/polls/${poll.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resultsReleased: false })
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update results release status');
      }

      setPoll((prev: any) => ({
        ...prev,
        settings: {
          ...prev.settings,
          resultsReleased: targetState
        }
      }));
      alert(`Exam results are now successfully ${targetState ? 'released and student reports dispatched' : 'withheld'}!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReleasingResults(false);
    }
  };

  const handleSaveGradeOverride = async (questionId: string) => {
    if (!poll || !gradeInspectorVote) return;
    setIsSavingOverride(true);

    const marksVal = manualMarks[questionId];
    const feedbackVal = manualFeedback[questionId] || '';

    try {
      const res = await fetch(`/api/polls/${poll.id}/override-grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voteId: gradeInspectorVote.id,
          questionId,
          marksAwarded: Number(marksVal),
          feedback: feedbackVal
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save grade override');
      }

      setPoll((prev: any) => {
        const updatedVotes = prev.votes.map((v: any) => {
          if (v.id === data.vote.id) {
            return { ...v, answers: data.vote.answers };
          }
          return v;
        });
        return { ...prev, votes: updatedVotes };
      });

      setLiveVotesList((prev: any) => {
        return prev.map((v: any) => {
          if (v.id === data.vote.id) {
            return { ...v, answers: data.vote.answers };
          }
          return v;
        });
      });

      setGradeInspectorVote((prev: any) => {
        if (prev.id === data.vote.id) {
          return { ...prev, answers: data.vote.answers };
        }
        return prev;
      });

      alert('Grade override applied successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingOverride(false);
    }
  const fetchCollaborators = async () => {
    setCollaboratorsLoading(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/collaborators`);
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data.collaborators || []);
      }
    } catch (err) {
      console.error('Failed to load collaborators:', err);
    } finally {
      setCollaboratorsLoading(false);
    }
  };

  const handleInviteCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setCollabError('');
    try {
      const res = await fetch(`/api/polls/${pollId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to invite collaborator.');
      }
      setInviteEmail('');
      alert('Collaborator successfully invited!');
      fetchCollaborators();
    } catch (err: any) {
      setCollabError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) return;
    try {
      const res = await fetch(`/api/polls/${pollId}/collaborators?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove.');
      alert('Collaborator removed successfully!');
      fetchCollaborators();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateCollaboratorRole = async (targetUserId: string, role: string) => {
    if (role === 'OWNER') {
      if (!confirm('Are you absolutely sure you want to transfer ownership of this poll? This action cannot be undone, and you will be demoted to an Editor.')) {
        return;
      }
    }
    try {
      const res = await fetch(`/api/polls/${pollId}/collaborators`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update role');
      }
      alert(role === 'OWNER' ? 'Ownership successfully transferred! Redirecting...' : 'Collaborator role updated successfully!');
      if (role === 'OWNER') {
        window.location.reload();
      } else {
        fetchCollaborators();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'collaborators') {
      fetchCollaborators();
    }
  }, [activeTab, pollId]);

  const renderCollaboratorsPanel = () => {
    if (!creatorCollaborationAllowed || !userCollaborationAllowed) {
      return (
        <div className="glass-card rounded-3xl border border-white/5 bg-[#080d1a] p-12 text-center max-w-xl mx-auto space-y-6 animate-fade-in print:hidden">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-outfit text-xl font-extrabold text-white">Collaboration Gated</h3>
            <p className="text-gray-400 text-xs leading-relaxed font-medium">
              {!creatorCollaborationAllowed 
                ? "The session creator's subscription plan does not support workspace collaborations. Only premium tier accounts with collaborations enabled can invite team members."
                : "Your current subscription plan does not support workspace collaborations. Both the session owner and the collaborator must have a plan with collaborations enabled to work together."}
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/dashboard/plans"
              className="px-6 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 inline-block"
            >
              🔄 Upgrade Subscription Plan
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="glass-card rounded-3xl border border-white/5 bg-[#080d1a] p-8 space-y-8 animate-fade-in print:hidden">
        <div className="flex items-center justify-between border-b border-white/5 pb-5">
          <div className="space-y-1">
            <h3 className="font-outfit text-xl font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Team Collaboration Hub</span>
            </h3>
            <p className="text-xs text-gray-400">
              Invite other users to collaborate on this {poll.pollType?.toLowerCase() || 'session'}. They will be notified via email to access this page.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <form onSubmit={handleInviteCollaborator} className="md:col-span-4 space-y-4">
            <h4 className="font-outfit text-xs font-extrabold text-indigo-400 uppercase tracking-widest">Invite Collaborator</h4>
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5 font-outfit">Collaborator's Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  required
                />
              </div>

              {collabError && (
                <p className="text-red-400 text-xs font-semibold">{collabError}</p>
              )}

              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full py-2.5 gradient-btn text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow"
              >
                {inviteLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Users className="w-4 h-4 text-white" />
                )}
                <span>Send Collaboration Invite</span>
              </button>
            </div>
          </form>

          <div className="md:col-span-8 space-y-4">
            <h4 className="font-outfit text-xs font-extrabold text-indigo-400 uppercase tracking-widest">Active Collaborators</h4>
            {collaboratorsLoading ? (
              <div className="flex items-center justify-center p-8 bg-white/2 border border-white/5 rounded-2xl">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
            ) : collaborators.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-white/2 border border-white/5 rounded-2xl space-y-2">
                <Users className="w-8 h-8 text-gray-500 stroke-[1.5]" />
                <span className="text-xs text-gray-400 font-medium">No other collaborators yet.</span>
                <span className="text-[10px] text-gray-500">Invite colleagues to help manage, edit questions, or view student outcomes.</span>
              </div>
            ) : (
              <div className="border border-white/5 bg-slate-950/20 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/2">
                        <th className="px-5 py-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider font-outfit">Collaborator</th>
                        <th className="px-5 py-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider font-outfit">Status</th>
                        <th className="px-5 py-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider font-outfit text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {collaborators.map((c: any) => (
                        <tr key={c.userId} className="hover:bg-white/2 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="text-xs text-gray-200 font-bold block">{c.user.email}</span>
                            <span className="text-[9px] text-gray-500">Joined {new Date(c.createdAt).toLocaleDateString()}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                              c.user.verified 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}>
                              {c.user.verified ? 'Registered' : 'Pending Sign Up'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right flex items-center justify-end gap-2">
                            <select
                              value={c.role || 'EDITOR'}
                              onChange={(e) => handleUpdateCollaboratorRole(c.userId, e.target.value)}
                              className="bg-[#030712] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-purple-500 font-semibold"
                            >
                              <option value="EDITOR">Editor</option>
                              <option value="VIEWER">Viewer</option>
                            </select>
                            <button
                              onClick={() => handleUpdateCollaboratorRole(c.userId, 'OWNER')}
                              className="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-[9px] font-bold uppercase transition-all"
                              title="Transfer Ownership"
                            >
                              🔑 Transfer
                            </button>
                            <button
                              onClick={() => handleRemoveCollaborator(c.userId)}
                              className="p-1.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all"
                              title="Remove Collaborator"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProctorPanel = () => {
    if (!poll) return null;

    if (isProctoringLocked) {
      return (
        <div className="glass-card rounded-3xl border border-white/10 bg-[#080d1a]/85 p-8 max-w-2xl mx-auto text-center space-y-6 my-10 relative overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] text-indigo-400 uppercase font-black tracking-widest bg-indigo-400/10 border border-indigo-400/20 px-2.5 py-1 rounded-full">
              Premium Integrity Feature
            </span>
            <h2 className="font-outfit text-2xl font-extrabold text-white leading-tight">Live Student Webcam Proctoring</h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto font-outfit">
              Webcam proctoring lets supervisors monitor active examinee streams, detect multiple faces, track head departures, and enforce browser lockdowns in real-time.
            </p>
          </div>
          <div className="p-4 bg-white/3 border border-white/5 rounded-2xl max-w-md mx-auto grid grid-cols-2 gap-3 text-left">
            <div className="flex items-center space-x-2 text-xs text-gray-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real-time Video Feeds</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>AI Face Detection Alerts</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tab Departure Tracking</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Supervisor Share Links</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/plans')}
            className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 hover:scale-105 active:scale-95 transition-all text-white text-xs inline-flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <Unlock className="w-4 h-4" />
            <span>Upgrade Plan to Unlock</span>
          </button>
        </div>
      );
    }

    const proctorLink = typeof window !== 'undefined' ? `${window.location.origin}/dashboard/polls/${poll.id}?tab=proctor` : '';
    const activeExaminees = poll.allowedVoters || [];

    const handleCopyProctorLink = () => {
      navigator.clipboard.writeText(proctorLink);
      alert('Supervisor Proctoring Link copied to clipboard!');
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <style>{`
          @keyframes scan {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
          .animate-scan {
            position: absolute;
            animation: scan 4s linear infinite;
          }
        `}</style>
        {/* Supervisor share banner */}
        <div className="glass-card rounded-2xl border border-white/5 bg-[#080d1a] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-white text-sm font-bold font-outfit flex items-center justify-center sm:justify-start gap-2">
              <MonitorPlay className="w-4 h-4 text-indigo-400" />
              <span>Supervisor Live Proctoring Link</span>
            </h4>
            <p className="text-gray-400 text-xs font-outfit">Share this secure monitor page with external proctors or exam supervisors.</p>
          </div>
          <div className="flex items-center bg-white/2 border border-white/5 rounded-xl px-3 py-1.5 gap-3 max-w-sm truncate text-xs font-mono text-gray-400 shrink-0">
            <span className="truncate max-w-[200px]">{proctorLink}</span>
            <button
              onClick={handleCopyProctorLink}
              className="p-1 hover:bg-white/10 rounded-lg text-indigo-400 hover:text-white transition-colors"
              title="Copy link"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Telemetry Indicator Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4 border border-white/5 bg-slate-950/40 text-center space-y-1">
            <span className="text-[9px] uppercase font-bold text-gray-500 block">Total Roster</span>
            <span className="text-lg font-black text-white block font-mono">{activeExaminees.length}</span>
          </div>
          <div className="glass-card rounded-xl p-4 border border-white/5 bg-slate-950/40 text-center space-y-1">
            <span className="text-[9px] uppercase font-bold text-gray-500 block">🟢 Active Feeds</span>
            <span className="text-lg font-black text-emerald-400 block font-mono">
              {Object.values(proctorTelemetry).filter(t => t.status === 'ACTIVE').length}
            </span>
          </div>
          <div className="glass-card rounded-xl p-4 border border-white/5 bg-slate-950/40 text-center space-y-1">
            <span className="text-[9px] uppercase font-bold text-gray-500 block">🔴 Offline Feeds</span>
            <span className="text-lg font-black text-red-400 block font-mono">
              {Object.values(proctorTelemetry).filter(t => t.status === 'OFFLINE').length}
            </span>
          </div>
          <div className="glass-card rounded-xl p-4 border border-white/5 bg-slate-950/40 text-center space-y-1">
            <span className="text-[9px] uppercase font-bold text-gray-500 block">🚨 Active Warnings</span>
            <span className="text-lg font-black text-amber-500 block font-mono">
              {Object.values(proctorTelemetry).filter(t => t.alert && t.alert.includes('⚠️')).length}
            </span>
          </div>
        </div>

        {/* Live Webcam Stream Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {activeExaminees.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-500 glass-card rounded-2xl border border-white/5">
              Roster is empty. Configure Step 4 closed roster first to track proctor streams.
            </div>
          ) : (
            activeExaminees.map((v: any) => {
              const tel = proctorTelemetry[v.id] || { status: 'ACTIVE', alert: '🟢 Focus Active (No anomalies)', lastActive: 'Just now' };
              const isOffline = tel.status === 'OFFLINE';
              const hasAlert = tel.alert && tel.alert.includes('⚠️');

              return (
                <div key={v.id} className="glass-card rounded-2xl border border-white/5 bg-[#080d1a] p-4 flex flex-col space-y-4 hover:border-white/10 transition-all">
                  {/* Card Header details */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-white text-sm font-bold truncate max-w-[150px]">{v.confirmer1 || 'Anonymous Student'}</h4>
                      <span className="text-gray-500 text-[10px] font-mono block">{v.identifier}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-1 ${
                      isOffline ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                      <span>{isOffline ? 'OFFLINE' : 'LIVE'}</span>
                    </span>
                  </div>

                  {/* Mock Camera video frame container */}
                  <div className="relative aspect-video rounded-xl bg-slate-950/80 border border-white/5 overflow-hidden flex items-center justify-center select-none group">
                    {/* Scanner scanlines */}
                    {!isOffline && (
                      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%] opacity-40" />
                    )}
                    
                    {/* Scanning horizontal line */}
                    {!isOffline && (
                      <div className="absolute left-0 right-0 h-[2px] bg-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-scan z-10" />
                    )}

                    {/* Camera Corner Brackets */}
                    <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-white/20" />
                    <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t border-r border-white/20" />
                    <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l border-white/20" />
                    <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-white/20" />

                    {/* Mock webcam stream representation */}
                    {isOffline ? (
                      <div className="text-center space-y-1 z-10">
                        <ShieldAlert className="w-8 h-8 text-red-500/40 mx-auto" />
                        <span className="text-[10px] text-gray-500 block">FEED OFFLINE</span>
                      </div>
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center">
                        {/* Futuristic facial landmark tracking grid */}
                        <svg className="w-full h-full absolute inset-0 text-indigo-500/20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                          {/* Face contour guide line */}
                          <path d="M25,35 Q50,20 75,35 Q85,55 75,75 Q50,90 25,75 Q15,55 25,35 Z" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                          {/* Eye tracking crosshairs */}
                          <circle cx="40" cy="45" r="2.5" fill="none" stroke="currentColor" strokeWidth="0.5" />
                          <circle cx="60" cy="45" r="2.5" fill="none" stroke="currentColor" strokeWidth="0.5" />
                          <circle cx="40" cy="45" r="0.5" fill="currentColor" />
                          <circle cx="60" cy="45" r="0.5" fill="currentColor" />
                          {/* Nose grid */}
                          <line x1="50" y1="40" x2="50" y2="65" stroke="currentColor" strokeWidth="0.5" />
                          <line x1="45" y1="65" x2="55" y2="65" stroke="currentColor" strokeWidth="0.5" />
                          {/* Mouth mesh line */}
                          <path d="M40,73 Q50,78 60,73" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        </svg>

                        <div className="text-center z-10 animate-pulse">
                          <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                            AI Tracking Enabled
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Proctor alert details */}
                  <div className={`p-2.5 rounded-xl border text-xs font-semibold ${
                    isOffline 
                      ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                      : hasAlert 
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    <span className="block truncate">{tel.alert}</span>
                  </div>

                  {/* Last Active details */}
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                    <span>Signal strength: {!isOffline ? '98%' : '0%'}</span>
                    <span>Last Active: {tel.lastActive}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderGradesPanel = () => {
    if (!poll) return null;

    const isClosed = !poll.isOpenVoting;
    const examinees: any[] = [];

    if (isClosed) {
      poll.allowedVoters.forEach((av: any) => {
        const matchingVote = liveVotesList.find(v => 
          (v.email && v.email.toLowerCase() === av.email.toLowerCase()) ||
          (v.userIdentifier && v.userIdentifier.toLowerCase() === av.identifier.toLowerCase())
        );
        
        // Parse department & class/year from confirmer2
        const { department, classYear } = parseConfirmer2(av.confirmer2);

        examinees.push({
          id: av.id,
          identifier: av.identifier,
          name: av.confirmer1,
          email: av.email,
          confirmer2: av.confirmer2,
          department,
          classYear,
          voted: !!matchingVote,
          vote: matchingVote || null,
        });
      });
    } else {
      liveVotesList.forEach((v: any) => {
        examinees.push({
          id: v.id,
          identifier: v.userIdentifier || 'Open Examinee',
          name: v.userIdentifier || 'Guest Voter',
          email: v.email || 'N/A',
          confirmer2: 'General',
          department: 'General',
          classYear: 'General',
          voted: true,
          vote: v,
        });
      });
    }

    const uniqueDepartments = Array.from(new Set(examinees.map(e => e.department).filter(Boolean)));
    const uniqueClassYears = Array.from(new Set(examinees.map(e => e.classYear).filter(Boolean)));

    const filteredExaminees = examinees.filter(ex => {
      const matchesSearch = 
        ex.identifier.toLowerCase().includes(gradesSearchQuery.toLowerCase()) ||
        ex.name.toLowerCase().includes(gradesSearchQuery.toLowerCase()) ||
        ex.email.toLowerCase().includes(gradesSearchQuery.toLowerCase());

      let matchesStatus = true;
      if (gradesFilterStatus === 'VOTED') matchesStatus = ex.voted;
      if (gradesFilterStatus === 'PENDING') matchesStatus = !ex.voted;

      let matchesIntegrity = true;
      if (gradesFilterIntegrity === 'FLAGGED') {
        matchesIntegrity = ex.voted && ex.vote?.flaggedSuspicious;
      }
      if (gradesFilterIntegrity === 'CLEAN') {
        matchesIntegrity = !ex.voted || !ex.vote?.flaggedSuspicious;
      }

      let matchesDept = true;
      if (selectedDepartment !== 'ALL') {
        matchesDept = ex.department === selectedDepartment;
      }

      let matchesClass = true;
      if (selectedClassYear !== 'ALL') {
        matchesClass = ex.classYear === selectedClassYear;
      }

      return matchesSearch && matchesStatus && matchesIntegrity && matchesDept && matchesClass;
    });

    // Calculate segment stats
    const segmentExaminees = examinees.filter(ex => {
      let matchesDept = true;
      if (selectedDepartment !== 'ALL') matchesDept = ex.department === selectedDepartment;
      let matchesClass = true;
      if (selectedClassYear !== 'ALL') matchesClass = ex.classYear === selectedClassYear;
      return matchesDept && matchesClass;
    });

    const segmentTotal = segmentExaminees.length;
    const segmentVoted = segmentExaminees.filter(e => e.voted).length;
    const segmentTurnoutRate = segmentTotal > 0 ? (segmentVoted / segmentTotal) * 100 : 0;

    let segmentAverageScore = 0.0;
    let segmentHighestScore = 0.0;
    let segmentVotesWithScores = 0;

    segmentExaminees.forEach(e => {
      if (e.voted && e.vote) {
        try {
          const answersObj = typeof e.vote.answers === 'string' ? JSON.parse(e.vote.answers) : e.vote.answers;
          const examScore = answersObj?.__examScore;
          if (examScore) {
            segmentAverageScore += examScore.earned || 0;
            if ((examScore.earned || 0) > segmentHighestScore) {
              segmentHighestScore = examScore.earned;
            }
            segmentVotesWithScores++;
          }
        } catch (e) {}
      }
    });

    segmentAverageScore = segmentVotesWithScores > 0 ? segmentAverageScore / segmentVotesWithScores : 0.0;

    const totalExaminees = examinees.length;
    const totalVoted = examinees.filter(e => e.voted).length;
    const turnoutRate = totalExaminees > 0 ? (totalVoted / totalExaminees) * 100 : 0;

    let averageScore = 0.0;
    let highestScore = 0.0;
    let votesWithScores = 0;

    examinees.forEach(e => {
      if (e.voted && e.vote) {
        try {
          const answersObj = typeof e.vote.answers === 'string' ? JSON.parse(e.vote.answers) : e.vote.answers;
          const examScore = answersObj?.__examScore;
          if (examScore) {
            averageScore += examScore.earned || 0;
            if ((examScore.earned || 0) > highestScore) {
              highestScore = examScore.earned;
            }
            votesWithScores++;
          }
        } catch (e) {
          console.error(e);
        }
      }
    });

    averageScore = votesWithScores > 0 ? averageScore / votesWithScores : 0.0;

    // AI Cohort Strengths & Weaknesses Calculations
    const strengthsList: any[] = [];
    const lackingList: any[] = [];
    const misconceptionsList: any[] = [];

    poll.questions.forEach((q: any) => {
      let totalMaxMarks = 0;
      let totalEarnedMarks = 0;
      let attemptsCount = 0;
      const optionCounts: Record<string, number> = {};

      liveVotesList.forEach((v: any) => {
        try {
          const parsed = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
          const qb = parsed?.__examBreakdown?.[q.id];
          if (qb) {
            totalMaxMarks += qb.maxMarks || 0;
            totalEarnedMarks += qb.marksAwarded || 0;
            attemptsCount++;
          }
          const userSelection = parsed?.[q.id];
          if (userSelection && typeof userSelection === 'string') {
            optionCounts[userSelection] = (optionCounts[userSelection] || 0) + 1;
          }
        } catch (e) {
          console.error(e);
        }
      });

      const avgRatio = totalMaxMarks > 0 ? totalEarnedMarks / totalMaxMarks : 0;
      if (attemptsCount > 0) {
        if (avgRatio >= 0.75) {
          strengthsList.push({
            id: q.id,
            text: q.questionText,
            ratio: avgRatio,
          });
        } else if (avgRatio < 0.5) {
          lackingList.push({
            id: q.id,
            text: q.questionText,
            ratio: avgRatio,
          });
        }

        if (q.type === 'SINGLE') {
          let popularWrongId = '';
          let popularWrongCount = 0;
          Object.entries(optionCounts).forEach(([optId, count]) => {
            if (optId !== q.correctAnswer && count > popularWrongCount) {
              popularWrongCount = count;
              popularWrongId = optId;
            }
          });
          const wrongRatio = popularWrongCount / attemptsCount;
          if (wrongRatio >= 0.3) {
            const wrongText = q.options.find((o: any) => o.id === popularWrongId)?.text || 'Option ID ' + popularWrongId;
            misconceptionsList.push({
              id: q.id,
              question: q.questionText,
              wrongOption: wrongText,
              ratio: wrongRatio,
            });
          }
        }
      }
    });

    const getKeywordFrequency = (qId: string) => {
      const frequencies: Record<string, number> = {};
      liveVotesList.forEach((v: any) => {
        try {
          const parsed = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
          const text = parsed?.__examBreakdown?.[qId]?.answer || parsed?.[qId];
          if (text && typeof text === 'string') {
            const cleanWords = text.toLowerCase()
              .replace(/[^\w\s]/g, '')
              .split(/\s+/)
              .filter(w => w.length > 3 && !['with', 'from', 'that', 'this', 'have', 'your', 'about', 'correct', 'answer'].includes(w));
            cleanWords.forEach(w => {
              frequencies[w] = (frequencies[w] || 0) + 1;
            });
          }
        } catch (e) {}
      });
      return Object.entries(frequencies)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 5);
    };

    return (
      <div className="space-y-6 animate-fade-in print:hidden">
        {/* Results Release Settings & Stats Cards */}
        <div className="glass-card rounded-2xl border border-white/5 bg-[#080d1a] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-outfit text-base font-bold text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <span>Results Release Settings</span>
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed max-w-xl">
              Releasing results emails examinees a comprehensive report of their score, direct concept analysis links, and tutoring resources.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
              poll.settings?.resultsReleased 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {poll.settings?.resultsReleased ? '✅ Results Released' : '🔒 Results Withheld'}
            </div>

            <button
              onClick={handleToggleReleaseResults}
              disabled={releasingResults}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                poll.settings?.resultsReleased
                  ? 'bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600 hover:text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
              } disabled:opacity-50 flex items-center gap-2`}
            >
              {releasingResults && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {poll.settings?.resultsReleased ? 'Retract Score Reports' : 'Release Score Reports'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl border border-white/5 bg-slate-950/40 p-6 flex flex-col space-y-2">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Exam Turnout</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black font-mono text-white">{totalVoted}</span>
              <span className="text-xs text-gray-500">/ {totalExaminees} candidates ({turnoutRate.toFixed(1)}%)</span>
            </div>
          </div>
          <div className="glass-card rounded-2xl border border-white/5 bg-slate-950/40 p-6 flex flex-col space-y-2">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Average Earned Score</span>
            <span className="text-2xl font-black font-mono text-indigo-400">{averageScore.toFixed(1)} points</span>
          </div>
          <div className="glass-card rounded-2xl border border-white/5 bg-slate-950/40 p-6 flex flex-col space-y-2">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Highest Score</span>
            <span className="text-2xl font-black font-mono text-emerald-400">{highestScore.toFixed(1)} points</span>
          </div>
        </div>

        {/* Sub Tabs Navigation Bar */}
        <div className="flex border-b border-white/5 pb-1 gap-6">
          <button
            onClick={() => setGradesSubTab('roster')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              gradesSubTab === 'roster' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>📋 Candidates Roster</span>
            {gradesSubTab === 'roster' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-full" />}
          </button>
          <button
            onClick={() => setGradesSubTab('ai-insights')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              gradesSubTab === 'ai-insights' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>🎓 AI Teacher Assistant</span>
            {gradesSubTab === 'ai-insights' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-full" />}
          </button>
          <button
            onClick={() => setGradesSubTab('questions')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              gradesSubTab === 'questions' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>📊 Question-Wise Diagnostics</span>
            {gradesSubTab === 'questions' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-full" />}
          </button>
          <button
            onClick={() => setGradesSubTab('proctor-logs')}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center space-x-1.5 ${
              gradesSubTab === 'proctor-logs' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>🛡️ Proctor & Cheating Logs</span>
            {liveVotesList.some(v => v.flaggedSuspicious) && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
            {gradesSubTab === 'proctor-logs' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-full" />}
          </button>
        </div>

        {/* Dynamic Panels */}
        {gradesSubTab === 'roster' && (
          <div className="glass-card rounded-2xl border border-white/5 bg-[#080d1a] p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search candidates by name, email, identifier..."
                  value={gradesSearchQuery}
                  onChange={(e) => setGradesSearchQuery(e.target.value)}
                  className="w-full bg-[#030712] border border-white/10 hover:border-white/15 focus:border-indigo-500/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition-all"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>

              <div className="flex gap-3 flex-wrap">
                <select
                  value={gradesFilterStatus}
                  onChange={(e: any) => setGradesFilterStatus(e.target.value)}
                  className="bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Attendance</option>
                  <option value="VOTED">Submitted</option>
                  <option value="PENDING">Absent / Pending</option>
                </select>

                <select
                  value={gradesFilterIntegrity}
                  onChange={(e: any) => setGradesFilterIntegrity(e.target.value)}
                  className="bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Integrity States</option>
                  <option value="FLAGGED">Flagged Suspicious</option>
                  <option value="CLEAN">Clear Attempts</option>
                </select>

                {uniqueDepartments.length > 0 && (
                  <select
                    value={selectedDepartment}
                    onChange={(e: any) => setSelectedDepartment(e.target.value)}
                    className="bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Departments</option>
                    {uniqueDepartments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                )}

                {uniqueClassYears.length > 0 && (
                  <select
                    value={selectedClassYear}
                    onChange={(e: any) => setSelectedClassYear(e.target.value)}
                    className="bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Class/Years</option>
                    {uniqueClassYears.map((cy) => (
                      <option key={cy} value={cy}>{cy}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {(selectedDepartment !== 'ALL' || selectedClassYear !== 'ALL') && (
              <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up">
                <div className="flex flex-col space-y-1">
                  <span className="text-[9px] uppercase font-bold text-indigo-300 tracking-wider">Filtered Group ({selectedDepartment !== 'ALL' ? selectedDepartment : ''} {selectedClassYear !== 'ALL' ? selectedClassYear : ''}) Turnout</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-xl font-extrabold text-white">{segmentVoted}</span>
                    <span className="text-xs text-gray-400">/ {segmentTotal} ({segmentTurnoutRate.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-[9px] uppercase font-bold text-indigo-300 tracking-wider">Group Average Score</span>
                  <span className="text-xl font-extrabold text-indigo-300 font-mono">{segmentAverageScore.toFixed(1)} points</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-[9px] uppercase font-bold text-indigo-300 tracking-wider">Group Highest Score</span>
                  <span className="text-xl font-extrabold text-emerald-400 font-mono">{segmentHighestScore.toFixed(1)} points</span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-4">Candidate Details</th>
                    <th className="pb-3 px-4">Attendance</th>
                    <th className="pb-3 px-4">Integrity Status</th>
                    <th className="pb-3 px-4">Time Spent</th>
                    <th className="pb-3 px-4">Evaluated Score</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredExaminees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No candidates match your active search and filter constraints.
                      </td>
                    </tr>
                  ) : (
                    filteredExaminees.map((ex) => {
                      let timeSpentStr = '-';
                      let scoreStr = '-';
                      let isFlagged = false;
                      let parsedAnswers: any = null;

                      if (ex.vote) {
                        isFlagged = ex.vote.flaggedSuspicious;
                        if (ex.vote.timeSpent) {
                          const m = Math.floor(ex.vote.timeSpent / 60);
                          const s = ex.vote.timeSpent % 60;
                          timeSpentStr = m > 0 ? `${m}m ${s}s` : `${s}s`;
                        } else {
                          timeSpentStr = 'Under 1m';
                        }

                        try {
                          parsedAnswers = typeof ex.vote.answers === 'string' ? JSON.parse(ex.vote.answers) : ex.vote.answers;
                          const score = parsedAnswers?.__examScore;
                          if (score) {
                            scoreStr = `${score.earned} / ${score.total}`;
                          }
                        } catch (e) {
                          console.error(e);
                        }
                      }

                      return (
                        <tr key={ex.id} className="hover:bg-white/2 transition-colors">
                          <td className="py-4 pr-4">
                            <div className="flex flex-col space-y-0.5">
                              <span className="font-bold text-white text-sm">{ex.name || 'Anonymous Student'}</span>
                              <span className="text-gray-500 text-[10px] font-mono">{ex.identifier} • {ex.email}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              ex.voted 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                            }`}>
                              {ex.voted ? 'Submitted' : 'Absent'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {ex.voted ? (
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center w-fit gap-1 ${
                                isFlagged 
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' 
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {isFlagged ? (
                                  <>
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    <span>Suspicious Tab Switched</span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>No Proctor Alerts</span>
                                  </>
                                )}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-4 px-4 font-mono text-gray-300">{timeSpentStr}</td>
                          <td className="py-4 px-4 font-mono font-bold text-indigo-300">{scoreStr}</td>
                          <td className="py-4 pl-4 text-right">
                            {ex.voted && ex.vote ? (
                              <button
                                onClick={() => {
                                  setGradeInspectorVote(ex.vote);
                                  try {
                                    const parsed = typeof ex.vote.answers === 'string' ? JSON.parse(ex.vote.answers) : ex.vote.answers;
                                    const breakdown = parsed?.__examBreakdown || {};
                                    const marksInit: Record<string, number> = {};
                                    const feedbackInit: Record<string, string> = {};
                                    Object.keys(breakdown).forEach(qId => {
                                      marksInit[qId] = breakdown[qId].marksAwarded || 0.0;
                                      feedbackInit[qId] = breakdown[qId].feedback || '';
                                    });
                                    setManualMarks(marksInit);
                                    setManualFeedback(feedbackInit);
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all font-bold text-[11px]"
                              >
                                Inspect Answers
                              </button>
                            ) : (
                              <span className="text-gray-600 text-xs italic">Not submitted</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {gradesSubTab === 'ai-insights' && (
          <div className="glass-card rounded-2xl border border-white/5 bg-[#080d1a] p-6 space-y-6">
            <h3 className="font-outfit text-base font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <span>AI Teacher Assistant: Cohort Performance Diagnostics</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Concept Mastered Strengths */}
              <div className="p-5 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 space-y-3.5">
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Conceptual Strengths</span>
                <h4 className="font-bold text-white text-xs">Exemplary Mastery Areas ({strengthsList.length} Topics)</h4>
                {strengthsList.length === 0 ? (
                  <p className="text-gray-400 text-xs italic">No topics achieved &gt; 75% average score yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {strengthsList.map((s) => (
                      <li key={s.id} className="text-xs text-gray-300 flex justify-between items-center bg-[#030712]/40 p-2.5 rounded-xl border border-white/5">
                        <span className="truncate max-w-[240px]">{s.text}</span>
                        <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">{(s.ratio * 100).toFixed(0)}% Mastery</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Concepts Needing Revision Lacking */}
              <div className="p-5 rounded-2xl border border-amber-500/15 bg-amber-500/5 space-y-3.5">
                <span className="text-[10px] uppercase font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Revision Gaps</span>
                <h4 className="font-bold text-white text-xs">Conceptual Weaknesses ({lackingList.length} Topics)</h4>
                {lackingList.length === 0 ? (
                  <p className="text-gray-400 text-xs italic">All topics are above the 50% threshold!</p>
                ) : (
                  <ul className="space-y-2">
                    {lackingList.map((l) => (
                      <li key={l.id} className="text-xs text-gray-300 flex justify-between items-center bg-[#030712]/40 p-2.5 rounded-xl border border-white/5">
                        <span className="truncate max-w-[240px]">{l.text}</span>
                        <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">{(l.ratio * 100).toFixed(0)}% Average</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Misconception detector */}
            <div className="p-5 rounded-2xl border border-red-500/15 bg-red-500/5 space-y-3.5">
              <span className="text-[10px] uppercase font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Misconception Detector</span>
              <h4 className="font-bold text-white text-xs">Identified Class Misconceptions</h4>
              {misconceptionsList.length === 0 ? (
                <p className="text-gray-400 text-xs italic">No systemic misconceptions detected in student answers.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {misconceptionsList.map((m) => (
                    <div key={m.id} className="p-4 rounded-xl bg-[#030712]/40 border border-white/5 space-y-1">
                      <span className="block text-[9px] uppercase font-mono text-red-400">Class Question Warning</span>
                      <p className="font-bold text-white text-xs leading-snug">{m.question}</p>
                      <p className="text-gray-400 text-[11px] leading-relaxed">
                        ⚠️ Over <span className="font-mono font-bold text-red-400">{(m.ratio * 100).toFixed(0)}%</span> of students mistakenly selected: <strong className="text-white font-medium">"{m.wrongOption}"</strong>. Suggesting targeted revision.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Question Wise Diagnostics Tab */}
        {gradesSubTab === 'questions' && (
          <div className="glass-card rounded-2xl border border-white/5 bg-[#080d1a] p-6 space-y-6">
            <h3 className="font-outfit text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>In-Depth Question-Wise Performance Analytics</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {poll.questions.map((q: any, idx: number) => {
                // Success rate calculation
                let totalCorrect = 0;
                let totalAttempts = 0;
                liveVotesList.forEach((v: any) => {
                  try {
                    const parsed = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
                    const qb = parsed?.__examBreakdown?.[q.id];
                    if (qb) {
                      if (qb.marksAwarded >= qb.maxMarks * 0.8) totalCorrect++;
                      totalAttempts++;
                    }
                  } catch (e) {}
                });

                const successRate = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
                const keywords = q.type === 'SHORT_TEXT' || q.type === 'LONG_TEXT' ? getKeywordFrequency(q.id) : [];

                return (
                  <div key={q.id} className="p-5 rounded-2xl bg-white/2 border border-white/5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[9px] uppercase font-mono font-bold text-gray-500">Question #{idx + 1}</span>
                        <h4 className="font-bold text-white text-xs leading-snug">{q.questionText}</h4>
                      </div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-extrabold shrink-0">{q.marks} Marks</span>
                    </div>

                    {/* Progress Bar Success */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <span>Cohort Success Rate</span>
                        <span className="font-mono text-indigo-400">{successRate.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                        <div 
                          style={{ width: `${successRate}%` }} 
                          className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                            successRate >= 75 ? 'from-emerald-500 to-teal-400' : (successRate >= 45 ? 'from-indigo-500 to-purple-400' : 'from-red-500 to-amber-400')
                          }`} 
                        />
                      </div>
                    </div>

                    {/* Keyword clouds or distributions */}
                    {(q.type === 'SHORT_TEXT' || q.type === 'LONG_TEXT') && keywords.length > 0 && (
                      <div className="pt-2 border-t border-white/5">
                        <span className="block text-[9px] uppercase font-mono text-gray-500 mb-2">Top Response Keywords (Word Cloud)</span>
                        <div className="flex flex-wrap gap-2">
                          {keywords.map(([word, freq]) => (
                            <span key={word} className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold font-mono">
                              {word} ({freq})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Proctoring Cheating logs tab */}
        {gradesSubTab === 'proctor-logs' && (
          <div className="glass-card rounded-2xl border border-white/5 bg-[#080d1a] p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <h3 className="font-outfit text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
                  <span>Proctor Integrity Monitoring Console</span>
                </h3>
                <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                  Real-time anti-cheat logs detecting focus blurs, page switches, and devtools departures.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Active Monitoring</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-4">Examinee Details</th>
                    <th className="pb-3 px-4 text-center">Focus Violations</th>
                    <th className="pb-3 px-4">Integrity State</th>
                    <th className="pb-3 px-4">IP Subnet & ISP</th>
                    <th className="pb-3 px-4">Browser & Device</th>
                    <th className="pb-3 pl-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {liveVotesList.filter(v => v.flaggedSuspicious).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 font-medium text-xs italic">
                        ✅ No proctoring violations or suspicious activities flagged for this examination.
                      </td>
                    </tr>
                  ) : (
                    liveVotesList.filter(v => v.flaggedSuspicious).map((v) => {
                      return (
                        <tr key={v.id} className="hover:bg-white/2 transition-colors">
                          <td className="py-4 pr-4">
                            <div className="flex flex-col space-y-0.5">
                              <span className="font-bold text-white text-sm">{v.userIdentifier || 'Anonymous Student'}</span>
                              <span className="text-gray-500 text-[10px] font-mono">{v.email || 'Guest Email'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center font-mono font-bold text-red-400 bg-red-500/5 border border-red-500/10 rounded-xl">
                            1+ Blur Event Flagged
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                              ⚠️ Tab Switch Triggered
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono text-gray-300">{v.ipAddress} <span className="text-gray-500">({v.isp || 'N/A'})</span></td>
                          <td className="py-4 px-4 text-gray-400 font-medium">{v.device || 'Desktop'}</td>
                          <td className="py-4 pl-4 text-right">
                            <button
                              onClick={() => {
                                setGradeInspectorVote(v);
                                try {
                                  const parsed = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
                                  const breakdown = parsed?.__examBreakdown || {};
                                  const marksInit: Record<string, number> = {};
                                  const feedbackInit: Record<string, string> = {};
                                  Object.keys(breakdown).forEach(qId => {
                                    marksInit[qId] = breakdown[qId].marksAwarded || 0.0;
                                    feedbackInit[qId] = breakdown[qId].feedback || '';
                                  });
                                  setManualMarks(marksInit);
                                  setManualFeedback(feedbackInit);
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white transition-all font-bold text-[11px]"
                            >
                              Inspect Failure
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI GRADING INSPECTOR MODAL */}
        {gradeInspectorVote && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
            <div className="glass-card rounded-3xl border border-white/8 bg-[#070c18] w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="border-b border-white/5 p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-outfit text-base font-bold text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <span>AI Grade Inspector & Overrider</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Inspecting Attempt ID: <span className="font-mono text-gray-400">{gradeInspectorVote.id}</span>
                  </p>
                </div>
                <button
                  onClick={() => setGradeInspectorVote(null)}
                  className="text-gray-400 hover:text-white text-xs border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-xl bg-white/2"
                >
                  Close Inspector
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/1 border border-white/5 text-[10px] text-gray-400 font-medium">
                  <div>
                    <span className="block text-gray-500 uppercase tracking-wider font-extrabold mb-1">Email / Identifier</span>
                    <span className="text-white font-semibold text-xs truncate block">{gradeInspectorVote.email || 'Guest'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 uppercase tracking-wider font-extrabold mb-1">IP Address & ISP</span>
                    <span className="text-white font-semibold text-xs truncate block">{gradeInspectorVote.ipAddress} • {gradeInspectorVote.isp || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 uppercase tracking-wider font-extrabold mb-1">Attempt Device</span>
                    <span className="text-white font-semibold text-xs truncate block">{gradeInspectorVote.device || 'Desktop'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 uppercase tracking-wider font-extrabold mb-1">Proctor Status</span>
                    <span className={`text-xs font-bold truncate block ${gradeInspectorVote.flaggedSuspicious ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                      {gradeInspectorVote.flaggedSuspicious ? '⚠️ Suspicious tab switch' : '✅ Integrity Clean'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-outfit text-xs uppercase tracking-widest font-extrabold text-gray-500">Question Evaluations</h4>
                  
                  {(() => {
                    let parsed: any = {};
                    try {
                      parsed = typeof gradeInspectorVote.answers === 'string' ? JSON.parse(gradeInspectorVote.answers) : gradeInspectorVote.answers;
                    } catch (e) {
                      console.error(e);
                    }
                    const breakdown = parsed?.__examBreakdown || {};

                    return poll.questions.map((q: any) => {
                      const qb = breakdown[q.id] || {};
                      const maxMarks = q.marks || 0.0;
                      const awardedMarks = qb.marksAwarded ?? 0.0;
                      const userAns = qb.answer ?? "";

                      return (
                        <div key={q.id} className="p-5 rounded-2xl bg-white/2 border border-white/5 space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <h5 className="font-bold text-white text-xs">{q.questionText}</h5>
                              <span className="inline-block text-[9px] uppercase tracking-wider font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                                {q.type}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="block text-[10px] text-gray-500 font-bold uppercase">Weight</span>
                              <span className="font-mono text-white text-sm font-bold">{maxMarks} Marks</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-3.5 rounded-xl bg-[#030712]/50 border border-white/5 space-y-1">
                              <span className="block text-[9px] text-gray-500 uppercase tracking-widest font-bold">Candidate Response</span>
                              <p className="text-white font-medium break-words">
                                {typeof userAns === 'object' ? JSON.stringify(userAns) : String(userAns || 'No Answer')}
                              </p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-1">
                              <span className="block text-[9px] text-indigo-400 uppercase tracking-widest font-bold">Reference Answer</span>
                              <p className="text-gray-300 font-medium break-words">
                                {q.type === 'SINGLE' ? (q.options.find((o: any) => o.id === q.correctAnswer)?.text || q.correctAnswer) : (q.correctAnswer || 'N/A')}
                              </p>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-white/1 border border-white/5 space-y-3.5">
                            <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                  qb.isAIGraded ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {qb.isAIGraded ? '⚡ AI Auto-Graded' : '👤 Manually Graded'}
                                </span>
                              </div>
                              <div className="font-bold text-white text-xs">
                                Evaluated Marks: <span className="font-mono text-indigo-400">{awardedMarks} / {maxMarks}</span>
                              </div>
                            </div>

                            <p className="text-gray-400 text-xs leading-relaxed italic">
                              <strong>AI Diagnostics Comment:</strong> {qb.feedback || 'No feedback calculated.'}
                            </p>

                            <div className="pt-2 flex flex-col sm:flex-row items-end gap-4 border-t border-white/5 mt-2.5">
                              <div className="flex-1 w-full space-y-1">
                                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold font-mono">Override Score (0 to {maxMarks})</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max={maxMarks}
                                  value={manualMarks[q.id] ?? awardedMarks}
                                  onChange={(e) => setManualMarks(prev => ({ ...prev, [q.id]: parseFloat(e.target.value) }))}
                                  className="w-full bg-[#030712] border border-white/10 hover:border-white/15 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none"
                                />
                              </div>

                              <div className="flex-[2] w-full space-y-1">
                                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold font-mono">Override Commentary / Feedback</label>
                                <textarea
                                  rows={1}
                                  value={manualFeedback[q.id] ?? qb.feedback ?? ''}
                                  onChange={(e) => setManualFeedback(prev => ({ ...prev, [q.id]: e.target.value }))}
                                  placeholder="Provide custom grading comments..."
                                  className="w-full bg-[#030712] border border-white/10 hover:border-white/15 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none resize-none"
                                />
                              </div>

                              <button
                                onClick={() => handleSaveGradeOverride(q.id)}
                                disabled={isSavingOverride}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs disabled:opacity-50 h-9 flex items-center justify-center gap-1.5 shrink-0"
                              >
                                {isSavingOverride && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Save Override
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="border-t border-white/5 p-6 flex justify-end">
                <button
                  onClick={() => setGradeInspectorVote(null)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/5"
                >
                  Close & Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getColorForCollaborator = (email: string) => {
    const colors = [
      { border: 'border-purple-500', bg: 'bg-purple-600', text: 'text-purple-100', glow: 'shadow-[0_0_10px_rgba(168,85,247,0.4)]' },
      { border: 'border-emerald-500', bg: 'bg-emerald-600', text: 'text-emerald-100', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.4)]' },
      { border: 'border-amber-500', bg: 'bg-amber-600', text: 'text-amber-100', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.4)]' },
      { border: 'border-pink-500', bg: 'bg-pink-600', text: 'text-pink-100', glow: 'shadow-[0_0_10px_rgba(236,72,153,0.4)]' },
      { border: 'border-cyan-500', bg: 'bg-cyan-600', text: 'text-cyan-100', glow: 'shadow-[0_0_10px_rgba(6,182,212,0.4)]' },
    ];
    let hash = 0;
    const str = email || 'user@example.com';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  };

  const renderEditPanel = () => {
    const isViewer = collaboratorRole === 'VIEWER';

    if (!isOwner && (!creatorCollaborationAllowed || !userCollaborationAllowed)) {
      return (
        <div className="glass-card rounded-3xl border border-white/5 bg-[#080d1a] p-12 text-center max-w-xl mx-auto space-y-6 animate-fade-in print:hidden">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-outfit text-xl font-extrabold text-white">Co-Editing Restrained</h3>
            <p className="text-gray-400 text-xs leading-relaxed font-medium">
              To co-edit this session layout as a collaborator, both your account and the session creator's account must have the "Real-time Creator Collaboration" feature enabled in your subscription plans.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/dashboard/plans"
              className="px-6 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 inline-block"
            >
              🔄 View Upgrade Options
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="glass-card rounded-3xl border border-white/5 bg-[#080d1a] p-8 space-y-8 animate-fade-in print:hidden">
        {/* Header Indicator */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-5 gap-4">
          <div className="space-y-1">
            <h3 className="font-outfit text-xl font-extrabold text-white flex items-center gap-2">
              <span>{isViewer ? '👁️ Session Layout Viewer' : '📝 Interactive Co-Editing Drafting Workspace'}</span>
            </h3>
            <p className="text-xs text-gray-400">
              {isViewer 
                ? "You have view-only access. The layout will update in real time as other editors commit changes."
                : "Real-time presence is active. Coordinate edits cleanly with other collaborators."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isViewer ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Viewer Mode — Live Tracking Active
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                  className="px-5 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingDraft ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Draft Layout...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Draft Layout</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Active Collaborators Presence List */}
        {activeCollaborators.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-white/2 border border-white/5 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-gray-400">Active Collaborators:</span>
            <div className="flex flex-wrap gap-2">
              {activeCollaborators.map((collab) => {
                const colors = getColorForCollaborator(collab.email);
                return (
                  <span 
                    key={collab.userId} 
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${colors.bg} ${colors.text}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    {collab.fullName} {collab.focus ? `(editing ${collab.focus})` : ''}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Document Fields */}
        <div className="space-y-6">
          {/* Title input container */}
          {(() => {
            const path = 'title';
            const otherCollab = activeCollaborators.find((c) => c.focus === path);
            const collabStyle = otherCollab ? getColorForCollaborator(otherCollab.email) : null;
            return (
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Session Title</label>
                <div className={`rounded-xl transition-all duration-300 ${collabStyle ? `border-2 ${collabStyle.border} ${collabStyle.glow} p-0.5` : 'border border-white/10'}`}>
                  <input
                    type="text"
                    disabled={isViewer}
                    placeholder="Enter session title..."
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onFocus={() => !isViewer && setFocusedField(path)}
                    onBlur={() => !isViewer && setFocusedField('')}
                    className="w-full bg-[#030712]/50 rounded-lg px-4 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  {collabStyle && (
                    <span className={`absolute -top-3.5 right-3 text-[9px] px-1.5 py-0.5 rounded font-extrabold shadow ${collabStyle.bg} ${collabStyle.text} animate-pulse z-20`}>
                      ✏️ {otherCollab.fullName} is editing title...
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Description input container */}
          {(() => {
            const path = 'description';
            const otherCollab = activeCollaborators.find((c) => c.focus === path);
            const collabStyle = otherCollab ? getColorForCollaborator(otherCollab.email) : null;
            return (
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Session Description</label>
                <div className={`rounded-xl transition-all duration-300 ${collabStyle ? `border-2 ${collabStyle.border} ${collabStyle.glow} p-0.5` : 'border border-white/10'}`}>
                  <textarea
                    rows={3}
                    disabled={isViewer}
                    placeholder="Enter description/guidelines..."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onFocus={() => !isViewer && setFocusedField(path)}
                    onBlur={() => !isViewer && setFocusedField('')}
                    className="w-full bg-[#030712]/50 rounded-lg px-4 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed resize-none"
                  />
                  {collabStyle && (
                    <span className={`absolute -top-3.5 right-3 text-[9px] px-1.5 py-0.5 rounded font-extrabold shadow ${collabStyle.bg} ${collabStyle.text} animate-pulse z-20`}>
                      ✏️ {otherCollab.fullName} is editing description...
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Questions Manager */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-t border-white/5 pt-6">
            <h4 className="font-outfit text-sm font-bold text-white uppercase tracking-wider">Questions & Pages Layout</h4>
            {!isViewer && (
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3.5 py-1.5 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>➕ Add Question</span>
              </button>
            )}
          </div>

          {editQuestions.length === 0 ? (
            <div className="p-8 text-center bg-white/2 border border-white/5 rounded-2xl space-y-2">
              <p className="text-gray-400 text-xs font-bold">No questions created yet</p>
              <p className="text-[10px] text-gray-500">Create a question using the button above to design this session layout.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {editQuestions.map((q, qIdx) => {
                const qTextPath = `questions.${qIdx}.questionText`;
                const otherQCollab = activeCollaborators.find((c) => c.focus === qTextPath);
                const qCollabStyle = otherQCollab ? getColorForCollaborator(otherQCollab.email) : null;

                return (
                  <div 
                    key={q.id || qIdx}
                    className="p-5 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-all space-y-4 relative animate-slide-in"
                  >
                    {/* Question Card Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/25 border border-indigo-500/35 text-indigo-300 text-[10px] font-extrabold flex items-center justify-center">
                          Q{qIdx + 1}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-400 uppercase">
                          {q.type}
                        </span>
                      </div>

                      {!isViewer && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(qIdx, 'UP')}
                            disabled={qIdx === 0}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move Question Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(qIdx, 'DOWN')}
                            disabled={qIdx === editQuestions.length - 1}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move Question Down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestionLocal(qIdx)}
                            className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 transition-all"
                            title="Delete Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Question Editing Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Question Text */}
                      <div className="md:col-span-8 space-y-1.5 relative">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500">Question Text</label>
                        <div className={`rounded-xl transition-all duration-300 ${qCollabStyle ? `border-2 ${qCollabStyle.border} ${qCollabStyle.glow} p-0.5` : 'border border-white/10'}`}>
                          <input
                            type="text"
                            disabled={isViewer}
                            placeholder="Enter the question text..."
                            value={q.questionText || ''}
                            onChange={(e) => handleUpdateQuestion(qIdx, { questionText: e.target.value })}
                            onFocus={() => !isViewer && setFocusedField(qTextPath)}
                            onBlur={() => !isViewer && setFocusedField('')}
                            className="w-full bg-[#030712]/50 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                          {qCollabStyle && (
                            <span className={`absolute -top-3.5 right-3 text-[8px] px-1 py-0.5 rounded font-extrabold shadow ${qCollabStyle.bg} ${qCollabStyle.text} animate-pulse z-20`}>
                              ✏️ {otherQCollab.fullName} is editing...
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Type */}
                      <div className="md:col-span-4 space-y-1.5">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500">Question Type</label>
                        <select
                          disabled={isViewer}
                          value={q.type || 'SINGLE'}
                          onChange={(e) => handleUpdateQuestion(qIdx, { type: e.target.value })}
                          className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-semibold disabled:opacity-75"
                        >
                          <option value="SINGLE">Single Choice MCQ</option>
                          <option value="MULTIPLE_CHOICE">Multiple Choice (Select Multiple)</option>
                          <option value="RANKED">Ranked Choice / Borda Count</option>
                          <option value="KNOCKOUT">Knockout Tournament Bracket</option>
                          <option value="SHORT_TEXT">Short Text Answer</option>
                          <option value="LONG_TEXT">Long Text Essay</option>
                          <option value="RATING">Rating Slider/Stars</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Page Number */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500">Page Number</label>
                        <input
                          type="number"
                          min="1"
                          disabled={isViewer}
                          value={q.pageNumber || 1}
                          onChange={(e) => handleUpdateQuestion(qIdx, { pageNumber: parseInt(e.target.value) || 1 })}
                          className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-75"
                        />
                      </div>

                      {/* Marks */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500">Marks / Weight</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          disabled={isViewer}
                          value={q.marks || 0}
                          onChange={(e) => handleUpdateQuestion(qIdx, { marks: parseFloat(e.target.value) || 0.0 })}
                          className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-75"
                        />
                      </div>

                      {/* Input Constraint */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500">Input Constraint</label>
                        <select
                          disabled={isViewer}
                          value={q.inputConstraint || 'NONE'}
                          onChange={(e) => handleUpdateQuestion(qIdx, { inputConstraint: e.target.value })}
                          className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-semibold disabled:opacity-75"
                        >
                          <option value="NONE">None</option>
                          <option value="NUMBERS">Numbers Only</option>
                          <option value="CHARACTERS">Characters Only</option>
                        </select>
                      </div>
                    </div>

                    {/* MCQ Options Editor block (Only rendered for Choice based questions) */}
                    {['SINGLE', 'MULTIPLE_CHOICE', 'RANKED', 'KNOCKOUT'].includes(q.type) && (
                      <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-3">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400">Options Editor</span>
                          {!isViewer && (
                            <button
                              type="button"
                              onClick={() => handleAddOptionLocal(qIdx)}
                              className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-all"
                            >
                              ➕ Add Option
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          {(q.options || []).map((opt: any, oIdx: number) => {
                            const optText = typeof opt === 'string' ? opt : (opt.text || '');
                            const optPath = `questions.${qIdx}.options.${oIdx}`;
                            const otherOptCollab = activeCollaborators.find((c) => c.focus === optPath);
                            const optCollabStyle = otherOptCollab ? getColorForCollaborator(otherOptCollab.email) : null;

                            return (
                              <div key={oIdx} className="flex items-center gap-2 relative">
                                <span className="text-[9px] font-mono text-gray-500 font-extrabold shrink-0">#{oIdx + 1}</span>
                                <div className={`flex-1 rounded-xl transition-all duration-300 ${optCollabStyle ? `border-2 ${optCollabStyle.border} ${optCollabStyle.glow} p-0.5` : 'border border-white/5'}`}>
                                  <input
                                    type="text"
                                    disabled={isViewer}
                                    value={optText}
                                    onChange={(e) => handleUpdateOptionLocal(qIdx, oIdx, e.target.value)}
                                    onFocus={() => !isViewer && setFocusedField(optPath)}
                                    onBlur={() => !isViewer && setFocusedField('')}
                                    className="w-full bg-[#030712]/40 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-700 outline-none focus:border-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
                                  />
                                  {optCollabStyle && (
                                    <span className={`absolute -top-3.5 right-12 text-[7px] px-1 py-0.5 rounded font-extrabold shadow ${optCollabStyle.bg} ${optCollabStyle.text} animate-pulse z-20`}>
                                      ✏️ {otherOptCollab.fullName} is editing...
                                    </span>
                                  )}
                                </div>

                                {!isViewer && (q.options || []).length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOptionLocal(qIdx, oIdx)}
                                    className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all shrink-0"
                                    title="Delete Option"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-8 print:p-0 print:m-0">
      
      {/* Print-only Header (hidden on web, shown on print PDF) */}
      <div className="hidden print:block border-b-2 border-gray-900 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-black uppercase tracking-wide">{poll.pollType === 'SURVEY' ? 'Official Survey Analytics Report' : 'Official Election Analytics Report'}</h1>
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
          <button
            onClick={() => {
              fetchActivityLogs();
              setShowLogsModal(true);
            }}
            className="px-4 py-2.5 rounded-xl border border-purple-500/20 hover:border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 text-xs font-semibold transition-all flex items-center space-x-2"
          >
            <History className="w-4 h-4" />
            <span>📜 Activity Logs</span>
          </button>
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
                {poll.pollType === 'SURVEY' ? 'Launch Survey' : 'Launch Poll (Active)'}
              </button>
            )}

            {poll.status === 'ACTIVE' && (
              <button
                onClick={() => handleUpdateStatus('ENDED')}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all animate-pulse-glow"
              >
                {poll.pollType === 'SURVEY' ? 'End Survey Early' : 'End Poll Early'}
              </button>
            )}

            <button
              onClick={handleDeletePoll}
              className="p-3 rounded-xl border border-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
              title={poll.pollType === 'SURVEY' ? 'Delete Survey' : 'Delete Poll'}
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
          <span>{poll.pollType === 'SURVEY' ? '📊 Analytics & Insights' : (poll.pollType === 'EXAM' ? '📝 Exam Analytics' : '🗳️ Analytics & Insights')}</span>
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
          <span>{poll.pollType === 'SURVEY' ? '📬 Respondent Inbox' : '📬 Voter Inbox'}</span>
          {inboxMessages.some(m => m.isFromCreator === false) && (
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          )}
          {activeTab === 'inbox' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-full" />
          )}
        </button>
        {poll?.pollType === 'EXAM' && (
          <button
            onClick={() => setActiveTab('grades')}
            className={`pb-4 text-sm font-bold transition-all relative ${
              activeTab === 'grades' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>📝 Grades & Evaluations</span>
            {activeTab === 'grades' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-full" />
            )}
          </button>
        )}
        {poll?.pollType === 'EXAM' && poll.settings?.enableProctorCamera && (
          <button
            onClick={() => setActiveTab('proctor')}
            className={`pb-4 text-sm font-bold transition-all relative flex items-center space-x-1.5 ${
              activeTab === 'proctor' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>🛡️ Webcam Proctoring</span>
            {activeTab === 'proctor' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-full" />
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab('collaborators')}
          className={`pb-4 text-sm font-bold transition-all relative flex items-center space-x-1.5 ${
            activeTab === 'collaborators' ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>👥 Team Collaboration</span>
          {activeTab === 'collaborators' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`pb-4 text-sm font-bold transition-all relative flex items-center space-x-1.5 ${
            activeTab === 'edit' ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>{collaboratorRole === 'VIEWER' ? '👁️ View Pages & Layout' : '📝 Edit Pages & Layout'}</span>
          {activeTab === 'edit' && (
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
                  {inboxSearch ? 'No matching threads found.' : (poll.pollType === 'SURVEY' ? 'No respondent messages received yet.' : 'No voter messages received yet.')}
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
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> {poll.pollType === 'SURVEY' ? 'Direct Respondent Thread' : 'Direct Voter Thread'}
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
      ) : activeTab === 'grades' ? (
        renderGradesPanel()
      ) : activeTab === 'collaborators' ? (
        renderCollaboratorsPanel()
      ) : activeTab === 'proctor' ? (
        renderProctorPanel()
      ) : activeTab === 'edit' ? (
        renderEditPanel()
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
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1 print:text-gray-600">{poll.pollType === 'SURVEY' ? 'Total Responses Logged' : 'Total Votes Logged'}</span>
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
                  <p className="text-gray-500 text-[10px] mt-0.5">{poll.pollType === 'SURVEY' ? 'Let respondents view pie and bar charts.' : 'Let voters view pie and bar charts.'}</p>
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
                  <p className="text-gray-500 text-[10px] mt-0.5">{poll.pollType === 'SURVEY' ? 'Let respondents view global response maps.' : 'Let voters view global voter maps.'}</p>
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
              <h4 className="font-outfit text-xs font-bold text-white uppercase tracking-wider">{poll.pollType === 'SURVEY' ? 'Respondent Participation Rate' : 'Voter Participation Rate'}</h4>
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
                  ? (poll.pollType === 'SURVEY' ? '🎉 100% response rate achieved for this survey!' : 'Incredible! 100% participation achieved for this election.')
                  : (poll.pollType === 'SURVEY' ? `Currently waiting on ${allowedCount - liveTotalVotes} registered respondents to submit their responses.` : `Currently waiting on ${allowedCount - liveTotalVotes} registered voters to submit their choices.`)
                }
              </p>
            </div>
          </div>
        )}

        {/* Insight Card 2: Hourly Voting Speed (Velocity) */}
        <div className={`glass-card rounded-2xl p-6 border border-white/5 space-y-4 ${poll.isOpenVoting ? 'md:col-span-2' : ''}`}>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h4 className="font-outfit text-xs font-bold text-white uppercase tracking-wider">{poll.pollType === 'SURVEY' ? 'Response Velocity Momentum' : 'Voting Velocity Momentum'}</h4>
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

      {/* Voter Segment Preferences Trend analysis (Identifier Ranges / Prefix) */}
      {liveVotesList.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-outfit text-xl font-bold text-white flex items-center space-x-2 print:text-black">
            <Users className="w-5 h-5 text-indigo-400 print:hidden" />
            <span>{poll.settings?.identifierLabel || 'Voter'} Segment Preference Trends</span>
          </h3>
          <p className="text-gray-500 text-xs print:text-gray-600">
            A comprehensive batch trend resolution identifying batch clusters, {(poll.settings?.identifierLabel || 'unique identifier').toLowerCase()} prefixes, or numeric ranges alongside their dominant preferences.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {getRollNumberTrends().map((trend, index) => (
              <div key={index} className="glass-card rounded-2xl p-5 border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Segment: {trend.groupName}
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold">{trend.total} {poll.pollType === 'SURVEY' ? (trend.total === 1 ? 'response' : 'responses') : (trend.total === 1 ? 'ballot' : 'ballots')}</span>
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
          <span>{poll.pollType === 'SURVEY' ? 'Global Respondent Geolocations' : 'Global Voter Geolocations'}</span>
        </h3>
        
        {liveVotesList.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 border border-white/5 rounded-2xl">
            {poll.pollType === 'SURVEY' ? 'Map is inactive until first responses are received.' : 'Map is inactive until first votes are received.'}
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
      {liveVotesList.length > 0 && poll.questions?.some((q: any) => q.type === 'SHORT_TEXT' || q.type === 'LONG_TEXT') && (
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
            const textQuestions = poll.questions.filter((q: any) => q.type === 'SHORT_TEXT' || q.type === 'LONG_TEXT');
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
            // Virtual demographic questions representing dynamically prepended survey inputs
            const demoQuestions = [
              { id: '__demo_age', questionText: 'Age Group', options: [{ id: 'Under 18', text: 'Under 18' }, { id: '18-24', text: '18-24' }, { id: '25-34', text: '25-34' }, { id: '35-44', text: '35-44' }, { id: '45-54', text: '45-54' }, { id: '55-64', text: '55-64' }, { id: '65+', text: '65+' }] },
              { id: '__demo_gender', questionText: 'Gender', options: [{ id: 'Male', text: 'Male' }, { id: 'Female', text: 'Female' }, { id: 'Non-binary', text: 'Non-binary' }, { id: 'Prefer not to say', text: 'Prefer not to say' }] },
              { id: '__demo_region', questionText: 'Geographic Region', options: [] }
            ];

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

      {/* Activity Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-[#030712]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card w-full max-w-2xl rounded-3xl border border-white/10 bg-[#080d1a] p-6 space-y-6 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center space-x-2.5">
                <History className="w-5 h-5 text-purple-400" />
                <h3 className="font-outfit text-lg font-bold text-white">Collaborator Activity Log</h3>
              </div>
              <button
                onClick={() => setShowLogsModal(false)}
                className="text-gray-400 hover:text-white text-lg font-bold transition-all p-1"
              >
                ✕
              </button>
            </div>

            {logsLoading ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-2">
                <p className="text-gray-400 text-sm font-bold">No changes logged yet</p>
                <p className="text-xs text-gray-500">Every change to draft layouts and settings is tracked and will appear here.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 no-scrollbar">
                {logs.map((log) => {
                  const colors = getColorForCollaborator(log.admin?.email || 'admin@pollstar.com');
                  return (
                    <div 
                      key={log.id} 
                      className="p-4 rounded-2xl bg-white/2 border border-white/5 flex gap-3.5 items-start animate-slide-in hover:border-white/10 transition-all"
                    >
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${colors.bg} ${colors.text} shadow`}>
                        {(log.admin?.fullName || log.admin?.email || 'A')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {log.admin?.fullName || log.admin?.email || 'Administrator'}
                          </span>
                          <span className="text-[9px] text-gray-500 font-medium shrink-0">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 font-medium leading-relaxed">
                          {log.details}
                        </p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-gray-400 uppercase tracking-widest">
                            {log.action}
                          </span>
                          {log.admin?.role && (
                            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-widest">
                              {log.admin.role}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="border-t border-white/5 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLogsModal(false)}
                className="px-4.5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
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
}
