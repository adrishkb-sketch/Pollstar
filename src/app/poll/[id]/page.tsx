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
  const [showIntro, setShowIntro] = useState(true);
  const [introStep, setIntroStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [verifiedVoter, setVerifiedVoter] = useState(false);
  const [voterToken, setVoterToken] = useState('');
  const [voterEmail, setVoterEmail] = useState('');
  const [voterId, setVoterId] = useState('');
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
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpSendLoading, setOtpSendLoading] = useState(false);
  const [otpSentOnce, setOtpSentOnce] = useState(false);
  const [bypassStatus, setBypassStatus] = useState<'IDLE' | 'REQUESTING' | 'WAITING' | 'GRANTED'>('IDLE');

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
  const [bypassPopup, setBypassPopup] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  // Confidence slider state: { [questionId]: number (1-100) }
  const [confidenceValues, setConfidenceValues] = useState<Record<string, number>>({});

  // Chat Sidebar states
  const [chatMessages, setChatMessages] = useState<any[]>([
    { id: 1, author: 'Alice', text: 'I think Option 1 is clearly the superior choice here!', sentiment: 'POSITIVE', time: '2 mins ago' },
    { id: 2, author: 'Bob', text: 'Not sure, Option 2 has a lot of good points too.', sentiment: 'NEUTRAL', time: '1 min ago' },
    { id: 3, author: 'Charlie', text: 'Option 3 is just a terrible option honestly...', sentiment: 'NEGATIVE', time: 'Just now' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [chatName, setChatName] = useState('Guest Voter');

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage.toLowerCase();
    const positiveWords = ['love', 'like', 'great', 'best', 'good', 'win', 'awesome', 'cool', 'support', 'yes', 'agree', 'better'];
    const negativeWords = ['hate', 'bad', 'worst', 'lose', 'terrible', 'dislike', 'no', 'poor', 'waste', 'disagree', 'worse'];
    
    let sentiment = 'NEUTRAL';
    let posCount = 0;
    let negCount = 0;
    positiveWords.forEach(w => { if (text.includes(w)) posCount++; });
    negativeWords.forEach(w => { if (text.includes(w)) negCount++; });

    if (posCount > negCount) sentiment = 'POSITIVE';
    else if (negCount > posCount) sentiment = 'NEGATIVE';

    const msg = {
      id: Date.now(),
      author: chatName.trim() || 'Voter',
      text: newMessage,
      sentiment,
      time: 'Just now'
    };

    setChatMessages([...chatMessages, msg]);
    setNewMessage('');
  };

  // Dynamic real-time charts states
  const [liveStats, setLiveStats] = useState<Record<string, any>>({});
  const [liveTotalVotes, setLiveTotalVotes] = useState(0);
  const [liveVoterLocations, setLiveVoterLocations] = useState<any[]>([]);

  // Tournament Knockout states
  const [knockoutRounds, setKnockoutRounds] = useState<any[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [knockoutWaiting, setKnockoutWaiting] = useState<any[]>([]);
  const [totalKnockoutRounds, setTotalKnockoutRounds] = useState(0);

  const initializeKnockout = (options: any[]) => {
    let N = options.length;
    if (N < 2) return;
    
    // Calculate total rounds dynamically based on the play-in logic
    let tempN = N;
    let roundsCount = 0;
    while (tempN > 1) {
      let P = 2;
      while (P * 2 <= tempN) {
        P *= 2;
      }
      let matches = tempN - P;
      if (matches === 0) {
        roundsCount += Math.log2(tempN);
        break;
      } else {
        roundsCount += 1;
        tempN = matches + (tempN - matches * 2);
      }
    }
    setTotalKnockoutRounds(roundsCount);

    // Find largest power of 2 <= N
    let P = 2;
    while (P * 2 <= N) {
      P *= 2;
    }
    
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    
    const numPlayInMatches = N - P;
    const numPlayInCandidates = numPlayInMatches * 2;
    
    const playInCandidates = shuffled.slice(0, numPlayInCandidates);
    const waitingCandidates = shuffled.slice(numPlayInCandidates);
    
    const firstRoundMatches: any[] = [];
    
    if (numPlayInMatches === 0) {
      // Perfect power of 2: no play-ins needed
      for (let i = 0; i < shuffled.length; i += 2) {
        firstRoundMatches.push({
          c1: shuffled[i],
          c2: shuffled[i + 1],
          winner: null
        });
      }
    } else {
      // Generate play-in matches for the first round
      for (let i = 0; i < playInCandidates.length; i += 2) {
        firstRoundMatches.push({
          c1: playInCandidates[i],
          c2: playInCandidates[i + 1],
          winner: null
        });
      }
    }
    
    setKnockoutRounds([firstRoundMatches]);
    setCurrentRoundIndex(0);
    setKnockoutWaiting(numPlayInMatches === 0 ? [] : waitingCandidates);
  };

  const handleKnockoutSelect = (matchIndex: number, winnerId: string, questionId: string) => {
    const updatedRounds = [...knockoutRounds];
    const currentRound = [...updatedRounds[currentRoundIndex]];
    
    currentRound[matchIndex] = {
      ...currentRound[matchIndex],
      winner: winnerId
    };
    updatedRounds[currentRoundIndex] = currentRound;
    setKnockoutRounds(updatedRounds);

    const allDecided = currentRound.every((m) => m.winner !== null);
    if (!allDecided) return;

    const winners = currentRound.map(m => [m.c1, m.c2].find(c => c.id === m.winner));
    
    // Retrieve waiting candidates for the first play-in transition
    const nextPool = currentRoundIndex === 0 ? [...winners, ...knockoutWaiting] : winners;

    if (nextPool.length === 1) {
      const ultimateWinner = nextPool[0].id;
      setSelectedAnswers((prev) => ({
        ...prev,
        [questionId]: {
          rounds: updatedRounds.map(r => r.map((m: any) => ({
            c1: { id: m.c1.id, text: m.c1.text },
            c2: { id: m.c2.id, text: m.c2.text },
            winner: m.winner
          }))),
          winner: ultimateWinner
        }
      }));
      return;
    }

    const nextRoundMatches: any[] = [];
    for (let i = 0; i < nextPool.length; i += 2) {
      nextRoundMatches.push({
        c1: nextPool[i],
        c2: nextPool[i + 1],
        winner: null
      });
    }

    setKnockoutRounds([...updatedRounds, nextRoundMatches]);
    setCurrentRoundIndex(currentRoundIndex + 1);
  };

  const handleResetKnockout = (questionId: string, options: any[]) => {
    setKnockoutWaiting([]);
    initializeKnockout(options);
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const getSessionDuration = () => {
    if (!poll || !poll.questions || !poll.questions[0]) return 90;
    const type = poll.questions[0].type;
    if (type === 'KNOCKOUT') return 300;
    if (type === 'RANKED') return 180;
    return 90;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const isVotingActive = (!loading && poll) && (
      (!poll.isOpenVoting && verifiedVoter && !votedSuccessfully) || 
      (poll.isOpenVoting && !showIntro && !votedSuccessfully)
    );

    if (isVotingActive) {
      const duration = getSessionDuration();
      setTimeLeft(duration);
      setTimerActive(true);
    } else {
      setTimerActive(false);
      setTimeLeft(null);
    }
  }, [verifiedVoter, votedSuccessfully, poll, showIntro, loading]);

  useEffect(() => {
    if (!timerActive || timeLeft === null) return;

    if (timeLeft <= 0 || (poll && poll.endTime && Date.now() > new Date(poll.endTime).getTime())) {
      setVerifiedVoter(false);
      setVoterToken('');
      setLookupPassed(false);
      setVoterIdentifier('');
      setConfirmer1('');
      setConfirmer2('');
      setVoterEmail('');
      setTimerActive(false);
      setTimeLeft(null);
      if (poll) setPoll({ ...poll, status: 'ENDED' });
      alert("⏱️ Session Expired! You did not submit your ballot in time or the poll has officially ended.");
      return;
    }

    const interval = setInterval(() => {
      if (poll && poll.endTime && Date.now() > new Date(poll.endTime).getTime()) {
        setTimeLeft(0);
      } else {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // 1. Fetch Poll Metadata on Mount
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch poll details');
        }

        const fetchedPoll = data.poll;

        // Client-side deadline enforcement: if endTime has passed, treat as ENDED
        if (fetchedPoll.status === 'ACTIVE' && fetchedPoll.endTime && Date.now() > new Date(fetchedPoll.endTime).getTime()) {
          fetchedPoll.status = 'ENDED';
        }

        setPoll(fetchedPoll);
        setLiveStats(fetchedPoll.stats || {});
        setLiveTotalVotes(fetchedPoll.totalVotes || 0);

        const activeQ = data.poll.questions?.[0];
        if (activeQ && activeQ.type === 'KNOCKOUT') {
          initializeKnockout(activeQ.options);
        }

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
            lat: v.latitude !== null && v.latitude !== undefined ? Number(v.latitude) : 22.5726,
            lon: v.longitude !== null && v.longitude !== undefined ? Number(v.longitude) : 88.3639,
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

  // OTP Verification countdown decrement effect
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpCooldown]);
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
          setPoll((prev: any) => (prev ? { ...prev, status: data.poll.status, votes: data.poll.votes || prev.votes } : data.poll));

          if (data.poll.votes) {
            const locs = data.poll.votes.map((v: any) => ({
              ipAddress: v.ipAddress,
              isp: v.isp,
              flaggedSuspicious: v.flaggedSuspicious,
              lat: v.latitude !== null && v.latitude !== undefined ? Number(v.latitude) : 22.5726,
              lon: v.longitude !== null && v.longitude !== undefined ? Number(v.longitude) : 88.3639,
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
      setVoterId(data.voterId || '');
      
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
    if (e) e.preventDefault();
    setError('');

    if (!voterIdentifier || !confirmer1 || !voterEmail) {
      setError('Compulsory verification credentials are empty.');
      return;
    }

    if (otpCooldown > 0) {
      setOtpSendLoading(true);
      try {
        const res = await fetch(`/api/polls/${pollId}/verify-voter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'CHECK_BYPASS', email: voterEmail, voterId }),
        });
        const data = await res.json();

        if (data.success && data.granted && data.voterToken) {
          setBypassPopup({ visible: true, message: '30 second bypass is enabled for you. Redirecting directly to ballot...' });
          setTimeout(() => {
            setVoterToken(data.voterToken);
            setVerifiedVoter(true);
            if (data.hasVotedAlready) {
              setVotedSuccessfully(true);
            }
            setShowOtpPopup(false);
            setBypassPopup({ visible: false, message: '' });
            setCaptchaNum1(Math.floor(Math.random() * 8) + 2);
            setCaptchaNum2(Math.floor(Math.random() * 8) + 2);
            setCaptchaAnswer('');
          }, 2500);
          return;
        }
      } catch (err) {
        console.error('Bypass check failed:', err);
      } finally {
        setOtpSendLoading(false);
      }

      setError(`OTP rate limited. Please wait ${otpCooldown}s before requesting a new code.`);
      return;
    }

    setOtpSendLoading(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/verify-voter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'REQUEST_OTP',
          voterId,
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

      // Handle creator-granted OTP bypass (30s window)
      if (data.isBypassGranted && data.voterToken) {
        setBypassPopup({ visible: true, message: '30 second bypass is enabled for you. Redirecting directly to ballot...' });
        setTimeout(() => {
          setVoterToken(data.voterToken);
          setVerifiedVoter(true);
          if (data.hasVotedAlready) {
            setVotedSuccessfully(true);
          }
          setShowOtpPopup(false);
          setBypassPopup({ visible: false, message: '' });
          setCaptchaNum1(Math.floor(Math.random() * 8) + 2);
          setCaptchaNum2(Math.floor(Math.random() * 8) + 2);
          setCaptchaAnswer('');
        }, 2500);
        return;
      }

      // Handle low-priority bypass (no OTP required)
      if (data.isLowPriority && data.voterToken) {
        setVoterToken(data.voterToken);
        setVerifiedVoter(true);
        if (data.hasVotedAlready) {
          setVotedSuccessfully(true);
        }
        setShowOtpPopup(false);
        setCaptchaNum1(Math.floor(Math.random() * 8) + 2);
        setCaptchaNum2(Math.floor(Math.random() * 8) + 2);
        setCaptchaAnswer('');
        return;
      }

      setOtpSentOnce(true);
      setOtpCooldown(15); // 15 seconds rate limit cooldown
      if (data.hasVotedAlready) {
        (window as any)._hasVotedAlready = true;
      }
      setShowOtpPopup(true);
      setOtpError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOtpSendLoading(false);
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
      if (data.hasVotedAlready || (window as any)._hasVotedAlready) {
        setVotedSuccessfully(true);
      }
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

  // SOS Request Bypass Logic
  const handleRequestBypass = async () => {
    setBypassStatus('REQUESTING');
    try {
      const res = await fetch(`/api/polls/${pollId}/request-bypass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: voterEmail, voterId }),
      });
      if (res.ok) {
        setBypassStatus('WAITING');
      } else {
        setBypassStatus('IDLE');
        setOtpError('Failed to request bypass. Please try again.');
      }
    } catch (e) {
      setBypassStatus('IDLE');
      setOtpError('Failed to request bypass.');
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (bypassStatus === 'WAITING') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/polls/${pollId}/verify-voter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step: 'CHECK_BYPASS', email: voterEmail, voterId }),
          });
          const data = await res.json();
          if (data.success && data.granted) {
            setVerifiedVoter(true);
            setVoterToken(data.voterToken);
            if (data.hasVotedAlready || (window as any)._hasVotedAlready) {
              setVotedSuccessfully(true);
            }
            setShowOtpPopup(false);
            setBypassStatus('GRANTED');
            
            // Load standard captcha refresh
            setCaptchaNum1(Math.floor(Math.random() * 8) + 2);
            setCaptchaNum2(Math.floor(Math.random() * 8) + 2);
            setCaptchaAnswer('');
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [bypassStatus, pollId, voterEmail, voterId]);

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

  const handleRankDrop = (draggedId: string, targetId: string, questionId: string) => {
    if (!draggedId || draggedId === targetId) return;

    const withoutDragged = rankedSelections.filter((id) => id !== draggedId);
    const targetIndex = withoutDragged.indexOf(targetId);
    const updated = [...withoutDragged];

    if (targetIndex === -1) {
      updated.push(draggedId);
    } else {
      updated.splice(targetIndex, 0, draggedId);
    }

    setRankedSelections(updated);
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: updated,
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
    for (const q of poll.questions) {
      const ans = selectedAnswers[q.id];
      const rankedRequiredCount = poll.settings?.enableRankCompleteness
        ? (poll.settings?.rankedCompletenessRule === 'FULL'
            ? q.options?.length
            : poll.settings?.rankedCompletenessRule === 'TOP_3'
              ? Math.min(3, q.options?.length || 0)
              : 1)
        : q.options?.length;

      if (
        !ans || 
        (q.type === 'RANKED' && ans.length < rankedRequiredCount) ||
        (q.type === 'KNOCKOUT' && !ans.winner) ||
        (q.type === 'MULTIPLE_CHOICE' && ans.length === 0) ||
        (q.type === 'SHORT_TEXT' && ans.trim() === '') ||
        (q.type === 'LONG_TEXT' && ans.trim() === '') ||
        (q.type === 'RATING' && ans === 0)
      ) {
        setError(q.type === 'RANKED' ? `Please rank at least ${rankedRequiredCount} choice${rankedRequiredCount === 1 ? '' : 's'} before submitting.` : 'Please complete all questions before submitting.');
        setVoteLoading(false);
        return;
      }
    }

    // 3. Confirm checkbox
    if (!confirmVoteChecked) {
      setError('Please check the confirmation box to submit your vote.');
      setVoteLoading(false);
      return;
    }

    // 4. Query High-Accuracy Browser Geolocation (Compulsory)
    let userCoords: { latitude: number; longitude: number } | null = null;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        userCoords = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      } catch (err: any) {
        console.error('Compulsory geolocation permission error:', err);
        setError('Location Access Required: To guarantee vote uniqueness and prevent security manipulation, you must enable and grant location permissions in your browser to submit your ballot.');
        setVoteLoading(false);
        return;
      }
    } else {
      setError('Location Access Required: Your browser does not support Geolocation, which is mandatory to cast a secure vote on this platform.');
      setVoteLoading(false);
      return;
    }

    if (!userCoords || !userCoords.latitude || !userCoords.longitude) {
      setError('Location Access Required: Could not resolve valid coordinates. Please ensure location access is enabled and try again.');
      setVoteLoading(false);
      return;
    }

    try {
      const isMobileUA = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator?.userAgent || '');
      const isMobileTouch = typeof window !== 'undefined' && (('ontouchstart' in window) || (navigator && navigator.maxTouchPoints > 0) || window.innerWidth < 768);
      const detectedDevice = (isMobileUA || isMobileTouch) ? 'Mobile' : 'Desktop';
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: selectedAnswers,
          confidenceValues: Object.keys(confidenceValues).length > 0 ? confidenceValues : undefined,
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

  // ── VOTING CLOSED SCREEN ──────────────────────────────────
  if (poll && poll.status !== 'ACTIVE' && !votedSuccessfully) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-16 text-center bg-[#030712] min-h-screen">
        <div className="max-w-lg w-full space-y-8">
          {/* Brand */}
          <div className="flex items-center justify-center space-x-2.5 mb-4">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/20">
              <VoteIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-outfit text-lg font-bold tracking-tight text-white">
              Poll<span className="text-indigo-400">star</span>
            </span>
          </div>

          {/* Closed Badge */}
          <div className="glass-card rounded-3xl p-10 border border-red-500/20 bg-red-500/5 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-center">
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl">
                <AlertCircle className="w-10 h-10" />
              </div>
            </div>

            <h1 className="font-outfit text-3xl font-extrabold text-white">Voting Has Closed</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              The poll <span className="text-white font-bold">"{poll.title}"</span> has officially ended and is no longer accepting ballots.
            </p>

            {poll.endTime && (
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold mx-auto">
                <span>⏱️ Deadline:</span>
                <span className="text-white font-mono">{new Date(poll.endTime).toLocaleString()}</span>
              </div>
            )}

            {poll.totalVotes !== undefined && (
              <p className="text-gray-500 text-xs">
                Total ballots recorded: <span className="text-white font-bold">{poll.totalVotes}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {poll.isResultPublic && (
              <button
                type="button"
                onClick={() => {
                  // Allow them through to view results by marking as "voted" 
                  setVotedSuccessfully(true);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 shadow-lg shadow-indigo-500/20 transition-all text-sm flex items-center justify-center space-x-2 active:scale-95"
              >
                <Award className="w-4 h-4" />
                <span>View Results & Report</span>
              </button>
            )}
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold glass-card hover:bg-white/5 text-gray-300 hover:text-white text-sm border border-white/10 flex items-center justify-center transition-all active:scale-95"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }


  if (showIntro) {
    return (
      <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-12 flex flex-col justify-center min-h-[80vh] space-y-8 relative animate-fade-in">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-center space-x-2.5 mb-2">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <VoteIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-outfit text-xl font-bold tracking-tight text-white">
            Poll<span className="text-indigo-400">star</span> Secure
          </span>
        </div>

        {introStep === 1 ? (
          <div className="glass-card rounded-3xl p-8 border border-indigo-500/30 bg-[#080d1a] shadow-2xl space-y-6 animate-fade-in-up relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            {poll.posterUrl && (
              <div className="w-full h-56 rounded-2xl border border-white/10 overflow-hidden bg-white/5 shadow-inner">
                <img src={poll.posterUrl} alt="Poll Poster" className="w-full h-full object-cover transform hover:scale-105 transition-all duration-700" />
              </div>
            )}

            <div className="space-y-3">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-widest">
                Step 1 of 2: Overview & Guidelines
              </span>
              <h1 className="font-outfit text-3xl font-extrabold text-white leading-tight">
                {poll.title}
              </h1>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line bg-white/3 p-4 rounded-2xl border border-white/5">
                {poll.description ? poll.description.replace(/\[domains:\s*([^\]]+)\]/i, '').replace(/\[geolock:\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(\d+)\s*\]/i, '').trim() : 'No guidelines specified.'}
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIntroStep(2)}
                className="px-6 py-3 rounded-xl font-bold bg-indigo-500 text-white hover:bg-indigo-600 transition-all text-xs flex items-center space-x-2 shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                <span>Rules & Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-8 border border-indigo-500/30 bg-[#080d1a] shadow-2xl space-y-6 animate-fade-in-up relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-widest">
                Step 2 of 2: Security & Protocols
              </span>
              <h2 className="font-outfit text-2xl font-bold text-white">Electoral Integrity Features</h2>
              <p className="text-gray-400 text-xs">
                To guarantee clean, transparent and fair outcomes, the administrator has locked this session under the following protocols:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex items-start space-x-3 hover:border-indigo-500/30 transition-all duration-300">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <VoteIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ballot Privacy</h4>
                    <p className="text-gray-400 text-[10px] mt-1 leading-relaxed">
                      {poll.isAnonymous 
                        ? 'Your vote won\'t be visible to anyone.' 
                        : 'Your vote will be visible to everyone based on choices made by the creator.'
                      }
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex items-start space-x-3 hover:border-indigo-500/30 transition-all duration-300">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Access Scope</h4>
                    <p className="text-gray-400 text-[10px] mt-1 leading-relaxed">
                      {poll.isOpenVoting 
                        ? 'Open Ballot. Open for all eligible internet participants.' 
                        : 'Restricted Roster. Only designated, registered voters can participate.'
                      }
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex items-start space-x-3 hover:border-indigo-500/30 transition-all duration-300">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Verification</h4>
                    <p className="text-gray-400 text-[10px] mt-1 leading-relaxed">
                      {poll.description && poll.description.includes('[priority: LOW]')
                        ? 'Direct Bypass Profile. Secure lookup is active, but OTP email code is bypassed.'
                        : 'Secure OTP Required. High Priority session with 6-digit email confirmation.'
                      }
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex items-start space-x-3 hover:border-indigo-500/30 transition-all duration-300">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Session Limit</h4>
                    <p className="text-gray-400 text-[10px] mt-1 leading-relaxed">
                      Time-limited session active: <span className="text-red-400 font-extrabold">{formatTime(getSessionDuration())}</span>. Unfinished ballots automatically expire.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5 gap-4">
              <button
                type="button"
                onClick={() => setIntroStep(1)}
                className="px-5 py-3 rounded-xl font-bold bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-xs"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => setShowIntro(false)}
                className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-95 shadow-lg shadow-indigo-500/20 transition-all text-xs flex items-center space-x-2 active:scale-95 animate-pulse-slow"
              >
                <span>Start Poll</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center space-x-1.5 pt-2">
          <button 
            type="button"
            onClick={() => setIntroStep(1)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${introStep === 1 ? 'bg-indigo-500 w-6' : 'bg-white/20'}`}
          />
          <button 
            type="button"
            onClick={() => setIntroStep(2)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${introStep === 2 ? 'bg-indigo-500 w-6' : 'bg-white/20'}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full relative">
      {timeLeft !== null && (
        <div className="w-full bg-[#080d1a]/95 sticky top-0 z-30 border-b border-red-500/20 py-3 px-6 animate-pulse-slow backdrop-blur-md">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] font-extrabold tracking-widest text-red-400 uppercase">Voting Session Time Limit</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-extrabold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          <div className="max-w-4xl mx-auto mt-2.5 h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-red-500 transition-all duration-1000"
              style={{ width: `${(timeLeft / getSessionDuration()) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className={`w-full mx-auto px-6 py-12 relative ${
        poll.settings?.enableSentimentChat ? 'max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-8 items-start' : 'max-w-4xl space-y-10'
      }`}>
      
      {/* Dynamic Background */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className={poll.settings?.enableSentimentChat ? 'lg:col-span-3 space-y-10' : 'space-y-10'}>

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
        <div className="space-y-3 flex-1">
          <h1 className="font-outfit text-3xl font-extrabold text-white leading-tight">
            {poll.title}
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
            {poll.description ? poll.description.replace(/\[domains:\s*([^\]]+)\]/i, '').replace(/\[geolock:\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(\d+)\s*\]/i, '').trim() : ''}
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {poll.description && poll.description.match(/\[domains:\s*([^\]]+)\]/i) && (
              <span className="px-3 py-1 rounded-xl text-[10px] font-extrabold bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center space-x-1.5 uppercase tracking-wider animate-pulse">
                <span>🛡️ Domain Lock:</span>
                <span className="font-mono text-white/90">{poll.description.match(/\[domains:\s*([^\]]+)\]/i)?.[1]}</span>
              </span>
            )}
            {poll.description && poll.description.match(/\[geolock:\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(\d+)\s*\]/i) && (
              <span className="px-3 py-1 rounded-xl text-[10px] font-extrabold bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center space-x-1.5 uppercase tracking-wider">
                <span>📍 GEOLOCKED:</span>
                <span className="text-white/90">Within {poll.description.match(/\[geolock:\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(\d+)\s*\]/i)?.[3]}km</span>
              </span>
            )}
          </div>
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
              Your vote won't be visible to anyone.
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
                      setVoterId('');
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
                disabled={otpSendLoading || otpCooldown > 0}
                className="w-full py-3.5 rounded-xl font-bold gradient-btn text-white transition-all text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpSendLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : otpCooldown > 0 ? (
                  <span>Resend OTP in {otpCooldown}s</span>
                ) : (poll.description && /\[priority:\s*LOW\]/i.test(poll.description)) ? (
                  <span>Confirm Profile & Access Ballot</span>
                ) : otpSentOnce ? (
                  <span>Resend OTP Code</span>
                ) : (
                  <span>Confirm Profile & Send OTP</span>
                )}
                {!otpSendLoading && <ArrowRight className="w-4 h-4" />}
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

              <div className="text-center py-1 select-none">
                {otpCooldown > 0 ? (
                  <span className="text-gray-500 text-xs font-bold">Resend available in {otpCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    disabled={otpSendLoading}
                    onClick={() => handleVoterRequestOtp(null as any)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-all disabled:opacity-50"
                  >
                    {otpSendLoading ? 'Requesting resend...' : 'Didn\'t receive code? Resend OTP'}
                  </button>
                )}
              </div>

              {/* SOS Bypass Request Section */}
              <div className="text-center pb-2">
                {bypassStatus === 'IDLE' && (
                  <button
                    type="button"
                    onClick={handleRequestBypass}
                    className="text-xs text-red-400 hover:text-red-300 font-bold transition-all"
                  >
                    Can't access email? Request OTP Bypass
                  </button>
                )}
                {bypassStatus === 'REQUESTING' && (
                  <span className="text-xs text-amber-400 font-bold animate-pulse">Sending request...</span>
                )}
                {bypassStatus === 'WAITING' && (
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    <span className="text-xs text-amber-400 font-bold">Request sent! Waiting for creator approval...</span>
                  </div>
                )}
              </div>

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
            <div className="space-y-10">
              {poll.questions.map((q: any, qIdx: number) => {
                const ans = selectedAnswers[q.id];
                
                return (
                  <div key={q.id} className="space-y-6">
                    <div className="p-4 bg-white/2 rounded-2xl border border-white/5">
                      <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                        Question {poll.questions.length > 1 ? qIdx + 1 : ''}
                      </span>
                      <h4 className="text-white text-base font-bold mt-1 leading-snug">{q.questionText}</h4>
                    </div>

                    {/* SINGLE CHOICE LAYOUT */}
                    {q.type === 'SINGLE' && (
                      <>
                        {poll.settings?.enableQuadraticVoting ? (
                          <div className="space-y-4 animate-fade-in-up">
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                              <div>
                                <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider block">Quadratic Voting Budget</span>
                                <p className="text-gray-500 text-[10px] mt-0.5">Allocate up to 100 points. Points cost is the square of votes (1 vote = 1 pt, 2 votes = 4 pts, 3 votes = 9 pts).</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-2xl font-black text-white block tabular-nums">
                                  {100 - Object.values(selectedAnswers[q.id] || {}).reduce((sum: number, v: any) => sum + v * v, 0) as number}
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Points Left</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                              {q.options.map((opt: any) => {
                                const currentAlloc = selectedAnswers[q.id] || {};
                                const votes = currentAlloc[opt.id] || 0;
                                const pointsUsed = Object.values(currentAlloc).reduce((sum: number, v: any) => sum + v * v, 0) as number;
                                const nextCost = (votes + 1) * (votes + 1) - votes * votes;
                                const pointsLeft = 100 - pointsUsed;

                                return (
                                  <div key={opt.id} className="p-4 rounded-xl border border-white/5 bg-white/2 flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                      <span className="text-sm font-semibold text-white block">{opt.text}</span>
                                      <span className="text-[10px] text-gray-500 block">
                                        Allocated: <strong className="text-indigo-400">{votes} vote{votes === 1 ? '' : 's'}</strong> ({votes * votes} points)
                                      </span>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                      <button
                                        type="button"
                                        disabled={votes === 0}
                                        onClick={() => {
                                          const nextAlloc = { ...currentAlloc, [opt.id]: votes - 1 };
                                          if (nextAlloc[opt.id] === 0) delete nextAlloc[opt.id];
                                          setSelectedAnswers({ ...selectedAnswers, [q.id]: nextAlloc });
                                        }}
                                        className={`w-8 h-8 rounded-lg border text-sm font-black flex items-center justify-center transition-all ${
                                          votes > 0 
                                            ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white' 
                                            : 'border-white/5 text-gray-600 cursor-not-allowed'
                                        }`}
                                      >
                                        -
                                      </button>
                                      <span className="text-sm font-black text-white w-4 text-center tabular-nums">{votes}</span>
                                      <button
                                        type="button"
                                        disabled={pointsLeft < nextCost}
                                        onClick={() => {
                                          setSelectedAnswers({
                                            ...selectedAnswers,
                                            [q.id]: { ...currentAlloc, [opt.id]: votes + 1 }
                                          });
                                        }}
                                        className={`w-8 h-8 rounded-lg border text-sm font-black flex items-center justify-center transition-all ${
                                          pointsLeft >= nextCost
                                            ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white' 
                                            : 'border-white/5 text-gray-600 cursor-not-allowed'
                                        }`}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {q.options.map((opt: any) => {
                              const isSelected = ans === opt.id;
                              return (
                                <div
                                  key={opt.id}
                                  onClick={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: opt.id })}
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

                        {/* CONFIDENCE SLIDER — shown after selecting an option if enabled */}
                        {q.type === 'SINGLE' && (poll.settings?.enableQuadraticVoting ? Object.keys(selectedAnswers[q.id] || {}).length > 0 : ans) && poll.settings?.enableConfidenceSlider && (
                          <div className="mt-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3 animate-fade-in-up">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block">How confident are you?</span>
                                <p className="text-gray-500 text-[10px] mt-0.5">Drag the slider to show how sure you are about your choice.</p>
                              </div>
                              <span className="text-2xl font-extrabold text-amber-400 tabular-nums">
                                {confidenceValues[q.id] ?? 50}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={100}
                              value={confidenceValues[q.id] ?? 50}
                              onChange={(e) => setConfidenceValues({ ...confidenceValues, [q.id]: Number(e.target.value) })}
                              className="w-full accent-amber-400 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-gray-600 font-bold">
                              <span>1% — Just guessing</span>
                              <span>100% — Absolutely certain</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}


                    {/* MULTIPLE CHOICE LAYOUT */}
                    {q.type === 'MULTIPLE_CHOICE' && (
                      <div className="grid grid-cols-1 gap-3">
                        {q.options.map((opt: any) => {
                          const isSelected = ans && ans.includes(opt.id);
                          return (
                            <div
                              key={opt.id}
                              onClick={() => {
                                const current = ans || [];
                                const updated = isSelected ? current.filter((id: string) => id !== opt.id) : [...current, opt.id];
                                setSelectedAnswers({ ...selectedAnswers, [q.id]: updated });
                              }}
                              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-md'
                                  : 'border-white/5 hover:border-white/10 hover:bg-white/3 text-gray-300'
                              }`}
                            >
                              <span className="text-sm font-semibold">{opt.text}</span>
                              <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-white/20'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* SHORT TEXT LAYOUT */}
                    {q.type === 'SHORT_TEXT' && (
                      <div>
                        <input
                          type="text"
                          value={ans || ''}
                          onChange={(e) => setSelectedAnswers({ ...selectedAnswers, [q.id]: e.target.value })}
                          placeholder="Your answer..."
                          className="w-full glass-input text-sm"
                        />
                      </div>
                    )}

                    {/* LONG TEXT LAYOUT */}
                    {q.type === 'LONG_TEXT' && (
                      <div>
                        <textarea
                          rows={4}
                          value={ans || ''}
                          onChange={(e) => setSelectedAnswers({ ...selectedAnswers, [q.id]: e.target.value })}
                          placeholder="Your answer..."
                          className="w-full glass-input text-sm resize-none"
                        />
                      </div>
                    )}

                    {/* RATING LAYOUT */}
                    {q.type === 'RATING' && (
                      <div className="flex gap-2 justify-center py-4 glass-card border border-white/5 rounded-2xl">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div
                            key={star}
                            onClick={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: star })}
                            className={`cursor-pointer transition-all p-2 rounded-xl ${
                              (ans || 0) >= star ? 'text-amber-400 bg-amber-400/10' : 'text-gray-600 hover:text-gray-400'
                            }`}
                          >
                            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* RANKED CHOICE (Borda Count) CLICK-TO-RANK PRIORITY LAYOUT */}
                    {q.type === 'RANKED' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white/2 p-4 rounded-xl border border-white/5">
                          <div className="space-y-0.5">
                            <span className="text-gray-300 text-xs font-bold">Rank candidates in order of priority:</span>
                            <p className="text-gray-500 text-[10px]">
                              {poll.settings?.enableDragAndDropPodium
                                ? 'Click to rank, or drag candidates to reorder their podium positions.'
                                : 'Click choices to assign weights (1 = highest priority).'}
                            </p>
                          </div>
                          {rankedSelections.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleResetRankings(q.id)}
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-all flex items-center space-x-1"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Reset</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {q.options.map((opt: any) => {
                            const rankIndex = rankedSelections.indexOf(opt.id);
                            const isRanked = rankIndex !== -1;
                            return (
                              <div
                                key={opt.id}
                                draggable={!!poll.settings?.enableDragAndDropPodium}
                                onDragStart={(e) => e.dataTransfer.setData('text/plain', opt.id)}
                                onDragOver={(e) => {
                                  if (poll.settings?.enableDragAndDropPodium) e.preventDefault();
                                }}
                                onDrop={(e) => {
                                  if (!poll.settings?.enableDragAndDropPodium) return;
                                  e.preventDefault();
                                  handleRankDrop(e.dataTransfer.getData('text/plain'), opt.id, q.id);
                                }}
                                onClick={() => handleRankClick(opt.id, q.id)}
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

                    {/* TOURNAMENT KNOCKOUT BRACKET LAYOUT */}
                    {q.type === 'KNOCKOUT' && knockoutRounds.length > 0 && (
                      <div className="space-y-6 animate-fade-in">
                        {poll.settings?.enableBracketPredictions && (
                          <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-3 animate-fade-in-up">
                            <div>
                              <span className="text-purple-400 text-xs font-bold uppercase tracking-wider block">🏆 Playoff Bracket Guessing</span>
                              <p className="text-gray-500 text-[10px] mt-0.5">Who do you think will win the whole tournament? Make your prediction before casting your bracket vote!</p>
                            </div>
                            <select
                              value={selectedAnswers[q.id]?.prediction || ''}
                              onChange={(e) => {
                                const currentVal = selectedAnswers[q.id] || {};
                                setSelectedAnswers({
                                  ...selectedAnswers,
                                  [q.id]: { ...currentVal, prediction: e.target.value }
                                });
                              }}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-purple-500"
                            >
                              <option value="">-- Choose your Predicted Champion --</option>
                              {q.options.filter((o: any) => o.text !== 'BYE').map((o: any) => (
                                <option key={o.id} value={o.id} className="bg-slate-900 text-white">{o.text}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex justify-between items-center bg-white/2 p-4 rounded-xl border border-white/5">
                          <div className="space-y-0.5">
                            <span className="text-gray-300 text-xs font-bold uppercase tracking-wide">
                              Tournament Round {currentRoundIndex + 1} of {totalKnockoutRounds}
                            </span>
                            <p className="text-gray-500 text-[10px]">
                              Select your preferred option in each match to advance them up the bracket.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleResetKnockout(q.id, q.options)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-all flex items-center space-x-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Restart Bracket</span>
                          </button>
                        </div>

                        {/* Present all matchups for the active round */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {knockoutRounds[currentRoundIndex].map((match: any, matchIdx: number) => {
                            const isByeMatch = match.c1.text === 'BYE' || match.c2.text === 'BYE';
                            
                            return (
                              <div 
                                key={matchIdx} 
                                className="glass-card rounded-2xl p-4 border border-white/5 space-y-3 shadow-md hover:border-indigo-500/20 transition-all"
                              >
                                <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase">
                                  <span>Matchup #{matchIdx + 1}</span>
                                  {isByeMatch && <span className="text-emerald-400 text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Auto-Resolved</span>}
                                </div>

                                <div className="space-y-4">
                                  {/* Candidate Option 1 */}
                                  <div className="space-y-2">
                                    <div
                                      onClick={() => {
                                        if (match.c1.text !== 'BYE' && match.c2.text !== 'BYE') {
                                          handleKnockoutSelect(matchIdx, match.c1.id, q.id);
                                        }
                                      }}
                                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                                        match.c1.text === 'BYE' ? 'opacity-30 cursor-not-allowed border-dashed border-white/5' : 'cursor-pointer'
                                      } ${
                                        match.winner === match.c1.id
                                          ? 'border-indigo-500 bg-indigo-500/15 text-white font-bold'
                                          : 'border-white/5 hover:border-white/10 hover:bg-white/3 text-gray-300'
                                      }`}
                                    >
                                      <span className="text-xs">{match.c1.text}</span>
                                      {match.winner === match.c1.id && (
                                        <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold">
                                          ✓
                                        </div>
                                      )}
                                    </div>
                                    {poll.settings?.enableOptionStatsCards && match.c1.text !== 'BYE' && (
                                      <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] space-y-1 animate-fade-in-up">
                                        <div className="flex justify-between text-gray-400">
                                          <span>Seed Rating:</span>
                                          <span className="font-bold text-indigo-300">#{(match.c1.id.charCodeAt(0) % 8) + 1} Seed</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                          <span>Est. Win Rate:</span>
                                          <span className="font-bold text-indigo-300">{70 + (match.c1.id.charCodeAt(1) % 25)}%</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                          <span>Style/Trait:</span>
                                          <span className="font-bold text-indigo-300">
                                            {['Defensive Wall', 'Championship Pedigree', 'Fan Favorite', 'Dark Horse', 'Tactical Genius', 'High Tempo'][match.c1.id.charCodeAt(2) % 6]}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Versus indicator */}
                                  <div className="text-center text-[9px] font-extrabold text-indigo-400 tracking-wider">VS</div>

                                  {/* Candidate Option 2 */}
                                  <div className="space-y-2">
                                    <div
                                      onClick={() => {
                                        if (match.c1.text !== 'BYE' && match.c2.text !== 'BYE') {
                                          handleKnockoutSelect(matchIdx, match.c2.id, q.id);
                                        }
                                      }}
                                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                                        match.c2.text === 'BYE' ? 'opacity-30 cursor-not-allowed border-dashed border-white/5' : 'cursor-pointer'
                                      } ${
                                        match.winner === match.c2.id
                                          ? 'border-indigo-500 bg-indigo-500/15 text-white font-bold'
                                          : 'border-white/5 hover:border-white/10 hover:bg-white/3 text-gray-300'
                                      }`}
                                    >
                                      <span className="text-xs">{match.c2.text}</span>
                                      {match.winner === match.c2.id && (
                                        <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold">
                                          ✓
                                        </div>
                                      )}
                                    </div>
                                    {poll.settings?.enableOptionStatsCards && match.c2.text !== 'BYE' && (
                                      <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] space-y-1 animate-fade-in-up">
                                        <div className="flex justify-between text-gray-400">
                                          <span>Seed Rating:</span>
                                          <span className="font-bold text-indigo-300">#{(match.c2.id.charCodeAt(0) % 8) + 1} Seed</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                          <span>Est. Win Rate:</span>
                                          <span className="font-bold text-indigo-300">{70 + (match.c2.id.charCodeAt(1) % 25)}%</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                          <span>Style/Trait:</span>
                                          <span className="font-bold text-indigo-300">
                                            {['Defensive Wall', 'Championship Pedigree', 'Fan Favorite', 'Dark Horse', 'Tactical Genius', 'High Tempo'][match.c2.id.charCodeAt(2) % 6]}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Showcase ultimate winner once decided! */}
                        {ans && (
                          <div className="p-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 text-center space-y-3 animate-fade-in-up">
                            <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider block">Your Selected Champion</span>
                            <h4 className="text-white text-xl font-black">
                              🏆 {
                                q.options.find((o: any) => o.id === ans.winner)?.text || 'BYE'
                              }
                            </h4>
                            <p className="text-gray-400 text-[10px]">Your final tournament bracket choice is locked. You can submit your ballot below.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
              {poll.settings?.postSurveyAction || 'Thank you for participating. Your vote has been cryptographically recorded on our backend ledger.'}
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

          {votedSuccessfully && poll.settings?.enableLiveTicker && poll.questions?.[0]?.options?.length > 0 && (
            <div className="glass-card rounded-2xl border border-white/5 bg-slate-950/40 p-4 flex items-center overflow-hidden relative select-none animate-fade-in">
              <div className="flex items-center space-x-2 border-r border-white/10 pr-4 shrink-0 bg-slate-950/80 backdrop-blur z-10">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">Live Ticker</span>
              </div>
              <div className="flex items-center space-x-6 pl-6 overflow-x-auto no-scrollbar py-1">
                {poll.questions[0].options.map((opt: any) => {
                  const questionStats = liveStats[poll.questions[0].id] || {};
                  const optStats = questionStats[opt.id] || { count: 0 };
                  const total = Object.values(questionStats).reduce((acc: number, cur: any) => acc + (cur.count || 0), 0) as number;
                  const percentage = total > 0 ? (optStats.count / total) * 100 : 0;

                  return (
                    <div key={opt.id} className="inline-flex items-center space-x-2 border border-white/5 rounded-xl px-3 py-1.5 text-xs font-semibold bg-white/2">
                      <span className="text-gray-300 font-medium truncate max-w-[120px]">{opt.text}</span>
                      <span className="text-white font-mono">{percentage.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Aggregate counts */}
          {poll.settings?.publicShowStats !== false && (
            <div className="glass-card rounded-2xl p-6 flex justify-between items-center">
              <div>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1">Total Votes Logged</span>
                <span className="font-outfit text-3xl font-extrabold text-white">{liveTotalVotes}</span>
              </div>
              <div className="p-3.5 bg-indigo-500/10 rounded-xl text-indigo-400">
                <VoteIcon className="w-6 h-6" />
              </div>
            </div>
          )}

          {/* Recharts graphs */}
          {poll.settings?.publicShowCharts !== false && (
            <div className="space-y-6">
              {poll.questions.map((q: any) => {
                if (['SHORT_TEXT', 'LONG_TEXT'].includes(q.type)) return null;
                return (
                  <div key={q.id} className="glass-card rounded-3xl p-8 border border-white/5">
                    <PollChart
                      questionId={q.id}
                      questionText={q.questionText}
                      type={q.type}
                      stats={liveStats[q.id] || {}}
                      votesList={poll?.votes || []}
                      optionsList={q.options || []}
                      settings={poll.settings}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Leaflet map */}
          {poll.settings?.publicShowMaps !== false && (
            <div className="space-y-3">
              <h4 className="font-outfit text-sm font-bold text-gray-400 uppercase tracking-widest">Global Device Geolocations</h4>
              <p className="text-gray-500 text-xs">A real-time distribution map plotting coordinates resolved from voter IP handshakes.</p>
              <PollMap locations={liveVoterLocations} />
            </div>
          )}
        </div>
      )}

      {/* If Results are kept completely private */}
      {votedSuccessfully && !poll.isResultPublic && (
        <div className="p-5 rounded-2xl bg-white/2 border border-white/5 text-center text-gray-500 text-xs">
          Live statistics and maps are set to private by the poll administrator.
        </div>
      )}
      </div>

      {poll.settings?.enableSentimentChat && (
        <div className="glass-card rounded-3xl p-6 border border-white/5 bg-[#080d1a] h-[600px] flex flex-col justify-between sticky top-24">
          <div className="space-y-2 pb-4 border-b border-white/5">
            <h4 className="font-outfit text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Opinion Chatbox</span>
            </h4>
            <p className="text-gray-500 text-[10px]">Discuss options. Message sentiments are auto-analyzed.</p>
          </div>

          {/* Chat message feed */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 no-scrollbar">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-gray-300">{msg.author}</span>
                  <span className="text-gray-500">{msg.time}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/2 border border-white/5 text-xs text-gray-200 relative group">
                  <p>{msg.text}</p>
                  <span className={`absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    msg.sentiment === 'POSITIVE'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : msg.sentiment === 'NEGATIVE'
                      ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                      : 'bg-gray-500/10 border border-gray-500/20 text-gray-400'
                  }`}>
                    {msg.sentiment === 'POSITIVE' ? '😊 Positive' : msg.sentiment === 'NEGATIVE' ? '😡 Negative' : '😐 Neutral'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Name Input & Send Input */}
          <form onSubmit={handleSendChatMessage} className="space-y-2 pt-4 border-t border-white/5">
            <input
              type="text"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="Your name..."
              className="w-full bg-slate-900 border border-white/5 rounded-lg px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-indigo-500"
            />
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-900 border border-white/5 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OTP Bypass Popup */}
      {bypassPopup.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card rounded-3xl p-8 border border-emerald-500/30 bg-emerald-500/5 shadow-2xl max-w-sm w-full mx-6 text-center space-y-4 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
            <h3 className="font-outfit text-lg font-extrabold text-white">OTP Bypass Granted</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{bypassPopup.message}</p>
            <div className="flex justify-center">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
