'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Vote, Plus, LogOut, Loader2, AlertCircle, Calendar, 
  BarChart3, Users, CheckCircle, Copy, Check, Eye 
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
                  <div className="flex items-center justify-between gap-3 pt-2">
                    {/* Share links */}
                    {poll.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleCopyLink(poll.id)}
                        className="px-3.5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold transition-all flex items-center space-x-2"
                        title="Copy Shareable Link"
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
                    ) : (
                      <div className="text-xs text-gray-500 font-medium italic">
                        {poll.status === 'DRAFT' ? 'Link inactive (draft)' : 'Link expired'}
                      </div>
                    )}

                    {/* View report */}
                    <Link
                      href={`/dashboard/polls/${poll.id}`}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white transition-all flex items-center space-x-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Analytics & Reports</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
