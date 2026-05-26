'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Vote, Plus, LogOut, Loader2, AlertCircle, Calendar, 
  BarChart3, Users, CheckCircle, Copy, Check, Eye, Edit, Trash2, X, Upload
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit & Delete modal states
  const [editingPoll, setEditingPoll] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPosterUrl, setEditPosterUrl] = useState('');
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editOptions, setEditOptions] = useState<any[]>([]);
  const [editIsResultPublic, setEditIsResultPublic] = useState(false);
  const [editHideResultsUntilEnd, setEditHideResultsUntilEnd] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingPollId, setDeletingPollId] = useState<string | null>(null);

  // Load session and polls
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="text-gray-400 text-sm mt-4 font-semibold">Syncing Dashboard...</span>
      </div>
    );
  }

  // Calculate aggregated stats
  const activePolls = polls.filter((p) => p.status === 'ACTIVE').length;
  const totalVotes = polls.reduce((sum, p) => sum + (p.votes?.length || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <header className="w-full border-b border-white/5 bg-[#080d1a]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Vote className="w-6 h-6" />
            </div>
            <span className="font-outfit text-xl font-bold tracking-tight text-white">
              Poll<span className="text-indigo-400">star</span>
            </span>
          </Link>

          <div className="flex items-center space-x-6">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-white">{user?.email}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                {user?.role === 'ADMIN' ? '👑 SYSTEM ADMIN' : 'CREATOR'}
              </span>
            </div>
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:text-white transition-all"
              >
                Admin Control
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1">Total Votes Cast</span>
              <span className="font-outfit text-3xl font-extrabold text-white">{totalVotes}</span>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400">
              <Users className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-outfit text-2xl font-bold text-white">Your Polls</h2>
            <p className="text-gray-400 text-sm mt-0.5">Manage and view real-time analytical reports for your sessions.</p>
          </div>

          <Link
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

        {/* Poll List Table/Cards */}
        {polls.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center border border-white/5">
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-6">
              <Vote className="w-8 h-8" />
            </div>
            <h3 className="font-outfit text-xl font-bold text-white mb-2">No polls found</h3>
            <p className="text-gray-400 text-sm max-w-md leading-relaxed mb-6">
              You haven't created any polls yet. Once you are approved, click "Create Poll" to initialize your first voting session!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {polls.map((poll) => {
              const statusColors = {
                DRAFT: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
                ACTIVE: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                ENDED: 'bg-red-500/10 border-red-500/20 text-red-400',
              };

              return (
                <div key={poll.id} className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col justify-between space-y-6">
                  {/* Status & Title */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusColors[poll.status as keyof typeof statusColors]}`}>
                        {poll.status}
                      </span>
                      <span className="text-gray-500 text-xs flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(poll.startTime).toLocaleDateString()}</span>
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
                      Anonymity: <strong className="text-gray-200">{poll.isAnonymous ? 'Anonymous' : 'Known'}</strong>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                    <div className="text-xs text-gray-400">
                      Votes: <strong className="text-indigo-300 font-bold">{poll.votes?.length || 0}</strong>
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
                          onClick={() => handleCopyLink(poll.id)}
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center space-x-2"
                        >
                          {copiedId === poll.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Share Link</span>
                            </>
                          )}
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

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
