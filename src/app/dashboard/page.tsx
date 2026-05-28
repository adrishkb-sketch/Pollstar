'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Vote, Plus, LogOut, Loader2, AlertCircle, Calendar, 
  BarChart3, Users, CheckCircle, Copy, Check, Eye, Edit, Trash2, X, Upload,
  Share2, Link as LinkIcon, Code2, Zap, ExternalLink, Settings, Mail, PlusCircle
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import AdvertisementZone from '@/components/AdvertisementZone';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Share modal states
  const [sharePoll, setSharePoll] = useState<any>(null);
  const [shortLinkLoading, setShortLinkLoading] = useState(false);
  const [shortLinkMap, setShortLinkMap] = useState<Record<string, string>>({}); // pollId -> shortCode
  const [shareCopied, setShareCopied] = useState<string | null>(null); // which item was copied
  const [embedCopied, setEmbedCopied] = useState(false);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'POLL' | 'SURVEY'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONGOING' | 'UPCOMING' | 'CLOSED' | 'DRAFT'>('ALL');

  // Poll Settings & Collaboration states
  const [settingsPoll, setSettingsPoll] = useState<any>(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'config' | 'collaborators'>('config');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);
  const [updatingConfig, setUpdatingConfig] = useState(false);
  const [removingCollaboratorId, setRemovingCollaboratorId] = useState<string | null>(null);

  const [settingsLimitOneVotePerUser, setSettingsLimitOneVotePerUser] = useState(false);
  const [settingsLimitOneVotePerIP, setSettingsLimitOneVotePerIP] = useState(false);
  const [settingsHideResultsUntilEnd, setSettingsHideResultsUntilEnd] = useState(false);
  const [settingsPublicShowStats, setSettingsPublicShowStats] = useState(true);
  const [settingsPublicShowCharts, setSettingsPublicShowCharts] = useState(true);
  const [settingsPublicShowMaps, setSettingsPublicShowMaps] = useState(true);

  // Edit & Delete modal states
  const [editingPoll, setEditingPoll] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPosterUrl, setEditPosterUrl] = useState('');
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editOptions, setEditOptions] = useState<any[]>([]);
  const [editIsResultPublic, setEditIsResultPublic] = useState(false);
  const [editHideResultsUntilEnd, setEditHideResultsUntilEnd] = useState(false);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingPollId, setDeletingPollId] = useState<string | null>(null);

  // Load session and polls
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.status === 503) {
          const errData = await userRes.json();
          if (errData.maintenance) {
            setError('Platform is currently undergoing scheduled maintenance.');
            setLoading(false);
            return;
          }
        }
        if (!userRes.ok) {
          router.push('/login');
          return;
        }
        const userData = await userRes.json();
        setUser(userData.user);

        const pollsRes = await fetch('/api/polls');
        if (pollsRes.ok) {
          const pollsData = await pollsRes.json();
          setPolls(pollsData.polls || []);
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Copy voting link to clipboard
  const handleCopyLink = (pollId: string) => {
    const host = window.location.host;
    const protocol = window.location.protocol;
    const url = `${protocol}//${host}/poll/${pollId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(pollId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateShortLink = async (pollId: string) => {
    setShortLinkLoading(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/shortlink`, { method: 'POST' });
      const data = await res.json();
      if (data.shortCode) {
        setShortLinkMap(m => ({ ...m, [pollId]: data.shortCode }));
        // Also update the polls list so the shortCode persists on next open
        setPolls(ps => ps.map((p: any) =>
          p.id === pollId ? { ...p, shortCode: data.shortCode } : p
        ));
      }
    } catch {}
    setShortLinkLoading(false);
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setShareCopied(key);
    setTimeout(() => setShareCopied(null), 2000);
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Are you absolutely sure you want to delete this poll? This will permanently remove all associated questions, options, and cast votes!')) {
      return;
    }
    setDeletingPollId(pollId);
    try {
      const res = await fetch(`/api/polls/${pollId}`, { method: 'DELETE' });
      if (res.ok) {
        setPolls((prev) => prev.filter((p) => p.id !== pollId));
      } else {
        alert('Failed to delete poll.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete poll.');
    } finally {
      setDeletingPollId(null);
    }
  };

  const handlePublishPoll = async (pollId: string) => {
    if (!confirm('Are you ready to publish this poll? This will set it to ACTIVE and make it open for voting according to its schedule.')) return;

    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish poll');
      }

      // Update local state immediately!
      setPolls((prev) =>
        prev.map((p) => (p.id === pollId ? { ...p, status: 'ACTIVE' } : p))
      );
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleOpenEdit = (poll: any) => {
    setEditingPoll(poll);
    setEditTitle(poll.title || '');
    setEditDescription(poll.description || '');
    setEditPosterUrl(poll.posterUrl || '');
    setEditIsResultPublic(!!poll.isResultPublic);
    setEditHideResultsUntilEnd(!!poll.settings?.hideResultsUntilEnd);

    const formatIST = (dateInput: any) => {
      if (!dateInput) return '';
      const d = new Date(dateInput);
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const parts = fmt.formatToParts(d);
      const getVal = (type: string) => parts.find(p => p.type === type)?.value || '';
      
      const year = getVal('year');
      const month = getVal('month');
      const day = getVal('day');
      let hour = getVal('hour');
      const minute = getVal('minute');
      
      if (hour === '24') hour = '00';
      return `${year}-${month}-${day}T${hour}:${minute}`;
    };
    setEditStartTime(formatIST(poll.startTime));
    setEditEndTime(formatIST(poll.endTime));
    
    const question = poll.questions?.[0] || { questionText: '', options: [] };
    setEditQuestionText(question.questionText || '');
    setEditOptions(question.options?.map((o: any) => ({ id: o.id, text: o.text })) || []);
  };

  const handleEditPosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPosterUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle || !editDescription || !editQuestionText) {
      alert('Please fill out all required fields.');
      return;
    }
    if (editOptions.some(o => !o.text.trim())) {
      alert('Please fill out all option names.');
      return;
    }
    
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/polls/${editingPoll.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          posterUrl: editPosterUrl,
          questionText: editQuestionText,
          options: editOptions,
          isResultPublic: editIsResultPublic,
          hideResultsUntilEnd: editHideResultsUntilEnd,
          startTime: editStartTime ? new Date(editStartTime).toISOString() : undefined,
          endTime: editEndTime ? new Date(editEndTime).toISOString() : undefined,
        })
      });
      
      if (res.ok) {
        // Update the poll in our local state to reflect edits immediately in real-time
        setPolls((prev) =>
          prev.map((p) => {
            if (p.id === editingPoll.id) {
              const updatedQ = p.questions?.[0] 
                ? { 
                    ...p.questions[0], 
                    questionText: editQuestionText, 
                    options: editOptions.map(o => ({ id: o.id, text: o.text }))
                  }
                : undefined;
              return {
                ...p,
                title: editTitle,
                description: editDescription,
                posterUrl: editPosterUrl,
                isResultPublic: editIsResultPublic,
                startTime: new Date(editStartTime).toISOString(),
                endTime: new Date(editEndTime).toISOString(),
                settings: p.settings 
                  ? { ...p.settings, hideResultsUntilEnd: editHideResultsUntilEnd }
                  : { hideResultsUntilEnd: editHideResultsUntilEnd },
                questions: updatedQ ? [updatedQ] : p.questions
              };
            }
            return p;
          })
        );
        setEditingPoll(null);
      } else {
        alert('Failed to save poll edits.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save poll edits.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenSettings = async (poll: any) => {
    setSettingsPoll(poll);
    setActiveSettingsTab('config');
    setInviteEmail('');
    setInviteError('');
    setInviteSuccess('');
    
    // Load config states from poll.settings
    const settings = poll.settings || {};
    setSettingsLimitOneVotePerUser(!!settings.limitOneVotePerUser);
    setSettingsLimitOneVotePerIP(!!settings.limitOneVotePerIP);
    setSettingsHideResultsUntilEnd(!!settings.hideResultsUntilEnd);
    setSettingsPublicShowStats(settings.publicShowStats !== undefined ? !!settings.publicShowStats : true);
    setSettingsPublicShowCharts(settings.publicShowCharts !== undefined ? !!settings.publicShowCharts : true);
    setSettingsPublicShowMaps(settings.publicShowMaps !== undefined ? !!settings.publicShowMaps : true);

    // Fetch collaborators
    setLoadingCollaborators(true);
    setCollaborators([]);
    try {
      const res = await fetch(`/api/polls/${poll.id}/collaborators`);
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data.collaborators || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCollaborators(false);
    }
  };

  const handleSaveSettingsConfig = async () => {
    if (!settingsPoll) return;
    setUpdatingConfig(true);
    try {
      const res = await fetch(`/api/polls/${settingsPoll.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limitOneVotePerUser: settingsLimitOneVotePerUser,
          limitOneVotePerIP: settingsLimitOneVotePerIP,
          hideResultsUntilEnd: settingsHideResultsUntilEnd,
          publicShowStats: settingsPublicShowStats,
          publicShowCharts: settingsPublicShowCharts,
          publicShowMaps: settingsPublicShowMaps,
        })
      });
      if (res.ok) {
        // Update local polls list to sync state in real-time
        setPolls(prev => prev.map(p => {
          if (p.id === settingsPoll.id) {
            return {
              ...p,
              settings: {
                ...p.settings,
                limitOneVotePerUser: settingsLimitOneVotePerUser,
                limitOneVotePerIP: settingsLimitOneVotePerIP,
                hideResultsUntilEnd: settingsHideResultsUntilEnd,
                publicShowStats: settingsPublicShowStats,
                publicShowCharts: settingsPublicShowCharts,
                publicShowMaps: settingsPublicShowMaps,
              }
            };
          }
          return p;
        }));
        alert('Poll settings updated successfully!');
        setSettingsPoll(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update poll settings.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update poll settings.');
    } finally {
      setUpdatingConfig(false);
    }
  };

  const handleInviteCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsPoll || !inviteEmail.trim()) return;
    
    setInviteError('');
    setInviteSuccess('');
    setInviteLoading(true);
    try {
      const res = await fetch(`/api/polls/${settingsPoll.id}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail })
      });
      
      const data = await res.json();
      if (res.ok) {
        setCollaborators(prev => [...prev, data.collaborator]);
        setInviteEmail('');
        setInviteSuccess(`Successfully invited ${data.collaborator.user.email}! An invitation email has been sent.`);
      } else {
        setInviteError(data.error || 'Failed to invite collaborator.');
      }
    } catch (err) {
      console.error(err);
      setInviteError('Failed to invite collaborator.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collabUserId: string) => {
    if (!settingsPoll) return;
    if (!confirm('Are you sure you want to remove this collaborator? They will lose all management access to this poll immediately.')) return;
    
    setRemovingCollaboratorId(collabUserId);
    try {
      const res = await fetch(`/api/polls/${settingsPoll.id}/collaborators?userId=${collabUserId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCollaborators(prev => prev.filter(c => c.user.id !== collabUserId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove collaborator.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to remove collaborator.');
    } finally {
      setRemovingCollaboratorId(null);
    }
  };

  if (error === 'Platform is currently undergoing scheduled maintenance.') {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="glass-card rounded-3xl border border-white/10 p-8 max-w-md w-full bg-[#080d1a]/85 backdrop-blur-md relative shadow-2xl space-y-6 animate-pulse-glow">
          <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400 mx-auto w-fit">
            <Settings className="w-10 h-10 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h3 className="font-outfit text-2xl font-black text-white">Scheduled Maintenance</h3>
            <p className="text-gray-400 text-xs mt-2.5 leading-relaxed">
              Pollstar is currently undergoing database optimizations and structural upgrades to make your interactive sessions even faster and more secure. We will be back online shortly!
            </p>
          </div>
          <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl text-[10px] text-purple-300 font-mono">
            Status: System Gated Lockdown
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="text-gray-400 text-sm mt-4 font-semibold">Syncing Dashboard...</span>
      </div>
    );
  }

  // Calculate aggregated stats
  const activePolls = polls.filter((p: any) => p.status === 'ACTIVE').length;
  const totalVotes = polls.reduce((sum: number, p: any) => sum + (p.votes?.length || 0), 0);
  const totalSurveys = polls.filter((p: any) => p.pollType === 'SURVEY').length;

  // Filtered list for the grid
  const filteredPolls = polls.filter((p: any) => {
    const matchesSearch = !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || p.pollType === typeFilter;
    
    // Status filter mapping
    const now = new Date();
    const start = new Date(p.startTime);
    const end = new Date(p.endTime);
    let currentStatus = p.status; // DRAFT, ACTIVE, ENDED
    if (p.status === 'ACTIVE') {
      if (now < start) {
        currentStatus = 'UPCOMING';
      } else if (now > end) {
        currentStatus = 'CLOSED';
      } else {
        currentStatus = 'ONGOING';
      }
    } else if (p.status === 'ENDED') {
      currentStatus = 'CLOSED';
    }
    
    const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <DashboardHeader user={user} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-8">
        
        {/* Admin Approval Banner */}
        {user && !user.approved && user.role !== 'ADMIN' && (
          <div className="glass-card rounded-2xl p-6 border-amber-500/20 bg-amber-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse-glow">
            <div className="flex items-start md:items-center space-x-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-outfit text-lg font-bold text-white">Verification Pending</h4>
                <p className="text-gray-400 text-sm mt-0.5 leading-relaxed">
                  Your creator status is currently undergoing administrator verification. You will be able to launch secure polls as soon as your account is approved.
                </p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-300 self-start md:self-auto shrink-0">
              PENDING ADMIN CHECK
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div id="dashboard-stats" className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1">Total Polls</span>
              <span className="font-outfit text-3xl font-extrabold text-white">{polls.length}</span>
            </div>
            <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400">
              <Vote className="w-7 h-7" />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1">Active Polls</span>
              <span className="font-outfit text-3xl font-extrabold text-white">{activePolls}</span>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400">
              <CheckCircle className="w-7 h-7" />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1">Surveys</span>
              <span className="font-outfit text-3xl font-extrabold text-white">{totalSurveys}</span>
            </div>
            <div className="p-4 bg-violet-500/10 rounded-2xl text-violet-400">
              <BarChart3 className="w-7 h-7" />
            </div>
          </div>
        </div>

        <AdvertisementZone removeAdvertisements={user?.plan?.features?.removeAdvertisements === true} />

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-outfit text-2xl font-bold text-white">Your Polls</h2>
            <p className="text-gray-400 text-sm mt-0.5">Manage and view real-time analytical reports for your sessions.</p>
          </div>

          <Link
            id="create-poll-btn"
            href={user?.approved || user?.role === 'ADMIN' ? '/dashboard/create' : '#'}
            onClick={(e) => {
              if (!user?.approved && user?.role !== 'ADMIN') {
                e.preventDefault();
                alert('Your account must be approved by an administrator before creating polls.');
              }
            }}
            className={`px-5 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all self-start sm:self-auto ${
              user?.approved || user?.role === 'ADMIN'
                ? 'gradient-btn text-white'
                : 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>Create Poll</span>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search by title or description…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/8 hover:border-white/15 focus:border-indigo-500/60 text-white placeholder-gray-500 text-sm outline-none transition-all"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex rounded-xl border border-white/8 overflow-hidden shrink-0">
              {(['ALL', 'POLL', 'SURVEY'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-4 py-2.5 text-xs font-bold transition-all ${
                    typeFilter === t
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/3 text-gray-400 hover:text-white hover:bg-white/8'
                  }`}
                >
                  {t === 'ALL' ? 'All Types' : t === 'POLL' ? '🗳 Polls' : '📋 Surveys'}
                </button>
              ))}
            </div>

            <div className="flex rounded-xl border border-white/8 overflow-hidden shrink-0">
              {(['ALL', 'ONGOING', 'UPCOMING', 'CLOSED', 'DRAFT'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2.5 text-xs font-bold transition-all ${
                    statusFilter === s
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/3 text-gray-400 hover:text-white hover:bg-white/8'
                  }`}
                >
                  {s === 'ALL' ? 'All Statuses' : s === 'ONGOING' ? '🟢 Ongoing' : s === 'UPCOMING' ? '⏳ Upcoming' : s === 'CLOSED' ? '🔴 Closed' : '📝 Draft'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Poll List Table/Cards */}
        {filteredPolls.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center border border-white/5">
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-6">
              <Vote className="w-8 h-8" />
            </div>
            {polls.length === 0 ? (
              <>
                <h3 className="font-outfit text-xl font-bold text-white mb-2">No polls yet</h3>
                <p className="text-gray-400 text-sm max-w-md leading-relaxed mb-6">
                  You haven't created any polls or surveys yet. Once approved, click <strong className="text-white">Create Poll</strong> to get started!
                </p>
              </>
            ) : (
              <>
                <h3 className="font-outfit text-xl font-bold text-white mb-2">No results found</h3>
                <p className="text-gray-400 text-sm max-w-md leading-relaxed mb-4">
                  No polls match <strong className="text-white">"{searchQuery}"</strong>
                  {typeFilter !== 'ALL' && <> in <strong className="text-indigo-300">{typeFilter}</strong> type</>}
                  {statusFilter !== 'ALL' && <> with status <strong className="text-indigo-300">{statusFilter}</strong></>}.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setTypeFilter('ALL'); setStatusFilter('ALL'); }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div id="polls-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPolls.map((poll) => {
              const statusColors = {
                DRAFT: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
                ACTIVE: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                ENDED: 'bg-red-500/10 border-red-500/20 text-red-400',
              };

                return (
                  <div key={poll.id} className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col justify-between space-y-6">
                    {/* Status & Title */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusColors[poll.status as keyof typeof statusColors]}`}>
                            {poll.status}
                          </span>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                            poll.pollType === 'SURVEY'
                              ? 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          }`}>
                            {poll.pollType === 'SURVEY' ? '📋 Survey' : '🗳 Poll'}
                          </span>
                        </div>
                        <span className="text-gray-500 text-xs flex items-center space-x-1 shrink-0">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(poll.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </span>
                      </div>

                    <h3 className="font-outfit text-xl font-bold text-white tracking-tight leading-snug">
                      {poll.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                      {poll.description}
                    </p>
                  </div>

                    {/* Badges & Statistics */}
                    <div className="flex items-center space-x-4 border-y border-white/5 py-4">
                      <div className="text-xs text-gray-400">
                        Access: <strong className="text-gray-200">{poll.isOpenVoting ? 'Open' : 'Closed'}</strong>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                      <div className="text-xs text-gray-400">
                        {poll.pollType === 'SURVEY' ? 'Questions' : 'Votes'}: <strong className="text-indigo-300 font-bold">
                          {poll.pollType === 'SURVEY' ? (poll.questions?.length || 0) : (poll.votes?.length || 0)}
                        </strong>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                      <div className="text-xs text-gray-400">
                        Responses: <strong className="text-indigo-300 font-bold">{poll.votes?.length || 0}</strong>
                      </div>
                    </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between gap-3">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(poll)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-white/5 hover:border-white/15 bg-white/3 hover:bg-white/8 text-gray-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Edit className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Edit Poll</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeletePoll(poll.id)}
                        disabled={deletingPollId === poll.id}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-red-500/10 hover:border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      {/* Share links */}
                      {poll.status === 'ACTIVE' ? (
                        <button
                          onClick={() => setSharePoll(poll)}
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-white/10 hover:border-indigo-500/40 bg-white/5 hover:bg-indigo-500/10 text-gray-300 hover:text-indigo-300 text-xs font-semibold transition-all flex items-center justify-center space-x-2"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share & Embed</span>
                        </button>
                      ) : poll.status === 'DRAFT' ? (
                        <button
                          onClick={() => handlePublishPoll(poll.id)}
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
                          <span>Publish Poll</span>
                        </button>
                      ) : (
                        <div className="flex-1 text-center py-2.5 text-xs text-gray-500 font-medium italic border border-white/5 bg-white/2 rounded-xl">
                          Link expired
                        </div>
                      )}

                      {/* View report */}
                      <Link
                        href={`/dashboard/polls/${poll.id}`}
                        className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Analytics</span>
                      </Link>
                    </div>

                    {/* Poll Settings Button (Only for owner/admin) */}
                    {(poll.creatorId === user?.id || user?.role === 'ADMIN') && (
                      <button
                        onClick={() => handleOpenSettings(poll)}
                        className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/8 hover:border-white/15 text-gray-300 hover:text-white transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Settings className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Poll Settings & Collaborators</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Share & Embed Modal ─────────────────────────────────────────── */}
      {sharePoll && (() => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const fullLink = `${origin}/poll/${sharePoll.id}`;
        const existingCode = shortLinkMap[sharePoll.id] ?? sharePoll.shortCode ?? null;
        const shortLink = existingCode ? `${origin}/s/${existingCode}` : null;
        const embedCode = `<iframe src="${origin}/embed/${sharePoll.id}" width="100%" height="600" style="border:none;border-radius:16px;" title="${sharePoll.title}"></iframe>`;
        return (
          <div className="fixed inset-0 bg-[#020612]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="glass-card rounded-3xl border border-white/10 p-6 max-w-md w-full space-y-6 bg-[#080d1a] relative">
              <button onClick={() => setSharePoll(null)} className="absolute top-5 right-5 text-gray-400 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h2 className="font-outfit text-lg font-bold text-white">Share & Embed</h2>
                </div>
                <p className="text-gray-500 text-xs ml-11 leading-relaxed line-clamp-1">{sharePoll.title}</p>
              </div>

              <div className="space-y-4">
                {/* Full link */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <LinkIcon className="w-3 h-3" /> Full Link
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/3 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-gray-300 font-mono truncate">
                      {fullLink}
                    </div>
                    <button
                      onClick={() => handleCopyText(fullLink, 'full')}
                      className="shrink-0 w-9 h-9 rounded-xl border border-white/10 hover:border-indigo-500/40 bg-white/5 hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-300 flex items-center justify-center transition-all"
                      title="Copy full link"
                    >
                      {shareCopied === 'full' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a
                      href={fullLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 w-9 h-9 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 text-gray-400 hover:text-white flex items-center justify-center transition-all"
                      title="Open poll"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Short link */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Zap className="w-3 h-3" /> Short Link
                  </label>
                  {shortLink ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white/3 border border-emerald-500/20 rounded-xl px-3 py-2.5 text-xs text-emerald-300 font-mono truncate">
                        {shortLink}
                      </div>
                      <button
                        onClick={() => handleCopyText(shortLink, 'short')}
                        className="shrink-0 w-9 h-9 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 flex items-center justify-center transition-all"
                        title="Copy short link"
                      >
                        {shareCopied === 'short' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleGenerateShortLink(sharePoll.id)}
                      disabled={shortLinkLoading}
                      className="w-full py-2.5 rounded-xl border border-dashed border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {shortLinkLoading
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                        : <><Zap className="w-3.5 h-3.5" /> Generate Short Link</>
                      }
                    </button>
                  )}
                </div>

                {/* Embed code */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Code2 className="w-3 h-3" /> Embed Code
                  </label>
                  <div className="relative">
                    <pre className="w-full bg-white/3 border border-white/8 rounded-xl px-3 py-2.5 text-[10px] text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                      {embedCode}
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(embedCode);
                        setEmbedCopied(true);
                        setTimeout(() => setEmbedCopied(false), 2000);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg border border-white/10 hover:border-white/20 bg-[#080d1a] text-gray-400 hover:text-white flex items-center justify-center transition-all"
                      title="Copy embed code"
                    >
                      {embedCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-600 leading-relaxed">
                    Paste this into any website or CMS to embed a voting widget. The embed requires the voter's device to allow geolocation.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSharePoll(null)}
                className="w-full py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Poll Settings & Collaboration Modal ─────────────────────────── */}
      {settingsPoll && (
        <div className="fixed inset-0 bg-[#020612]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card rounded-3xl border border-white/10 p-6 md:p-8 max-w-lg w-full space-y-6 bg-[#080d1a] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSettingsPoll(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-indigo-400" />
                </div>
                <h2 className="font-outfit text-2xl font-bold text-white">Poll Settings</h2>
              </div>
              <p className="text-gray-400 text-xs ml-11 leading-relaxed line-clamp-1">{settingsPoll.title}</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex rounded-xl border border-white/8 overflow-hidden">
              <button
                onClick={() => setActiveSettingsTab('config')}
                className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  activeSettingsTab === 'config'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/3 text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configuration</span>
              </button>
              <button
                onClick={() => setActiveSettingsTab('collaborators')}
                className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  activeSettingsTab === 'collaborators'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/3 text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Collaborators</span>
              </button>
            </div>

            {/* Tab 1 Content: Configuration Toggles */}
            {activeSettingsTab === 'config' && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Security & Restrictions</h4>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white">Limit 1 Vote per User</span>
                      <span className="text-[10px] text-gray-400">Require voters to log in and cast only one vote.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsLimitOneVotePerUser(!settingsLimitOneVotePerUser)}
                      className={`w-10 h-6 rounded-full transition-all flex items-center p-0.5 ${
                        settingsLimitOneVotePerUser ? 'bg-indigo-600 justify-end' : 'bg-white/10 justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white">Limit 1 Vote per IP</span>
                      <span className="text-[10px] text-gray-400">Block multiple submissions originating from the same IP address.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsLimitOneVotePerIP(!settingsLimitOneVotePerIP)}
                      className={`w-10 h-6 rounded-full transition-all flex items-center p-0.5 ${
                        settingsLimitOneVotePerIP ? 'bg-indigo-600 justify-end' : 'bg-white/10 justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Public Visibility Settings</h4>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white">Hide Results Until Close</span>
                      <span className="text-[10px] text-gray-400">Prevent voters from seeing live tallies until the scheduled deadline passes.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsHideResultsUntilEnd(!settingsHideResultsUntilEnd)}
                      className={`w-10 h-6 rounded-full transition-all flex items-center p-0.5 ${
                        settingsHideResultsUntilEnd ? 'bg-indigo-600 justify-end' : 'bg-white/10 justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white">Show Detailed Statistics</span>
                      <span className="text-[10px] text-gray-400">Display secondary stats cards and response analytics.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsPublicShowStats(!settingsPublicShowStats)}
                      className={`w-10 h-6 rounded-full transition-all flex items-center p-0.5 ${
                        settingsPublicShowStats ? 'bg-indigo-600 justify-end' : 'bg-white/10 justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white">Show Charts Visualization</span>
                      <span className="text-[10px] text-gray-400">Allow the public to view bar, pie, and timeline charts.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsPublicShowCharts(!settingsPublicShowCharts)}
                      className={`w-10 h-6 rounded-full transition-all flex items-center p-0.5 ${
                        settingsPublicShowCharts ? 'bg-indigo-600 justify-end' : 'bg-white/10 justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white">Show Demographic Geocharts</span>
                      <span className="text-[10px] text-gray-400">Allow viewers to view the geographical distribution heatmaps.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsPublicShowMaps(!settingsPublicShowMaps)}
                      className={`w-10 h-6 rounded-full transition-all flex items-center p-0.5 ${
                        settingsPublicShowMaps ? 'bg-indigo-600 justify-end' : 'bg-white/10 justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setSettingsPoll(null)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSettingsConfig}
                    disabled={updatingConfig}
                    className="flex-1 py-3 rounded-xl gradient-btn text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {updatingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2 Content: Collaborator Management */}
            {activeSettingsTab === 'collaborators' && (
              <div className="space-y-6">
                {/* Invite Form */}
                <form onSubmit={handleInviteCollaborator} className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Invite by Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="collaborator@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 bg-white/3 border border-white/8 hover:border-white/15 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      className="px-4 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                      {inviteLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <PlusCircle className="w-4.5 h-4.5" />}
                      <span>Invite</span>
                    </button>
                  </div>

                  {inviteError && (
                    <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{inviteError}</span>
                    </div>
                  )}

                  {inviteSuccess && (
                    <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{inviteSuccess}</span>
                    </div>
                  )}
                </form>

                {/* Collaborators List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Current Collaborators</h4>
                  
                  {loadingCollaborators ? (
                    <div className="flex flex-col py-6 items-center justify-center text-gray-500 gap-2">
                      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                      <span className="text-[11px]">Loading collaborators...</span>
                    </div>
                  ) : collaborators.length === 0 ? (
                    <div className="text-center py-8 rounded-2xl bg-white/2 border border-dashed border-white/8 text-gray-500 text-xs">
                      No collaborators have been added to this poll yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {collaborators.map((c) => (
                        <div key={c.user.id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/8 transition-all">
                          <div className="flex flex-col gap-0.5 truncate">
                            <span className="text-xs font-bold text-white truncate">{c.user.email}</span>
                            <span className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${c.user.verified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                                {c.user.verified ? '🟢 Active' : '⏳ Pending Invite'}
                              </span>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCollaborator(c.user.id)}
                            disabled={removingCollaboratorId === c.user.id}
                            className="p-2 rounded-lg border border-red-500/10 hover:border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all disabled:opacity-50"
                            title="Remove collaborator"
                          >
                            {removingCollaboratorId === c.user.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSettingsPoll(null)}
                    className="w-full py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-xs font-bold transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Poll Modal */}

      {editingPoll && (
        <div className="fixed inset-0 bg-[#020612]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="glass-card rounded-3xl border border-white/10 p-6 md:p-8 max-w-lg w-full space-y-6 bg-[#080d1a] max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setEditingPoll(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div>
              <h2 className="font-outfit text-2xl font-bold text-white">Edit Poll Details</h2>
              <p className="text-gray-400 text-xs mt-1">Modify your poll's details, question, and candidate options.</p>
            </div>

            <div className="space-y-4">
              {/* Step 1 Details */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Poll Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/2 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-indigo-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description / Voter Guidelines</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/2 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-indigo-500 focus:outline-none transition-all resize-none"
                  required
                />
              </div>

              {/* Poster Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Poll Poster (Optional)</label>
                <div className="flex items-center space-x-4">
                  {editPosterUrl && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                      <img src={editPosterUrl} alt="Poster preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <label className="flex-1 flex items-center justify-center border border-dashed border-white/15 hover:border-white/30 rounded-xl p-4 cursor-pointer transition-all bg-white/2 hover:bg-white/3 text-gray-400 hover:text-white">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditPosterChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center space-y-1">
                      <Upload className="w-5 h-5 text-indigo-400" />
                      <span className="text-xs font-bold">{editPosterUrl ? 'Change Poster' : 'Upload Poster'}</span>
                    </div>
                  </label>
                  {editPosterUrl && (
                    <button
                      type="button"
                      onClick={() => setEditPosterUrl('')}
                      className="text-xs font-bold text-red-400 hover:text-red-300 transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Schedule Timing Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Start Schedule</label>
                  <input
                    type="datetime-local"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/2 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-indigo-500 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">End Schedule</label>
                  <input
                    type="datetime-local"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/2 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-indigo-500 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Step 2 Details: Question & Lock Options */}
              <div className="border-t border-white/5 pt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Poll Question</label>
                  <input
                    type="text"
                    value={editQuestionText}
                    onChange={(e) => setEditQuestionText(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/2 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-indigo-500 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Candidate / Ballot Options (Locked)</label>
                  <div className="space-y-2">
                    {editOptions.map((opt, idx) => (
                      <div key={opt.id || idx} className="flex items-center space-x-2">
                        <span className="w-6 text-xs text-gray-500 font-bold text-center">#{idx + 1}</span>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const newOpts = [...editOptions];
                            newOpts[idx].text = e.target.value;
                            setEditOptions(newOpts);
                          }}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-white/2 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-indigo-500 focus:outline-none transition-all"
                          placeholder={`Option ${idx + 1}`}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Results Visibility Settings */}
                <div className="border-t border-white/5 pt-4 space-y-3.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Results Visibility & Security</label>
                  <div className="space-y-3">
                    <div 
                      onClick={() => {
                        const nextVal = !editHideResultsUntilEnd;
                        setEditHideResultsUntilEnd(nextVal);
                        if (nextVal) {
                          setEditIsResultPublic(false);
                        }
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        editHideResultsUntilEnd ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5 bg-white/2'
                      }`}
                    >
                      <div>
                        <h4 className="font-outfit font-bold text-white text-xs">Hide Live Results From Voters</h4>
                        <p className="text-gray-500 text-[10px] mt-0.5 leading-relaxed">Keep results secret until the schedule ends.</p>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        editHideResultsUntilEnd ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                      }`}>
                        {editHideResultsUntilEnd && <Check className="w-3 h-3" />}
                      </div>
                    </div>

                    <div 
                      onClick={() => {
                        const nextVal = !editIsResultPublic;
                        setEditIsResultPublic(nextVal);
                        if (nextVal) {
                          setEditHideResultsUntilEnd(false);
                        }
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        editIsResultPublic ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5 bg-white/2'
                      }`}
                    >
                      <div>
                        <h4 className="font-outfit font-bold text-white text-xs">Make Detailed Analytics Public</h4>
                        <p className="text-gray-500 text-[10px] mt-0.5 leading-relaxed">Show real-time charts and reports to voters.</p>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        editIsResultPublic ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                      }`}>
                        {editIsResultPublic && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setEditingPoll(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {savingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
