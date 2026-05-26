'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Users, ShieldCheck, Loader2, Play, Pause,
  Maximize2, Minimize2, Copy, Check, QrCode, MonitorPlay
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PresentationView({ params }: PageProps) {
  const { id: pollId } = use(params);
  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalVotes, setTotalVotes] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isPolling, setIsPolling] = useState(true);

  const fetchPollData = async () => {
    try {
      const res = await fetch(`/api/polls/${pollId}`);
      if (!res.ok) throw new Error('Failed to fetch poll data');
      const data = await res.json();
      setPoll(data.poll);
      setTotalVotes(data.totalVotes);

      // Extract question and options
      const question = data.poll?.questions?.[0];
      if (question) {
        const questionStats = data.stats?.[question.id] || {};
        const formatted = question.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          count: questionStats[opt.id]?.count || 0
        }));
        setChartData(formatted);
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPollData();
  }, [pollId]);

  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(fetchPollData, 2000);
    return () => clearInterval(interval);
  }, [isPolling]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const handleCopyLink = () => {
    const voteUrl = `${window.location.origin}/poll/${pollId}`;
    navigator.clipboard.writeText(voteUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="text-gray-400 mt-4 text-sm font-medium">Entering Premium Arena...</span>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-400 text-lg font-bold">⚠️ {error || 'Poll not found'}</p>
        <Link href="/dashboard" className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 text-sm font-bold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const maxVotes = Math.max(...chartData.map((d) => d.count), 1);
  const voteUrl = typeof window !== 'undefined' ? `${window.location.origin}/poll/${pollId}` : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&bgcolor=0b0f19&color=ffffff&data=${encodeURIComponent(voteUrl)}`;

  return (
    <div className="min-h-screen bg-[#07090e] text-white font-sans flex flex-col relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header controls */}
      <header className="relative z-10 px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/2 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <Link 
            href={`/dashboard/polls/${pollId}`}
            className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-outfit text-lg font-extrabold tracking-wide text-white flex items-center gap-2">
              <MonitorPlay className="w-5 h-5 text-indigo-400" />
              <span>LIVE PRESENTATION MODE</span>
            </h1>
            <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mt-0.5">Pollstar Pro Arena</p>
          </div>
        </div>

        {/* Dynamic State Controllers */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPolling(!isPolling)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border ${
              isPolling 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
            }`}
          >
            {isPolling ? <Play className="w-3.5 h-3.5 animate-pulse" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPolling ? 'Live Syncing' : 'Sync Paused'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition-all flex items-center space-x-2"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Link Copied' : 'Copy Vote Link'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all flex items-center justify-center"
          >
            {isFullscreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
          </button>
        </div>
      </header>

      {/* Main presentation grid */}
      <main className="flex-1 relative z-10 max-w-7xl w-full mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10 items-stretch">
        
        {/* Left 2 Columns: Large Dynamic Results Chart */}
        <section className="lg:col-span-2 flex flex-col justify-between space-y-6">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              {poll.isOpenVoting ? 'Public Room' : 'Closed Roster'}
            </span>
            <h2 className="font-outfit text-4xl font-extrabold text-white mt-4 leading-tight">
              {poll.questions?.[0]?.questionText || 'Live Ballot Question'}
            </h2>
            <p className="text-gray-400 text-sm mt-2 max-w-xl">
              {poll.description || 'Scan the QR code on the right to place your secure vote.'}
            </p>
          </div>

          {/* Glowing Premium Progress Bars */}
          <div className="space-y-5 py-6">
            {chartData.map((choice) => {
              const percentage = Math.round((choice.count / (totalVotes || 1)) * 100);
              const barWidth = `${(choice.count / maxVotes) * 100}%`;
              
              return (
                <div key={choice.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-bold px-1">
                    <span className="text-white text-base tracking-wide">{choice.text}</span>
                    <span className="text-indigo-400 font-mono text-base">{choice.count} votes ({percentage}%)</span>
                  </div>
                  <div className="h-7 w-full bg-white/3 rounded-full border border-white/5 overflow-hidden p-1 relative">
                    <div 
                      style={{ width: barWidth }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20 transition-all duration-1000 ease-out relative"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:16px_16px] animate-[progress-bar-stripes_1.5s_linear_infinite]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Metrics Footer */}
          <div className="grid grid-cols-3 gap-6 bg-white/2 p-5 rounded-2xl border border-white/5">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block">Total Voters</span>
                <span className="text-xl font-extrabold text-white font-mono">{totalVotes}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block">Platform Shield</span>
                <span className="text-xs font-bold text-emerald-400">SECURE VOTE</span>
              </div>
            </div>

            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block">Status</span>
                <span className="text-xs font-bold text-purple-400 uppercase">{poll.status}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right 1 Column: Custom Audience Call-to-Action QR Code */}
        <section className="flex flex-col justify-between items-center bg-[#0b0f19] p-8 rounded-3xl border border-indigo-500/10 shadow-2xl relative">
          <div className="absolute top-3 right-3 text-indigo-400/30 animate-pulse">
            <QrCode className="w-16 h-16 pointer-events-none" />
          </div>

          <div className="text-center w-full">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
              JOIN THE ROOM
            </span>
            <h3 className="font-outfit text-2xl font-extrabold text-white mt-4">
              Cast Your Vote
            </h3>
            <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
              Scan this QR code from your smartphone camera or enter the room URL to vote.
            </p>
          </div>

          {/* Interactive QR Code container */}
          <div className="my-6 p-4 bg-white/2 rounded-2xl border border-white/5 flex items-center justify-center shadow-lg relative group">
            <img 
              src={qrCodeUrl}
              alt="Scan QR to vote"
              className="w-48 h-48 rounded-xl object-contain border border-white/10"
            />
            <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer" onClick={handleCopyLink}>
              <Copy className="w-6 h-6 text-white" />
              <span className="text-white text-xs font-bold ml-2">Copy Vote URL</span>
            </div>
          </div>

          {/* Room joining URL card */}
          <div className="w-full text-center space-y-2">
            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block">Room URL</span>
            <div className="px-4 py-2.5 bg-white/2 border border-white/5 rounded-xl font-mono text-[11px] text-gray-300 break-all select-all flex items-center justify-between gap-2">
              <span>{voteUrl}</span>
            </div>
          </div>
        </section>

      </main>

      {/* Embedded stripes animation CSS */}
      <style jsx global>{`
        @keyframes progress-bar-stripes {
          from { background-position: 0 0; }
          to { background-position: 16px 0; }
        }
      `}</style>
    </div>
  );
}
