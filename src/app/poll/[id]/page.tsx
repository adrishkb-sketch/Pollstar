'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { 
  Vote as VoteIcon, Loader2, AlertCircle, CheckCircle, 
  HelpCircle, ShieldAlert, Award, ArrowRight, RefreshCw, Check
} from 'lucide-react';
import PollChart from '@/components/PollChart';
import PollMap from '@/components/PollMap';
import confetti from 'canvas-confetti';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VoterPortal({ params }: PageProps) {
  const { id: pollId } = use(params);

  // Core loading & schema states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [poll, setPoll] = useState<any>(null);
  
  // Closed voter entrance gate states
  const [verifiedVoter, setVerifiedVoter] = useState(false);
  const [voterToken, setVoterToken] = useState('');
  const [voterEmail, setVoterEmail] = useState('');
  const [voterIdentifier, setVoterIdentifier] = useState('');
  const [confirmer1, setConfirmer1] = useState('');
  const [confirmer2, setConfirmer2] = useState('');

  // Closed voter lookup states
  const [lookupPassed, setLookupPassed] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [identifierLabel, setIdentifierLabel] = useState('Roll Number');
  const [confirmer1Label, setConfirmer1Label] = useState('Student Name');
  const [confirmer2Label, setConfirmer2Label] = useState('Parent Name');
  
  // OTP Verification modal states
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Open voter email limit state
  const [openEmail, setOpenEmail] = useState('');

  // Voting answers selection states
  // answers map: { [questionId]: optionId | optionId[] }
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [rankedSelections, setRankedSelections] = useState<string[]>([]); // active array of ranks
  const [confirmVoteChecked, setConfirmVoteChecked] = useState(false);
  
  // Captcha states
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // Final submission state
  const [votedSuccessfully, setVotedSuccessfully] = useState(false);
  const [flaggedSuspicious, setFlaggedSuspicious] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);

  // Dynamic real-time charts states
  const [liveStats, setLiveStats] = useState<Record<string, any>>({});
  const [liveTotalVotes, setLiveTotalVotes] = useState(0);
  const [liveVoterLocations, setLiveVoterLocations] = useState<any[]>([]);

  // 1. Fetch Poll Metadata on Mount
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch poll details');
        }

        setPoll(data.poll);
        setLiveStats(data.poll.stats || {});
        setLiveTotalVotes(data.poll.totalVotes || 0);

        if (data.poll.settings) {
          setIdentifierLabel(data.poll.settings.identifierLabel || 'Roll Number');
          setConfirmer1Label(data.poll.settings.confirmer1Label || 'Student Name');
          setConfirmer2Label(data.poll.settings.confirmer2Label || 'Parent Name');
        }
        
        // Setup initial locations list if present
        if (data.poll.votes) {
          const locs = data.poll.votes.map((v: any) => ({
            ipAddress: v.ipAddress,
            isp: v.isp,
            flaggedSuspicious: v.flaggedSuspicious,
            // In dynamic view, locations will load fallback coords or real ones
            lat: 37.751, // default fallbacks matching lib/geo.ts
            lon: -97.822,
          }));
          setLiveVoterLocations(locs);
        }

        // Initialize captcha math values
        setCaptchaNum1(Math.floor(Math.random() * 9) + 2);
        setCaptchaNum2(Math.floor(Math.random() * 9) + 2);
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
    if (!poll || !poll.isResultPublic) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}`);
        const data = await res.json();
        if (res.ok && data.poll) {
          setLiveStats(data.poll.stats || {});
          setLiveTotalVotes(data.poll.totalVotes || 0);
          setPoll((prev: any) => (prev ? { ...prev, status: data.poll.status } : data.poll));

          if (data.poll.votes) {
            const locs = data.poll.votes.map((v: any) => ({
              ipAddress: v.ipAddress,
              isp: v.isp,
              flaggedSuspicious: v.flaggedSuspicious,
              lat: 37.751,
              lon: -97.822,
            }));
            setLiveVoterLocations(locs);
          }
        }
      } catch (err) {
        console.error('Real-time sync error:', err);
      }
    }, 4000); // Refresh every 4 seconds

    return () => clearInterval(interval);
  }, [poll, pollId]);

  // ────────────────────────────────────────────────────────
  // CLOSED VOTER SECURE VERIFICATION PORTAL
  // ────────────────────────────────────────────────────────

  // Step 0: Lookup unique identifier in database
  const handleLookupIdentifier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLookupLoading(true);

    try {
      const res = await fetch(`/api/polls/${pollId}/verify-voter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'LOOKUP_IDENTIFIER',
          identifier: voterIdentifier,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Identifier lookup failed');
      }

      setConfirmer1(data.confirmer1Value);
      setConfirmer2(data.confirmer2Value);
      setVoterEmail(data.emailValue);
      
      // Update custom labels returned from backend if any
      if (data.labels) {
        setIdentifierLabel(data.labels.identifierLabel);
        setConfirmer1Label(data.labels.confirmer1Label);
        setConfirmer2Label(data.labels.confirmer2Label);
      }

      setLookupPassed(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  // Step 1: Submit allowed credentials to request email verification code
  const handleVoterRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!voterIdentifier || !confirmer1 || !voterEmail) {
      setError('Compulsory verification credentials are empty.');
      return;
    }

    try {
      const res = await fetch(`/api/polls/${pollId}/verify-voter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'REQUEST_OTP',
          identifier: voterIdentifier,
          confirmer1,
          confirmer2,
          email: voterEmail,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm credentials');
      }

      setShowOtpPopup(true);
      setOtpError('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Step 2: Confirm OTP to get secure voter session Token
  const handleVerifyVoterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    try {
      const res = await fetch(`/api/polls/${pollId}/verify-voter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'VERIFY_OTP',
          email: voterEmail,
          otp: otpCode,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      setVoterToken(data.voterToken);
      setVerifiedVoter(true);
      setShowOtpPopup(false);
      
      // Load standard captcha refresh
      setCaptchaNum1(Math.floor(Math.random() * 8) + 2);
      setCaptchaNum2(Math.floor(Math.random() * 8) + 2);
      setCaptchaAnswer('');
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // CLICK-TO-RANK PRIORITY SELECTOR
  // ────────────────────────────────────────────────────────
  
  const handleRankClick = (optionId: string, questionId: string) => {
    let updated;
    if (rankedSelections.includes(optionId)) {
      // Remove rank
      updated = rankedSelections.filter((id) => id !== optionId);
    } else {
      // Append rank
      updated = [...rankedSelections, optionId];
    }
    
    setRankedSelections(updated);
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: updated,
    });
  };

  const handleResetRankings = (questionId: string) => {
    setRankedSelections([]);
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: [],
    });
  };

  // ────────────────────────────────────────────────────────
  // VOTE PLACEMENT ROUTINE
  // ────────────────────────────────────────────────────────

  const handleCastVote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCaptchaError('');
    setVoteLoading(true);

    // 1. Verify Human Math CAPTCHA
    const parsedAnswer = parseInt(captchaAnswer);
    if (isNaN(parsedAnswer) || parsedAnswer !== (captchaNum1 + captchaNum2)) {
      setCaptchaError('Human validation calculation is incorrect. Please check and try again.');
      setVoteLoading(false);
      return;
    }

    // 2. Question completeness check
    const activeQuestion = poll.questions[0]; // singular questions block
    const ans = selectedAnswers[activeQuestion.id];

    if (!ans || (activeQuestion.type === 'RANKED' && ans.length !== activeQuestion.options.length)) {
      setError(
        activeQuestion.type === 'RANKED'
          ? 'You must rank all candidate options in order of priority.'
          : 'Please select an option before submitting.'
      );
      setVoteLoading(false);
      return;
    }

    // 3. Confirm checkbox
    if (!confirmVoteChecked) {
      setError('Please check the confirmation box to submit your vote.');
      setVoteLoading(false);
      return;
    }

    // 4. Query High-Accuracy Browser Geolocation
    let userCoords: { latitude: number; longitude: number } | null = null;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        userCoords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 4000 }
          );
        });
      } catch (err) {}
    }

    try {
      const detectedDevice = /Mobi|Android|iPhone|iPad/i.test(navigator?.userAgent || '') ? 'Mobile' : 'Desktop';
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: selectedAnswers,
          voterToken: poll.isOpenVoting ? undefined : voterToken,
          email: poll.isOpenVoting && poll.settings?.limitOneVotePerUser ? openEmail : undefined,
          latitude: userCoords?.latitude || null,
          longitude: userCoords?.longitude || null,
          device: detectedDevice,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit vote');
      }

      setVotedSuccessfully(true);
      setFlaggedSuspicious(data.flaggedSuspicious || false);

      // Add their geoposition marker if present
      if (data.geo && data.geo.lat !== 0) {
        setLiveVoterLocations((prev) => [
          ...prev,
          {
            ipAddress: data.geo.ip,
            isp: data.geo.isp,
            lat: data.geo.lat,
            lon: data.geo.lon,
            city: data.geo.city,
            country: data.geo.country,
            flaggedSuspicious: data.flaggedSuspicious || false,
          },
        ]);
      }

      // Fire canvas confetti celebration
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setVoteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-[#030712]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="text-gray-400 text-sm mt-4 font-semibold">Opening secure poll...</span>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center px-6 text-center">
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="font-outfit text-xl font-bold text-white mb-2">Failed to Access Poll</h3>
        <p className="text-gray-400 text-sm max-w-md leading-relaxed">{error}</p>
        <Link href="/" className="mt-6 px-5 py-2.5 rounded-xl font-semibold gradient-btn text-white text-xs">
          Return to Home
        </Link>
      </div>
    );
  }

  const activeQuestion = poll.questions[0];

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 space-y-10 relative">
      
      {/* Dynamic Background */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Icon */}
      <div className="flex items-center space-x-2.5">
        <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/20">
          <VoteIcon className="w-5 h-5 text-white" />
        </div>
        <span className="font-outfit text-lg font-bold tracking-tight text-white">
          Poll<span className="text-indigo-400">star</span> Secure
        </span>
      </div>

      {/* Poll Details Header Card */}
      <div className="glass-card rounded-3xl p-8 border border-white/5 flex flex-col md:flex-row gap-8 items-start md:items-center relative overflow-hidden">
        {poll.posterUrl && (
          <div className="w-full md:w-32 h-32 rounded-2xl border border-white/10 overflow-hidden shrink-0 bg-white/5 shadow-inner">
            <img src={poll.posterUrl} alt="Poll Poster" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="space-y-3">
          <h1 className="font-outfit text-3xl font-extrabold text-white leading-tight">
            {poll.title}
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
            {poll.description}
          </p>
        </div>
      </div>

      {/* Strict Anonymity big notice */}
      {poll.isAnonymous && (
        <div className="glass-card rounded-2xl p-6 border-indigo-500/25 bg-indigo-500/5 flex items-start space-x-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
            <VoteIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-outfit font-extrabold uppercase text-xs tracking-widest text-indigo-300">
              Strictly Anonymous Election
            </h4>
            <p className="text-white text-sm font-extrabold mt-1 leading-relaxed">
              YOUR VOTE WON'T BE VISIBLE TO ANYONE, NOT EVEN THE CREATOR OF THE VOTE. WHOM YOU VOTED FOR IS TOTALLY ANONYMOUS.
            </p>
          </div>
        </div>
      )}

      {/* Closed Voter Entrance gate */}
      {!poll.isOpenVoting && !verifiedVoter && !votedSuccessfully && (
        <div className="glass-card rounded-3xl p-8 border border-white/5 shadow-2xl space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-outfit text-xl font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              <span>Identity Verification Gateway</span>
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              {!lookupPassed
                ? `Please enter your registered ${identifierLabel} below to verify identity.`
                : `Double-check your credentials to make sure you are at the right place.`
              }
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!lookupPassed ? (
            <form onSubmit={handleLookupIdentifier} className="space-y-6">
              <div>
                <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                  {identifierLabel}
                </label>
                <input
                  type="text"
                  required
                  value={voterIdentifier}
                  onChange={(e) => setVoterIdentifier(e.target.value)}
                  placeholder={`Enter your unique ${identifierLabel.toLowerCase()}`}
                  className="w-full glass-input text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={lookupLoading}
                className="w-full py-3.5 rounded-xl font-bold gradient-btn text-white transition-all text-sm flex items-center justify-center space-x-2"
              >
                {lookupLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify Identifier</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVoterRequestOtp} className="space-y-6">
              {/* Profile Confirmation Card */}
              <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Profile Retrieved</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLookupPassed(false);
                      setVoterIdentifier('');
                      setConfirmer1('');
                      setConfirmer2('');
                      setVoterEmail('');
                    }}
                    className="text-[10px] text-gray-500 hover:text-red-400 font-bold transition-all"
                  >
                    Change ID
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 block mb-0.5">{identifierLabel}</span>
                    <span className="text-white font-mono font-bold text-sm">{voterIdentifier}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">{confirmer1Label}</span>
                    <span className="text-white font-bold">{confirmer1}</span>
                  </div>
                  {confirmer2 && (
                    <div>
                      <span className="text-gray-500 block mb-0.5">{confirmer2Label}</span>
                      <span className="text-white font-bold">{confirmer2}</span>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <span className="text-gray-500 block mb-0.5">Registered Email (OTP Destination)</span>
                    <span className="text-indigo-300 font-semibold">{voterEmail}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold gradient-btn text-white transition-all text-sm flex items-center justify-center space-x-2"
              >
                <span>Confirm Profile & Send OTP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Closed Voter OTP verification popup */}
      {showOtpPopup && (
        <div className="fixed inset-0 bg-[#030712]/80 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="glass-card rounded-3xl p-8 border border-white/10 shadow-2xl max-w-md w-full text-center space-y-6">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 w-14 h-14 flex items-center justify-center mx-auto">
              <VoteIcon className="w-6 h-6" />
            </div>
            
            <div>
              <h3 className="font-outfit text-xl font-bold text-white">Enter Email OTP</h3>
              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                Confirm your identity by entering the 6-digit OTP code dispatched to <br/>
                <span className="text-indigo-300 font-semibold">{voterEmail}</span>.
              </p>
            </div>

            {otpError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyVoterOtp} className="space-y-6">
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-[12px] pl-3 glass-input text-2xl font-bold font-mono placeholder-gray-800"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOtpPopup(false)}
                  className="flex-1 py-3 rounded-xl text-xs font-bold border border-white/5 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpLoading || otpCode.length !== 6}
                  className="flex-1 py-3 rounded-xl text-xs font-bold gradient-btn text-white flex items-center justify-center"
                >
                  {otpLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirm OTP</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Ballot Casting Form */}
      {(poll.isOpenVoting || verifiedVoter) && !votedSuccessfully && (
        <div className="glass-card rounded-3xl p-8 border border-white/5 shadow-2xl space-y-8 animate-fade-in-up">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-outfit text-xl font-bold text-white flex items-center space-x-2">
              <VoteIcon className="w-5 h-5 text-indigo-400" />
              <span>Official Voting Ballot</span>
            </h3>
            <p className="text-gray-400 text-xs mt-1">Please review candidate selections and cast your secure vote below.</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCastVote} className="space-y-8">
            
            {/* Open voting Email check */}
            {poll.isOpenVoting && poll.settings?.limitOneVotePerUser && (
              <div>
                <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                  Confirm Your Email Address
                </label>
                <input
                  type="email"
                  required
                  value={openEmail}
                  onChange={(e) => setOpenEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full glass-input text-sm"
                />
                <span className="text-[10px] text-gray-500 mt-2 block">
                  Email verification is compulsory to enforce unique voting limits.
                </span>
              </div>
            )}

            {/* Questions block */}
            <div className="space-y-6">
              <div className="p-4 bg-white/2 rounded-2xl border border-white/5">
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Question</span>
                <h4 className="text-white text-base font-bold mt-1 leading-snug">{activeQuestion.questionText}</h4>
              </div>

              {/* SINGLE CHOICE LAYOUT */}
              {activeQuestion.type === 'SINGLE' && (
                <div className="grid grid-cols-1 gap-3">
                  {activeQuestion.options.map((opt: any) => {
                    const isSelected = selectedAnswers[activeQuestion.id] === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedAnswers({ [activeQuestion.id]: opt.id })}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-md'
                            : 'border-white/5 hover:border-white/10 hover:bg-white/3 text-gray-300'
                        }`}
                      >
                        <span className="text-sm font-semibold">{opt.text}</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-white/20'
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* RANKED CHOICE (Borda Count) CLICK-TO-RANK PRIORITY LAYOUT */}
              {activeQuestion.type === 'RANKED' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white/2 p-4 rounded-xl border border-white/5">
                    <div className="space-y-0.5">
                      <span className="text-gray-300 text-xs font-bold">Rank candidates in order of priority:</span>
                      <p className="text-gray-500 text-[10px]">Click choices to assign weights (① = highest priority).</p>
                    </div>
                    {rankedSelections.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleResetRankings(activeQuestion.id)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-all flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {activeQuestion.options.map((opt: any) => {
                      const rankIndex = rankedSelections.indexOf(opt.id);
                      const isRanked = rankIndex !== -1;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleRankClick(opt.id, activeQuestion.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isRanked
                              ? 'border-purple-500 bg-purple-500/10 text-white shadow-md'
                              : 'border-white/5 hover:border-white/10 hover:bg-white/3 text-gray-300'
                          }`}
                        >
                          <span className="text-sm font-semibold">{opt.text}</span>
                          {isRanked ? (
                            <div className="w-6 h-6 rounded-lg bg-purple-500 text-white text-xs font-extrabold flex items-center justify-center shadow-md">
                              {rankIndex + 1}
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-lg border border-white/20 text-gray-500 text-xs font-bold flex items-center justify-center">
                              -
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Human Math CAPTCHA Protection */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
              <div className="flex items-start space-x-3">
                <HelpCircle className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-outfit text-xs font-bold text-gray-300 uppercase tracking-wide">
                    Human Verification Required
                  </h4>
                  <p className="text-gray-500 text-[10px] mt-0.5">Solve this quick calculation to confirm you are not a bot.</p>
                </div>
              </div>

              {captchaError && (
                <div className="text-xs text-red-400 font-semibold">{captchaError}</div>
              )}

              <div className="flex items-center space-x-4">
                <span className="font-outfit text-base font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
                  {captchaNum1} + {captchaNum2} = ?
                </span>
                <input
                  type="text"
                  required
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Answer"
                  className="w-24 glass-input text-sm py-1.5 text-center font-bold"
                />
              </div>
            </div>

            {/* Confirm Checkbox */}
            <div
              onClick={() => setConfirmVoteChecked(!confirmVoteChecked)}
              className="flex items-start space-x-3 cursor-pointer select-none"
            >
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                confirmVoteChecked ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
              }`}>
                {confirmVoteChecked && <Check className="w-3.5 h-3.5" />}
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                I explicitly confirm that my selections are final. I understand that <strong className="text-gray-200">my vote cannot be changed or resubmitted</strong> once cast.
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={voteLoading}
              className="w-full py-4 rounded-xl font-bold gradient-btn text-white text-base shadow-xl flex items-center justify-center"
            >
              {voteLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <span>Submit Secure Vote</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* VOTE SUBMITTED SUCCESS VIEW */}
      {votedSuccessfully && (
        <div className="glass-card rounded-3xl p-10 border border-white/5 shadow-2xl space-y-6 text-center animate-fade-in-up">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="font-outfit text-2xl font-bold text-white">Vote Submitted Successfully!</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
              Thank you for participating. Your vote has been cryptographically recorded on our backend ledger.
            </p>
            {flaggedSuspicious && (
              <span className="inline-block mt-2 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg uppercase tracking-wider animate-pulse">
                ⚠️ Cast flagged for Administrator inspection
              </span>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Real-Time Results displaying below */}
      {((votedSuccessfully && poll.isResultPublic) || (!votedSuccessfully && poll.isResultPublic && poll.isOpenVoting)) && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h3 className="font-outfit text-xl font-bold text-white">Live Insights Report</h3>
          </div>

          {/* Aggregate counts */}
          <div className="glass-card rounded-2xl p-6 flex justify-between items-center">
            <div>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1">Total Votes Logged</span>
              <span className="font-outfit text-3xl font-extrabold text-white">{liveTotalVotes}</span>
            </div>
            <div className="p-3.5 bg-indigo-500/10 rounded-xl text-indigo-400">
              <VoteIcon className="w-6 h-6" />
            </div>
          </div>

          {/* Recharts graphs */}
          <div className="glass-card rounded-3xl p-8 border border-white/5">
            <PollChart
              questionId={activeQuestion.id}
              questionText={activeQuestion.questionText}
              type={activeQuestion.type}
              stats={liveStats[activeQuestion.id] || {}}
            />
          </div>

          {/* Leaflet map */}
          <div className="space-y-3">
            <h4 className="font-outfit text-sm font-bold text-gray-400 uppercase tracking-widest">Global Device Geolocations</h4>
            <p className="text-gray-500 text-xs">A real-time distribution map plotting coordinates resolved from voter IP handshakes.</p>
            <PollMap locations={liveVoterLocations} />
          </div>
        </div>
      )}

      {/* If Results are kept completely private */}
      {votedSuccessfully && !poll.isResultPublic && (
        <div className="p-5 rounded-2xl bg-white/2 border border-white/5 text-center text-gray-500 text-xs">
          Live statistics and maps are set to private by the poll administrator.
        </div>
      )}
    </div>
  );
}
