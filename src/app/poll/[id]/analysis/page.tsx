'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Brain, Award, ShieldAlert, ShieldCheck, Clock, 
  ArrowLeft, AlertCircle, Sparkles, BookOpen, 
  CheckCircle2, XCircle, Lock, GraduationCap,
  ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ExamineeAnalysisPage({ params }: PageProps) {
  const { id: pollId } = use(params);
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const fetchResults = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/polls/${pollId}/examinee-result?email=${encodeURIComponent(emailParam)}`);
      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to retrieve analysis');
      }

      setData(resData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pollId) {
      fetchResults();
    }
  }, [pollId, emailParam]);

  const toggleExpand = (qId: string) => {
    setExpandedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <Brain className="w-6 h-6 text-indigo-400 animate-pulse" />
        </div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-widest font-mono">
          Assembling AI Tutor Analysis...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full border border-red-500/20 bg-red-500/5 rounded-3xl p-6 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto animate-bounce" />
          <div className="space-y-1.5">
            <h3 className="font-outfit text-base font-bold">Analysis Retraction Failed</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={fetchResults}
            className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-white font-bold text-xs transition-all border border-red-500/20"
          >
            Retry Fetching Report
          </button>
        </div>
      </div>
    );
  }

  // 1. Lock screen (withheld results)
  if (data && !data.resultsReleased) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full border border-white/5 bg-[#080d1a] rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-pulse">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-outfit text-lg font-bold text-white uppercase tracking-wider">Results Withheld</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              The score reports and tutor diagnostics for <strong className="text-white">"{data.message.includes('🔒') ? 'this examination' : data.poll?.title}"</strong> have not been officially released by the examiner yet.
            </p>
          </div>
          <div className="text-[10px] text-gray-500 font-mono leading-relaxed bg-[#030712] p-3 rounded-xl border border-white/5">
            Integrity Safeguard Check: Active.<br />
            Please coordinate with your instructor and refresh this page once results are released.
          </div>
          <button 
            onClick={fetchResults}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check for Updates</span>
          </button>
        </div>
      </div>
    );
  }

  // Requires Authentication / Email lookup
  if (data && data.requiresLogin) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="glass-card max-w-md w-full border border-white/5 bg-[#080d1a] rounded-3xl p-8 text-center space-y-6 shadow-2xl relative z-10">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto shadow-[0_0_20px_rgba(99,102,241,0.15)] animate-pulse">
            <GraduationCap className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-outfit text-xl font-bold text-white uppercase tracking-wider">Access Graded Report</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              To view your detailed exam analytics, AI tutoring insights, and concept diagnostics, please identify yourself.
            </p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const emailVal = formData.get('email') as string;
            if (emailVal) {
              window.location.search = `?email=${encodeURIComponent(emailVal)}`;
            }
          }} className="space-y-4">
            <div className="text-left">
              <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2 ml-1">
                Candidate Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@university.com"
                className="w-full glass-input placeholder-gray-600 text-xs px-4 py-3.5 rounded-xl border border-white/5 bg-[#030712]/50 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-1.5"
            >
              <span>Retrieve Graded Report</span>
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-[10px] text-gray-500 font-mono uppercase tracking-widest">Or Account Login</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <Link
            href={`/login?callbackUrl=/poll/${pollId}/analysis`}
            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-all border border-white/5 block text-center"
          >
            Log In to Pollstar Account
          </Link>
        </div>
      </div>
    );
  }

  // 2. Not Voted / Submission not found
  if (data && !data.voted) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full border border-white/5 bg-[#080d1a] rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-outfit text-lg font-bold text-white">No Submission Found</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              We were unable to locate any examination answers submitted by <strong className="text-indigo-400 font-mono">{emailParam}</strong> for this exam. You may have missed the examination window.
            </p>
          </div>
          <Link
            href="/"
            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-all border border-white/5 block"
          >
            Back to Pollstar Home
          </Link>
        </div>
      </div>
    );
  }

  const { poll, examinee, score, questions } = data.result;

  const scoreEarned = score.earned || 0.0;
  const scoreTotal = score.total || 0.0;
  const scorePercent = scoreTotal > 0 ? (scoreEarned / scoreTotal) * 100 : 0;
  const isPassed = scorePercent >= 40;

  // Proctor status parsing
  const isSuspicious = examinee.flaggedSuspicious;

  // Format timeSpent
  let timeSpentStr = 'N/A';
  if (examinee.timeSpent) {
    const mins = Math.floor(examinee.timeSpent / 60);
    const secs = examinee.timeSpent % 60;
    timeSpentStr = mins > 0 ? `${mins} mins ${secs} secs` : `${secs} secs`;
  } else {
    timeSpentStr = 'Under 1 min';
  }

  // Count incorrect / needing revision
  const incorrectQuestions = questions.filter((q: any) => q.marksAwarded < q.marks);

  return (
    <div className="min-h-screen bg-[#030712] text-white py-10 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center space-x-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Print stylesheets override for professional A4 PDF generation */}
        <style>{`
          @media print {
            body {
              background: #ffffff !important;
              color: #000000 !important;
            }
            .glass-card {
              background: #ffffff !important;
              color: #000000 !important;
              border: 1px solid #d1d5db !important;
              box-shadow: none !important;
              border-radius: 12px !important;
            }
            .text-white {
              color: #000000 !important;
            }
            .text-indigo-400, .text-emerald-400, .text-purple-400 {
              color: #312e81 !important;
            }
            .text-gray-400, .text-gray-500 {
              color: #4b5563 !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            svg {
              stroke: #000000 !important;
            }
          }
        `}</style>

        {/* Brand Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="font-outfit text-2xl font-black tracking-wider text-white uppercase bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {poll.title}
            </h1>
            <p className="text-xs text-gray-400">
              Personalized AI Graded Diagnostics & Concept Tutoring
            </p>
          </div>
          
          <div className="text-right flex flex-col items-end gap-2 print:hidden">
            <span className="text-[10px] font-extrabold uppercase font-mono tracking-widest text-indigo-400 border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 rounded-xl">
              Official Exam Report Card
            </span>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all border border-indigo-500/30"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Download PDF Report Card</span>
            </button>
          </div>
        </div>

        {/* Top Grade Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Circular Score Widget */}
          <div className="glass-card md:col-span-1 rounded-3xl border border-white/5 bg-[#080d1a] p-6 flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Your Final Grade</span>
            
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-white/5 fill-transparent"
                  strokeWidth="8"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className={`fill-transparent transition-all duration-1000 ${
                    isPassed ? 'stroke-emerald-500' : 'stroke-red-500'
                  }`}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 62}`}
                  strokeDashoffset={`${2 * Math.PI * 62 * (1 - scorePercent / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="flex flex-col items-center justify-center">
                <span className="font-mono text-3xl font-black text-white">{scoreEarned}</span>
                <span className="text-gray-500 text-[10px] font-bold font-mono">/ {scoreTotal} Points</span>
              </div>
            </div>

            <div className={`px-4 py-1.5 rounded-xl border text-[10px] font-extrabold uppercase ${
              isPassed 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {isPassed ? `PASSED (${Math.round(scorePercent)}%)` : `NEEDS REVISION (${Math.round(scorePercent)}%)`}
            </div>
          </div>

          {/* Peer Rank & Comparative Diagnostics */}
          {(() => {
            const stats = data?.result?.cohortStats || { peerRank: 1, totalSubmissions: 1, classAverage: 0.0, highestScore: 0.0 };
            return (
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Peer Rank card */}
                <div className="glass-card rounded-3xl border border-white/5 bg-[#080d1a] p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Cohort Standing</span>
                    <Award className="w-5 h-5 text-amber-400 animate-bounce" />
                  </div>
                  <div className="space-y-1 mt-4">
                    <span className="text-3xl font-mono font-black text-white">
                      Rank #{stats.peerRank}
                    </span>
                    <span className="text-[10px] text-gray-400 block font-medium">
                      Out of {stats.totalSubmissions} examinee submissions.
                    </span>
                  </div>
                </div>

                {/* Class Average comparison card */}
                <div className="glass-card rounded-3xl border border-white/5 bg-[#080d1a] p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Class Comparison</span>
                    <Clock className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-xs font-mono font-bold text-white">
                      <span>Average:</span>
                      <span className="text-indigo-400">{stats.classAverage}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${Math.min(100, (stats.classAverage / (scoreTotal || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 block font-medium">
                      Class High: <strong className="text-emerald-400">{stats.highestScore} Marks</strong>
                    </span>
                  </div>
                </div>

                {/* Testing Duration & Proctor Integrity */}
                <div className="glass-card rounded-3xl border border-white/5 bg-[#080d1a] p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Session Proctoring</span>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="space-y-1 mt-4">
                    <span className={`text-sm font-bold block ${isSuspicious ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isSuspicious ? '⚠️ Tab Switched Warning' : '✅ Full Focus Active'}
                    </span>
                    <span className="text-[10px] text-gray-400 block font-medium">
                      Time spent: {timeSpentStr}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>

        {/* PERSONALIZED AI CONCEPT TUTOR CARD */}
        {incorrectQuestions.length > 0 ? (
          <div className="glass-card rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2.5">
              <GraduationCap className="w-6 h-6 text-indigo-400 animate-pulse" />
              <h3 className="font-outfit text-base font-bold text-white flex items-center gap-1.5">
                <span>🎓 AI Concept Tutor</span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">Personalized Coaching</span>
              </h3>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed">
              Based on your response performance, we identified some areas that would benefit from conceptual revision. Spend a few minutes reviewing these core concepts to solidify your understanding:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {incorrectQuestions.map((q: any, index: number) => (
                <div key={q.id} className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 space-y-1.5">
                  <span className="text-[9px] uppercase font-bold font-mono text-indigo-400">Concept #{index + 1}: {q.questionText.slice(0, 30)}...</span>
                  <h4 className="font-bold text-white text-xs leading-snug">
                    Correct Concept:
                  </h4>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    {q.type === 'SINGLE' ? (
                      `The correct choice is option "${q.options.find((o: any) => o.id === q.correctAnswer)?.text || q.correctAnswer}". Make sure to align options on technical correctness.`
                    ) : (
                      `Check correct answer parameters: "${q.correctAnswer}". AI Suggestion: ${q.feedback}`
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-3.5 shadow-xl text-center">
            <Sparkles className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="font-outfit text-base font-bold text-white">🏆 Flawless Score! Perfect Mastery</h3>
            <p className="text-gray-300 text-xs leading-relaxed max-w-lg mx-auto">
              Sensational! You achieved full marks across every single question in this examination. You have demonstrated perfect conceptual mastery. No conceptual tutoring needed!
            </p>
          </div>
        )}

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <h3 className="font-outfit text-base font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Question-by-Question Diagnostics</span>
          </h3>

          <div className="space-y-4">
            {questions.map((q: any, idx: number) => {
              const isExpanded = !!expandedQuestions[q.id];
              const isCorrect = q.marksAwarded === q.marks;
              const isPartial = q.marksAwarded > 0 && q.marksAwarded < q.marks;

              return (
                <div 
                  key={q.id} 
                  className={`glass-card rounded-2xl border transition-all duration-300 ${
                    isExpanded ? 'border-white/10 bg-[#080d1a]' : 'border-white/5 bg-[#080d1a]/60 hover:bg-[#080d1a]'
                  }`}
                >
                  {/* Collapsible header bar */}
                  <div 
                    onClick={() => toggleExpand(q.id)}
                    className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center space-x-4">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : isPartial ? (
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                      )}
                      
                      <div className="space-y-0.5 text-left">
                        <span className="text-[10px] text-gray-500 uppercase font-extrabold font-mono">Question {idx + 1}</span>
                        <h4 className="font-bold text-white text-xs leading-snug">{q.questionText}</h4>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0">
                      <div className="text-right">
                        <span className="block text-[9px] uppercase tracking-wider font-extrabold text-gray-500 font-mono">Score Awarded</span>
                        <span className="font-mono text-xs font-bold text-white">
                          <span className={isCorrect ? 'text-emerald-400' : isPartial ? 'text-amber-400' : 'text-red-400'}>
                            {q.marksAwarded}
                          </span>
                          <span className="text-gray-500"> / {q.marks}</span>
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded comparative details */}
                  {isExpanded && (
                    <div className="border-t border-white/5 p-5 space-y-4 text-xs animate-slide-down">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 space-y-1">
                          <span className="block text-[9px] text-gray-500 uppercase tracking-widest font-extrabold">Your Response</span>
                          <p className="text-white font-medium break-words leading-relaxed">
                            {typeof q.candidateAnswer === 'object' ? JSON.stringify(q.candidateAnswer) : String(q.candidateAnswer || 'No Answer')}
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-1">
                          <span className="block text-[9px] text-indigo-400 uppercase tracking-widest font-extrabold">Reference Model Answer</span>
                          <p className="text-gray-300 font-medium break-words leading-relaxed">
                            {q.type === 'SINGLE' ? (
                              q.options.find((o: any) => o.id === q.correctAnswer)?.text || q.correctAnswer
                            ) : String(q.correctAnswer || 'N/A')}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#030712]/50 border border-white/5 space-y-2">
                        <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                          <Sparkles className="w-4 h-4" />
                          <span>AI Diagnostics Review</span>
                        </div>
                        <p className="text-gray-400 leading-relaxed text-xs italic">
                          "{q.feedback}"
                        </p>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
