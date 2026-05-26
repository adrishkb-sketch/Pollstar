'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Vote, ArrowLeft, Loader2, Users, FileText, CheckCircle, 
  XCircle, ToggleLeft, ToggleRight, ShieldCheck, AlertCircle, Trash2,
  Eye, BarChart3, Calendar, Lock, ShieldAlert, X
} from 'lucide-react';

export default function AdminPortal() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin lists states
  const [creators, setCreators] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);

  // UI Tabs & Modal details states
  const [activeTab, setActiveTab] = useState<'creators' | 'logs' | 'polls'>('creators');
  const [selectedPoll, setSelectedPoll] = useState<any | null>(null);

  // Toggling states
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Override States
  const [editingVote, setEditingVote] = useState<any | null>(null);
  const [overrideAnswers, setOverrideAnswers] = useState<Record<string, any>>({});
  const [overrideError, setOverrideError] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  // 1. Fetch system details on mount
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const adminRes = await fetch('/api/auth/me');
        if (!adminRes.ok) {
          router.push('/login');
          return;
        }
        const adminData = await adminRes.json();
        
        if (adminData.user.role !== 'ADMIN') {
          router.push('/dashboard');
          return;
        }

        // Fetch Creators
        const creatorsRes = await fetch('/api/admin/users');
        if (creatorsRes.ok) {
          const creatorsData = await creatorsRes.json();
          setCreators(creatorsData.creators || []);
        }

        // Fetch Audit Logs
        const logsRes = await fetch('/api/admin/logs');
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setLogs(logsData.logs || []);
        }

        // Fetch System Polls
        const pollsRes = await fetch('/api/admin/override-vote');
        if (pollsRes.ok) {
          const pollsData = await pollsRes.json();
          setPolls(pollsData.polls || []);
        }

      } catch (err) {
        setError('Failed to fetch administrator console assets.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // 2. Toggle Creator Verification approval
  const handleToggleApproval = async (userId: string, currentApproved: boolean) => {
    setUpdatingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approve: !currentApproved }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update approval state');
      }

      // Update creators local state
      setCreators((prev) =>
        prev.map((c) => (c.id === userId ? { ...c, approvedByAdmin: !currentApproved } : c))
      );

      // Re-fetch logs to update audit trails immediately
      const logsRes = await fetch('/api/admin/logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // 3. Delete Creator Account
  const handleDeleteCreator = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to permanently delete creator account "${email}"? This will delete all of their polls and voting sessions as well!`)) return;

    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      // Update local creators state
      setCreators((prev) => prev.filter((c) => c.id !== userId));

      // Re-fetch logs to update audit trails immediately
      const logsRes = await fetch('/api/admin/logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeletePoll = async (pollId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete poll "${title}"? This action is destructive and removes all vote records, questions, and allowed voter logs permanently.`)) return;

    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete poll');
      }

      // Update polls list state locally
      setPolls((prev) => prev.filter((p) => p.id !== pollId));

      // Re-fetch logs to update audit trails immediately
      const logsRes = await fetch('/api/admin/logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleStartOverride = (v: any) => {
    let parsedAns = {};
    try {
      parsedAns = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
    } catch {}
    setEditingVote(v);
    setOverrideAnswers(parsedAns);
    setOverrideError('');
  };

  const handleSaveOverride = async () => {
    setOverrideLoading(true);
    setOverrideError('');
    try {
      const res = await fetch('/api/admin/override-vote', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voteId: editingVote.id,
          newAnswers: overrideAnswers
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save override');

      // Update selectedPoll votes state locally
      setSelectedPoll((prev: any) => {
        if (!prev) return null;
        const updatedVotes = prev.votes.map((v: any) => 
          v.id === editingVote.id ? { ...v, answers: JSON.stringify(overrideAnswers) } : v
        );
        return { ...prev, votes: updatedVotes };
      });

      // Update polls list state locally
      setPolls((prev: any[]) => 
        prev.map((p) => {
          if (p.id === selectedPoll.id) {
            const updatedVotes = p.votes.map((v: any) =>
              v.id === editingVote.id ? { ...v, answers: JSON.stringify(overrideAnswers) } : v
            );
            return { ...p, votes: updatedVotes };
          }
          return p;
        })
      );

      // Re-fetch audit logs to show override audit logs instantly!
      const logsRes = await fetch('/api/admin/logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }

      setEditingVote(null);
    } catch (err: any) {
      setOverrideError(err.message);
    } finally {
      setOverrideLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-[#030712]">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        <span className="text-gray-400 text-sm mt-4 font-semibold">Opening Admin Console...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-10 relative">
      
      {/* Ambience glow */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="font-outfit text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              System Admin Console
            </span>
            <p className="text-gray-400 text-xs mt-0.5">Control creator listings, verify accounts, and inspect audit ledgers.</p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold transition-all flex items-center space-x-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Console</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Selectors */}
      <div id="admin-tabs" className="flex border-b border-white/5 space-x-6 pb-1">
        <button
          onClick={() => setActiveTab('creators')}
          className={`pb-3 text-sm font-bold transition-all relative uppercase tracking-wider ${
            activeTab === 'creators' ? 'text-purple-400 font-extrabold' : 'text-gray-400 hover:text-white'
          }`}
        >
          Creators Listings
          {activeTab === 'creators' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('polls')}
          className={`pb-3 text-sm font-bold transition-all relative uppercase tracking-wider flex items-center gap-2`}
        >
          <BarChart3 className="w-4 h-4 text-purple-400" />
          <span>Poll Databases</span>
          {activeTab === 'polls' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-sm font-bold transition-all relative uppercase tracking-wider ${
            activeTab === 'logs' ? 'text-purple-400 font-extrabold' : 'text-gray-400 hover:text-white'
          }`}
        >
          Audit Ledgers
          {activeTab === 'logs' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab: Creators Mapping */}
      {activeTab === 'creators' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Card: Users / Creators Approval */}
          <div id="creators-list" className="glass-card rounded-3xl p-6 border border-white/5 space-y-6">
            <div className="flex items-center space-x-2.5 border-b border-white/5 pb-4">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="font-outfit text-lg font-bold text-white">Pending Creator Listings</h3>
            </div>

            {creators.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 italic">
                No registered user accounts found.
              </div>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                {creators.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-between gap-4 hover:border-white/10 transition-colors">
                    <div className="space-y-1">
                      <span className="text-sm font-semibold text-white block truncate max-w-[200px]">{c.email}</span>
                      <div className="flex items-center space-x-3 text-[10px]">
                        <span className="text-gray-500 font-bold">{new Date(c.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span className={c.verified ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                          {c.verified ? 'Verified Email' : 'Email Unverified'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Toggle Switch */}
                      <button
                        onClick={() => handleToggleApproval(c.id, c.approvedByAdmin)}
                        disabled={updatingId === c.id}
                        className="p-1 rounded-xl hover:bg-white/5 transition-all text-purple-400"
                        title={c.approvedByAdmin ? 'Revoke Approval' : 'Approve Account'}
                      >
                        {updatingId === c.id ? (
                          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                        ) : c.approvedByAdmin ? (
                          <ToggleRight className="w-9 h-9 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-9 h-9 text-gray-600" />
                        )}
                      </button>

                      {/* Delete Account Button */}
                      <button
                        onClick={() => handleDeleteCreator(c.id, c.email)}
                        disabled={updatingId === c.id}
                        className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                        title="Delete Creator Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Card: Mini logs summary */}
          <div className="glass-card rounded-3xl p-6 border border-white/5 space-y-6">
            <div className="flex items-center space-x-2.5 border-b border-white/5 pb-4">
              <FileText className="w-5 h-5 text-purple-400" />
              <h3 className="font-outfit text-lg font-bold text-white">Recent Security Logs</h3>
            </div>

            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 italic">
                No audit logs recorded.
              </div>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                {logs.slice(0, 5).map((l) => (
                  <div key={l.id} className="p-3.5 rounded-2xl bg-white/2 border border-white/5 space-y-1 hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-wider">
                      <span className="text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        {l.action}
                      </span>
                      <span className="text-gray-500">{new Date(l.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-gray-300 text-xs truncate">{l.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Full Security Logs List */}
      {activeTab === 'logs' && (
        <div className="glass-card rounded-3xl p-6 border border-white/5 space-y-6">
          <div className="flex items-center space-x-2.5 border-b border-white/5 pb-4">
            <FileText className="w-5 h-5 text-purple-400" />
            <h3 className="font-outfit text-lg font-bold text-white">Security Audit Ledger</h3>
          </div>

          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 italic">
              No audit logs have been recorded in the ledger.
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {logs.map((l) => (
                <div key={l.id} className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-1.5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-wider">
                    <span className="text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20">
                      {l.action}
                    </span>
                    <span className="text-gray-500 font-mono">
                      {new Date(l.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed">{l.details}</p>
                  <div className="text-[10px] text-gray-500 font-semibold flex justify-between">
                    <span>By Administrator: {l.admin?.email || 'System'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: System Polls & Analytic Results */}
      {activeTab === 'polls' && (
        <div className="glass-card rounded-3xl p-6 border border-white/5 space-y-6">
          <div className="flex items-center space-x-2.5 border-b border-white/5 pb-4">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h3 className="font-outfit text-lg font-bold text-white">System Poll Database</h3>
          </div>

          {polls.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500 italic">
              No voting polls exist in the database.
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
                  <div key={poll.id} className="p-5 rounded-2xl bg-white/2 border border-white/5 flex flex-col justify-between space-y-5 hover:border-white/10 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${statusColors[poll.status as keyof typeof statusColors]}`}>
                          {poll.status}
                        </span>
                        <span className="text-[10px] text-gray-500 font-semibold truncate max-w-[200px]">
                          Creator: {poll.creator?.email || 'System'}
                        </span>
                      </div>
                      <h4 className="font-outfit text-base font-bold text-white leading-tight truncate">
                        {poll.title}
                      </h4>
                      <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                        {poll.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        {poll.isOpenVoting ? '🔓 Public' : '🔒 Closed'} ({poll.votes?.length || 0} Votes)
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedPoll(poll)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white transition-all flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Results</span>
                        </button>
                        <button
                          onClick={() => handleDeletePoll(poll.id, poll.title)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/20 transition-all"
                          title="Delete Poll permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Poll Analytical Inspector Overlay Modal */}
      {selectedPoll && (
        <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-6 z-50 overflow-y-auto">
          <div className="glass-card rounded-3xl w-full max-w-4xl p-8 border border-white/5 max-h-[85vh] overflow-y-auto space-y-8 relative">
            <button
              onClick={() => setSelectedPoll(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="border-b border-white/5 pb-5 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-purple-500/30 text-purple-400 bg-purple-500/5 uppercase">
                  {selectedPoll.isOpenVoting ? '🔓 Public Access' : '🔒 Closed List'}
                </span>
                <span className="text-gray-500 text-xs">•</span>
                <span className="text-xs text-gray-400 font-bold">Created by: {selectedPoll.creator?.email || 'System'}</span>
              </div>
              <h3 className="font-outfit text-2xl font-bold text-white">{selectedPoll.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{selectedPoll.description}</p>
            </div>

            {/* Results Chart Breakdown */}
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
                Analytical Results Breakdown ({selectedPoll.votes?.length || 0} Total Votes)
              </h4>

              {selectedPoll.questions.map((q: any, idx: number) => {
                // Calculate question scores/counts dynamically
                const stats: Record<string, number> = {};
                q.options.forEach((opt: any) => { stats[opt.id] = 0; });

                selectedPoll.votes.forEach((v: any) => {
                  try {
                    const ans = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
                    const val = ans[q.id];
                    if (q.type === 'RANKED' && Array.isArray(val)) {
                      const numOpts = q.options.length;
                      val.forEach((optId: string, itemIdx: number) => {
                        if (stats[optId] !== undefined) {
                          stats[optId] += numOpts - itemIdx; // weighting preference score
                        }
                      });
                    } else if (q.type === 'SINGLE' && typeof val === 'string') {
                      if (stats[val] !== undefined) { stats[val] += 1; }
                    } else if (q.type === 'KNOCKOUT' && val && typeof val.winner === 'string') {
                      if (stats[val.winner] !== undefined) { stats[val.winner] += 1; }
                    }
                  } catch (e) {}
                });

                const totalPoints = Object.values(stats).reduce((a, b) => a + b, 0) || 1;

                return (
                  <div key={q.id} className="p-5 rounded-2xl bg-white/2 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-bold text-white">Q{idx + 1}: {q.questionText}</h5>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300">
                        {q.type === 'RANKED' ? 'Order-based choice' : q.type === 'KNOCKOUT' ? 'Knockout Tournament' : 'Single Choice'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {q.options.map((opt: any) => {
                        const score = stats[opt.id] || 0;
                        const percentage = Math.round((score / totalPoints) * 100);

                        return (
                          <div key={opt.id} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-gray-300">{opt.text}</span>
                              <span className="text-purple-400 font-bold">{score} {q.type === 'RANKED' ? 'pts' : 'votes'} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/5">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Who Voted For Whom details (Always Visible to Admin) */}
            {selectedPoll && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Voter Registry & Choice Map</h4>
                </div>
                {selectedPoll.votes?.length === 0 ? (
                  <p className="text-xs text-gray-500 italic text-center py-4">No votes have been cast yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/1">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase font-bold tracking-wider bg-white/2">
                          <th className="p-3">Unique ID</th>
                          <th className="p-3">Email Address</th>
                          {selectedPoll.questions.map((q: any, qIdx: number) => (
                            <th key={q.id} className="p-3 truncate max-w-[200px]">Choice: Q{qIdx + 1}</th>
                          ))}
                          <th className="p-3">Timestamp</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                        {selectedPoll.votes.map((v: any) => {
                          let ans: any = {};
                          try {
                            ans = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
                          } catch (e) {}

                          return (
                            <tr key={v.id} className="hover:bg-white/2 transition-colors">
                              <td className="p-3 font-mono font-bold text-purple-300">{v.userIdentifier || 'N/A'}</td>
                              <td className="p-3 font-semibold">{v.email || 'N/A'}</td>
                              {selectedPoll.questions.map((q: any) => {
                                const val = ans[q.id];
                                let resolvedText = 'No Answer';
                                if (q.type === 'SINGLE' && typeof val === 'string') {
                                  resolvedText = q.options.find((o: any) => o.id === val)?.text || val;
                                } else if (q.type === 'RANKED' && Array.isArray(val)) {
                                  resolvedText = val.map((optId, idx) => {
                                    const optText = q.options.find((o: any) => o.id === optId)?.text || optId;
                                    return `${idx + 1}st Preference: ${optText}`;
                                  }).join(' | ');
                                } else if (q.type === 'KNOCKOUT' && val && typeof val.winner === 'string') {
                                  const champText = q.options.find((o: any) => o.id === val.winner)?.text || val.winner;
                                  resolvedText = `🏆 Champion: ${champText}`;
                                }

                                return (
                                  <td key={q.id} className="p-3 truncate max-w-[250px]" title={resolvedText}>
                                    {resolvedText}
                                  </td>
                                );
                              })}
                              <td className="p-3 text-[10px] text-gray-500 font-mono">
                                {new Date(v.createdAt).toLocaleString()}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleStartOverride(v)}
                                  className="px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-600 hover:text-white font-bold text-[10px] transition-all"
                                >
                                  Override Ballot
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editing Override modal */}
      {editingVote && (
        <div className="fixed inset-0 bg-[#030712]/95 backdrop-blur-md flex items-center justify-center p-6 z-[60]">
          <div className="glass-card rounded-3xl w-full max-w-md p-6 border border-white/5 space-y-6 relative">
            <button
              onClick={() => setEditingVote(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Admin Override Panel</span>
              <h4 className="text-white text-base font-bold mt-1">Modify Ballot Selection</h4>
              <p className="text-gray-400 text-[10px] mt-0.5">
                Voter Ref: <span className="font-mono text-purple-300 font-bold">{editingVote.userIdentifier}</span> ({editingVote.email})
              </p>
            </div>

            {overrideError && <div className="text-xs text-red-400 font-semibold">{overrideError}</div>}

            <div className="space-y-4">
              {selectedPoll.questions.map((q: any) => {
                const val = overrideAnswers[q.id];

                return (
                  <div key={q.id} className="space-y-2">
                    <label className="block text-gray-300 text-xs font-bold uppercase tracking-wide">
                      {q.questionText}
                    </label>

                    {/* SINGLE CHOICE OVERRIDE */}
                    {q.type === 'SINGLE' && (
                      <select
                        value={typeof val === 'string' ? val : ''}
                        onChange={(e) => setOverrideAnswers({ ...overrideAnswers, [q.id]: e.target.value })}
                        className="w-full glass-input text-xs"
                      >
                        <option value="">-- Select Winner --</option>
                        {q.options.map((opt: any) => (
                          <option key={opt.id} value={opt.id}>{opt.text}</option>
                        ))}
                      </select>
                    )}

                    {/* RANKED CHOICE OVERRIDE */}
                    {q.type === 'RANKED' && (
                      <div className="space-y-2 bg-white/2 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-400 mb-1">Set preference order list by selecting candidate:</p>
                        {q.options.map((opt: any, index: number) => {
                          const currentRankVal = Array.isArray(val) ? val[index] : '';
                          return (
                            <div key={index} className="flex items-center space-x-2">
                              <span className="text-[10px] text-gray-500 font-bold font-mono">Rank #{index + 1}:</span>
                              <select
                                value={currentRankVal || ''}
                                onChange={(e) => {
                                  const newRankList = Array.isArray(val) ? [...val] : [];
                                  newRankList[index] = e.target.value;
                                  setOverrideAnswers({ ...overrideAnswers, [q.id]: newRankList });
                                }}
                                className="flex-1 glass-input text-[11px] py-1 px-2"
                              >
                                <option value="">-- Choose Candidate --</option>
                                {q.options.map((cand: any) => (
                                  <option key={cand.id} value={cand.id}>{cand.text}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* KNOCKOUT CHOICE OVERRIDE */}
                    {q.type === 'KNOCKOUT' && (
                      <div className="space-y-2 bg-white/2 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-400 mb-1">Override Grand Champion Candidate directly:</p>
                        <select
                          value={val && typeof val.winner === 'string' ? val.winner : ''}
                          onChange={(e) => {
                            const existingVal = val || { rounds: [] };
                            setOverrideAnswers({
                              ...overrideAnswers,
                              [q.id]: {
                                ...existingVal,
                                winner: e.target.value
                              }
                            });
                          }}
                          className="w-full glass-input text-xs"
                        >
                          <option value="">-- Select Champion --</option>
                          {q.options.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>{opt.text}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingVote(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOverride}
                disabled={overrideLoading}
                className="flex-1 py-2.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white text-xs transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-purple-600/20"
              >
                {overrideLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Apply Override</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
