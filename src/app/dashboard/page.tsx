'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Vote, Plus, LogOut, Loader2, AlertCircle, Calendar, 
  BarChart3, Users, CheckCircle, Copy, Check, Eye, Edit, Trash2, X, Upload,
  Share2, Link as LinkIcon, Code2, Zap, ExternalLink, Settings, Mail, PlusCircle, Lock, Megaphone,
  History, ChevronDown, ChevronUp, TrendingUp, Award
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

  // Notices states
  const [notices, setNotices] = useState<any[]>([]);
  const [dismissedNotices, setDismissedNotices] = useState<string[]>([]);

  // Share modal states
  const [sharePoll, setSharePoll] = useState<any>(null);
  const [shortLinkLoading, setShortLinkLoading] = useState(false);
  const [shortLinkMap, setShortLinkMap] = useState<Record<string, string>>({}); // pollId -> shortCode
  const [shareCopied, setShareCopied] = useState<string | null>(null); // which item was copied
  const [embedCopied, setEmbedCopied] = useState(false);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'POLL' | 'SURVEY' | 'EXAM'>('ALL');
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

  // Quota & Deleted Items panel state
  const [quota, setQuota] = useState<any>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [deletedItems, setDeletedItems] = useState<any[]>([]);
  const [showDeletedItems, setShowDeletedItems] = useState(false);

  // Load session, polls, and notices
  useEffect(() => {
    // Load dismissed notices from localStorage
    try {
      const stored = localStorage.getItem('dismissed_notices');
      if (stored) {
        setDismissedNotices(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading dismissed notices:', e);
    }

    const loadDashboard = async () => {
      try {
        // Fire all independent requests in parallel — massive load time reduction
        const [userRes, pollsRes, noticesRes, quotaRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/polls'),
          fetch('/api/notices'),
          fetch('/api/dashboard/quota'),
        ]);

        // Handle auth failure first
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

        // Parse all responses in parallel
        const [userData, pollsData, noticesData, quotaData] = await Promise.all([
          userRes.json(),
          pollsRes.ok ? pollsRes.json() : Promise.resolve({ polls: [] }),
          noticesRes.ok ? noticesRes.json() : Promise.resolve({ notices: [] }),
          quotaRes.ok ? quotaRes.json() : Promise.resolve(null),
        ]);

        setUser(userData.user);
        setPolls(pollsData.polls || []);
        setNotices(noticesData.notices || []);
        if (quotaData) {
          setQuota(quotaData);
          setDeletedItems(quotaData.deletedItems || []);
        }
        setQuotaLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data');
        setQuotaLoading(false);
      } finally {
        setLoading(false);
      }
    };


    loadDashboard();
  }, []);

  // Silent realtime background poller (workspace synchronization)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const pollsRes = await fetch('/api/polls');
        if (pollsRes.ok) {
          const pollsData = await pollsRes.json();
          setPolls(pollsData.polls || []);
        }
        const noticesRes = await fetch('/api/notices');
        if (noticesRes.ok) {
          const noticesData = await noticesRes.json();
          setNotices(noticesData.notices || []);
        }
        const quotaRes = await fetch('/api/dashboard/quota');
        if (quotaRes.ok) {
          const qd = await quotaRes.json();
          setQuota(qd);
          setDeletedItems(qd.deletedItems || []);
        }
      } catch (e) {
        console.error('Real-time workspace sync error:', e);
      }
    }, 15000); // Sync every 15 seconds

    return () => clearInterval(interval);
  }, [user]);

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

  const handleUpdateCollaboratorRole = async (targetUserId: string, role: string) => {
    if (!settingsPoll) return;
    if (role === 'OWNER') {
      if (!confirm('Are you absolutely sure you want to transfer ownership of this poll? This action cannot be undone, and you will be demoted to an Editor.')) {
        return;
      }
    }
    try {
      const res = await fetch(`/api/polls/${settingsPoll.id}/collaborators`, {
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
        // Refresh the list of collaborators
        const freshRes = await fetch(`/api/polls/${settingsPoll.id}/collaborators`);
        const freshData = await freshRes.json();
        if (freshRes.ok) {
          setCollaborators(freshData.collaborators || []);
        }
      }
    } catch (err: any) {
      alert(err.message);
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
  const totalPollsCount = polls.filter((p: any) => p.pollType === 'POLL').length;
  const totalSurveysCount = polls.filter((p: any) => p.pollType === 'SURVEY').length;
  const totalExamsCount = polls.filter((p: any) => p.pollType === 'EXAM').length;
  const activeSessionsCount = polls.filter((p: any) => p.status === 'ACTIVE').length;

  // Derive enabled categories from quota
  const enabledCategories: string[] = quota?.enabledCategories ?? ['POLL', 'SURVEY', 'EXAM'];
  const canPoll = enabledCategories.includes('POLL');
  const canSurvey = enabledCategories.includes('SURVEY');
  const canExam = enabledCategories.includes('EXAM');

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
      <DashboardHeader user={user} enabledCategories={enabledCategories} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-8">
        
        {/* Dynamic Notices Board */}
        {notices.length > 0 && notices.filter(n => !dismissedNotices.includes(n.id)).length > 0 && (
          <div className="space-y-4">
            {notices
              .filter(n => !dismissedNotices.includes(n.id))
              .map((n) => {
                const borderColors = {
                  HIGH: 'border-red-500/30 bg-red-500/5 text-red-400',
                  MEDIUM: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
                  LOW: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400',
                };
                const tagColors = {
                  HIGH: 'bg-red-500/10 border-red-500/20 text-red-300',
                  MEDIUM: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
                  LOW: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
                };
                return (
                  <div 
                    key={n.id} 
                    className={`glass-card rounded-3xl p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in relative overflow-hidden ${
                      n.priority === 'HIGH' ? 'animate-pulse-glow ' : ''
                    }${borderColors[n.priority as keyof typeof borderColors] || borderColors.LOW}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl shrink-0 ${tagColors[n.priority as keyof typeof tagColors] || tagColors.LOW}`}>
                        <Megaphone className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-outfit text-base font-bold text-white leading-snug">{n.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                            tagColors[n.priority as keyof typeof tagColors] || tagColors.LOW
                          }`}>
                            {n.priority} PRIORITY
                          </span>
                        </div>
                        <p className="text-gray-300 text-xs leading-relaxed max-w-3xl whitespace-pre-wrap">{n.content}</p>
                        {n.referencedNotice && (
                          <div className="mt-2.5 p-2 bg-black/40 border border-white/5 rounded-xl text-[10px] text-purple-300 inline-block font-semibold">
                            🔗 Mentions previous announcement: <strong className="text-white font-bold">"{n.referencedNotice.title}"</strong> (Published {new Date(n.referencedNotice.publishedAt).toLocaleDateString()})
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const nextDismissed = [...dismissedNotices, n.id];
                        setDismissedNotices(nextDismissed);
                        localStorage.setItem('dismissed_notices', JSON.stringify(nextDismissed));
                      }}
                      className="px-4 py-2 border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 self-start md:self-auto"
                    >
                      Dismiss Notice
                    </button>
                  </div>
                );
              })}
          </div>
        )}
        

        {/* Stats Grid */}
        <div id="dashboard-stats" className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className={`glass-card rounded-2xl p-6 flex items-center justify-between transition-all ${!canPoll ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            <div>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1">Polls</span>
              <span className="font-outfit text-3xl font-extrabold text-white">{canPoll ? totalPollsCount : '—'}</span>
              {!canPoll && <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Not in Plan</span>}
            </div>
            <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400">
              <Vote className="w-7 h-7" />
            </div>
          </div>

          <div className={`glass-card rounded-2xl p-6 flex items-center justify-between transition-all ${!canSurvey ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            <div>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1">Surveys</span>
              <span className="font-outfit text-3xl font-extrabold text-white">{canSurvey ? totalSurveysCount : '—'}</span>
              {!canSurvey && <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Not in Plan</span>}
            </div>
            <div className="p-4 bg-violet-500/10 rounded-2xl text-violet-400">
              <BarChart3 className="w-7 h-7" />
            </div>
          </div>

          <div className={`glass-card rounded-2xl p-6 flex items-center justify-between transition-all ${!canExam ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            <div>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1">Exams</span>
              <span className="font-outfit text-3xl font-extrabold text-white">{canExam ? totalExamsCount : '—'}</span>
              {!canExam && <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Not in Plan</span>}
            </div>
            <div className="p-4 bg-cyan-500/10 rounded-2xl text-cyan-400">
              <Award className="w-7 h-7" />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1">Active Sessions</span>
              <span className="font-outfit text-3xl font-extrabold text-white">{activeSessionsCount}</span>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400">
              <CheckCircle className="w-7 h-7" />
            </div>
          </div>
        </div>

        <AdvertisementZone removeAdvertisements={user?.plan?.features?.removeAdvertisements === true} />

        {/* ── Quota Progress Panel ───────────────────────────────────────── */}
        {!quotaLoading && quota && (() => {
          const { total, subscription, isSubBased, planType } = quota;
          const cycleLabel = isSubBased && subscription
            ? `Cycle: ${new Date(subscription.cycleStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(subscription.cycleEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : 'All-time lifetime quota';

          const bars = [
            { label: 'Polls', used: total.usedPolls, limit: total.allowedPolls, color: 'from-indigo-500 to-violet-500', warn: 'from-amber-500 to-orange-500', crit: 'from-red-500 to-rose-600', icon: '🗳' },
            { label: 'Surveys', used: total.usedSurveys, limit: total.allowedSurveys, color: 'from-violet-500 to-purple-600', warn: 'from-amber-500 to-orange-500', crit: 'from-red-500 to-rose-600', icon: '📋' },
            { label: 'Exams', used: total.usedExams, limit: total.allowedExams, color: 'from-cyan-500 to-blue-500', warn: 'from-amber-500 to-orange-500', crit: 'from-red-500 to-rose-600', icon: '📝' },
          ];

          return (
            <div className="glass-card rounded-3xl p-6 border border-white/8 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-outfit text-base font-bold text-white">Creation Quota &amp; Usage</h3>
                    <p className="text-[10px] text-gray-500 font-semibold">{cycleLabel} · {planType || 'FREE'}</p>
                  </div>
                </div>
                {!isSubBased && (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-violet-500/10 border-violet-500/20 text-violet-300 uppercase tracking-wider">Pack Quota</span>
                )}
              </div>

              <div className="space-y-4">
                {bars.map((bar) => {
                  const isUnlimited = bar.limit === -1 || bar.limit === null;
                  const pct = isUnlimited ? 0 : Math.min(100, Math.round((bar.used / Math.max(bar.limit, 1)) * 100));
                  const isWarn = pct >= 75 && pct < 90;
                  const isCrit = pct >= 90;
                  const trackColor = isCrit ? bar.crit : isWarn ? bar.warn : bar.color;

                  return (
                    <div key={bar.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                          <span>{bar.icon}</span>
                          {bar.label}
                        </span>
                        <span className={`text-xs font-bold ${
                          isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-gray-400'
                        }`}>
                          {isUnlimited
                            ? <span className="text-emerald-400 flex items-center gap-1"><span>∞</span><span className="text-[10px] font-semibold">Unlimited</span></span>
                            : <>{bar.used} <span className="text-gray-600">/</span> {bar.limit}</>}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        {!isUnlimited && (
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${trackColor} transition-all duration-700 ease-out`}
                            style={{ width: `${pct}%` }}
                          />
                        )}
                        {isUnlimited && (
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500/40 to-teal-500/40" style={{ width: '100%' }} />
                        )}
                      </div>
                      {isCrit && !isUnlimited && (
                        <p className="text-[10px] text-red-400 font-semibold">⚠️ Quota nearly exhausted — upgrade to create more {bar.label.toLowerCase()}.</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {(total.allowedPolls !== -1 || total.allowedSurveys !== -1 || total.allowedExams !== -1) && (
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <p className="text-[10px] text-gray-600 leading-relaxed">Deleted sessions still count towards your quota.</p>
                  <a href="/dashboard/plans" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Upgrade Plan →</a>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Deleted Items Ledger ───────────────────────────────────────── */}
        {deletedItems.length > 0 && (
          <div className="glass-card rounded-3xl border border-white/8 overflow-hidden">
            <button
              onClick={() => setShowDeletedItems(v => !v)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/3 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <History className="w-4.5 h-4.5 text-red-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-outfit text-base font-bold text-white">Deleted Items</h3>
                  <p className="text-[10px] text-gray-500 font-semibold">{deletedItems.length} item{deletedItems.length !== 1 ? 's' : ''} permanently removed · still count toward quota</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-400">{deletedItems.length}</span>
                {showDeletedItems ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>
            </button>

            {showDeletedItems && (
              <div className="border-t border-white/5 px-6 pb-6 pt-4 space-y-2 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {deletedItems.map((item: any) => {
                    const typeColor = item.pollType === 'SURVEY'
                      ? 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                      : item.pollType === 'EXAM'
                        ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                        : 'bg-blue-500/10 border-blue-500/20 text-blue-400';
                    const typeIcon = item.pollType === 'SURVEY' ? '📋' : item.pollType === 'EXAM' ? '📝' : '🗳';

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white/2 border border-white/5 hover:border-white/8 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-red-500/8 border border-red-500/15 flex items-center justify-center shrink-0">
                            <Trash2 className="w-3.5 h-3.5 text-red-400/70" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-300 truncate leading-snug group-hover:text-white transition-colors">{item.title}</p>
                            <p className="text-[10px] text-gray-600 mt-0.5">
                              Deleted {new Date(item.deletedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                              {' '}at{' '}
                              {new Date(item.deletedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-bold border ${typeColor}`}>
                            {typeIcon} {item.pollType}
                          </span>
                          <span className="px-2 py-1 rounded-lg text-[9px] font-bold bg-red-500/8 border border-red-500/15 text-red-400/80">
                            REMOVED
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-center text-[10px] text-gray-700 pt-2 leading-relaxed">
                  These sessions are permanently deleted. Analytics, responses, and configuration data are not recoverable.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Header Actions */}
        {(() => {
          const pollsExhausted = quota && quota.total && quota.total.allowedPolls !== -1 && quota.total.usedPolls >= quota.total.allowedPolls;
          const surveysExhausted = quota && quota.total && quota.total.allowedSurveys !== -1 && quota.total.usedSurveys >= quota.total.allowedSurveys;
          const examsExhausted = quota && quota.total && quota.total.allowedExams !== -1 && quota.total.usedExams >= quota.total.allowedExams;
          
          return (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-outfit text-2xl font-bold text-white">Your Sessions</h2>
                <p className="text-gray-400 text-sm mt-0.5">Manage and view real-time analytical reports for your sessions.</p>
              </div>

              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                {/* Poll Create Button */}
                {!canPoll ? (
                  <Link href="/dashboard/plans" title="Polls not included in your plan. Upgrade to get access."
                    className="px-4 py-2.5 rounded-xl font-semibold flex flex-col items-center justify-center transition-all bg-gray-800/60 text-gray-500 text-xs border border-orange-500/20 cursor-pointer flex-1 sm:flex-initial hover:border-orange-500/40"
                  >
                    <div className="flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-orange-500/60" />
                      <span>Create Poll</span>
                    </div>
                    <span className="text-[8px] text-orange-400/80 font-semibold mt-0.5 uppercase tracking-wide">Not in Plan → Upgrade</span>
                  </Link>
                ) : pollsExhausted ? (
                  <button
                    disabled
                    title="You have exhausted your poll quota. Please buy an add-on or upgrade your plan."
                    className="px-4 py-2.5 rounded-xl font-semibold flex flex-col items-center justify-center transition-all bg-gray-800/80 text-gray-500 text-xs border border-white/5 cursor-not-allowed flex-1 sm:flex-initial"
                  >
                    <div className="flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Create Poll</span>
                    </div>
                    <span className="text-[8px] text-red-400 font-semibold mt-0.5 uppercase tracking-wide">Quota Exhausted - Buy Add-on</span>
                  </button>
                ) : (
                  <Link
                    id="create-poll-btn"
                    href="/dashboard/create?type=POLL"
                    className="px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center space-x-1.5 transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs shadow-md shadow-blue-900/20 active:scale-95 flex-1 sm:flex-initial"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Poll</span>
                  </Link>
                )}

                {/* Survey Create Button */}
                {!canSurvey ? (
                  <Link href="/dashboard/plans" title="Surveys not included in your plan. Upgrade to get access."
                    className="px-4 py-2.5 rounded-xl font-semibold flex flex-col items-center justify-center transition-all bg-gray-800/60 text-gray-500 text-xs border border-orange-500/20 cursor-pointer flex-1 sm:flex-initial hover:border-orange-500/40"
                  >
                    <div className="flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-orange-500/60" />
                      <span>Create Survey</span>
                    </div>
                    <span className="text-[8px] text-orange-400/80 font-semibold mt-0.5 uppercase tracking-wide">Not in Plan → Upgrade</span>
                  </Link>
                ) : surveysExhausted ? (
                  <button
                    disabled
                    title="You have exhausted your survey quota. Please buy an add-on or upgrade your plan."
                    className="px-4 py-2.5 rounded-xl font-semibold flex flex-col items-center justify-center transition-all bg-gray-800/80 text-gray-500 text-xs border border-white/5 cursor-not-allowed flex-1 sm:flex-initial"
                  >
                    <div className="flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Create Survey</span>
                    </div>
                    <span className="text-[8px] text-red-400 font-semibold mt-0.5 uppercase tracking-wide">Quota Exhausted - Buy Add-on</span>
                  </button>
                ) : (
                  <Link
                    id="create-survey-btn"
                    href="/dashboard/create?type=SURVEY"
                    className="px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center space-x-1.5 transition-all bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs shadow-md shadow-violet-900/20 active:scale-95 flex-1 sm:flex-initial"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Survey</span>
                  </Link>
                )}

                {/* Exam Create Button */}
                {!canExam ? (
                  <Link href="/dashboard/plans" title="Exams not included in your plan. Upgrade to get access."
                    className="px-4 py-2.5 rounded-xl font-semibold flex flex-col items-center justify-center transition-all bg-gray-800/60 text-gray-500 text-xs border border-orange-500/20 cursor-pointer flex-1 sm:flex-initial hover:border-orange-500/40"
                  >
                    <div className="flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-orange-500/60" />
                      <span>Create Exam</span>
                    </div>
                    <span className="text-[8px] text-orange-400/80 font-semibold mt-0.5 uppercase tracking-wide">Not in Plan → Upgrade</span>
                  </Link>
                ) : examsExhausted ? (
                  <button
                    disabled
                    title="You have exhausted your exam quota. Please buy an add-on or upgrade your plan."
                    className="px-4 py-2.5 rounded-xl font-semibold flex flex-col items-center justify-center transition-all bg-gray-800/80 text-gray-500 text-xs border border-white/5 cursor-not-allowed flex-1 sm:flex-initial"
                  >
                    <div className="flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Create Exam</span>
                    </div>
                    <span className="text-[8px] text-red-400 font-semibold mt-0.5 uppercase tracking-wide">Quota Exhausted - Buy Add-on</span>
                  </button>
                ) : (
                  <Link
                    id="create-exam-btn"
                    href="/dashboard/create?type=EXAM"
                    className="px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center space-x-1.5 transition-all bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs shadow-md shadow-rose-900/20 active:scale-95 flex-1 sm:flex-initial"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Exam</span>
                  </Link>
                )}
              </div>
            </div>
          );
        })()}

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
              {(['ALL', 'POLL', 'SURVEY', 'EXAM'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-4 py-2.5 text-xs font-bold transition-all ${
                    typeFilter === t
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/3 text-gray-400 hover:text-white hover:bg-white/8'
                  }`}
                >
                  {t === 'ALL' ? 'All Types' : t === 'POLL' ? '🗳 Polls' : t === 'SURVEY' ? '📋 Surveys' : '📝 Exams'}
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusColors[poll.status as keyof typeof statusColors]}`}>
                            {poll.status}
                          </span>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                            poll.pollType === 'SURVEY'
                              ? 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                              : poll.pollType === 'EXAM'
                                ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          }`}>
                            {poll.pollType === 'SURVEY' ? '📋 Survey' : poll.pollType === 'EXAM' ? '📝 Exam' : '🗳 Poll'}
                          </span>
                          {poll.creatorId !== user?.id && (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold border bg-indigo-500/10 border-indigo-500/20 text-indigo-300">
                              🤝 Shared Workspace
                            </span>
                          )}
                          {poll.creatorId === user?.id && poll.collaborators && poll.collaborators.length > 0 && (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold border bg-purple-500/10 border-purple-500/20 text-purple-300">
                              👥 Collaborative ({poll.collaborators.length})
                            </span>
                          )}
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
                    {poll.collaborators && poll.collaborators.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Team:</span>
                        {poll.collaborators.map((c: any) => (
                          <span 
                            key={c.user?.email || c.userId} 
                            className="px-2 py-0.5 rounded-full bg-slate-900 border border-white/5 text-gray-400 text-[9px] font-semibold"
                            title={c.user?.email || c.userId}
                          >
                            {c.user?.email ? c.user.email.split('@')[0] : 'Pending'}
                          </span>
                        ))}
                      </div>
                    )}
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
                      {(poll.status === 'DRAFT' || (poll.collaborators && poll.collaborators.length > 0) || poll.creatorId !== user?.id) ? (
                        <Link
                          href={`/dashboard/create?id=${poll.id}`}
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-white/5 hover:border-white/15 bg-white/3 hover:bg-white/8 text-gray-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
                        >
                          <Edit className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Edit Wizard</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleOpenEdit(poll)}
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-white/5 hover:border-white/15 bg-white/3 hover:bg-white/8 text-gray-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
                        >
                          <Edit className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Edit Details</span>
                        </button>
                      )}

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

                    {poll.pollType === 'EXAM' && poll.status !== 'DRAFT' && (
                      <Link
                        href={`/dashboard/polls/${poll.id}?tab=grades`}
                        className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center space-x-1.5"
                      >
                        <span>📝 Open Marking Portal</span>
                      </Link>
                    )}

                    {/* Poll Settings Button (Only for owner/admin) */}
                    {(poll.creatorId === user?.id || user?.role === 'ADMIN') && (
                      <button
                        onClick={() => handleOpenSettings(poll)}
                        className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/8 hover:border-white/15 text-gray-300 hover:text-white transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Settings className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{poll.pollType === 'EXAM' ? 'Exam Settings & Collaborators' : 'Poll Settings & Collaborators'}</span>
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
        
        const isEmbedAllowed = user?.role === 'ADMIN' || user?.plan?.features?.embedCode === true;
        const isLinkShortenerAllowed = user?.role === 'ADMIN' || user?.plan?.features?.linkShortener === true;

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
                  {!isLinkShortenerAllowed ? (
                    <div className="rounded-xl border border-white/5 bg-white/3 p-3 flex flex-col items-center justify-center text-center gap-1.5 relative overflow-hidden">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                        <Lock className="w-3.5 h-3.5" /> Link Shortening Locked
                      </div>
                      <p className="text-[10px] text-gray-500 max-w-[280px]">
                        Customized short sharing URLs (e.g. /s/abc) are only available on upgraded tiers.
                      </p>
                      <Link
                        href="/dashboard/plans"
                        className="mt-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-lg transition-all"
                      >
                        Upgrade Plan
                      </Link>
                    </div>
                  ) : shortLink ? (
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
                  <div className="relative overflow-hidden rounded-xl">
                    {!isEmbedAllowed ? (
                      <div className="absolute inset-0 bg-[#080d1a]/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-4 border border-white/10 rounded-xl z-10">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 mb-1">
                          <Lock className="w-3.5 h-3.5" /> Premium Embed Feature
                        </div>
                        <p className="text-[10px] text-gray-400 max-w-[280px] mb-2 leading-relaxed">
                          Embedding voting widgets directly onto your CMS or website is locked on your current plan.
                        </p>
                        <Link
                          href="/dashboard/plans"
                          className="text-[11px] font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-4 py-1.5 rounded-lg transition-all shadow-lg shadow-indigo-500/20"
                        >
                          Upgrade Tier
                        </Link>
                      </div>
                    ) : null}
                    <pre className={`w-full bg-white/3 border border-white/8 rounded-xl px-3 py-2.5 text-[10px] text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed ${!isEmbedAllowed ? 'blur-[3px] select-none pointer-events-none' : ''}`}>
                      {embedCode}
                    </pre>
                    {isEmbedAllowed && (
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
                    )}
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
                        <div key={c.user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/8 transition-all gap-3">
                          <div className="flex flex-col gap-0.5 truncate">
                            <span className="text-xs font-bold text-white truncate">{c.user.email}</span>
                            <span className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${c.user.verified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                                {c.user.verified ? '🟢 Active' : '⏳ Pending Invite'}
                              </span>
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              value={c.role || 'CO_EDITOR'}
                              onChange={(e) => handleUpdateCollaboratorRole(c.user.id, e.target.value)}
                              className="bg-[#030712] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-purple-500 font-semibold"
                            >
                              <option value="CO_EDITOR">Editor</option>
                              <option value="VIEWER">Viewer</option>
                            </select>
                            
                            <button
                              type="button"
                              onClick={() => handleUpdateCollaboratorRole(c.user.id, 'OWNER')}
                              className="px-2 py-1.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-[9px] font-bold uppercase transition-all"
                              title="Transfer Ownership"
                            >
                              🔑 Transfer
                            </button>

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
              <div className="flex items-center gap-2">
                <h2 className="font-outfit text-2xl font-bold text-white">Edit Poll Details</h2>
                {editingPoll.creatorId !== user?.id && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-extrabold uppercase animate-pulse">
                    Collaborative Session Active 🟢
                  </span>
                )}
              </div>
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
