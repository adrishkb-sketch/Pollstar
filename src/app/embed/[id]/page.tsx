'use client';

import { useEffect, useState, use } from 'react';
import {
  Loader2, AlertCircle, CheckCircle, Vote as VoteIcon,
  ArrowRight, ArrowLeft, Check, ExternalLink
} from 'lucide-react';

interface PageProps { params: Promise<{ id: string }> }

export default function EmbedVoterPortal({ params }: PageProps) {
  const { id: pollId } = use(params);

  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState<any>(null);
  const [errorPage, setErrorPage] = useState('');

  // Survey pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageHistory, setPageHistory] = useState<number[]>([]);

  // Answers & form
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [error, setError] = useState('');
  const [voted, setVoted] = useState(false);
  const [openEmail, setOpenEmail] = useState('');

  // Geo
  const [geoData, setGeoData] = useState<any>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState('');

  // Captcha (for non-survey)
  const [captchaNum1] = useState(Math.floor(Math.random() * 9) + 1);
  const [captchaNum2] = useState(Math.floor(Math.random() * 9) + 1);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // ── Load poll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/polls/${pollId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setErrorPage(d.error);
        else {
          setPoll(d.poll ?? d);
          if ((d.poll ?? d).pollType === 'SURVEY') setCurrentPage(0);
        }
      })
      .catch(() => setErrorPage('Failed to load poll.'))
      .finally(() => setLoading(false));
  }, [pollId]);

  // ── Geolocation ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setGeoError('Geolocation unavailable'); setGeoLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGeoData({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => { setGeoError('Location access denied.'); setGeoLoading(false); }
    );
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const isSurvey = poll?.pollType === 'SURVEY';
  const maxPage = poll ? Math.max(...poll.questions.map((q: any) => q.pageNumber || 1)) : 1;
  const isReviewPage = isSurvey && currentPage > maxPage;
  const isDemoPage = isSurvey && currentPage === 0;
  const showDemographics = isDemoPage && poll?.settings?.enableCrossTabulation;

  const pageQuestions = poll
    ? (isSurvey
        ? poll.questions.filter((q: any) => (q.pageNumber || 1) === currentPage)
        : poll.questions)
    : [];

  // ── Survey navigation ──────────────────────────────────────────────────────
  const handleSurveyNext = () => {
    setError('');
    if (isDemoPage) {
      setPageHistory(h => [...h, 0]);
      setCurrentPage(1);
      return;
    }
    // Validate current page
    for (const q of pageQuestions) {
      if (q.required && !selectedAnswers[q.id] && selectedAnswers[q.id] !== 0) {
        setError(`Please answer: "${q.text}"`);
        return;
      }
    }
    // Branching logic
    let nextPage = currentPage + 1;
    for (const q of pageQuestions) {
      if (q.type === 'SINGLE' && q.logicRules?.length) {
        const ans = selectedAnswers[q.id];
        const rule = q.logicRules.find((r: any) => r.optionId === ans);
        if (rule?.targetPage) { nextPage = rule.targetPage; break; }
      }
    }
    setPageHistory(h => [...h, currentPage]);
    setCurrentPage(nextPage);
  };

  const handleSurveyBack = () => {
    setError('');
    setPageHistory(h => {
      const next = [...h];
      const prev = next.pop() ?? 1;
      setCurrentPage(prev);
      return next;
    });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!confirmChecked) { setError('Please check the confirmation box.'); return; }

    if (!isSurvey) {
      const parsed = parseInt(captchaAnswer);
      if (isNaN(parsed) || parsed !== captchaNum1 + captchaNum2) {
        setError('Incorrect human verification answer.');
        return;
      }
    }

    if (!geoData) { setError(geoError || 'Location is required to cast your vote.'); return; }

    setVoteLoading(true);
    try {
      const body: any = {
        pollId,
        answers: selectedAnswers,
        latitude: geoData.lat,
        longitude: geoData.lng,
        source: 'EMBED',
      };
      if (poll.isOpenVoting && poll.settings?.limitOneVotePerUser) body.voterEmail = openEmail;

      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to submit vote.'); return; }
      setVoted(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setVoteLoading(false);
    }
  };

  // ── Render: Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (errorPage || !poll) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-white font-semibold">{errorPage || 'Poll not found'}</p>
        </div>
      </div>
    );
  }

  // ── Render: Voted ──────────────────────────────────────────────────────────
  if (voted) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white font-outfit">Vote Cast!</h2>
          <p className="text-gray-400 text-sm">Your response has been recorded successfully.</p>
          <a
            href={`/poll/${pollId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View full results on Pollstar
          </a>
        </div>
      </div>
    );
  }

  // ── Render: Geo loading ────────────────────────────────────────────────────
  if (geoLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Requesting location access…</p>
        </div>
      </div>
    );
  }

  // ── Render: Main embed form ────────────────────────────────────────────────
  const dotCount = isSurvey ? maxPage : 0;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-inter">
      {/* Embed header */}
      <div className="sticky top-0 z-10 bg-[#0a0f1e]/90 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
              <VoteIcon className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h1 className="text-sm font-bold text-white truncate">{poll.title}</h1>
          </div>
          <a
            href={`/poll/${pollId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-[10px] text-gray-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Full page
          </a>
        </div>

        {/* Survey progress dots */}
        {isSurvey && dotCount > 0 && (
          <div className="flex items-center gap-1.5 mt-2.5 px-1">
            {Array.from({ length: dotCount }, (_, i) => i + 1).map(pg => (
              <div
                key={pg}
                className={`h-1 rounded-full transition-all duration-300 ${
                  pg < currentPage ? 'bg-emerald-500 flex-1' :
                  pg === currentPage ? 'bg-indigo-400 flex-[2]' :
                  'bg-white/10 flex-1'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 pb-8 max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">

          {/* ── Demographics page (page 0) ───────────────────────────────── */}
          {isDemoPage && showDemographics && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                Please share a few details before starting. This helps us provide better insights.
              </p>
              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Age Group</label>
                <select
                  value={selectedAnswers['__demo_age'] ?? ''}
                  onChange={e => setSelectedAnswers(s => ({ ...s, __demo_age: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                >
                  <option value="">Select age group</option>
                  {['Under 18','18–24','25–34','35–44','45–54','55–64','65+'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              {/* Region */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Region</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai, Maharashtra"
                  value={selectedAnswers['__demo_region'] ?? ''}
                  onChange={e => setSelectedAnswers(s => ({ ...s, __demo_region: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Male','Female','Non-binary','Prefer not to say'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedAnswers(s => ({ ...s, __demo_gender: g }))}
                      className={`px-2 py-2 rounded-xl border text-xs font-medium transition-all ${
                        selectedAnswers['__demo_gender'] === g
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                          : 'border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Standard questions ───────────────────────────────────────── */}
          {!isDemoPage && !isReviewPage && pageQuestions.map((q: any) => (
            <div key={q.id} className="space-y-2">
              <label className="block text-sm font-semibold text-white leading-snug">
                {q.text}
                {q.required && <span className="text-red-400 ml-1">*</span>}
              </label>

              {/* SINGLE / MULTIPLE choice */}
              {(q.type === 'SINGLE' || q.type === 'MULTIPLE') && (
                <div className="space-y-1.5">
                  {q.options.map((opt: any) => {
                    const isSelected = q.type === 'SINGLE'
                      ? selectedAnswers[q.id] === opt.id
                      : Array.isArray(selectedAnswers[q.id]) && selectedAnswers[q.id].includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (q.type === 'SINGLE') {
                            setSelectedAnswers(s => ({ ...s, [q.id]: opt.id }));
                          } else {
                            setSelectedAnswers(s => {
                              const cur: string[] = Array.isArray(s[q.id]) ? s[q.id] : [];
                              return { ...s, [q.id]: cur.includes(opt.id) ? cur.filter((x: string) => x !== opt.id) : [...cur, opt.id] };
                            });
                          }
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                            : 'bg-white/3 border-white/8 text-gray-300 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'bg-indigo-500 border-indigo-400' : 'border-white/20'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TEXT */}
              {q.type === 'TEXT' && (
                <textarea
                  rows={3}
                  placeholder="Type your answer…"
                  value={selectedAnswers[q.id] ?? ''}
                  onChange={e => setSelectedAnswers(s => ({ ...s, [q.id]: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none transition-all"
                />
              )}

              {/* RATING */}
              {q.type === 'RATING' && (
                <div className="flex gap-2">
                  {Array.from({ length: q.ratingMax ?? 5 }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSelectedAnswers(s => ({ ...s, [q.id]: n }))}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                        selectedAnswers[q.id] === n
                          ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                          : 'border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* ── Review page ──────────────────────────────────────────────── */}
          {isReviewPage && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">Review your responses before submitting.</p>
              {poll.questions.map((q: any) => {
                const ans = selectedAnswers[q.id];
                if (!ans && ans !== 0) return null;
                let displayAns = '';
                if (Array.isArray(ans)) {
                  displayAns = ans.map((id: string) => q.options?.find((o: any) => o.id === id)?.text ?? id).join(', ');
                } else if (typeof ans === 'string' && q.options?.length) {
                  displayAns = q.options.find((o: any) => o.id === ans)?.text ?? ans;
                } else {
                  displayAns = String(ans);
                }
                return (
                  <div key={q.id} className="p-3 rounded-xl bg-white/4 border border-white/8">
                    <p className="text-[11px] text-gray-500 font-medium mb-1">{q.text}</p>
                    <p className="text-sm text-white font-semibold">{displayAns}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Email (open voting) ───────────────────────────────────────── */}
          {poll.isOpenVoting && poll.settings?.limitOneVotePerUser && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Your Email</label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={openEmail}
                onChange={e => setOpenEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          )}

          {/* ── CAPTCHA (non-survey final submit) ────────────────────────── */}
          {(!isSurvey || isReviewPage) && !isSurvey && (
            <div className="p-3 rounded-xl bg-white/4 border border-white/8 space-y-2">
              <label className="block text-xs font-semibold text-gray-300">
                Human Check: What is {captchaNum1} + {captchaNum2}?
              </label>
              <input
                type="number"
                value={captchaAnswer}
                onChange={e => setCaptchaAnswer(e.target.value)}
                placeholder="Answer"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          )}

          {/* ── Error ────────────────────────────────────────────────────── */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Navigation / Submit ───────────────────────────────────────── */}
          {isSurvey ? (
            <div className="space-y-3 pt-2">
              {isReviewPage ? (
                <>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmChecked}
                      onChange={e => setConfirmChecked(e.target.checked)}
                      className="mt-0.5 accent-indigo-500"
                    />
                    <span className="text-xs text-gray-300 leading-relaxed">
                      I confirm my responses are accurate and truthful.
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSurveyBack}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={voteLoading || !confirmChecked}
                      className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {voteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><VoteIcon className="w-4 h-4" />Submit</>}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  {pageHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSurveyBack}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSurveyNext}
                    className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {currentPage > maxPage - 1 ? 'Review' : 'Next'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={e => setConfirmChecked(e.target.checked)}
                  className="mt-0.5 accent-indigo-500"
                />
                <span className="text-xs text-gray-300 leading-relaxed">
                  I confirm my vote is intentional and accurate.
                </span>
              </label>
              <button
                type="submit"
                disabled={voteLoading || !confirmChecked || !geoData}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {voteLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><VoteIcon className="w-4 h-4" /> Cast Vote</>
                }
              </button>
            </div>
          )}
        </form>

        {/* Powered by */}
        <p className="text-center text-[10px] text-gray-600 mt-6">
          Powered by{' '}
          <a href="/" target="_blank" className="text-indigo-400 hover:underline">Pollstar</a>
        </p>
      </div>
    </div>
  );
}
