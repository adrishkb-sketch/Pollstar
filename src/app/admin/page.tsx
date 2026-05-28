'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Vote, ArrowLeft, Loader2, Users, FileText, CheckCircle, 
  XCircle, ToggleLeft, ToggleRight, ShieldCheck, AlertCircle, Trash2,
  Eye, BarChart3, Calendar, Lock, ShieldAlert, X, Plus, Edit2, Check,
  ExternalLink, User, HelpCircle
} from 'lucide-react';

const POLL_FEATURES = [
  { key: 'openPublicPolls', label: 'Open Public Polls' },
  { key: 'realTimeLiveResults', label: 'Real-Time Live Results' },
  { key: 'liveGeolocationMap', label: 'Live Geolocation Map' },
  { key: 'liveVoteTicker', label: 'Live Vote Ticker' },
  { key: 'viralVoteIndicators', label: 'Viral Vote Indicators' },
  { key: 'rankedChoiceBordaCount', label: 'Ranked Choice / Borda Count' },
  { key: 'quadraticVoting', label: 'Quadratic Voting' },
  { key: 'singleChoiceMultiSelect', label: 'Single Choice / Multi-Select' },
  { key: 'enableDragAndDropPodium', label: 'Drag-and-Drop Ballot Podium' },
  { key: 'opinionChatbox', label: 'Opinion Chatbox' },
  { key: 'sentimentReactions', label: 'Sentiment Reactions' },
  { key: 'voterLeaderboard', label: 'Voter Leaderboard' },
  { key: 'multipleChartTypes', label: 'Multiple Chart Types' },
  { key: 'voteTimelineGraph', label: 'Vote Timeline Graph' },
  { key: 'multiRoundPolls', label: 'Multi-Round Polls' },
  { key: 'revoteChangeVote', label: 'Revote / Change Vote' },
  { key: 'knockoutBracket', label: 'Knockout Tournament Bracket' },
  { key: 'enableScenarioSimulator', label: 'What-If Scenario Simulator' },
  { key: 'enableAiProjection', label: 'AI Vote Projection & Live Predictions' }
];

const SURVEY_FEATURES = [
  { key: 'multipleQuestionTypes', label: 'Multiple Question Types' },
  { key: 'longFormTextResponses', label: 'Long-Form Text Responses' },
  { key: 'starEmojiRatings', label: 'Star & Emoji Ratings' },
  { key: 'matrixGridQuestions', label: 'Matrix / Grid Questions' },
  { key: 'yesnoToggleQuestions', label: 'Yes/No & Toggle Questions' },
  { key: 'fileUploadQuestions', label: 'File Upload Questions' },
  { key: 'conditionalLogicBranching', label: 'Conditional Logic Branching' },
  { key: 'multiPageSurveys', label: 'Multi-Page Surveys' },
  { key: 'questionRandomizationSurvey', label: 'Question Randomization' },
  { key: 'responseTimeLimits', label: 'Response Time Limits' },
  { key: 'requiredVsOptionalQuestions', label: 'Required vs Optional Questions' },
  { key: 'inputValidationRules', label: 'Input Validation Rules' },
  { key: 'realTimeResponseDashboard', label: 'Real-Time Response Dashboard' },
  { key: 'aiSentimentAnalysis', label: 'AI Sentiment Analysis' },
  { key: 'wordCloudGenerator', label: 'Word Cloud Generator' },
  { key: 'aiSummaryReport', label: 'AI Summary Report' },
  { key: 'automatedReminders', label: 'Automated Reminders' },
  { key: 'completionRateTracking', label: 'Completion Rate Tracking' },
  { key: 'anonymousResponses', label: 'Anonymous Responses' },
  { key: 'targetedDistribution', label: 'Targeted Distribution' },
  { key: 'responseFilteringSegmentation', label: 'Response Filtering & Segmentation' },
  { key: 'saveResumeLater', label: 'Save & Resume Later (Survey)' },
  { key: 'enableDropOffTracking', label: 'Abandonment & Drop-off Tracking' },
  { key: 'enableCrossTabulation', label: 'Demographic Cross-Tabulation' }
];

const EXAM_FEATURES = [
  { key: 'timedExams', label: 'Timed Exams' },
  { key: 'fullScreenLockdown', label: 'Full-Screen Lockdown' },
  { key: 'tabSwitchDetection', label: 'Tab-Switch Detection' },
  { key: 'copyPastePrevention', label: 'Copy-Paste Prevention' },
  { key: 'cheatProbabilityScore', label: 'Cheat Probability Score' },
  { key: 'perQuestionMarks', label: 'Per-Question Marks' },
  { key: 'autoGradingEngine', label: 'Auto-Grading Engine' },
  { key: 'manualGradingInterface', label: 'Manual Grading Interface' },
  { key: 'pageBreaksSections', label: 'Page Breaks / Sections' },
  { key: 'dragAndDropQuestionOrderingExam', label: 'Drag-and-Drop Question Ordering' },
  { key: 'detailedScoreReports', label: 'Detailed Score Reports' },
  { key: 'classPerformanceAnalytics', label: 'Class Performance Analytics' },
  { key: 'weaknessAnalysis', label: 'Weakness Analysis' },
  { key: 'aiConceptExplanations', label: 'AI Concept Explanations' },
  { key: 'printableResultsPdf', label: 'Printable Results PDF' },
  { key: 'bulkResultsExport', label: 'Bulk Results Export' },
  { key: 'emailResultsToStudents', label: 'Email Results to Students' },
  { key: 'teacherGradebook', label: 'Teacher Gradebook' },
  { key: 'scheduledStartEnd', label: 'Scheduled Start & End' },
  { key: 'questionHints', label: 'Question Hints' },
  { key: 'negativeMarking', label: 'Negative Marking' },
  { key: 'studentRosterManagement', label: 'Student Roster Management' },
  { key: 'timePerQuestionAnalytics', label: 'Time-per-Question Analytics' },
  { key: 'inbuiltScientificCalculator', label: 'Inbuilt Scientific Calculator' },
  { key: 'saveResumeLaterExam', label: 'Save & Resume Later (Exam)' }
];

const EXAM_QUESTION_TYPES = [
  { key: 'mcqSingleCorrect', label: 'MCQ (Single Correct)' },
  { key: 'mcqMultipleCorrect', label: 'MCQ (Multiple Correct)' },
  { key: 'shortAnswerQuestionsSaq', label: 'Short Answer Questions (SAQ)' },
  { key: 'longAnswerQuestionsLaq', label: 'Long Answer Questions (LAQ)' },
  { key: 'trueOrFalse', label: 'True or False' },
  { key: 'fillInTheBlanks', label: 'Fill in the Blanks' },
  { key: 'matchTheFollowing', label: 'Match the Following' },
  { key: 'numericalInput', label: 'Numerical Input' },
  { key: 'fileUploadAnswers', label: 'File Upload Answers' },
  { key: 'studentWhiteboardQuestion', label: 'Student Drawing Whiteboard' }
];

const PLATFORM_FEATURES = [
  { key: 'otpVoterVerification', label: 'OTP Voter Verification' },
  { key: 'closedVoterLists', label: 'Closed Voter Lists' },
  { key: 'customBranding', label: 'Custom Logo Branding' },
  { key: 'customBrandingThemes', label: 'Custom Branding & Premium Themes' },
  { key: 'creatorScribbleCanvas', label: 'Creator Brain Scribble Canvas' },
  { key: 'premiumDarkMode', label: 'Premium Dark Mode' },
  { key: 'organizationAccounts', label: 'Organization Accounts' },
  { key: 'apiWebhooks', label: 'API & Webhooks' },
  { key: 'deviceFingerprinting', label: 'Device Fingerprinting' },
  { key: 'exportResults', label: 'Export Results' },
  { key: 'enableDomainRestriction', label: 'Domain and Email Lock Lists' },
  { key: 'collaborations', label: 'Real-time Creator Collaboration' },
  { key: 'enableDirectInbox', label: 'Voter Inbox Direct Messages' },
  { key: 'removeAdvertisements', label: 'Ad-Free Experience (No Ads on Platform)' }
];

const FEATURES_KEYS = [
  ...POLL_FEATURES,
  ...SURVEY_FEATURES,
  ...EXAM_FEATURES,
  ...EXAM_QUESTION_TYPES,
  ...PLATFORM_FEATURES
];

export default function AdminPortal() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lists states
  const [creators, setCreators] = useState<any[]>([]); // "creators" means users list in backend payload
  const [plans, setPlans] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [contactRequests, setContactRequests] = useState<any[]>([]);
  const [siteConfigs, setSiteConfigs] = useState<any[]>([]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'users' | 'verifications' | 'plans' | 'logs' | 'issues' | 'moderation' | 'contact' | 'site_editor'>('users');
  const [issueLoadingId, setIssueLoadingId] = useState<string | null>(null);

  // Inspector States
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<any | null>(null);
  const [editingVote, setEditingVote] = useState<any | null>(null);
  const [overrideAnswers, setOverrideAnswers] = useState<Record<string, any>>({});
  const [overrideError, setOverrideError] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  // User moderation interaction modals
  const [suspensionUser, setSuspensionUser] = useState<any | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionDays, setSuspensionDays] = useState('7');
  const [suspensionLoading, setSuspensionLoading] = useState(false);

  // Verification Rejection reason prompt
  const [rejectionUser, setRejectionUser] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionLoading, setRejectionLoading] = useState(false);

  // Plans CRUD Panel states
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planPrice, setPlanPrice] = useState('0.0');
  const [planCycle, setPlanCycle] = useState('MONTHLY');
  const [planFeatures, setPlanFeatures] = useState<Record<string, boolean>>({});
  
  // New pricing & trial options
  const [planIsFree, setPlanIsFree] = useState(false);
  const [planCurrency, setPlanCurrency] = useState('USD');
  const [planType, setPlanType] = useState('SUBSCRIPTION');
  const [planPackQuantity, setPlanPackQuantity] = useState('10');
  const [planFreePerks, setPlanFreePerks] = useState('0');
  const [planComboTypes, setPlanComboTypes] = useState<string[]>(['POLL', 'SURVEY']);
  const [planBadgeColor, setPlanBadgeColor] = useState('#a855f7');
  const [planBadgeLabel, setPlanBadgeLabel] = useState('');
  const [planHasFreeTrial, setPlanHasFreeTrial] = useState(false);
  const [planFreeTrialDays, setPlanFreeTrialDays] = useState('7');
  const [planFreeTrialFeatures, setPlanFreeTrialFeatures] = useState<Record<string, boolean>>({});
  const [planPollSubtypes, setPlanPollSubtypes] = useState<Record<string, boolean>>({
    mcq: true,
    ranked: true,
    multi: true,
    knockout: true
  });
  const [planIsActive, setPlanIsActive] = useState(true);

  const [planFormError, setPlanFormError] = useState('');
  const [planFormLoading, setPlanFormLoading] = useState(false);

  // Contact requests inspector & reply notes
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [contactNote, setContactNote] = useState('');
  const [contactNoteLoading, setContactNoteLoading] = useState(false);

  // Moderation state
  const [modLoadingId, setModLoadingId] = useState<string | null>(null);

  // Site Config state
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [configSaving, setConfigSaving] = useState(false);

  // Bulk transfer target plan selection
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkTargetPlanId, setBulkTargetPlanId] = useState('');
  const [bulkTransferLoading, setBulkTransferLoading] = useState(false);

  // Action loading track
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Search & Filter
  const [userSearch, setUserSearch] = useState('');

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

      // 1. Fetch Users
      const creatorsRes = await fetch('/api/admin/users');
      if (creatorsRes.ok) {
        const creatorsData = await creatorsRes.json();
        setCreators(creatorsData.creators || []);
      }

      // 2. Fetch Plans
      const plansRes = await fetch('/api/admin/plans');
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);
      }

      // 3. Fetch Audit Logs
      const logsRes = await fetch('/api/admin/logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }

      // 4. Fetch Support Issues
      const issuesRes = await fetch('/api/support/issues');
      if (issuesRes.ok) {
        const issuesData = await issuesRes.json();
        setIssues(issuesData.issues || []);
      }

      // 5. Fetch Content Moderation Logs
      const modRes = await fetch('/api/admin/moderation');
      if (modRes.ok) {
        const modData = await modRes.json();
        setModerationLogs(modData.logs || []);
      }

      // 6. Fetch Contact Requests
      const contactRes = await fetch('/api/contact');
      if (contactRes.ok) {
        const contactData = await contactRes.json();
        setContactRequests(contactData.requests || []);
      }

      // 7. Fetch Site Configs
      const configRes = await fetch('/api/admin/site-config');
      if (configRes.ok) {
        const configData = await configRes.json();
        setSiteConfigs(configData.configs || []);
        
        // Populate configValues dictionary
        const vals: Record<string, string> = {};
        (configData.configs || []).forEach((c: any) => {
          vals[c.key] = c.value;
        });
        setConfigValues(vals);
      }

    } catch (err) {
      setError('Failed to fetch administrator console credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleActivity = async (userId: string, currentRestricted: boolean) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'RESTRICT', restrict: !currentRestricted }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restrict activities');

      setCreators(prev => prev.map(u => u.id === userId ? { ...u, isActivityRestricted: !currentRestricted } : u));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev: any) => ({ ...prev, isActivityRestricted: !currentRestricted }));
      }
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleBan = async (userId: string, currentBanned: boolean) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'BAN', ban: !currentBanned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply ban');

      setCreators(prev => prev.map(u => u.id === userId ? { ...u, isBanned: !currentBanned } : u));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev: any) => ({ ...prev, isBanned: !currentBanned }));
      }
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenSuspend = (userObj: any) => {
    setSuspensionUser(userObj);
    setSuspensionReason('');
    setSuspensionDays('7');
  };

  const handleSuspendUser = async () => {
    if (!suspensionUser) return;
    setSuspensionLoading(true);
    try {
      const untilDate = new Date();
      untilDate.setDate(untilDate.getDate() + parseInt(suspensionDays, 10));

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: suspensionUser.id,
          action: 'SUSPEND',
          suspend: true,
          suspensionUntil: untilDate.toISOString(),
          suspensionReason: suspensionReason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to suspend user');

      setCreators(prev => prev.map(u => u.id === suspensionUser.id ? { 
        ...u, 
        isSuspended: true, 
        suspensionUntil: untilDate.toISOString(), 
        suspensionReason: suspensionReason 
      } : u));
      if (selectedUser && selectedUser.id === suspensionUser.id) {
        setSelectedUser((prev: any) => ({ 
          ...prev, 
          isSuspended: true, 
          suspensionUntil: untilDate.toISOString(), 
          suspensionReason: suspensionReason 
        }));
      }
      setSuspensionUser(null);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSuspensionLoading(false);
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'SUSPEND', suspend: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to lift suspension');

      setCreators(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: false, suspensionUntil: null, suspensionReason: null } : u));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev: any) => ({ ...prev, isSuspended: false, suspensionUntil: null, suspensionReason: null }));
      }
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePlanChange = async (userId: string, newPlanId: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'CHANGE_PLAN', planId: newPlanId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change subscription plan');

      const planObj = plans.find(p => p.id === newPlanId);
      setCreators(prev => prev.map(u => u.id === userId ? { ...u, planId: newPlanId, plan: planObj } : u));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev: any) => ({ ...prev, planId: newPlanId, plan: planObj }));
      }
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to permanently delete account "${email}"? This will delete all of their polls, questions, and responses!`)) return;
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');

      setCreators(prev => prev.filter(u => u.id !== userId));
      setSelectedUser(null);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveVerification = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch('/api/admin/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'APPROVE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify account');

      setCreators(prev => prev.map(u => u.id === userId ? { ...u, verificationStatus: 'VERIFIED', isVerifiedUser: true } : u));
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRejectVerification = (userObj: any) => {
    setRejectionUser(userObj);
    setRejectionReason('');
  };

  const handleRejectVerification = async () => {
    if (!rejectionUser || !rejectionReason.trim()) return;
    setRejectionLoading(true);
    try {
      const res = await fetch('/api/admin/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: rejectionUser.id, action: 'REJECT', reason: rejectionReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject verification');

      setCreators(prev => prev.map(u => u.id === rejectionUser.id ? { 
        ...u, 
        verificationStatus: 'REJECTED', 
        isVerifiedUser: false, 
        verificationReason: rejectionReason 
      } : u));
      setRejectionUser(null);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRejectionLoading(false);
    }
  };

  const isFeatureVisible = (featKey: string) => {
    const isPoll = POLL_FEATURES.some(f => f.key === featKey);
    const isSurvey = SURVEY_FEATURES.some(f => f.key === featKey);
    const isExam = EXAM_FEATURES.some(f => f.key === featKey);
    const isExamQType = EXAM_QUESTION_TYPES.some(f => f.key === featKey);
    const isPlatform = PLATFORM_FEATURES.some(f => f.key === featKey);

    // 1. Plan Type category gating
    if (planType === 'POLL_PACK') {
      if (!isPoll && !isPlatform) return false;
    } else if (planType === 'SURVEY_PACK') {
      if (!isSurvey && !isPlatform) return false;
    } else if (planType === 'EXAM_PACK') {
      if (!isExam && !isExamQType && !isPlatform) return false;
    } else if (planType === 'COMBO_PACK') {
      // Filter based on comboTypes selected
      const showPoll = planComboTypes.includes('POLL');
      const showSurvey = planComboTypes.includes('SURVEY');
      const showExam = planComboTypes.includes('EXAM');

      if (isPoll && !showPoll) return false;
      if (isSurvey && !showSurvey) return false;
      if ((isExam || isExamQType) && !showExam) return false;

      // If it belongs to a category that is not selected in combo types, hide it
      if (!isPlatform && (!isPoll || !showPoll) && (!isSurvey || !showSurvey) && (!isExam && !isExamQType || !showExam)) {
        return false;
      }
    }

    // 2. Poll subtype conditional checks (should apply globally if Poll features are active)
    const pollActive = planType === 'SUBSCRIPTION' || planType === 'POLL_PACK' || (planType === 'COMBO_PACK' && planComboTypes.includes('POLL'));
    if (pollActive && isPoll) {
      if ((featKey === 'rankedChoiceBordaCount' || featKey === 'enableDragAndDropPodium' || featKey === 'enableScenarioSimulator') && !planPollSubtypes.ranked) {
        return false;
      }
      if (featKey === 'quadraticVoting' && !planPollSubtypes.mcq) {
        return false;
      }
      if (featKey === 'singleChoiceMultiSelect' && !planPollSubtypes.mcq && !planPollSubtypes.multi) {
        return false;
      }
      if (featKey === 'knockoutBracket' && !planPollSubtypes.knockout) {
        return false;
      }
    }

    return true;
  };

  // Plans CRUD logic
  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanName('');
    setPlanDesc('');
    setPlanPrice('0.0');
    setPlanCycle('MONTHLY');
    setPlanIsFree(false);
    setPlanCurrency('USD');
    setPlanType('SUBSCRIPTION');
    setPlanPackQuantity('10');
    setPlanFreePerks('0');
    setPlanComboTypes(['POLL', 'SURVEY']);
    setPlanBadgeColor('#a855f7');
    setPlanBadgeLabel('');
    setPlanHasFreeTrial(false);
    setPlanFreeTrialDays('7');
    setPlanIsActive(true);

    const resetFeats: Record<string, boolean> = {};
    FEATURES_KEYS.forEach(f => { resetFeats[f.key] = true; });
    setPlanFeatures(resetFeats);

    const resetTrialFeats: Record<string, boolean> = {};
    FEATURES_KEYS.forEach(f => { resetTrialFeats[f.key] = false; });
    setPlanFreeTrialFeatures(resetTrialFeats);

    setPlanPollSubtypes({ mcq: true, ranked: true, multi: true, knockout: true });
    setPlanFormError('');
    setShowPlanForm(true);
  };

  const handleOpenEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanDesc(plan.description || '');
    setPlanPrice(plan.price.toString());
    setPlanCycle(plan.billingCycle);
    setPlanIsFree(plan.isFree);
    setPlanCurrency(plan.currency || 'USD');
    setPlanType(plan.planType || 'SUBSCRIPTION');
    setPlanPackQuantity((plan.packQuantity || 10).toString());
    setPlanFreePerks((plan.freePerks || 0).toString());
    setPlanComboTypes(plan.comboTypes ? plan.comboTypes.split(',') : ['POLL', 'SURVEY']);
    setPlanBadgeColor(plan.badgeColor || '#a855f7');
    setPlanBadgeLabel(plan.badgeLabel || '');
    setPlanHasFreeTrial(plan.hasFreeTrial || false);
    setPlanFreeTrialDays((plan.freeTrialDays || 7).toString());
    setPlanIsActive(plan.isActive !== false);

    let resolvedFeats: Record<string, boolean> = {};
    FEATURES_KEYS.forEach(f => {
      resolvedFeats[f.key] = plan.features ? !!plan.features[f.key] : false;
    });
    setPlanFeatures(resolvedFeats);

    let resolvedTrialFeats: Record<string, boolean> = {};
    FEATURES_KEYS.forEach(f => {
      resolvedTrialFeats[f.key] = plan.freeTrialFeatures ? !!plan.freeTrialFeatures[f.key] : false;
    });
    setPlanFreeTrialFeatures(resolvedTrialFeats);

    let resolvedSubtypes = { mcq: true, ranked: true, multi: true, knockout: true };
    if (plan.pollSubtypes) {
      resolvedSubtypes = {
        mcq: plan.pollSubtypes.includes('mcq'),
        ranked: plan.pollSubtypes.includes('ranked'),
        multi: plan.pollSubtypes.includes('multi'),
        knockout: plan.pollSubtypes.includes('knockout')
      };
    }
    setPlanPollSubtypes(resolvedSubtypes);

    setPlanFormError('');
    setShowPlanForm(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanFormError('');
    setPlanFormLoading(true);

    if (!planName.trim()) {
      setPlanFormError('Plan name is required.');
      setPlanFormLoading(false);
      return;
    }

    const payload = {
      planId: editingPlan?.id,
      name: planName,
      description: planDesc,
      price: planIsFree ? 0 : parseFloat(planPrice),
      isFree: planIsFree,
      currency: planCurrency,
      billingCycle: planCycle,
      planType,
      packQuantity: planType !== 'SUBSCRIPTION' ? parseInt(planPackQuantity) : null,
      freePerks: parseInt(planFreePerks) || 0,
      comboTypes: planType === 'COMBO_PACK' ? planComboTypes.join(',') : null,
      badgeColor: planBadgeColor,
      badgeLabel: planBadgeLabel,
      hasFreeTrial: planHasFreeTrial,
      freeTrialDays: planHasFreeTrial ? parseInt(planFreeTrialDays) : null,
      freeTrialFeatures: planHasFreeTrial ? planFreeTrialFeatures : null,
      pollSubtypes: Object.keys(planPollSubtypes).filter(k => planPollSubtypes[k]).join(','),
      isActive: planIsActive,
      features: planFeatures,
    };

    try {
      const url = '/api/admin/plans';
      const method = editingPlan ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save subscription plan.');

      setShowPlanForm(false);
      fetchAdminData();
    } catch (err: any) {
      setPlanFormError(err.message);
    } finally {
      setPlanFormLoading(false);
    }
  };

  const handleBulkTransfer = async () => {
    if (selectedUserIds.length === 0) {
      alert('No users selected.');
      return;
    }
    if (!bulkTargetPlanId) {
      alert('Please select a target plan.');
      return;
    }
    setBulkTransferLoading(true);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulkTransfer: true,
          targetPlanId: bulkTargetPlanId,
          userIds: selectedUserIds
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to transfer users');
      
      alert(`Successfully transferred ${data.transferred} users.`);
      setSelectedUserIds([]);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBulkTransferLoading(false);
    }
  };

  const handleResolveModeration = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setModLoadingId(id);
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update moderation status');
      
      // Update in local state
      setModerationLogs(prev => prev.map(m => m.id === id ? { ...m, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' } : m));
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModLoadingId(null);
    }
  };

  const handleSaveContactNote = async () => {
    if (!selectedContact) return;
    setContactNoteLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedContact.id,
          adminNote: contactNote,
          status: 'READ'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update contact request');
      
      setSelectedContact(null);
      setContactNote('');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setContactNoteLoading(false);
    }
  };

  const handleSaveSiteConfigs = async () => {
    setConfigSaving(true);
    try {
      const entries = Object.entries(configValues).map(([key, value]) => ({ key, value }));
      const res = await fetch('/api/admin/site-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save site configurations');
      
      alert('Website configurations updated successfully.');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConfigSaving(false);
    }
  };

  const handleAdImageUpload = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setConfigValues(prev => ({
        ...prev,
        [key]: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePlan = async (planId: string, name: string) => {
    if (name === 'Free') {
      alert('The Free plan is the default platform tier and cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to delete subscription plan "${name}"? Any users assigned to it will fallback to no plan settings.`)) return;

    try {
      const res = await fetch(`/api/admin/plans?planId=${planId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete plan.');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Ballot Overrides
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

      // Update creators list created polls state locally
      setCreators((prevCreators) => prevCreators.map(u => {
        const updatedPolls = u.polls.map((p: any) => {
          if (p.id === selectedPoll.id) {
            const updatedVotes = p.votes.map((v: any) =>
              v.id === editingVote.id ? { ...v, answers: JSON.stringify(overrideAnswers) } : v
            );
            return { ...p, votes: updatedVotes };
          }
          return p;
        });
        return { ...u, polls: updatedPolls };
      }));

      setEditingVote(null);
      fetchAdminData();
    } catch (err: any) {
      setOverrideError(err.message);
    } finally {
      setOverrideLoading(false);
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

      // Update local state
      setCreators(prevCreators => prevCreators.map(u => {
        return {
          ...u,
          polls: u.polls.filter((p: any) => p.id !== pollId)
        };
      }));

      if (selectedUser) {
        setSelectedUser((prev: any) => ({
          ...prev,
          polls: prev.polls.filter((p: any) => p.id !== pollId)
        }));
      }

      fetchAdminData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleIssueStatus = async (issueId: string, currentStatus: string) => {
    setIssueLoadingId(issueId);
    try {
      const newStatus = currentStatus === 'PENDING' ? 'RESOLVED' : 'PENDING';
      const res = await fetch('/api/support/issues', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId, status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update issue status.');

      setIssues(prev => prev.map(issue => issue.id === issueId ? { ...issue, status: newStatus } : issue));
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIssueLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-[#030712] min-h-screen">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        <span className="text-gray-400 text-sm mt-4 font-semibold">Opening Admin Console...</span>
      </div>
    );
  }

  // Filtered Users list
  const filteredUsers = creators.filter(c => 
    c.email.toLowerCase().includes(userSearch.toLowerCase()) || 
    (c.fullName || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  // Pending Verifications users list
  const pendingVerifications = creators.filter(c => c.verificationStatus === 'PENDING');

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#030712] text-gray-200">
      
      {/* Header bar */}
      <header className="w-full border-b border-white/5 bg-[#080d1a]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-outfit text-xl font-bold tracking-tight text-white flex items-center gap-2">
                System Admin Console
              </span>
              <p className="text-gray-400 text-[10px] uppercase font-bold mt-0.5">Control creators, verifications, & platform subscription plans</p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold transition-all flex items-center space-x-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Console</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8 relative">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center space-x-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* System Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-card rounded-2xl p-4 border border-white/5 bg-[#080d1a]/50 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Creators</span>
              <span className="text-xl font-bold text-white mt-1 block">{creators.length}</span>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-white/5 bg-[#080d1a]/50 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Verifications</span>
              <span className="text-xl font-bold text-amber-400 mt-1 block">{pendingVerifications.length}</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-white/5 bg-[#080d1a]/50 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Active Tiers</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">{plans.length}</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-white/5 bg-[#080d1a]/50 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Flagged Items</span>
              <span className="text-xl font-bold text-red-400 mt-1 block">
                {moderationLogs.filter(m => m.status === 'PENDING').length}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-white/5 bg-[#080d1a]/50 flex items-center justify-between col-span-2 md:col-span-1">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Contact Inquiries</span>
              <span className="text-xl font-bold text-blue-400 mt-1 block">
                {contactRequests.filter(c => c.status === 'UNREAD').length}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Selectors */}
        <div className="flex border-b border-white/5 space-x-6 pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-xs font-bold transition-all relative uppercase tracking-wider shrink-0 ${
              activeTab === 'users' ? 'text-purple-400 font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Users Management
            {activeTab === 'users' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('verifications')}
            className={`pb-3 text-xs font-bold transition-all relative uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${
              activeTab === 'verifications' ? 'text-purple-400 font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Verification Requests
            {pendingVerifications.length > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[9px] font-bold rounded-full">
                {pendingVerifications.length}
              </span>
            )}
            {activeTab === 'verifications' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`pb-3 text-xs font-bold transition-all relative uppercase tracking-wider shrink-0 ${
              activeTab === 'plans' ? 'text-purple-400 font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Plans Management
            {activeTab === 'plans' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`pb-3 text-xs font-bold transition-all relative uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${
              activeTab === 'moderation' ? 'text-purple-400 font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Content Moderation
            {moderationLogs.filter(m => m.status === 'PENDING').length > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full animate-pulse">
                {moderationLogs.filter(m => m.status === 'PENDING').length}
              </span>
            )}
            {activeTab === 'moderation' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`pb-3 text-xs font-bold transition-all relative uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${
              activeTab === 'contact' ? 'text-purple-400 font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Contact Inquiries
            {contactRequests.filter(c => c.status === 'UNREAD').length > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-bold rounded-full">
                {contactRequests.filter(c => c.status === 'UNREAD').length}
              </span>
            )}
            {activeTab === 'contact' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('site_editor')}
            className={`pb-3 text-xs font-bold transition-all relative uppercase tracking-wider shrink-0 ${
              activeTab === 'site_editor' ? 'text-purple-400 font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Site Editor
            {activeTab === 'site_editor' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 text-xs font-bold transition-all relative uppercase tracking-wider shrink-0 ${
              activeTab === 'logs' ? 'text-purple-400 font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Audit Ledgers
            {activeTab === 'logs' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`pb-3 text-xs font-bold transition-all relative uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${
              activeTab === 'issues' ? 'text-purple-400 font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Platform Issues
            {issues.filter(i => i.status === 'PENDING').length > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                {issues.filter(i => i.status === 'PENDING').length}
              </span>
            )}
            {activeTab === 'issues' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
            )}
          </button>
        </div>

        {/* TAB 1: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search user email or legal name..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-purple-500/60 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedUserIds.length > 0 && (
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-in">
                <span className="text-xs text-purple-300 font-semibold">
                  Selected {selectedUserIds.length} creator accounts
                </span>
                <div className="flex items-center gap-3">
                  <select
                    value={bulkTargetPlanId}
                    onChange={e => setBulkTargetPlanId(e.target.value)}
                    className="bg-[#030712] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                  >
                    <option value="">-- Choose Target Plan --</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.isFree ? 'Free' : `${p.currency} ${p.price}`})</option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkTransfer}
                    disabled={bulkTransferLoading || !bulkTargetPlanId}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                  >
                    {bulkTransferLoading ? 'Transferring...' : 'Transfer Selected'}
                  </button>
                </div>
              </div>
            )}

            <div className="glass-card rounded-3xl border border-white/5 bg-[#080d1a] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase font-bold tracking-wider bg-white/2">
                      <th className="p-4 w-10">
                        <input 
                          type="checkbox" 
                          checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds(filteredUsers.map(u => u.id));
                            } else {
                              setSelectedUserIds([]);
                            }
                          }}
                          className="rounded border-white/20 bg-white/5 text-purple-600 focus:ring-0" 
                        />
                      </th>
                      <th className="p-4">User</th>
                      <th className="p-4">Demographics</th>
                      <th className="p-4">Active Plan</th>
                      <th className="p-4">Activity Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500 italic">No users found.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isUserSuspended = u.isSuspended && (!u.suspensionUntil || new Date() < new Date(u.suspensionUntil));
                        return (
                          <tr key={u.id} className="hover:bg-white/2 transition-colors">
                            <td className="p-4 w-10">
                              <input 
                                type="checkbox" 
                                checked={selectedUserIds.includes(u.id)} 
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUserIds([...selectedUserIds, u.id]);
                                  } else {
                                    setSelectedUserIds(selectedUserIds.filter(id => id !== u.id));
                                  }
                                }}
                                className="rounded border-white/20 bg-white/5 text-purple-600 focus:ring-0" 
                              />
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                                  {u.fullName ? u.fullName.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                                </div>
                                <div className="truncate max-w-[200px]">
                                  <span className="font-semibold text-white block truncate flex items-center gap-1">
                                    {u.fullName || 'Anonymous User'}
                                    {u.isVerifiedUser && (
                                      <span className="inline-flex items-center justify-center p-0.5 bg-blue-500 text-white rounded-full" title="Verified Account">
                                        <Check className="w-2 h-2 stroke-[4]" />
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-mono block truncate">{u.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[10px] font-bold text-gray-400">
                                {u.occupation || 'UNSPECIFIED'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span 
                                className="px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit"
                                style={{
                                  backgroundColor: `${u.plan?.badgeColor || '#a855f7'}1A`,
                                  borderColor: `${u.plan?.badgeColor || '#a855f7'}33`,
                                  color: u.plan?.badgeColor || '#a855f7'
                                }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: u.plan?.badgeColor || '#a855f7' }} />
                                {u.plan?.badgeLabel || u.plan?.name || 'Free'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1.5">
                                {u.isBanned && (
                                  <span className="px-2 py-0.5 bg-red-500/15 border border-red-500/30 text-red-400 text-[9px] font-bold uppercase rounded">Banned</span>
                                )}
                                {isUserSuspended && (
                                  <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] font-bold uppercase rounded">Suspended</span>
                                )}
                                {u.isActivityRestricted && (
                                  <span className="px-2 py-0.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[9px] font-bold uppercase rounded">Restricted</span>
                                )}
                                {!u.isBanned && !isUserSuspended && !u.isActivityRestricted && (
                                  <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase rounded">Active</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setSelectedUser(u)}
                                className="px-3 py-1.5 rounded-lg font-bold bg-purple-500/15 border border-purple-500/20 text-purple-300 hover:bg-purple-600 hover:text-white transition-all"
                              >
                                Inspect Profile
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VERIFICATION REQUESTS */}
        {activeTab === 'verifications' && (
          <div className="glass-card rounded-3xl p-6 border border-white/5 bg-[#080d1a] space-y-6">
            <div className="flex items-center space-x-2 pb-4 border-b border-white/5">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              <h3 className="font-outfit text-lg font-bold text-white">Pending Creator Verification Approvals</h3>
            </div>

            <div className="space-y-4">
              {pendingVerifications.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-500 italic">
                  No pending verification applications found.
                </div>
              ) : (
                pendingVerifications.map((reqUser) => (
                  <div key={reqUser.id} className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 truncate max-w-md">
                      <h4 className="font-bold text-white flex items-center gap-1.5">
                        {reqUser.fullName || 'Anonymous Legal Name'}
                        <span className="text-[10px] text-gray-500 font-mono">({reqUser.email})</span>
                      </h4>
                      <p className="text-[10px] text-gray-400">Occupation Role: <strong className="text-gray-200">{reqUser.occupation}</strong> at <strong className="text-gray-200">{reqUser.institution || 'N/A'}</strong></p>
                      
                      <div className="pt-2">
                        <a
                          href={reqUser.verificationDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white transition-all text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <span>Open Google Drive Proof Link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleApproveVerification(reqUser.id)}
                        disabled={actionLoadingId === reqUser.id}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1 shadow-md shadow-emerald-500/10"
                      >
                        {actionLoadingId === reqUser.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleOpenRejectVerification(reqUser)}
                        disabled={actionLoadingId === reqUser.id}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PLANS MANAGEMENT */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-outfit text-lg font-bold text-white">Subscription Tiers Plan Matrix</h3>
                <p className="text-gray-500 text-xs mt-0.5">Control pricing cycles and toggle precise platform feature flags.</p>
              </div>
              <button
                onClick={handleOpenCreatePlan}
                className="px-4 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-purple-500/20 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Plan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => {
                const featsCount = p.features ? Object.values(p.features).filter(Boolean).length : 0;
                
                // Determine currency prefix
                let currSymbol = '$';
                if (p.currency === 'INR') currSymbol = '₹';
                else if (p.currency === 'EUR') currSymbol = '€';
                else if (p.currency === 'GBP') currSymbol = '£';
                else if (p.currency === 'AUTO') currSymbol = 'Geo ';

                return (
                  <div key={p.id} className={`glass-card rounded-3xl p-6 border bg-[#080d1a] flex flex-col justify-between hover:border-white/10 transition-all relative ${
                    !p.isActive ? 'opacity-60 border-dashed border-white/5' : 'border-white/5'
                  }`}>
                    {/* Active/Inactive state & Badge preview */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      {p.badgeLabel && (
                        <span 
                          className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border"
                          style={{
                            backgroundColor: `${p.badgeColor || '#a855f7'}1A`,
                            borderColor: `${p.badgeColor || '#a855f7'}40`,
                            color: p.badgeColor || '#a855f7'
                          }}
                        >
                          {p.badgeLabel}
                        </span>
                      )}
                      <span className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-gray-500'}`} title={p.isActive ? 'Active Plan' : 'Inactive Plan'} />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-[10px] text-gray-500 uppercase font-extrabold tracking-widest">{p.billingCycle} billing</span>
                        <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                          {featsCount} Features
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-outfit text-xl font-extrabold text-white flex items-center gap-2">
                          {p.name}
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-400 uppercase">
                            {p.planType || 'SUBSCRIPTION'}
                          </span>
                        </h4>
                        <p className="text-gray-400 text-xs mt-1 leading-relaxed line-clamp-2">{p.description || 'No plan details provided.'}</p>
                      </div>

                      {/* Display trial & pack information */}
                      {(p.hasFreeTrial || p.packQuantity) && (
                        <div className="p-3 rounded-xl bg-white/2 border border-white/5 text-[10px] text-gray-400 space-y-1">
                          {p.hasFreeTrial && (
                            <div className="flex items-center justify-between">
                              <span>Free Trial Period:</span>
                              <strong className="text-purple-300 font-bold">{p.freeTrialDays || 7} Days</strong>
                            </div>
                          )}
                          {p.planType !== 'SUBSCRIPTION' && p.packQuantity && (
                            <div className="flex items-center justify-between">
                              <span>Pack Allowance:</span>
                              <strong className="text-emerald-300 font-bold">
                                {p.packQuantity} Items {p.freePerks > 0 && `(+ ${p.freePerks} Bonus)`}
                              </strong>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-2">
                        {p.isFree ? (
                          <span className="font-outfit text-3xl font-black text-white">FREE</span>
                        ) : (
                          <>
                            <span className="font-outfit text-3xl font-black text-white">{currSymbol}{p.price.toFixed(2)}</span>
                            <span className="text-gray-500 text-[11px] font-bold"> / Cycle</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                      <button
                        onClick={() => handleOpenEditPlan(p)}
                        className="flex-1 py-2 bg-white/5 border border-white/8 hover:border-white/15 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeletePlan(p.id, p.name)}
                        disabled={p.name === 'Free'}
                        className="p-2 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Delete Subscription Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LEDGERS */}
        {activeTab === 'logs' && (
          <div className="glass-card rounded-3xl p-6 border border-white/5 bg-[#080d1a] space-y-6">
            <div className="flex items-center space-x-2.5 border-b border-white/5 pb-4">
              <FileText className="w-5 h-5 text-purple-400" />
              <h3 className="font-outfit text-lg font-bold text-white">Platform System Audit Ledger</h3>
            </div>

            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 italic">
                No system logs recorded.
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
                    <div className="text-[10px] text-gray-500 font-semibold">
                      <span>Administrator Account: {l.admin?.email || 'System'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PLATFORM ISSUES */}
        {activeTab === 'issues' && (
          <div className="glass-card rounded-3xl p-6 border border-white/5 bg-[#080d1a] space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
              <div className="flex items-center space-x-2.5">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-outfit text-lg font-bold text-white">Platform Support & Issues Log</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Inspect user reported bugs and toggle their resolution status.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                  {issues.filter(i => i.status === 'PENDING').length} Pending
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  {issues.filter(i => i.status === 'RESOLVED').length} Resolved
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {issues.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-500 italic">
                  No issues have been reported yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/1">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase font-bold tracking-wider bg-white/2">
                        <th className="p-4">Contact Email</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Reported On Page</th>
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {issues.map((item) => {
                        const isPending = item.status === 'PENDING';
                        return (
                          <tr key={item.id} className="hover:bg-white/2 transition-colors">
                            <td className="p-4 font-semibold text-white">
                              <a href={`mailto:${item.email}`} className="text-indigo-400 hover:underline flex items-center gap-1 font-mono">
                                {item.email}
                              </a>
                            </td>
                            <td className="p-4">
                              <p className="whitespace-pre-wrap max-w-md leading-relaxed text-gray-300">
                                {item.description}
                              </p>
                            </td>
                            <td className="p-4">
                              {item.pageUrl ? (
                                <a 
                                  href={item.pageUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/20 text-indigo-400 text-[10px] font-medium inline-flex items-center gap-1 max-w-[200px] truncate"
                                  title={item.pageUrl}
                                >
                                  <span className="truncate">{item.pageUrl.replace(/https?:\/\/[^\/]+/, '') || '/'}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              ) : (
                                <span className="text-gray-500 italic">Not available</span>
                              )}
                            </td>
                            <td className="p-4 text-[10px] text-gray-500 font-mono">
                              {new Date(item.createdAt).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase ${
                                isPending 
                                  ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleToggleIssueStatus(item.id, item.status)}
                                disabled={issueLoadingId === item.id}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ml-auto ${
                                  isPending
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow shadow-emerald-500/10'
                                    : 'bg-white/5 border border-white/8 hover:border-white/15 hover:bg-white/10 text-gray-400 hover:text-white'
                                }`}
                              >
                                {issueLoadingId === item.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : isPending ? (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Mark Resolved</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reopen Issue</span>
                                  </>
                                )}
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
          </div>
        )}

        {/* TAB 6: CONTENT MODERATION */}
        {activeTab === 'moderation' && (
          <div className="glass-card rounded-3xl p-6 border border-white/5 bg-[#080d1a] space-y-6">
            <div className="flex items-center space-x-2 pb-4 border-b border-white/5">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-outfit text-lg font-bold text-white">Content Moderation & Flagged Items</h3>
                <p className="text-gray-500 text-xs mt-0.5">Inspect items flagged by AI for offensive, toxic, or explicit content.</p>
              </div>
            </div>

            <div className="space-y-4">
              {moderationLogs.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-500 italic">
                  No content has been flagged by the AI.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/1">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase font-bold tracking-wider bg-white/2">
                        <th className="p-4">Flagged Item Details</th>
                        <th className="p-4">Reason For Flag</th>
                        <th className="p-4">Violating text Snippet</th>
                        <th className="p-4">Created On</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {moderationLogs.map((log) => {
                        const isPending = log.status === 'PENDING';
                        return (
                          <tr key={log.id} className="hover:bg-white/2 transition-colors">
                            <td className="p-4">
                              <span className="font-semibold text-white block">{log.poll?.title || 'Untitled Poll'}</span>
                              <span className="text-[10px] text-gray-500 block font-mono">ID: {log.pollId}</span>
                              <span className="text-[10px] text-indigo-400 block font-semibold">Creator: {log.poll?.creator?.email || 'N/A'}</span>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-medium text-[10px]">
                                {log.reason}
                              </span>
                            </td>
                            <td className="p-4 max-w-xs">
                              <p className="font-mono text-[11px] text-amber-300 bg-white/5 border border-white/5 p-2 rounded-lg max-h-24 overflow-y-auto whitespace-pre-wrap animate-pulse-glow">
                                {log.flaggedText || 'N/A'}
                              </p>
                            </td>
                            <td className="p-4 text-gray-500 font-mono text-[10px]">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase ${
                                log.status === 'PENDING' 
                                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                                  : log.status === 'APPROVED'
                                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
                              }`}>
                                {log.status}
                              </span>
                              {log.reviewedBy && (
                                <span className="block text-[9px] text-gray-500 mt-1 font-semibold">By: {log.reviewedBy}</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              {isPending ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleResolveModeration(log.id, 'APPROVE')}
                                    disabled={modLoadingId === log.id}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow shadow-emerald-500/10"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleResolveModeration(log.id, 'REJECT')}
                                    disabled={modLoadingId === log.id}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow shadow-red-500/10"
                                  >
                                    Block
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-[11px] italic">Resolved</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: CONTACT REQUESTS */}
        {activeTab === 'contact' && (
          <div className="glass-card rounded-3xl p-6 border border-white/5 bg-[#080d1a] space-y-6">
            <div className="flex items-center space-x-2 pb-4 border-b border-white/5">
              <FileText className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-outfit text-lg font-bold text-white">Contact & Support Requests</h3>
                <p className="text-gray-500 text-xs mt-0.5">Inspect inquiries sent via the Contact Us form.</p>
              </div>
            </div>

            <div className="space-y-4">
              {contactRequests.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-500 italic">
                  No contact requests received yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/1">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase font-bold tracking-wider bg-white/2">
                        <th className="p-4">Sender</th>
                        <th className="p-4">Subject</th>
                        <th className="p-4">Message Snippet</th>
                        <th className="p-4">Submitted On</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {contactRequests.map((reqItem) => {
                        const isUnread = reqItem.status === 'UNREAD';
                        return (
                          <tr key={reqItem.id} className="hover:bg-white/2 transition-colors">
                            <td className="p-4">
                              <span className="font-bold text-white block">{reqItem.name}</span>
                              <span className="text-[10px] text-gray-500 block font-mono">{reqItem.email}</span>
                            </td>
                            <td className="p-4 font-semibold text-gray-300">
                              {reqItem.subject}
                            </td>
                            <td className="p-4 max-w-xs truncate">
                              <span className="text-gray-400 truncate block">{reqItem.message}</span>
                            </td>
                            <td className="p-4 text-gray-500 font-mono text-[10px]">
                              {new Date(reqItem.createdAt).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                isUnread 
                                  ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 animate-pulse' 
                                  : 'bg-white/5 border border-white/5 text-gray-400'
                              }`}>
                                {reqItem.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedContact(reqItem);
                                  setContactNote(reqItem.adminNote || '');
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/15 border border-purple-500/20 text-purple-300 hover:bg-purple-600 hover:text-white transition-all"
                              >
                                View & Annotate
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
          </div>
        )}

        {/* TAB 8: WEBSITE CONTENT EDITOR */}
        {activeTab === 'site_editor' && (
          <div className="glass-card rounded-3xl p-6 border border-white/5 bg-[#080d1a] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center space-x-2.5">
                <Edit2 className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-outfit text-lg font-bold text-white">Website Content Editor</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Edit copy on the home page, about page, contact page, and footer live.</p>
                </div>
              </div>
              <button
                onClick={handleSaveSiteConfigs}
                disabled={configSaving}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
              >
                {configSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Save All Changes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 🛡️ Global Platform Operations Control Panel */}
              <div className="space-y-4 border border-white/5 rounded-2xl p-5 bg-white/1 col-span-1 md:col-span-2">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-purple-400">🛡️ Global Platform Operations Control Panel</h4>
                  <p className="text-gray-500 text-[9px] uppercase font-bold mt-0.5">Enforce system lockdowns, restrict logins, or activate absolute voter verification filters platform-wide</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. Maintenance Mode Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#030712] border border-white/5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 block">Maintenance Mode</span>
                      <span className="text-gray-500 text-[9px]">Gates platform access; Admins bypass only</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfigValues({ ...configValues, maintenance_mode_enabled: configValues['maintenance_mode_enabled'] === 'true' ? 'false' : 'true' })}
                      className="text-purple-400 hover:text-purple-300 transition-all focus:outline-none shrink-0 ml-2"
                    >
                      {configValues['maintenance_mode_enabled'] === 'true' ? (
                        <ToggleRight className="w-9 h-9 stroke-[1.5]" />
                      ) : (
                        <ToggleLeft className="w-9 h-9 text-gray-600 stroke-[1.5]" />
                      )}
                    </button>
                  </div>

                  {/* 2. New Registrations Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#030712] border border-white/5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 block">Suspsend New Signups</span>
                      <span className="text-gray-500 text-[9px]">Lock registrations globally on the database</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfigValues({ ...configValues, new_signups_enabled: configValues['new_signups_enabled'] === 'false' ? 'true' : 'false' })}
                      className="text-purple-400 hover:text-purple-300 transition-all focus:outline-none shrink-0 ml-2"
                    >
                      {configValues['new_signups_enabled'] === 'false' ? (
                        <ToggleRight className="w-9 h-9 stroke-[1.5]" />
                      ) : (
                        <ToggleLeft className="w-9 h-9 text-gray-600 stroke-[1.5]" />
                      )}
                    </button>
                  </div>

                  {/* 3. Global OTP Verification Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#030712] border border-white/5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 block">Global Voter OTP Gate</span>
                      <span className="text-gray-500 text-[9px]">Force OTP voter verification across all sessions</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfigValues({ ...configValues, force_global_otp_voter_verification: configValues['force_global_otp_voter_verification'] === 'true' ? 'false' : 'true' })}
                      className="text-purple-400 hover:text-purple-300 transition-all focus:outline-none shrink-0 ml-2"
                    >
                      {configValues['force_global_otp_voter_verification'] === 'true' ? (
                        <ToggleRight className="w-9 h-9 stroke-[1.5]" />
                      ) : (
                        <ToggleLeft className="w-9 h-9 text-gray-600 stroke-[1.5]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Home Page Copy */}
              <div className="space-y-4 border border-white/5 rounded-2xl p-5 bg-white/1">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-purple-400 border-b border-white/5 pb-2">Home Page Hero</h4>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Hero Main Title</label>
                  <input
                    type="text"
                    value={configValues['landing_hero_title'] || 'The Ultimate Platform for Interactive Elections & Polls'}
                    onChange={e => setConfigValues({ ...configValues, landing_hero_title: e.target.value })}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Hero Subtitle</label>
                  <textarea
                    rows={3}
                    value={configValues['landing_hero_subtitle'] || 'Create highly secure, real-time, and mobile-friendly polls. See live result charts, track voter groups, count ranked choices, and view voter maps instantly.'}
                    onChange={e => setConfigValues({ ...configValues, landing_hero_subtitle: e.target.value })}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500 resize-none"
                  />
                </div>
              </div>

              {/* About Us Page Copy */}
              <div className="space-y-4 border border-white/5 rounded-2xl p-5 bg-white/1">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-purple-400 border-b border-white/5 pb-2">About Page Content</h4>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Company Mission Statement</label>
                  <textarea
                    rows={3}
                    value={configValues['about_company_mission'] || 'At Pollstar, our mission is to empower teams, organizations, and educators with beautifully simple yet highly sophisticated voting and evaluation tools.'}
                    onChange={e => setConfigValues({ ...configValues, about_company_mission: e.target.value })}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500 resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Company History Copy</label>
                  <textarea
                    rows={2}
                    value={configValues['about_history'] || 'Founded in 2026, Pollstar was built by engineers frustrated by archaic, complex survey systems.'}
                    onChange={e => setConfigValues({ ...configValues, about_history: e.target.value })}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500 resize-none"
                  />
                </div>
              </div>

              {/* Contact Us Info */}
              <div className="space-y-4 border border-white/5 rounded-2xl p-5 bg-white/1">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-purple-400 border-b border-white/5 pb-2">Contact Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Contact Email</label>
                    <input
                      type="text"
                      value={configValues['contact_email'] || 'support@pollstar.com'}
                      onChange={e => setConfigValues({ ...configValues, contact_email: e.target.value })}
                      className="w-full bg-[#030712] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Contact Phone</label>
                    <input
                      type="text"
                      value={configValues['contact_phone'] || '+1 (555) 019-2834'}
                      onChange={e => setConfigValues({ ...configValues, contact_phone: e.target.value })}
                      className="w-full bg-[#030712] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">HQ Address</label>
                  <input
                    type="text"
                    value={configValues['contact_address'] || '100 Innovation Way, Suite 400, San Francisco, CA'}
                    onChange={e => setConfigValues({ ...configValues, contact_address: e.target.value })}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Footer Text */}
              <div className="space-y-4 border border-white/5 rounded-2xl p-5 bg-white/1">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-purple-400 border-b border-white/5 pb-2">Footer Details</h4>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Footer Tagline</label>
                  <input
                    type="text"
                    value={configValues['footer_tagline'] || 'The premium platform for real-time polls, surveys & exams.'}
                    onChange={e => setConfigValues({ ...configValues, footer_tagline: e.target.value })}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Copyright Text</label>
                  <input
                    type="text"
                    value={configValues['footer_copyright'] || '© 2026 Pollstar. All rights reserved.'}
                    onChange={e => setConfigValues({ ...configValues, footer_copyright: e.target.value })}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* 🎯 Global Advertising & Monetization Control */}
              <div className="col-span-1 md:col-span-2 space-y-6 border border-white/5 rounded-2xl p-6 bg-white/1">
                <div className="border-b border-white/5 pb-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-purple-400">🎯 Global Advertising & Monetization Control</h4>
                  <p className="text-gray-500 text-[10px] uppercase font-bold mt-0.5">Paste third-party script integrations or upload custom image banners for targeted monetization</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Network Ad Agencies */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#030712] border border-white/5">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 block">Enable Network Script Ads</span>
                        <span className="text-gray-500 text-[9px]">Google AdSense, Media.net scripts injection</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfigValues({ ...configValues, ad_network_enabled: configValues['ad_network_enabled'] === 'true' ? 'false' : 'true' })}
                        className="text-purple-400 hover:text-purple-300 transition-all focus:outline-none"
                      >
                        {configValues['ad_network_enabled'] === 'true' ? (
                          <ToggleRight className="w-9 h-9 stroke-[1.5]" />
                        ) : (
                          <ToggleLeft className="w-9 h-9 text-gray-600 stroke-[1.5]" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Google AdSense Integration Snippet</label>
                      <textarea
                        rows={4}
                        placeholder="Paste your Google AdSense <script> tags or header code..."
                        value={configValues['ad_google_adsense_code'] || ''}
                        onChange={e => setConfigValues({ ...configValues, ad_google_adsense_code: e.target.value })}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500 font-mono resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Media.net / Generic Ad Script Snippet</label>
                      <textarea
                        rows={4}
                        placeholder="Paste Media.net or other advertising agency script code..."
                        value={configValues['ad_medianet_code'] || ''}
                        onChange={e => setConfigValues({ ...configValues, ad_medianet_code: e.target.value })}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500 font-mono resize-none"
                      />
                    </div>
                  </div>

                  {/* Right Column: Custom Upload Banner Advertisements */}
                  <div className="space-y-4 border-l border-white/5 pl-0 md:pl-6">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#030712] border border-white/5">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 block">Enable Custom Image Ads</span>
                        <span className="text-gray-500 text-[9px]">Render uploaded image banners on different viewports</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfigValues({ ...configValues, ad_custom_enabled: configValues['ad_custom_enabled'] === 'true' ? 'false' : 'true' })}
                        className="text-purple-400 hover:text-purple-300 transition-all focus:outline-none"
                      >
                        {configValues['ad_custom_enabled'] === 'true' ? (
                          <ToggleRight className="w-9 h-9 stroke-[1.5]" />
                        ) : (
                          <ToggleLeft className="w-9 h-9 text-gray-600 stroke-[1.5]" />
                        )}
                      </button>
                    </div>

                    {/* Desktop Custom Banner */}
                    <div className="p-3 rounded-xl bg-white/2 border border-white/5 space-y-3">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-400 font-bold block">Desktop Custom Banner Layout (970x90 or 728x90)</span>
                      <div className="grid grid-cols-2 gap-3 items-center">
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 block">Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleAdImageUpload(e, 'ad_custom_desktop_image')}
                            className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-white/5 file:text-indigo-400 hover:file:bg-white/10 file:cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 block">Redirection Link</span>
                          <input
                            type="text"
                            placeholder="https://example.com/target"
                            value={configValues['ad_custom_desktop_link'] || ''}
                            onChange={e => setConfigValues({ ...configValues, ad_custom_desktop_link: e.target.value })}
                            className="w-full bg-[#030712] border border-white/10 rounded-lg px-2.5 py-1 text-[10px] text-white outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                      {configValues['ad_custom_desktop_image'] && (
                        <div className="relative rounded-lg overflow-hidden border border-white/5 max-h-12 bg-black flex items-center justify-center">
                          <img src={configValues['ad_custom_desktop_image']} alt="Desktop Preview" className="max-h-12 w-auto object-contain" />
                          <button
                            type="button"
                            onClick={() => setConfigValues({ ...configValues, ad_custom_desktop_image: '' })}
                            className="absolute top-1 right-1 p-0.5 rounded bg-black/60 hover:bg-black text-gray-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Tablet Custom Banner */}
                    <div className="p-3 rounded-xl bg-white/2 border border-white/5 space-y-3">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-400 font-bold block">Tablet Custom Banner Layout (728x90 or 468x60)</span>
                      <div className="grid grid-cols-2 gap-3 items-center">
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 block">Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleAdImageUpload(e, 'ad_custom_tablet_image')}
                            className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-white/5 file:text-indigo-400 hover:file:bg-white/10 file:cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 block">Redirection Link</span>
                          <input
                            type="text"
                            placeholder="https://example.com/target"
                            value={configValues['ad_custom_tablet_link'] || ''}
                            onChange={e => setConfigValues({ ...configValues, ad_custom_tablet_link: e.target.value })}
                            className="w-full bg-[#030712] border border-white/10 rounded-lg px-2.5 py-1 text-[10px] text-white outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                      {configValues['ad_custom_tablet_image'] && (
                        <div className="relative rounded-lg overflow-hidden border border-white/5 max-h-12 bg-black flex items-center justify-center">
                          <img src={configValues['ad_custom_tablet_image']} alt="Tablet Preview" className="max-h-12 w-auto object-contain" />
                          <button
                            type="button"
                            onClick={() => setConfigValues({ ...configValues, ad_custom_tablet_image: '' })}
                            className="absolute top-1 right-1 p-0.5 rounded bg-black/60 hover:bg-black text-gray-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Mobile Custom Banner */}
                    <div className="p-3 rounded-xl bg-white/2 border border-white/5 space-y-3">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-400 font-bold block">Mobile Custom Banner Layout (320x50 or 300x50)</span>
                      <div className="grid grid-cols-2 gap-3 items-center">
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 block">Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleAdImageUpload(e, 'ad_custom_mobile_image')}
                            className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-white/5 file:text-indigo-400 hover:file:bg-white/10 file:cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 block">Redirection Link</span>
                          <input
                            type="text"
                            placeholder="https://example.com/target"
                            value={configValues['ad_custom_mobile_link'] || ''}
                            onChange={e => setConfigValues({ ...configValues, ad_custom_mobile_link: e.target.value })}
                            className="w-full bg-[#030712] border border-white/10 rounded-lg px-2.5 py-1 text-[10px] text-white outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                      {configValues['ad_custom_mobile_image'] && (
                        <div className="relative rounded-lg overflow-hidden border border-white/5 max-h-12 bg-black flex items-center justify-center">
                          <img src={configValues['ad_custom_mobile_image']} alt="Mobile Preview" className="max-h-12 w-auto object-contain" />
                          <button
                            type="button"
                            onClick={() => setConfigValues({ ...configValues, ad_custom_mobile_image: '' })}
                            className="absolute top-1 right-1 p-0.5 rounded bg-black/60 hover:bg-black text-gray-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ── USER INSPECTOR MODAL ────────────────────────────────────────── */}
      {selectedUser && (
        <div className="fixed inset-0 bg-[#020612]/95 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-card rounded-3xl border border-white/10 p-6 md:p-8 max-w-4xl w-full bg-[#080d1a] relative max-h-[90vh] overflow-y-auto space-y-8 animate-fade-in">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all p-1 bg-white/5 rounded-lg border border-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-600/20 text-purple-400 flex items-center justify-center text-3xl font-extrabold shrink-0">
                  {selectedUser.fullName ? selectedUser.fullName.charAt(0).toUpperCase() : selectedUser.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-outfit text-2xl font-bold text-white flex items-center gap-2">
                    {selectedUser.fullName || 'Anonymous Account'}
                    {selectedUser.isVerifiedUser && (
                      <span className="inline-flex items-center justify-center p-0.5 bg-blue-500 text-white rounded-full" title="Verified Creator">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-400 font-mono mt-0.5">{selectedUser.email}</p>
                </div>
              </div>

              {/* Status flag Indicators */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  selectedUser.isBanned 
                    ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  {selectedUser.isBanned ? 'BANNED' : 'UNBANNED'}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  selectedUser.isSuspended 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  {selectedUser.isSuspended ? 'SUSPENDED' : 'UNSUSPENDED'}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  selectedUser.isActivityRestricted 
                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  {selectedUser.isActivityRestricted ? 'PRIVILEGES LOCKED' : 'CREATION ACTIVE'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Demographic Details Column */}
              <div className="md:col-span-1 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/5 pb-1">Demographics Profile</h4>
                  
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-gray-500 font-bold block uppercase text-[9px]">Occupation Role</span>
                      <span className="text-white font-medium">{selectedUser.occupation || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-bold block uppercase text-[9px]">Institution / Co.</span>
                      <span className="text-white font-medium">{selectedUser.institution || 'N/A'}</span>
                    </div>
                    {selectedUser.gender && (
                      <div>
                        <span className="text-gray-500 font-bold block uppercase text-[9px]">Gender</span>
                        <span className="text-white font-medium">{selectedUser.gender}</span>
                      </div>
                    )}
                    {selectedUser.phoneNumber && (
                      <div>
                        <span className="text-gray-500 font-bold block uppercase text-[9px]">Phone Number</span>
                        <span className="text-white font-medium">{selectedUser.phoneNumber}</span>
                      </div>
                    )}
                    {selectedUser.bio && (
                      <div>
                        <span className="text-gray-500 font-bold block uppercase text-[9px]">Profile Biography</span>
                        <p className="text-gray-300 mt-1 leading-relaxed bg-white/2 border border-white/5 p-3 rounded-xl italic">"{selectedUser.bio}"</p>
                      </div>
                    )}

                    {/* Specific details */}
                    {selectedUser.occupation === 'STUDENT' && (
                      <>
                        <div>
                          <span className="text-gray-500 font-bold block uppercase text-[9px]">Field of Study</span>
                          <span className="text-white font-medium">{selectedUser.studyField}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 font-bold block uppercase text-[9px]">Graduation Year</span>
                          <span className="text-white font-medium">{selectedUser.gradYear}</span>
                        </div>
                      </>
                    )}
                    {selectedUser.occupation === 'PROFESSIONAL' && (
                      <>
                        <div>
                          <span className="text-gray-500 font-bold block uppercase text-[9px]">Job Title</span>
                          <span className="text-white font-medium">{selectedUser.jobTitle}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 font-bold block uppercase text-[9px]">Industry</span>
                          <span className="text-white font-medium">{selectedUser.industry}</span>
                        </div>
                      </>
                    )}
                    {selectedUser.occupation === 'EDUCATOR' && (
                      <>
                        <div>
                          <span className="text-gray-500 font-bold block uppercase text-[9px]">Subject</span>
                          <span className="text-white font-medium">{selectedUser.educatorSubject}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 font-bold block uppercase text-[9px]">Department</span>
                          <span className="text-white font-medium">{selectedUser.educatorDept}</span>
                        </div>
                      </>
                    )}
                    {selectedUser.occupation === 'RESEARCHER' && (
                      <>
                        <div>
                          <span className="text-gray-500 font-bold block uppercase text-[9px]">Research Domain</span>
                          <span className="text-white font-medium">{selectedUser.researchDomain}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 font-bold block uppercase text-[9px]">Position</span>
                          <span className="text-white font-medium">{selectedUser.researchPos}</span>
                        </div>
                      </>
                    )}
                    {selectedUser.occupation === 'OTHER' && (
                      <div>
                        <span className="text-gray-500 font-bold block uppercase text-[9px]">Custom details</span>
                        <span className="text-white font-medium">{selectedUser.otherDetail}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subscription Switcher Dropdown */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block flex items-center gap-1">
                    👑 Manual Administrative Plan Switcher
                  </label>
                  <p className="text-[9px] text-gray-500 leading-normal">
                    Directly grant plan access and upgrade the creator tier without payment or billing checks. Only admins have this bypass privilege.
                  </p>
                  <select
                    value={selectedUser.planId || ''}
                    onChange={(e) => handlePlanChange(selectedUser.id, e.target.value)}
                    disabled={actionLoadingId === selectedUser.id}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="" disabled>-- Select Subscription --</option>
                    {plans.map((pl) => (
                      <option key={pl.id} value={pl.id}>{pl.name} (${pl.price.toFixed(2)}) - Admin Bypass</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Middle Section: User Polls list */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Created Session Registries</h4>
                  <span className="text-xs text-purple-300 font-bold">{selectedUser.polls?.length || 0} Polls Launched</span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {!selectedUser.polls || selectedUser.polls.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500 italic bg-white/1 rounded-2xl border border-dashed border-white/5">
                      This user hasn't created any surveys or polls.
                    </div>
                  ) : (
                    selectedUser.polls.map((pl: any) => (
                      <div key={pl.id} className="p-3.5 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 flex items-center justify-between gap-4 transition-colors">
                        <div className="truncate space-y-1">
                          <h5 className="font-bold text-white text-xs truncate max-w-[320px]">{pl.title}</h5>
                          <div className="flex items-center space-x-2.5 text-[9px] text-gray-500 font-bold uppercase tracking-wide">
                            <span className={pl.pollType === 'SURVEY' ? 'text-violet-400' : 'text-blue-400'}>{pl.pollType}</span>
                            <span>•</span>
                            <span>{pl.votes?.length || 0} Votes</span>
                            <span>•</span>
                            <span className={pl.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}>{pl.status}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            onClick={() => setSelectedPoll(pl)}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Override Ballot</span>
                          </button>
                          <button
                            onClick={() => handleDeletePoll(pl.id, pl.title)}
                            className="p-1.5 bg-red-500/5 border border-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                            title="Delete Poll permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Moderation Controls Trigger Buttons */}
                <div className="border-t border-white/5 pt-6 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Moderator Access Restrictions</h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Ban Account */}
                    <button
                      onClick={() => handleToggleBan(selectedUser.id, selectedUser.isBanned)}
                      disabled={actionLoadingId === selectedUser.id}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        selectedUser.isBanned
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                          : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
                      }`}
                    >
                      {selectedUser.isBanned ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{selectedUser.isBanned ? 'Lift Ban' : 'Permanently Ban'}</span>
                    </button>

                    {/* Suspension triggers */}
                    {selectedUser.isSuspended ? (
                      <button
                        onClick={() => handleUnsuspendUser(selectedUser.id)}
                        disabled={actionLoadingId === selectedUser.id}
                        className="py-2 px-3 rounded-xl text-xs font-bold border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Lift Suspension</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenSuspend(selectedUser)}
                        disabled={actionLoadingId === selectedUser.id}
                        className="py-2 px-3 rounded-xl text-xs font-bold border bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Suspend User</span>
                      </button>
                    )}

                    {/* Restrict Creation */}
                    <button
                      onClick={() => handleToggleActivity(selectedUser.id, selectedUser.isActivityRestricted)}
                      disabled={actionLoadingId === selectedUser.id}
                      className="py-2 px-3 rounded-xl text-xs font-bold border bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-orange-400" />
                      <span>{selectedUser.isActivityRestricted ? 'Allow Creation' : 'Restrict Actions'}</span>
                    </button>

                    {/* Permanent Account Deletion */}
                    <button
                      onClick={() => handleDeleteUser(selectedUser.id, selectedUser.email)}
                      disabled={actionLoadingId === selectedUser.id}
                      className="py-2 px-3 rounded-xl text-xs font-bold border bg-red-600 hover:bg-red-500 text-white transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete User</span>
                    </button>

                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SYSTEM SUSPENSION SETTINGS MODAL ───────────────────────────── */}
      {suspensionUser && (
        <div className="fixed inset-0 bg-[#020612]/90 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
          <div className="glass-card rounded-3xl border border-white/10 p-6 max-w-sm w-full bg-[#080d1a] relative space-y-5 animate-fade-in">
            <button
              onClick={() => setSuspensionUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest block">Security Enforcement</span>
              <h4 className="text-white text-base font-bold mt-1">Suspend Account Access</h4>
              <p className="text-gray-400 text-[10px] truncate max-w-[300px]">User: {suspensionUser.email}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Suspension End Duration</label>
                <select
                  value={suspensionDays}
                  onChange={e => setSuspensionDays(e.target.value)}
                  className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                >
                  <option value="1">1 Day (Temporary Lock)</option>
                  <option value="3">3 Days (Warning Period)</option>
                  <option value="7">7 Days (Standard Suspension)</option>
                  <option value="30">30 Days (Extended Suspension)</option>
                  <option value="365">1 Year (Longterm Block)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Suspension Reason Label</label>
                <textarea
                  placeholder="Provide precise violation details for client dashboard notification..."
                  value={suspensionReason}
                  onChange={e => setSuspensionReason(e.target.value)}
                  rows={3}
                  className="w-full bg-white/2 border border-white/10 text-white placeholder-gray-500 text-xs rounded-xl p-3 focus:outline-none focus:border-amber-500 resize-none"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSuspensionUser(null)}
                className="flex-1 py-2 border border-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendUser}
                disabled={suspensionLoading || !suspensionReason.trim()}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow"
              >
                {suspensionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>Suspend</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VERIFICATION REJECTION REASON PROMPT ───────────────────────── */}
      {rejectionUser && (
        <div className="fixed inset-0 bg-[#020612]/90 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
          <div className="glass-card rounded-3xl border border-white/10 p-6 max-w-sm w-full bg-[#080d1a] relative space-y-5 animate-fade-in">
            <button
              onClick={() => setRejectionUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] text-red-400 font-extrabold uppercase tracking-widest block">Verification Review</span>
              <h4 className="text-white text-base font-bold mt-1">Reject Verification Request</h4>
              <p className="text-gray-400 text-[10px]">Applicant: {rejectionUser.email}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Reason for rejection</label>
              <textarea
                placeholder="Explain why the proof documents were not accepted (e.g. Blurred photocopy, public access disabled)..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full bg-white/2 border border-white/10 text-white placeholder-gray-500 text-xs rounded-xl p-3 focus:outline-none focus:border-red-500 resize-none"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRejectionUser(null)}
                className="flex-1 py-2 border border-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectVerification}
                disabled={rejectionLoading || !rejectionReason.trim()}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow"
              >
                {rejectionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PLANS CREATE / EDIT FORM MODAL ────────────────────────────── */}
      {showPlanForm && (
        <div className="fixed inset-0 bg-[#020612]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-card rounded-3xl border border-white/10 p-6 md:p-8 max-w-4xl w-full bg-[#080d1a] relative max-h-[90vh] overflow-y-auto space-y-6 animate-fade-in">
            <button
              onClick={() => setShowPlanForm(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all p-1 bg-white/5 rounded-lg border border-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest block">Plan Matrix Console</span>
              <h4 className="text-white text-lg font-bold mt-1">
                {editingPlan ? `Edit Subscription: "${editingPlan.name}"` : 'Create Custom Platform Plan'}
              </h4>
            </div>

            {planFormError && (
              <div className="p-3 bg-red-500/15 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{planFormError}</span>
              </div>
            )}

            <form onSubmit={handleSavePlan} className="space-y-6">
              {/* Row 1: Name, Plan Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Plan Name Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard, Creator Pro, 10 Polls Pack"
                    value={planName}
                    onChange={e => setPlanName(e.target.value)}
                    className="w-full bg-white/3 border border-white/10 rounded-xl px-4.5 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Plan Type</label>
                  <select
                    value={planType}
                    onChange={e => setPlanType(e.target.value)}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  >
                    <option value="SUBSCRIPTION">Recurring Subscription Tier</option>
                    <option value="POLL_PACK">Individual Polls Pack</option>
                    <option value="SURVEY_PACK">Individual Surveys Pack</option>
                    <option value="EXAM_PACK">Individual Exams Pack</option>
                    <option value="COMBO_PACK">Combo Feature Pack</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Price details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-white/1 border border-white/5">
                <div className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    id="planIsFreeCheckbox"
                    checked={planIsFree}
                    onChange={e => {
                      setPlanIsFree(e.target.checked);
                      if (e.target.checked) setPlanPrice('0.0');
                    }}
                    className="rounded border-white/20 bg-white/5 text-purple-600 focus:ring-0 w-4 h-4"
                  />
                  <label htmlFor="planIsFreeCheckbox" className="text-xs font-bold uppercase tracking-wider text-gray-300 cursor-pointer">
                    Free Tier Plan
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    disabled={planIsFree}
                    placeholder="e.g. 19.99"
                    value={planPrice}
                    onChange={e => setPlanPrice(e.target.value)}
                    className="w-full bg-white/3 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-500 disabled:opacity-40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Currency Mode</label>
                  <select
                    value={planCurrency}
                    onChange={e => setPlanCurrency(e.target.value)}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  >
                    <option value="USD">USD ($ - Dollars)</option>
                    <option value="INR">INR (₹ - Rupees)</option>
                    <option value="EUR">EUR (€ - Euros)</option>
                    <option value="GBP">GBP (£ - Pounds)</option>
                    <option value="AUTO">AUTO (Local Geo-Currency)</option>
                  </select>
                </div>
              </div>

              {/* Conditional Row 3: Pack Quantities, perks, combos */}
              {planType !== 'SUBSCRIPTION' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-white/1 border border-white/5 animate-slide-in">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pack Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={planPackQuantity}
                      onChange={e => setPlanPackQuantity(e.target.value)}
                      className="w-full bg-white/3 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Free Bonus Perks (e.g., 2 Free)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={planFreePerks}
                      onChange={e => setPlanFreePerks(e.target.value)}
                      className="w-full bg-white/3 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  {planType === 'COMBO_PACK' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Combo Types Included</label>
                      <div className="flex items-center gap-3 pt-2">
                        {['POLL', 'SURVEY', 'EXAM'].map(t => {
                          const isSel = planComboTypes.includes(t);
                          return (
                            <button
                              type="button"
                              key={t}
                              onClick={() => {
                                if (isSel) {
                                  setPlanComboTypes(planComboTypes.filter(x => x !== t));
                                } else {
                                  setPlanComboTypes([...planComboTypes, t]);
                                }
                              }}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                isSel ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-white/2 border-white/5 text-gray-500 hover:border-white/10'
                              }`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Row 4: Badge and Cycle Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Billing Cycle</label>
                  <select
                    value={planCycle}
                    onChange={e => setPlanCycle(e.target.value)}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="ONE_TIME">One Time</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Badge Label (User Tag)</label>
                  <input
                    type="text"
                    placeholder="e.g. Pro, Educator, VIP"
                    value={planBadgeLabel}
                    onChange={e => setPlanBadgeLabel(e.target.value)}
                    className="w-full bg-white/3 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Badge Color Theme</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={planBadgeColor}
                      onChange={e => setPlanBadgeColor(e.target.value)}
                      className="bg-transparent border border-white/10 rounded-xl w-11 h-9.5 p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={planBadgeColor}
                      onChange={e => setPlanBadgeColor(e.target.value)}
                      className="flex-1 bg-white/3 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Free trial options */}
              <div className="p-4 rounded-2xl bg-white/1 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="planHasFreeTrialCheckbox"
                      checked={planHasFreeTrial}
                      onChange={e => setPlanHasFreeTrial(e.target.checked)}
                      className="rounded border-white/20 bg-white/5 text-purple-600 focus:ring-0 w-4 h-4"
                    />
                    <label htmlFor="planHasFreeTrialCheckbox" className="text-xs font-bold uppercase tracking-wider text-gray-300 cursor-pointer">
                      Offer Free Trial Period
                    </label>
                  </div>
                  {planHasFreeTrial && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-gray-500">Trial Days:</span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={planFreeTrialDays}
                        onChange={e => setPlanFreeTrialDays(e.target.value)}
                        className="bg-[#030712] border border-white/10 rounded-lg w-16 px-2 py-1 text-xs text-white text-center outline-none focus:border-purple-500"
                      />
                    </div>
                  )}
                </div>

                {planHasFreeTrial && (
                  <div className="space-y-2 animate-slide-in">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block border-b border-white/5 pb-1">
                      Free Trial Allowed Features
                    </label>
                    <div className="max-h-[140px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pr-2">
                      {FEATURES_KEYS.map((item) => {
                        const isChecked = planFreeTrialFeatures[item.key] || false;
                        return (
                          <div
                            key={`trial-${item.key}`}
                            onClick={() => setPlanFreeTrialFeatures({ ...planFreeTrialFeatures, [item.key]: !isChecked })}
                            className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                              isChecked ? 'border-purple-500/40 bg-purple-500/5' : 'border-white/5 bg-white/2 hover:border-white/8'
                            }`}
                          >
                            <span className="text-[10px] text-gray-300 truncate">{item.label}</span>
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                              isChecked ? 'border-purple-500 bg-purple-500 text-white' : 'border-white/20'
                            }`}>
                              {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Row 6: Poll subtypes allowed */}
              <div className="p-4 rounded-2xl bg-white/1 border border-white/5 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block border-b border-white/5 pb-1">
                  Allowed Poll Subtypes
                </label>
                <div className="flex flex-wrap gap-4 pt-1">
                  {[
                    { key: 'mcq', label: 'MCQ (Single Correct)' },
                    { key: 'ranked', label: 'Ranked Choice Poll' },
                    { key: 'multi', label: 'Multiple Correct (Checkboxes)' },
                    { key: 'knockout', label: 'Knockout Bracket Tournament' }
                  ].map(subtype => {
                    const isChecked = planPollSubtypes[subtype.key] || false;
                    return (
                      <div
                        key={subtype.key}
                        onClick={() => setPlanPollSubtypes({ ...planPollSubtypes, [subtype.key]: !isChecked })}
                        className="flex items-center space-x-2 cursor-pointer select-none"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked ? 'border-purple-500 bg-purple-500 text-white' : 'border-white/20 bg-white/3'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs text-gray-300 font-medium">{subtype.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Row 7: Description text */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Description / Tagline</label>
                <textarea
                  placeholder="A descriptive caption details about billing limits and features available under this tier..."
                  value={planDesc}
                  onChange={e => setPlanDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-white/3 border border-white/10 text-white placeholder-gray-500 text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Row 8: Features list checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Toggle Features Gated ({FEATURES_KEYS.filter(f => isFeatureVisible(f.key)).length} Active / {FEATURES_KEYS.length} Total)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allTrue = { ...planFeatures };
                        FEATURES_KEYS.forEach(f => { if (isFeatureVisible(f.key)) allTrue[f.key] = true; });
                        setPlanFeatures(allTrue);
                      }}
                      className="text-[9px] font-bold uppercase tracking-wider text-purple-400 hover:text-purple-300"
                    >
                      Select All
                    </button>
                    <span className="text-gray-600 text-[10px]">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allFalse = { ...planFeatures };
                        FEATURES_KEYS.forEach(f => { if (isFeatureVisible(f.key)) allFalse[f.key] = false; });
                        setPlanFeatures(allFalse);
                      }}
                      className="text-[9px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-400"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2">
                  {/* POLL FEATURES */}
                  {POLL_FEATURES.some(f => isFeatureVisible(f.key)) && (
                    <details open className="group border border-white/5 bg-white/1 rounded-xl overflow-hidden transition-all">
                      <summary className="px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/15 cursor-pointer flex items-center justify-between text-xs font-bold text-indigo-300 select-none">
                        <span>🗳 Poll Features ({POLL_FEATURES.filter(f => isFeatureVisible(f.key) && planFeatures[f.key]).length} / {POLL_FEATURES.filter(f => isFeatureVisible(f.key)).length} enabled)</span>
                        <span className="text-[10px] text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-transparent border-t border-white/5">
                        {POLL_FEATURES.filter(f => isFeatureVisible(f.key)).map((item) => {
                          const isChecked = planFeatures[item.key] || false;
                          return (
                            <div
                              key={item.key}
                              onClick={() => setPlanFeatures({ ...planFeatures, [item.key]: !isChecked })}
                              className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                                isChecked ? 'border-purple-500/40 bg-purple-500/5' : 'border-white/5 bg-white/2 hover:border-white/8'
                              }`}
                            >
                              <span className="text-[10px] text-gray-300 font-medium truncate" title={item.label}>{item.label}</span>
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                isChecked ? 'border-purple-500 bg-purple-500 text-white' : 'border-white/20'
                              }`}>
                                {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}

                  {/* SURVEY FEATURES */}
                  {SURVEY_FEATURES.some(f => isFeatureVisible(f.key)) && (
                    <details open className="group border border-white/5 bg-white/1 rounded-xl overflow-hidden transition-all">
                      <summary className="px-4 py-2.5 bg-violet-500/10 hover:bg-violet-500/15 cursor-pointer flex items-center justify-between text-xs font-bold text-violet-300 select-none">
                        <span>📋 Survey Features ({SURVEY_FEATURES.filter(f => isFeatureVisible(f.key) && planFeatures[f.key]).length} / {SURVEY_FEATURES.filter(f => isFeatureVisible(f.key)).length} enabled)</span>
                        <span className="text-[10px] text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-transparent border-t border-white/5">
                        {SURVEY_FEATURES.filter(f => isFeatureVisible(f.key)).map((item) => {
                          const isChecked = planFeatures[item.key] || false;
                          return (
                            <div
                              key={item.key}
                              onClick={() => setPlanFeatures({ ...planFeatures, [item.key]: !isChecked })}
                              className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                                isChecked ? 'border-purple-500/40 bg-purple-500/5' : 'border-white/5 bg-white/2 hover:border-white/8'
                              }`}
                            >
                              <span className="text-[10px] text-gray-300 font-medium truncate" title={item.label}>{item.label}</span>
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                isChecked ? 'border-purple-500 bg-purple-500 text-white' : 'border-white/20'
                              }`}>
                                {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}

                  {/* EXAM FEATURES */}
                  {EXAM_FEATURES.some(f => isFeatureVisible(f.key)) && (
                    <details open className="group border border-white/5 bg-white/1 rounded-xl overflow-hidden transition-all">
                      <summary className="px-4 py-2.5 bg-pink-500/10 hover:bg-pink-500/15 cursor-pointer flex items-center justify-between text-xs font-bold text-pink-300 select-none">
                        <span>🎓 Exam Capabilities ({EXAM_FEATURES.filter(f => isFeatureVisible(f.key) && planFeatures[f.key]).length} / {EXAM_FEATURES.filter(f => isFeatureVisible(f.key)).length} enabled)</span>
                        <span className="text-[10px] text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-transparent border-t border-white/5">
                        {EXAM_FEATURES.filter(f => isFeatureVisible(f.key)).map((item) => {
                          const isChecked = planFeatures[item.key] || false;
                          return (
                            <div
                              key={item.key}
                              onClick={() => setPlanFeatures({ ...planFeatures, [item.key]: !isChecked })}
                              className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                                isChecked ? 'border-purple-500/40 bg-purple-500/5' : 'border-white/5 bg-white/2 hover:border-white/8'
                              }`}
                            >
                              <span className="text-[10px] text-gray-300 font-medium truncate" title={item.label}>{item.label}</span>
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                isChecked ? 'border-purple-500 bg-purple-500 text-white' : 'border-white/20'
                              }`}>
                                {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}

                  {/* EXAM QUESTION TYPES */}
                  {EXAM_QUESTION_TYPES.some(f => isFeatureVisible(f.key)) && (
                    <details open className="group border border-white/5 bg-white/1 rounded-xl overflow-hidden transition-all">
                      <summary className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/15 cursor-pointer flex items-center justify-between text-xs font-bold text-amber-300 select-none">
                        <span>❓ Question Types / Sub-Categories ({EXAM_QUESTION_TYPES.filter(f => isFeatureVisible(f.key) && planFeatures[f.key]).length} / {EXAM_QUESTION_TYPES.filter(f => isFeatureVisible(f.key)).length} enabled)</span>
                        <span className="text-[10px] text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-transparent border-t border-white/5">
                        {EXAM_QUESTION_TYPES.filter(f => isFeatureVisible(f.key)).map((item) => {
                          const isChecked = planFeatures[item.key] || false;
                          return (
                            <div
                              key={item.key}
                              onClick={() => setPlanFeatures({ ...planFeatures, [item.key]: !isChecked })}
                              className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                                isChecked ? 'border-purple-500/40 bg-purple-500/5' : 'border-white/5 bg-white/2 hover:border-white/8'
                              }`}
                            >
                              <span className="text-[10px] text-gray-300 font-medium truncate" title={item.label}>{item.label}</span>
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                isChecked ? 'border-purple-500 bg-purple-500 text-white' : 'border-white/20'
                              }`}>
                                {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}

                  {/* PLATFORM & SECURITY FEATURES */}
                  {PLATFORM_FEATURES.some(f => isFeatureVisible(f.key)) && (
                    <details open className="group border border-white/5 bg-white/1 rounded-xl overflow-hidden transition-all">
                      <summary className="px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/15 cursor-pointer flex items-center justify-between text-xs font-bold text-blue-300 select-none">
                        <span>🛡️ Platform & Anti-Fraud Features ({PLATFORM_FEATURES.filter(f => isFeatureVisible(f.key) && planFeatures[f.key]).length} / {PLATFORM_FEATURES.filter(f => isFeatureVisible(f.key)).length} enabled)</span>
                        <span className="text-[10px] text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-transparent border-t border-white/5">
                        {PLATFORM_FEATURES.filter(f => isFeatureVisible(f.key)).map((item) => {
                          const isChecked = planFeatures[item.key] || false;
                          return (
                            <div
                              key={item.key}
                              onClick={() => setPlanFeatures({ ...planFeatures, [item.key]: !isChecked })}
                              className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                                isChecked ? 'border-purple-500/40 bg-purple-500/5' : 'border-white/5 bg-white/2 hover:border-white/8'
                              }`}
                            >
                              <span className="text-[10px] text-gray-300 font-medium truncate" title={item.label}>{item.label}</span>
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                isChecked ? 'border-purple-500 bg-purple-500 text-white' : 'border-white/20'
                              }`}>
                                {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}
                </div>
              </div>

              {/* Row 9: Status Toggle */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="planIsActiveCheckbox"
                  checked={planIsActive}
                  onChange={e => setPlanIsActive(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-purple-600 focus:ring-0 w-4 h-4"
                />
                <label htmlFor="planIsActiveCheckbox" className="text-xs font-bold uppercase tracking-wider text-gray-300 cursor-pointer">
                  Plan is Active (Available for Users)
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowPlanForm(false)}
                  className="flex-1 py-3 border border-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={planFormLoading}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  {planFormLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  <span>{editingPlan ? 'Save Plan Changes' : 'Create Custom Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Contact Inquiry Annotation Modal Overlay */}
      {selectedContact && (
        <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-6 z-50 overflow-y-auto animate-fade-in">
          <div className="glass-card rounded-3xl w-full max-w-xl p-8 border border-white/5 bg-[#080d1a] relative space-y-6">
            <button
              onClick={() => setSelectedContact(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-white/5 pb-4 space-y-1">
              <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest">Inquiry Details</span>
              <h3 className="font-outfit text-xl font-bold text-white">{selectedContact.subject}</h3>
              <p className="text-gray-400 text-xs">From: <strong>{selectedContact.name}</strong> ({selectedContact.email})</p>
              <p className="text-gray-500 text-[10px] font-mono">Date: {new Date(selectedContact.createdAt).toLocaleString()}</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Sender's Message:</label>
              <p className="p-4 rounded-2xl bg-white/2 border border-white/5 text-gray-300 text-xs leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {selectedContact.message}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Administrator Action Notes:</label>
              <textarea
                placeholder="Enter resolutions, response notes, or administrative reminders here..."
                value={contactNote}
                onChange={e => setContactNote(e.target.value)}
                rows={3}
                className="w-full bg-[#030712] border border-white/10 text-white placeholder-gray-500 text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="flex-1 py-2.5 border border-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveContactNote}
                disabled={contactNoteLoading}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
              >
                {contactNoteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Save Annotations</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Poll Analytical Inspector Overlay Modal */}
      {selectedPoll && (
        <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-6 z-50 overflow-y-auto animate-fade-in">
          <div className="glass-card rounded-3xl w-full max-w-4xl p-8 border border-white/5 max-h-[85vh] overflow-y-auto space-y-8 bg-[#080d1a] relative">
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
                          stats[optId] += numOpts - itemIdx;
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

            {/* Voter Registry table */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                <Lock className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Voter Registry & Choice Map</h4>
              </div>
              {selectedPoll.votes?.length === 0 ? (
                <p className="text-xs text-gray-500 italic text-center py-4">No votes have been cast yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/1">
                  <table className="w-full border-collapse text-left text-xs">
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
                                  return `${idx + 1}st: ${optText}`;
                                }).join(', ');
                              } else if (q.type === 'KNOCKOUT' && val && typeof val.winner === 'string') {
                                const champText = q.options.find((o: any) => o.id === val.winner)?.text || val.winner;
                                resolvedText = `🏆 Champ: ${champText}`;
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
          </div>
        </div>
      )}

      {/* Editing Override modal */}
      {editingVote && (
        <div className="fixed inset-0 bg-[#030712]/95 backdrop-blur-md flex items-center justify-center p-6 z-[60] animate-fade-in">
          <div className="glass-card rounded-3xl w-full max-w-md p-6 border border-white/5 space-y-6 bg-[#080d1a] relative">
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
                        className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
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
                                className="flex-1 bg-[#030712] border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white"
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
                          className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
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
