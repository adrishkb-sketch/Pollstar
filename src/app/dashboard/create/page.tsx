'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import { 
  ArrowLeft, ArrowRight, Save, Check, Vote, 
  Trash2, Plus, Upload, Shield, Calendar, Users, AlertCircle, Award, Trophy, Lock,
  Zap, Brain, TrendingUp, Mail, Eye, EyeOff, Sparkles, Layers, Search, GripVertical,
  X, Eraser, RotateCcw, FileText, Palette, Clock, Activity
} from 'lucide-react';

export default function CreatePoll() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Collaboration / Co-editing states
  const [editingPollId, setEditingPollId] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string>('');
  const [activeCollaborators, setActiveCollaborators] = useState<any[]>([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logsList, setLogsList] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // ────────────────────────────────────────────────────────
  // POLL FORM STATES
  // ────────────────────────────────────────────────────────
  
  // Step 1: Core details
  const [pollType, setPollType] = useState<'POLL' | 'SURVEY' | 'EXAM'>('POLL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState(''); // holds base64 string

  // Verification & Access Settings
  const [verificationMethod, setVerificationMethod] = useState('EMAIL'); // EMAIL, PHONE
  const [verificationType, setVerificationType] = useState('OTP'); // OTP, PASSWORD

  // Exam Safeguards & Proctors Settings
  const [examTimerDuration, setExamTimerDuration] = useState<number>(60);
  const [enableProctorCamera, setEnableProctorCamera] = useState(false);
  const [enableProctorMicrophone, setEnableProctorMicrophone] = useState(false);
  const [proctorDriveFolderUrl, setProctorDriveFolderUrl] = useState('');
  const [enableAutoSubmitOnTabLeave, setEnableAutoSubmitOnTabLeave] = useState(false);
  const [enableAutoSubmitOnCacheClear, setEnableAutoSubmitOnCacheClear] = useState(false);
  const [enableAutoSubmitOnLeave, setEnableAutoSubmitOnLeave] = useState(false);

  // White-Label Custom Branding Settings
  const [enableCustomBranding, setEnableCustomBranding] = useState(false);
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [customBrandingText, setCustomBrandingText] = useState('');

  // Premium Themes & Save/Resume
  const [customTheme, setCustomTheme] = useState('MIDNIGHT');
  const [enableSaveAndResumeLater, setEnableSaveAndResumeLater] = useState(false);
  const [studentWhiteboardDriveUrl, setStudentWhiteboardDriveUrl] = useState('');

  // Additional 30 Advanced Features Toggles
  const [enableShuffleQuestions, setEnableShuffleQuestions] = useState(false);
  const [enableShuffleOptions, setEnableShuffleOptions] = useState(false);
  const [enableCopyPasteBlock, setEnableCopyPasteBlock] = useState(false);
  const [enableInstantFeedback, setEnableInstantFeedback] = useState(false);
  const [enableNegativeMarking, setEnableNegativeMarking] = useState(false);
  const [enableCalculator, setEnableCalculator] = useState(false);
  const [enableOtpBypass, setEnableOtpBypass] = useState(false);
  const [enableStrictTimeBuffer, setEnableStrictTimeBuffer] = useState(false);
  const [enableTabDepartureSound, setEnableTabDepartureSound] = useState(false);

  const [enableDemographicWeighting, setEnableDemographicWeighting] = useState(false);
  const [enableVpnBlocking, setEnableVpnBlocking] = useState(false);
  const [enableWriteInOptions, setEnableWriteInOptions] = useState(false);

  const [enableCustomNavLabels, setEnableCustomNavLabels] = useState(false);
  const [enablePreOnboarding, setEnablePreOnboarding] = useState(false);
  const [enableBranchingLogic, setEnableBranchingLogic] = useState(false);
  const [enableDomainRestriction, setEnableDomainRestriction] = useState(false);
  const [enableDirectInbox, setEnableDirectInbox] = useState(false);
  const [enableDraftSave, setEnableDraftSave] = useState(false);

  // Poll extra states that were previously inside singleFeatures or rankedFeatures
  const [enableQuadraticVoting, setEnableQuadraticVoting] = useState(false);
  const [enableTieBreakerEngine, setEnableTieBreakerEngine] = useState(false);
  const [enableConsensusScore, setEnableConsensusScore] = useState(false);
  const [enableSentimentChat, setEnableSentimentChat] = useState(false);
  const [enableSwingMap, setEnableSwingMap] = useState(false);

  // Drag & Drop / Warnings States
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showLogicWarningModal, setShowLogicWarningModal] = useState(false);

  // Step 2 & 3: Questions & Types
  const [questions, setQuestions] = useState<any[]>([
    { id: 1, questionText: '', type: 'SINGLE', options: ['Option 1', 'Option 2'], pageNumber: 1, logicRules: null }
  ]);
  const [activeQuestionId, setActiveQuestionId] = useState<number>(1);

  // Step 4: Closed vs Open Voting
  const [isOpenVoting, setIsOpenVoting] = useState(true);
  const [numVoters, setNumVoters] = useState(5);
  // Dynamically renameable fields
  const [identifierLabel, setIdentifierLabel] = useState('Roll Number');
  const [confirmer1Label, setConfirmer1Label] = useState('Student Name');
  const [confirmer2Label, setConfirmer2Label] = useState('Parent Name');
  const [useConfirmer2, setUseConfirmer2] = useState(false);
  const [allowedVoters, setAllowedVoters] = useState<any[]>([
    { identifier: '', confirmer1: '', confirmer2: '', email: '' },
    { identifier: '', confirmer1: '', confirmer2: '', email: '' },
    { identifier: '', confirmer1: '', confirmer2: '', email: '' },
    { identifier: '', confirmer1: '', confirmer2: '', email: '' },
    { identifier: '', confirmer1: '', confirmer2: '', email: '' },
  ]);

  // Previous Voter Templates
  const [voterTemplates, setVoterTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');

  // Google Sheets import states
  const [sheetUrl, setSheetUrl] = useState('');
  const [importingSheet, setImportingSheet] = useState(false);
  const [sheetImportError, setSheetImportError] = useState('');
  const [sheetImportSuccess, setSheetImportSuccess] = useState('');  // Step 5: Restrictions
  const [limitOneVotePerUser, setLimitOneVotePerUser] = useState(true);
  const [limitOneVotePerIP, setLimitOneVotePerIP] = useState(false);
  const [limitOneVotePerISP, setLimitOneVotePerISP] = useState(false);
  const [ballotPriority, setBallotPriority] = useState<'HIGH' | 'LOW'>('HIGH');

  // Step 6: Anonymity
  const [isAnonymous, setIsAnonymous] = useState(true);

  // Step 7: Schedule
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Step 8: Results & Visibility Toggles
  const [hideResultsUntilEnd, setHideResultsUntilEnd] = useState(false);
  const [isResultPublic, setIsResultPublic] = useState(false);
  const [publicShowMaps, setPublicShowMaps] = useState(true);
  const [publicShowCharts, setPublicShowCharts] = useState(true);
  const [publicShowStats, setPublicShowStats] = useState(true);
  const [postSurveyAction, setPostSurveyAction] = useState('Thank you for completing this survey!');
  const [resultsReleased, setResultsReleased] = useState(false);
  const [postExamMessage, setPostExamMessage] = useState('Thank you for completing the exam! Your answers have been recorded.');
  const [enableConfidenceSlider, setEnableConfidenceSlider] = useState(false);
  const [enableDragAndDropPodium, setEnableDragAndDropPodium] = useState(false);
  const [enableHotStreaks, setEnableHotStreaks] = useState(false);
  const [enableLiveTicker, setEnableLiveTicker] = useState(false);
  const [enableSmartDebrief, setEnableSmartDebrief] = useState(false);
  const [leaderboardVisibility, setLeaderboardVisibility] = useState('HIDDEN');
  const [rankedFeatures, setRankedFeatures] = useState<Record<string, boolean>>({
    enablePreferenceFlowMap: false,
    enableHeadToHeadMatrix: false,
    enableConsensusScore: false,
    enablePolarizationDetector: false,
    enableKingmakerAnalysis: false,
    enableRankHeatmap: false,
    enableRankConfidence: false,
    enableScenarioSimulator: false,
    enableTieBreakerEngine: false,
    enableRankCompleteness: false,
    enablePodiumResults: false,
    enableCoalitionFinder: false,
    enableMinorityProtection: false,
    enableAuditReplay: false,
  });
  const [rankedTieBreakerRule, setRankedTieBreakerRule] = useState('FIRST_PLACE');
  const [rankedCompletenessRule, setRankedCompletenessRule] = useState('PARTIAL');

  // Survey Features
  const [collectEmail, setCollectEmail] = useState(false);
  const [postEmailMessage, setPostEmailMessage] = useState('');
  const [enableDropOffTracking, setEnableDropOffTracking] = useState(false);
  const [enableSemanticAnalysis, setEnableSemanticAnalysis] = useState(false);
  const [enableCrossTabulation, setEnableCrossTabulation] = useState(false);
  const [enableTimeAnalytics, setEnableTimeAnalytics] = useState(false);

  const hasRankedQuestion = questions.some((q: any) => q.type === 'RANKED');
  const hasSingleQuestion = questions.some((q: any) => q.type === 'SINGLE');
  const hasKnockoutQuestion = questions.some((q: any) => q.type === 'KNOCKOUT');

  // 🧠 Creator Brain Board States
  const [brainBoardOpen, setBrainBoardOpen] = useState(false);
  const [brainBoardTab, setBrainBoardTab] = useState<'draw' | 'notes' | 'links'>('draw');
  const [brainNotes, setBrainNotes] = useState('');
  const [brainLinks, setBrainLinks] = useState<{ id: string; label: string; url: string }[]>([]);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Draggable FAB Logic for Brain Board
  const [brainDragOffset, setBrainDragOffset] = useState({ x: 0, y: 0 });
  const [brainActiveDrag, setBrainActiveDrag] = useState(false);
  const brainDragStartPos = useRef({ x: 0, y: 0 });

  const onBrainDragStart = (clientX: number, clientY: number) => {
    setBrainActiveDrag(true);
    brainDragStartPos.current = {
      x: clientX - brainDragOffset.x,
      y: clientY - brainDragOffset.y
    };
  };

  useEffect(() => {
    const onDragMove = (e: MouseEvent) => {
      if (!brainActiveDrag) return;
      setBrainDragOffset({
        x: e.clientX - brainDragStartPos.current.x,
        y: e.clientY - brainDragStartPos.current.y
      });
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!brainActiveDrag || !e.touches[0]) return;
      setBrainDragOffset({
        x: e.touches[0].clientX - brainDragStartPos.current.x,
        y: e.touches[0].clientY - brainDragStartPos.current.y
      });
    };

    const onDragEnd = () => {
      setBrainActiveDrag(false);
    };

    if (brainActiveDrag) {
      window.addEventListener('mousemove', onDragMove);
      window.addEventListener('mouseup', onDragEnd);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', onDragEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onDragEnd);
    };
  }, [brainActiveDrag]);
  
  // Canvas State & Refs
  const [strokeColor, setStrokeColor] = useState('#6366f1'); // default indigo
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  
  // Read and parse URL query parameters for pre-selected creation type
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const typeParam = params.get('type')?.toUpperCase();
      if (typeParam === 'POLL' || typeParam === 'SURVEY' || typeParam === 'EXAM') {
        const selectedType = typeParam as 'POLL' | 'SURVEY' | 'EXAM';
        setPollType(selectedType);
        if (selectedType === 'POLL') {
          setIdentifierLabel('Roll Number');
          setConfirmer1Label('Student Name');
          setConfirmer2Label('Parent Name');
        } else if (selectedType === 'SURVEY') {
          setIdentifierLabel('Respondent ID');
          setConfirmer1Label('Full Name');
          setConfirmer2Label('Department');
        } else if (selectedType === 'EXAM') {
          setIdentifierLabel('Examinee ID');
          setConfirmer1Label('Student Name');
          setConfirmer2Label('Class/Branch');
        }
      }
    }
  }, []);

  // Auto-load and persistence for Creator Brain Board
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedNotes = localStorage.getItem('pollstar_brain_board_notes');
      if (storedNotes) setBrainNotes(storedNotes);
      
      const storedLinks = localStorage.getItem('pollstar_brain_board_links');
      if (storedLinks) {
        try {
          setBrainLinks(JSON.parse(storedLinks));
        } catch (e) {
          console.error('Error parsing stored brain links', e);
        }
      }
    }
  }, []);

  const saveBrainNotes = (val: string) => {
    setBrainNotes(val);
    localStorage.setItem('pollstar_brain_board_notes', val);
  };

  const addBrainLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    const cleanUrl = newLinkUrl.trim().startsWith('http') ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`;
    const newLink = {
      id: Math.random().toString(36).substr(2, 9),
      label: newLinkLabel.trim(),
      url: cleanUrl
    };
    const updated = [...brainLinks, newLink];
    setBrainLinks(updated);
    localStorage.setItem('pollstar_brain_board_links', JSON.stringify(updated));
    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  const removeBrainLink = (id: string) => {
    const updated = brainLinks.filter(l => l.id !== id);
    setBrainLinks(updated);
    localStorage.setItem('pollstar_brain_board_links', JSON.stringify(updated));
  };

  // Canvas drawing handlers & refs
  const isDrawingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);

  useEffect(() => {
    if (brainBoardOpen && brainBoardTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const savedSketch = localStorage.getItem('pollstar_brain_board_sketch');
        if (savedSketch) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = savedSketch;
        }
      }
    }
  }, [brainBoardOpen, brainBoardTab]);

  const startDrawing = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    isDrawingRef.current = true;
    lastXRef.current = clientX - rect.left;
    lastYRef.current = clientY - rect.top;
  };

  const draw = (clientX: number, clientY: number) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastXRef.current, lastYRef.current);
    ctx.lineTo(x, y);
    
    ctx.strokeStyle = isEraser ? '#030712' : strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastXRef.current = x;
    lastYRef.current = y;

    const savedData = canvas.toDataURL();
    localStorage.setItem('pollstar_brain_board_sketch', savedData);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem('pollstar_brain_board_sketch');
  };

  const toggleRankedFeature = (key: string) => {
    setRankedFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDropQuestion = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const reorderedQuestions = [...questions];
    const [draggedItem] = reorderedQuestions.splice(draggedIndex, 1);
    reorderedQuestions.splice(targetIndex, 0, draggedItem);

    // Dynamic warning evaluation for logic rules:
    // If pollType is SURVEY, check if any skip logic rules exist and if they point to affected question IDs
    let hasLogicAffected = false;
    if (pollType === 'SURVEY') {
      reorderedQuestions.forEach((q) => {
        if (q.logicRules && q.logicRules.length > 0) {
          hasLogicAffected = true;
        }
      });
    }

    setQuestions(reorderedQuestions);
    setDraggedIndex(null);

    if (hasLogicAffected) {
      setShowLogicWarningModal(true);
    }
  };

  // Single Choice advanced features
  const [singleFeatures, setSingleFeatures] = useState<Record<string, boolean>>({
    enableQuadraticVoting: false,
    enableAiProjection: false,
    enableCohortCrossTab: false,
    enableSentimentChat: false,
    enableSwingMap: false,
  });
  const toggleSingleFeature = (key: string) => {
    setSingleFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Knockout advanced features
  const [knockoutFeatures, setKnockoutFeatures] = useState<Record<string, boolean>>({
    enableBracketPredictions: false,
    enableDoubleElimination: false,
    enableUnderdogTracker: false,
    enableOptionStatsCards: false,
    enableSuddenDeath: false,
  });
  const toggleKnockoutFeature = (key: string) => {
    setKnockoutFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [userPlan, setUserPlan] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [quotaData, setQuotaData] = useState<any>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(''); // empty string is subscription

  const getAllocationOptions = () => {
    if (!quotaData) return [];
    const options = [];

    // Check if subscription option is valid for this type
    const sub = quotaData.subscription;
    const isSubValid = quotaData.isSubBased && sub;
    
    if (isSubValid) {
      const allowed = pollType === 'SURVEY' ? sub.limitSurveys : pollType === 'EXAM' ? sub.limitExams : sub.limitPolls;
      const used = pollType === 'SURVEY' ? sub.usedSurveys : pollType === 'EXAM' ? sub.usedExams : sub.usedPolls;
      const remaining = allowed === -1 ? 'Unlimited' : Math.max(0, allowed - used);
      const partLimit = pollType === 'SURVEY' ? sub.maxParticipantsSurvey : pollType === 'EXAM' ? sub.maxParticipantsExam : sub.maxParticipantsPoll;

      options.push({
        id: '', // Subscription is represented by empty string
        name: `${quotaData.planType === 'FREE' || !userPlan ? 'Free Tier' : userPlan.name} (Subscription)`,
        remaining,
        participantLimit: partLimit ? `${partLimit} voters` : 'Plan default',
      });
    }

    // Addons
    const addons = quotaData.activeAddons || [];
    for (const add of addons) {
      const allowed = pollType === 'SURVEY' ? add.allowedSurveys : pollType === 'EXAM' ? add.allowedExams : add.allowedPolls;
      const used = pollType === 'SURVEY' ? add.usedSurveys : pollType === 'EXAM' ? add.usedExams : add.usedPolls;
      
      if (allowed > 0 || allowed === -1) {
        const remaining = allowed === -1 ? 'Unlimited' : Math.max(0, allowed - used);
        const partLimit = pollType === 'SURVEY' ? add.maxParticipantsSurvey : pollType === 'EXAM' ? add.maxParticipantsExam : add.maxParticipantsPoll;

        options.push({
          id: add.id,
          name: `${add.name} (Credit Pack)`,
          remaining,
          participantLimit: partLimit ? `${partLimit} voters` : 'Pack default',
        });
      }
    }

    return options;
  };

  const isFeatureLocked = (key: string): boolean => {
    if (!userPlan) return false;
    if (user?.role === 'ADMIN') return false;
    if (!userPlan.features) return false;
    return !userPlan.features[key];
  };

  const isSubtypeLocked = (subtype: 'mcq' | 'ranked' | 'multi' | 'knockout'): boolean => {
    if (!userPlan) return false;
    if (user?.role === 'ADMIN') return false;
    if (!userPlan.pollSubtypes) return false;
    const raw = userPlan.pollSubtypes;
    const allowed = typeof raw === 'string' ? raw.split(',') : (Array.isArray(raw) ? raw.map(String) : []);
    return !allowed.includes(subtype);
  };

  const toggleFeatureState = (key: string, val: boolean) => {
    if (key in singleFeatures) {
      setSingleFeatures(prev => ({ ...prev, [key]: val }));
    } else if (key in rankedFeatures) {
      setRankedFeatures(prev => ({ ...prev, [key]: val }));
    } else if (key in knockoutFeatures) {
      setKnockoutFeatures(prev => ({ ...prev, [key]: val }));
    }
  };

  const getDynamicPollExtras = () => {
    const qType = questions[0]?.type || 'SINGLE';
    if (qType === 'RANKED') {
      return [
        {
          key: 'enableDragAndDropPodium',
          label: 'Drag-and-Drop Ballot Podium',
          desc: 'Let voters interactively rank options on a physical visual gold/silver/bronze podium.',
          val: enableDragAndDropPodium,
          setter: setEnableDragAndDropPodium,
          gateKey: 'enableDragAndDropPodium'
        },
        {
          key: 'enableScenarioSimulator',
          label: 'What-If Scenario Simulator',
          desc: 'Let voters run simulations on the results chart to see what would happen if candidates were removed.',
          val: rankedFeatures.enableScenarioSimulator,
          gateKey: 'enableScenarioSimulator'
        },
        {
          key: 'enableTieBreakerEngine',
          label: 'Automatic Tie Resolver',
          desc: 'Instantly break close ties using customized priority or duel criteria.',
          val: enableTieBreakerEngine,
          setter: setEnableTieBreakerEngine,
          gateKey: 'quadraticVoting'
        },
        {
          key: 'enableConsensusScore',
          label: 'Consensus & Polarization Score',
          desc: 'Measure and display community agreement rates or highly divided choices.',
          val: enableConsensusScore,
          setter: setEnableConsensusScore,
          gateKey: 'quadraticVoting'
        },
        {
          key: 'enableLiveTicker',
          label: 'Scrolling Live Ticker',
          desc: 'Display a rolling real-time ticker bar of ongoing vote transitions.',
          val: enableLiveTicker,
          setter: setEnableLiveTicker,
          gateKey: 'liveVoteTicker'
        },
        {
          key: 'enableVpnBlocking',
          label: 'Block VPNs & Proxies',
          desc: 'Verify IPs and refuse votes coming from anonymous proxy lists or VPN servers.',
          val: enableVpnBlocking,
          setter: setEnableVpnBlocking,
          gateKey: 'deviceFingerprinting'
        },
        {
          key: 'enableSentimentChat',
          label: 'Opinion Chat & Sentiment Sidebar',
          desc: 'Include a sidebar chatbox where text is sorted by positive, neutral, or negative feelings.',
          val: enableSentimentChat,
          setter: setEnableSentimentChat,
          gateKey: 'opinionChatbox'
        }
      ];
    }

    if (qType === 'KNOCKOUT') {
      return [
        {
          key: 'enableBracketPredictions',
          label: 'Playoff Bracket Guessing',
          desc: 'Let voters predict the complete knockout brackets outcome before voting begins.',
          val: knockoutFeatures.enableBracketPredictions,
          gateKey: 'knockoutBracket'
        },
        {
          key: 'enableDoubleElimination',
          label: 'Double Elimination Tournament',
          desc: 'Set up double brackets so options must lose twice before getting knocked out.',
          val: knockoutFeatures.enableDoubleElimination,
          gateKey: 'knockoutBracket'
        },
        {
          key: 'enableUnderdogTracker',
          label: 'Matchup Underdog Tracker',
          desc: 'Highlight and track matchups won by lower-seeded options in brackets.',
          val: knockoutFeatures.enableUnderdogTracker,
          gateKey: 'knockoutBracket'
        },
        {
          key: 'enableOptionStatsCards',
          label: 'Option Facts & Stats Cards',
          desc: 'Show beautiful charts and details for each option during bracket matchups.',
          val: knockoutFeatures.enableOptionStatsCards,
          gateKey: 'knockoutBracket'
        },
        {
          key: 'enableSuddenDeath',
          label: 'Sudden Death Overtime',
          desc: 'Resolve matchup voting ties automatically using immediate overtime scoring.',
          val: knockoutFeatures.enableSuddenDeath,
          gateKey: 'knockoutBracket'
        },
        {
          key: 'enableLiveTicker',
          label: 'Scrolling Live Ticker',
          desc: 'Display a rolling real-time ticker bar of ongoing vote transitions.',
          val: enableLiveTicker,
          setter: setEnableLiveTicker,
          gateKey: 'liveVoteTicker'
        },
        {
          key: 'enableVpnBlocking',
          label: 'Block VPNs & Proxies',
          desc: 'Verify IPs and refuse votes coming from anonymous proxy lists or VPN servers.',
          val: enableVpnBlocking,
          setter: setEnableVpnBlocking,
          gateKey: 'deviceFingerprinting'
        }
      ];
    }

    return [
      {
        key: 'enableQuadraticVoting',
        label: 'Point-Based Voting (Quadratic)',
        desc: 'Voters get points to split. Buying more votes for one option costs exponentially more.',
        val: enableQuadraticVoting,
        setter: setEnableQuadraticVoting,
        gateKey: 'quadraticVoting'
      },
      {
        key: 'enableAiProjection',
        label: 'AI Vote Projection & Live Predictions',
        desc: 'Predict outcome early based on velocity momentum, turnout trends, and historical distribution models.',
        val: singleFeatures.enableAiProjection,
        gateKey: 'enableAiProjection'
      },
      {
        key: 'enableLiveTicker',
        label: 'Scrolling Live Ticker',
        desc: 'Display a rolling real-time ticker bar of ongoing vote transitions.',
        val: enableLiveTicker,
        setter: setEnableLiveTicker,
        gateKey: 'liveVoteTicker'
      },
      {
        key: 'enableHotStreaks',
        label: 'Fast Surge Detector (Hot Streaks)',
        desc: 'Highlight options that are receiving votes exceptionally fast in real time.',
        val: enableHotStreaks,
        setter: setEnableHotStreaks,
        gateKey: 'viralVoteIndicators'
      },
      {
        key: 'enableDemographicWeighting',
        label: 'Group Influence Weighting',
        desc: 'Assign higher vote importance factors based on role, age, or department.',
        val: enableDemographicWeighting,
        setter: setEnableDemographicWeighting,
        gateKey: 'enableCrossTabulation'
      },
      {
        key: 'enableVpnBlocking',
        label: 'Block VPNs & Proxies',
        desc: 'Verify IPs and refuse votes coming from anonymous proxy lists or VPN servers.',
        val: enableVpnBlocking,
        setter: setEnableVpnBlocking,
        gateKey: 'deviceFingerprinting'
      },
      {
        key: 'enableWriteInOptions',
        label: 'Allow Custom Write-In Choices',
        desc: 'Permit voters to type and suggest a custom choice not in the original list.',
        val: enableWriteInOptions,
        setter: setEnableWriteInOptions,
        gateKey: 'openPublicPolls'
      },
      {
        key: 'enableSentimentChat',
        label: 'Opinion Chat & Sentiment Sidebar',
        desc: 'Include a sidebar chatbox where text is sorted by positive, neutral, or negative feelings.',
        val: enableSentimentChat,
        setter: setEnableSentimentChat,
        gateKey: 'opinionChatbox'
      },
      {
        key: 'enableSwingMap',
        label: 'Opinion Trend Shift Map',
        desc: 'Render a beautiful visual graph showing how public preferences shifted over the voting span.',
        val: enableSwingMap,
        setter: setEnableSwingMap,
        gateKey: 'voteTimelineGraph'
      }
    ];
  };

  // Initialize date defaults in Indian Standard Time (IST)
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success && data.user) {
          setUser(data.user);
          setUserPlan(data.user.plan);
        }
      })
      .catch((e) => console.error(e));

    fetch('/api/dashboard/quota')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success) {
          setQuotaData(data);
        }
      })
      .catch((e) => console.error(e));

    const start = new Date();
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days later
    
    // Format to YYYY-MM-DDTHH:MM in Asia/Kolkata timezone
    const formatIST = (d: Date) => {
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
      
      // Handle edge cases where hour12: false might output '24' for midnight
      if (hour === '24') hour = '00';
      
      return `${year}-${month}-${day}T${hour}:${minute}`;
    };
    
    setStartTime(formatIST(start));
    setEndTime(formatIST(end));
  }, []);

  // Auto pre-select correct allocation option based on chosen pollType
  useEffect(() => {
    const options = getAllocationOptions();
    if (options.length > 0) {
      const isValid = options.some(opt => opt.id === selectedInvoiceId);
      if (!isValid) {
        setSelectedInvoiceId(options[0].id);
      }
    }
  }, [pollType, quotaData]);

  // Load poll details if editing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('id');
      if (editId) {
        setEditingPollId(editId);
        setLoading(true);
        fetch(`/api/polls/${editId}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.poll) {
              const p = data.poll;
              setPollType(p.pollType);
              setTitle(p.title || '');
              setDescription(p.description || '');
              setPosterUrl(p.posterUrl || '');
              setIsOpenVoting(!!p.isOpenVoting);
              setIsAnonymous(!!p.isAnonymous);
              setIsResultPublic(!!p.isResultPublic);

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
                const getVal = (type: string) => parts.find(x => x.type === type)?.value || '';

                const year = getVal('year');
                const month = getVal('month');
                const day = getVal('day');
                let hour = getVal('hour');
                const minute = getVal('minute');

                if (hour === '24') hour = '00';
                return `${year}-${month}-${day}T${hour}:${minute}`;
              };
              if (p.startTime) setStartTime(formatIST(p.startTime));
              if (p.endTime) setEndTime(formatIST(p.endTime));

              if (p.questions && p.questions.length > 0) {
                setQuestions(p.questions.map((q: any) => ({
                  id: q.id,
                  questionText: q.questionText || '',
                  type: q.type || 'SINGLE',
                  options: q.options?.map((o: any) => o.text) || [],
                  pageNumber: q.pageNumber || 1,
                  logicRules: q.logicRules || null,
                  correctAnswer: q.correctAnswer || null,
                  correctAnswers: q.correctAnswers || null,
                  marks: q.marks !== undefined ? String(q.marks) : '1.0',
                  inputConstraint: q.inputConstraint || 'NONE',
                  fileUploadDriveUrl: q.fileUploadDriveUrl || null,
                  enableWhiteboard: !!q.enableWhiteboard,
                })));
              }

              const s = p.settings || {};
              setLimitOneVotePerUser(s.limitOneVotePerUser !== undefined ? !!s.limitOneVotePerUser : true);
              setLimitOneVotePerIP(!!s.limitOneVotePerIP);
              setLimitOneVotePerISP(!!s.limitOneVotePerISP);
              setHideResultsUntilEnd(!!s.hideResultsUntilEnd);
              setPublicShowMaps(s.publicShowMaps !== undefined ? !!s.publicShowMaps : true);
              setPublicShowCharts(s.publicShowCharts !== undefined ? !!s.publicShowCharts : true);
              setPublicShowStats(s.publicShowStats !== undefined ? !!s.publicShowStats : true);
              setEnableConfidenceSlider(!!s.enableConfidenceSlider);
              setEnableDragAndDropPodium(!!s.enableDragAndDropPodium);
              setEnableHotStreaks(!!s.enableHotStreaks);
              setEnableLiveTicker(!!s.enableLiveTicker);
              setEnableSmartDebrief(!!s.enableSmartDebrief);
              setLeaderboardVisibility(s.leaderboardVisibility || 'HIDDEN');

              // Load features
              const rFeats: any = {};
              Object.keys(rankedFeatures).forEach(k => { rFeats[k] = !!s[k]; });
              setRankedFeatures(rFeats);

              const sFeats: any = {};
              Object.keys(singleFeatures).forEach(k => { sFeats[k] = !!s[k]; });
              setSingleFeatures(sFeats);

              const kFeats: any = {};
              Object.keys(knockoutFeatures).forEach(k => { kFeats[k] = !!s[k]; });
              setKnockoutFeatures(kFeats);

              setRankedTieBreakerRule(s.rankedTieBreakerRule || 'FIRST_PLACE');
              setRankedCompletenessRule(s.rankedCompletenessRule || 'PARTIAL');

              if (p.pollType === 'SURVEY') {
                setPostSurveyAction(s.postSurveyAction || 'Thank you for completing this survey!');
                setCollectEmail(!!s.collectEmail);
                setPostEmailMessage(s.postEmailMessage || '');
                setEnableDropOffTracking(!!s.enableDropOffTracking);
                setEnableSemanticAnalysis(!!s.enableSemanticAnalysis);
                setEnableCrossTabulation(!!s.enableCrossTabulation);
                setEnableTimeAnalytics(!!s.enableTimeAnalytics);
                setEnableCustomNavLabels(!!s.enableCustomNavLabels);
                setEnablePreOnboarding(!!s.enablePreOnboarding);
                setEnableBranchingLogic(!!s.enableBranchingLogic);
                setEnableDomainRestriction(!!s.enableDomainRestriction);
                setEnableDirectInbox(!!s.enableDirectInbox);
                setEnableDraftSave(!!s.enableDraftSave);
              } else if (p.pollType === 'EXAM') {
                setPostExamMessage(s.postSurveyAction || 'Thank you for completing the exam! Your answers have been recorded.');
                setResultsReleased(!!s.resultsReleased);
                setExamTimerDuration(s.examTimerDuration || 60);
                setEnableProctorCamera(!!s.enableProctorCamera);
                setEnableProctorMicrophone(!!s.enableProctorMicrophone);
                setProctorDriveFolderUrl(s.proctorDriveFolderUrl || '');
                setEnableAutoSubmitOnTabLeave(!!s.enableAutoSubmitOnTabLeave);
                setEnableAutoSubmitOnCacheClear(!!s.enableAutoSubmitOnCacheClear);
                setEnableAutoSubmitOnLeave(!!s.enableAutoSubmitOnLeave);
                setEnableShuffleQuestions(!!s.enableShuffleQuestions);
                setEnableShuffleOptions(!!s.enableShuffleOptions);
                setEnableCopyPasteBlock(!!s.enableCopyPasteBlock);
                setEnableInstantFeedback(!!s.enableInstantFeedback);
                setEnableNegativeMarking(!!s.enableNegativeMarking);
                setEnableCalculator(!!s.enableCalculator);
                setEnableOtpBypass(!!s.enableOtpBypass);
                setEnableStrictTimeBuffer(!!s.enableStrictTimeBuffer);
                setEnableTabDepartureSound(!!s.enableTabDepartureSound);
              } else if (p.pollType === 'POLL') {
                setEnableDemographicWeighting(!!s.enableDemographicWeighting);
                setEnableVpnBlocking(!!s.enableVpnBlocking);
                setEnableWriteInOptions(!!s.enableWriteInOptions);
                setEnableQuadraticVoting(!!s.enableQuadraticVoting);
                setEnableTieBreakerEngine(!!s.enableTieBreakerEngine);
                setEnableConsensusScore(!!s.enableConsensusScore);
                setEnableSentimentChat(!!s.enableSentimentChat);
                setEnableSwingMap(!!s.enableSwingMap);
              }

              setVerificationMethod(s.verificationMethod || 'EMAIL');
              setVerificationType(s.verificationType || 'OTP');

              setEnableCustomBranding(!!s.enableCustomBranding);
              setCustomLogoUrl(s.customLogoUrl || '');
              setCustomBrandingText(s.customBrandingText || '');
              setCustomTheme(s.customTheme || 'MIDNIGHT');
              setEnableSaveAndResumeLater(!!s.enableSaveAndResumeLater);
              setStudentWhiteboardDriveUrl(s.studentWhiteboardDriveUrl || '');

              if (p.allowedVoters && p.allowedVoters.length > 0) {
                setAllowedVoters(p.allowedVoters.map((av: any) => {
                  let session = '';
                  let classYear = '';
                  let department = '';
                  if (av.confirmer2) {
                    try {
                      const parsed = JSON.parse(av.confirmer2);
                      if (parsed && typeof parsed === 'object') {
                        session = parsed.session || '';
                        classYear = parsed.class || parsed.classYear || '';
                        department = parsed.department || '';
                      }
                    } catch (e) {}
                  }
                  return {
                    identifier: av.identifier || '',
                    confirmer1: av.confirmer1 || '',
                    confirmer2: av.confirmer2 || '',
                    email: av.email || '',
                    phone: av.phone || '',
                    password: av.password || '',
                    voterAuthType: av.voterAuthType || 'GLOBAL',
                    session,
                    classYear,
                    department,
                  };
                }));
                setNumVoters(p.allowedVoters.length);
              }

              setIdentifierLabel(p.identifierLabel || 'Roll Number');
              setConfirmer1Label(p.confirmer1Label || 'Student Name');
              if (p.confirmer2Label) {
                setConfirmer2Label(p.confirmer2Label);
                setUseConfirmer2(true);
              } else {
                setConfirmer2Label('');
                setUseConfirmer2(false);
              }
            }
            setLoading(false);
          })
          .catch(e => {
            console.error('Failed to load edit poll:', e);
            setLoading(false);
          });
      }
    }
  }, []);

  // Presence / Co-editing sync
  useEffect(() => {
    if (!editingPollId) return;

    const syncPresence = () => {
      fetch(`/api/polls/${editingPollId}?focus=${encodeURIComponent(focusedField)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.activeCollaborators) {
            setActiveCollaborators(data.activeCollaborators);
          }
        })
        .catch(e => console.error('Presence poll error:', e));
    };

    syncPresence();
    const interval = setInterval(syncPresence, 3000);
    return () => clearInterval(interval);
  }, [editingPollId, focusedField]);

  // Fetch previous closed poll rosters
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const res = await fetch('/api/polls/voter-templates');
        if (res.ok) {
          const data = await res.json();
          setVoterTemplates(data.templates || []);
        }
      } catch (err) {
        console.error('Failed to load voter templates:', err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  // ────────────────────────────────────────────────────────
  // DYNAMIC HELPERS & VALIDATORS
  // ────────────────────────────────────────────────────────

  const handleImportTemplate = (templateId: string) => {
    if (!templateId) return;
    const selected = voterTemplates.find((t) => t.id === templateId);
    if (!selected) return;

    if (selected.allowedVoters && selected.allowedVoters.length > 0) {
      const mappedVoters = selected.allowedVoters.map((v: any) => {
        let session = '';
        let classYear = '';
        let department = '';
        if (v.confirmer2) {
          try {
            const parsed = JSON.parse(v.confirmer2);
            if (parsed && typeof parsed === 'object') {
              session = parsed.session || '';
              classYear = parsed.class || parsed.classYear || '';
              department = parsed.department || '';
            }
          } catch (e) {}
        }
        return {
          identifier: v.identifier || '',
          confirmer1: v.confirmer1 || '',
          confirmer2: v.confirmer2 || '',
          email: v.email || '',
          phone: v.phone || '',
          password: v.password || '',
          voterAuthType: v.voterAuthType || 'GLOBAL',
          session,
          classYear,
          department,
        };
      });
      setAllowedVoters(mappedVoters);
      setNumVoters(mappedVoters.length);

      const settingsObj = selected.settings || {};
      setIdentifierLabel(settingsObj.identifierLabel || 'Roll Number');
      setConfirmer1Label(settingsObj.confirmer1Label || 'Student Name');
      if (settingsObj.confirmer2Label) {
        setConfirmer2Label(settingsObj.confirmer2Label);
        setUseConfirmer2(true);
      } else {
        setConfirmer2Label('');
        setUseConfirmer2(false);
      }
      
      alert(`Imported ${mappedVoters.length} ${pollType === 'SURVEY' ? 'respondent' : 'voter'} profiles successfully from previous ${pollType === 'SURVEY' ? 'survey' : 'poll'}: "${selected.title}"!`);
    } else {
      alert(`This previous ${pollType === 'SURVEY' ? 'survey' : 'poll'} does not have any allowed ${pollType === 'SURVEY' ? 'respondents' : 'voters'} to import.`);
    }
  };

  // Parse image to base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 2 Options controllers
  const handleAddOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.push(`Option ${updated[qIndex].options.length + 1}`);
    setQuestions(updated);
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options.length > 2) {
      updated[qIndex].options = updated[qIndex].options.filter((_: any, idx: number) => idx !== optIndex);
      setQuestions(updated);
    }
  };

  const handleOptionChange = (value: string, qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const handleAddQuestion = () => {
    const lastPage = questions.length > 0 ? questions[questions.length - 1].pageNumber : 1;
    setQuestions([...questions, { id: Date.now(), questionText: '', type: 'SINGLE', options: ['Option 1', 'Option 2'], pageNumber: lastPage, marks: 1, logicRules: null }]);
  };

  const handleAddPage = () => {
    const lastPage = questions.length > 0 ? questions[questions.length - 1].pageNumber : 0;
    setQuestions([...questions, { id: Date.now(), questionText: '', type: 'SINGLE', options: ['Option 1', 'Option 2'], pageNumber: lastPage + 1, marks: 1, logicRules: null }]);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, idx) => idx !== qIndex));
    }
  };

  // Step 4 Dynamic spreadsheet row controllers
  const handleVoterCountChange = (count: number) => {
    if (count < 1) return;
    if (count > 1000) count = 1000;
    setNumVoters(count);

    const updated = [...allowedVoters];
    if (count > updated.length) {
      // Append rows
      const diff = count - updated.length;
      for (let i = 0; i < diff; i++) {
        updated.push({ identifier: '', confirmer1: '', confirmer2: '', email: '' });
      }
    } else {
      // Truncate rows
      updated.splice(count);
    }
    setAllowedVoters(updated);
  };

  const handleImportGoogleSheet = async () => {
    setSheetImportError('');
    setSheetImportSuccess('');
    if (!sheetUrl.trim()) {
      setSheetImportError('Please provide a Google Sheets URL first.');
      return;
    }

    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      setSheetImportError('Invalid Google Sheets URL. Make sure it is a public link containing "/d/spreadsheet-id/".');
      return;
    }

    const docId = match[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv`;

    setImportingSheet(true);
    try {
      const res = await fetch(csvUrl);
      if (!res.ok) {
        throw new Error('Failed to fetch spreadsheet. Please verify that the sheet sharing settings are set to "Anyone with the link can view".');
      }

      const csvText = await res.text();
      const rows = csvText.split(/\r?\n/).filter(r => r.trim());

      if (rows.length < 2) {
        throw new Error('Spreadsheet is empty or lacks headers in the first row.');
      }

      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result.map(val => val.replace(/^"|"$/g, ''));
      };

      const headers = parseCSVLine(rows[0]).map(h => h.toLowerCase().trim());

      // Match header columns case-insensitively with current custom labels
      const identifierIdx = headers.findIndex(h => 
        h === identifierLabel.toLowerCase().trim() || 
        h.includes('id') || 
        h.includes('roll') || 
        h.includes('identifier') ||
        h.includes('unique')
      );
      const confirmer1Idx = headers.findIndex(h => 
        h === confirmer1Label.toLowerCase().trim() || 
        h.includes('confirmer1') || 
        h.includes('confirmer 1') || 
        h.includes('name1') || 
        h.includes('name 1') || 
        h === 'name'
      );
      const confirmer2Idx = headers.findIndex(h => 
        h === confirmer2Label.toLowerCase().trim() || 
        h.includes('confirmer2') || 
        h.includes('confirmer 2') || 
        h.includes('name2') || 
        h.includes('name 2')
      );
      const emailIdx = headers.findIndex(h => 
        h === 'email' || 
        h === 'email address' || 
        h === 'mail' || 
        h.includes('email')
      );
      const phoneIdx = headers.findIndex(h => 
        h === 'phone' || 
        h === 'phone number' || 
        h === 'contact' || 
        h.includes('phone') || 
        h.includes('contact')
      );
      const passwordIdx = headers.findIndex(h => 
        h === 'password' || 
        h === 'pass' || 
        h === 'passcode' || 
        h.includes('password') || 
        h.includes('passcode')
      );

      if (emailIdx === -1) {
        throw new Error('Required column "Email" was not found in the spreadsheet header row.');
      }

      const sessionIdx = headers.findIndex(h => 
        h === 'session' || 
        h.includes('sess')
      );
      const classIdx = headers.findIndex(h => 
        h === 'class' || 
        h === 'class year' || 
        h.includes('class') ||
        h.includes('year')
      );
      const departmentIdx = headers.findIndex(h => 
        h === 'department' || 
        h.includes('dept') || 
        h.includes('department')
      );

      const parsedVoters: any[] = [];
      for (let i = 1; i < rows.length; i++) {
        const cols = parseCSVLine(rows[i]);
        const email = emailIdx !== -1 ? (cols[emailIdx] || '').trim() : '';
        if (!email) continue; // Skip blank emails

        const sessionVal = sessionIdx !== -1 ? (cols[sessionIdx] || '').trim() : '';
        const classVal = classIdx !== -1 ? (cols[classIdx] || '').trim() : '';
        const deptVal = departmentIdx !== -1 ? (cols[departmentIdx] || '').trim() : '';

        parsedVoters.push({
          identifier: identifierIdx !== -1 ? (cols[identifierIdx] || '').trim() : '',
          confirmer1: confirmer1Idx !== -1 ? (cols[confirmer1Idx] || '').trim() : '',
          confirmer2: confirmer2Idx !== -1 ? (cols[confirmer2Idx] || '').trim() : '',
          email,
          phone: phoneIdx !== -1 ? (cols[phoneIdx] || '').trim() : '',
          password: passwordIdx !== -1 ? (cols[passwordIdx] || '').trim() : '',
          session: sessionVal,
          classYear: classVal,
          department: deptVal,
        });
      }

      if (parsedVoters.length === 0) {
        throw new Error('No valid voter entries found. Make sure email columns are populated.');
      }

      if (parsedVoters.length > 1000) {
        throw new Error('The spreadsheet contains more than 1000 voters. The system is capped at 1000.');
      }

      setNumVoters(parsedVoters.length);
      setAllowedVoters(parsedVoters);
      setSheetImportSuccess(`Successfully imported ${parsedVoters.length} voters from Google Sheet!`);
    } catch (err: any) {
      setSheetImportError(err.message || 'Failed to fetch spreadsheet. Confirm that links and permissions are valid.');
    } finally {
      setImportingSheet(false);
    }
  };

  const handleVoterCellChange = (value: string, index: number, field: string) => {
    const updated = [...allowedVoters];
    updated[index][field] = value;
    setAllowedVoters(updated);
  };

  const handleTablePaste = (e: React.ClipboardEvent<HTMLTableElement>) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('Text');
    if (!clipboardData) return;

    const parsedRows = clipboardData
      .trim()
      .split(/\r?\n/)
      .map((row) => {
        if (row.includes('\t')) {
          return row.split('\t');
        }
        return row.split(',');
      });

    if (parsedRows.length === 0) return;

    // Detect focused cell starting point
    const activeEl = document.activeElement as HTMLInputElement;
    let startRow = 0;
    let startFieldKey = 'identifier';

    if (activeEl && activeEl.hasAttribute('data-row-idx') && activeEl.hasAttribute('data-field-key')) {
      startRow = parseInt(activeEl.getAttribute('data-row-idx') || '0', 10);
      startFieldKey = activeEl.getAttribute('data-field-key') || 'identifier';
    }

    const fieldOrder = ['identifier', 'confirmer1'];
    if (pollType === 'EXAM') {
      fieldOrder.push('session', 'classYear', 'department');
    } else if (useConfirmer2) {
      fieldOrder.push('confirmer2');
    }
    fieldOrder.push('email');
    if (showPhoneColumn) {
      fieldOrder.push('phone');
    }
    if (showPasswordColumn) {
      fieldOrder.push('password');
    }

    const startFieldIdx = fieldOrder.indexOf(startFieldKey);
    const startIdx = startFieldIdx >= 0 ? startFieldIdx : 0;

    const updated = [...allowedVoters];
    parsedRows.forEach((cols, rOffset) => {
      const targetRowIdx = startRow + rOffset;
      if (!updated[targetRowIdx]) {
        updated[targetRowIdx] = { identifier: '', confirmer1: '', confirmer2: '', email: '', phone: '', password: '' };
      }

      // Preserve other fields of the row, only modifying targeted ones
      const voter = { ...updated[targetRowIdx] };
      cols.forEach((cellVal, cOffset) => {
        const targetFieldIdx = startIdx + cOffset;
        if (targetFieldIdx < fieldOrder.length) {
          const fieldKey = fieldOrder[targetFieldIdx];
          voter[fieldKey] = cellVal.trim();
        }
      });

      updated[targetRowIdx] = voter;
    });

    const filtered = updated.filter(v => v.identifier || v.confirmer1 || v.email);
    const finalRows = filtered.length > 0 ? filtered : [{ identifier: '', confirmer1: '', confirmer2: '', email: '', phone: '', password: '' }];
    
    setAllowedVoters(finalRows);
    setNumVoters(finalRows.length);
  };

  // Wizard Step verification
  const validateStep = () => {
    setError('');
    if (currentStep === 1) {
      if (!title.trim() || !description.trim()) {
        setError('Poll title and description are required.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (questions.some((q) => !q.questionText.trim())) {
        setError('Please input the question text for all questions.');
        return false;
      }
      if (questions.some((q) => ['SINGLE', 'RANKED', 'KNOCKOUT', 'MULTIPLE_CHOICE'].includes(q.type) && q.options.some((o: string) => !o.trim()))) {
        setError('All option labels must contain text.');
        return false;
      }
    }
    if (currentStep === 4 && !isOpenVoting) {
      // Validate per-voter based on their effective auth type
      for (let i = 0; i < allowedVoters.length; i++) {
        const v = allowedVoters[i];
        const authType = v.voterAuthType && v.voterAuthType !== 'GLOBAL' ? v.voterAuthType : (verificationMethod === 'PHONE' ? 'PHONE_PASSWORD' : (verificationType === 'PASSWORD' ? 'EMAIL_PASSWORD' : 'EMAIL_OTP'));
        
        if (!v.identifier?.trim() || !v.confirmer1?.trim()) {
          setError(`Row ${i + 1}: Compulsory cells (${identifierLabel} and ${confirmer1Label}) cannot be left blank.`);
          return false;
        }

        if (authType === 'EMAIL_OTP' || authType === 'EMAIL_PASSWORD') {
          if (!v.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) {
            setError(`Row ${i + 1}: Please enter a valid email address.`);
            return false;
          }
        }

        if (authType === 'EMAIL_PASSWORD' || authType === 'PHONE_PASSWORD') {
          if (!v.password || !v.password.trim()) {
            setError(`Row ${i + 1}: Password is required for this auth type.`);
            return false;
          }
        }

        if (authType === 'PHONE_PASSWORD') {
          if (!v.phone || !v.phone.trim()) {
            setError(`Row ${i + 1}: Phone number is required for phone + password auth.`);
            return false;
          }
        }
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep((prev) => prev - 1);
  };

  // Submit Poll (immediate or draft save)
  const handleSubmitPoll = async (status: 'DRAFT' | 'ACTIVE') => {
    setLoading(true);
    setError('');

    const payload = {
      title,
      description: ballotPriority === 'LOW' && !isOpenVoting && pollType !== 'SURVEY' ? `${description} [priority: LOW]` : description,
      posterUrl,
      pollType,
      isOpenVoting,
      isAnonymous: pollType === 'EXAM' ? false : isAnonymous,
      isResultPublic,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      status,
      questions: questions.map((q, idx) => ({
        questionText: q.questionText,
        type: q.type,
        options: ['SHORT_TEXT', 'LONG_TEXT', 'RATING'].includes(q.type) ? [] : q.options,
        pageNumber: q.pageNumber || 1,
        order: idx + 1,
        logicRules: q.logicRules || null,
        correctAnswer: q.correctAnswer || null,
        correctAnswers: q.correctAnswers || null,
        marks: q.marks !== undefined && q.marks !== null ? parseFloat(String(q.marks)) : 1.0,
        inputConstraint: q.inputConstraint || 'NONE',
        fileUploadDriveUrl: q.fileUploadDriveUrl || null,
        enableWhiteboard: !!q.enableWhiteboard,
      })),
      settings: {
        limitOneVotePerUser,
        limitOneVotePerIP,
        limitOneVotePerISP,
        hideResultsUntilEnd,
        publicShowMaps,
        publicShowCharts,
        publicShowStats,
        enableConfidenceSlider: questions.some(q => q.type === 'SINGLE') ? enableConfidenceSlider : false,
        enableDragAndDropPodium,
        enableHotStreaks,
        enableLiveTicker,
        enableFomoPopups: false,
        enableSmartDebrief,
        leaderboardVisibility,
        ...Object.fromEntries(Object.entries(rankedFeatures).map(([key, enabled]) => [key, hasRankedQuestion ? enabled : false])),
        ...Object.fromEntries(Object.entries(singleFeatures).map(([key, enabled]) => [key, hasSingleQuestion ? enabled : false])),
        ...Object.fromEntries(Object.entries(knockoutFeatures).map(([key, enabled]) => [key, hasKnockoutQuestion ? enabled : false])),
        rankedTieBreakerRule,
        rankedCompletenessRule,
        postSurveyAction: pollType === 'SURVEY' ? postSurveyAction : pollType === 'EXAM' ? postExamMessage : null,
        resultsReleased: pollType === 'EXAM' ? resultsReleased : false,
        collectEmail: pollType === 'SURVEY' ? collectEmail : false,
        postEmailMessage: pollType === 'SURVEY' ? postEmailMessage : null,
        enableDropOffTracking: pollType === 'SURVEY' ? enableDropOffTracking : false,
        enableSemanticAnalysis: pollType === 'SURVEY' ? enableSemanticAnalysis : false,
        enableCrossTabulation: pollType === 'SURVEY' ? enableCrossTabulation : false,
        enableTimeAnalytics: pollType === 'SURVEY' ? enableTimeAnalytics : false,

        // Verification matrices
        verificationMethod,
        verificationType,

        // Online Testing / Exam Engine Toggles
        examTimerDuration: pollType === 'EXAM' ? examTimerDuration : null,
        enableProctorCamera: pollType === 'EXAM' ? enableProctorCamera : false,
        enableProctorMicrophone: pollType === 'EXAM' ? enableProctorMicrophone : false,
        proctorDriveFolderUrl: pollType === 'EXAM' ? proctorDriveFolderUrl : null,
        enableAutoSubmitOnTabLeave: pollType === 'EXAM' ? enableAutoSubmitOnTabLeave : false,
        enableAutoSubmitOnCacheClear: pollType === 'EXAM' ? enableAutoSubmitOnCacheClear : false,
        enableAutoSubmitOnLeave: pollType === 'EXAM' ? enableAutoSubmitOnLeave : false,

        // Custom White-Label Branding
        enableCustomBranding,
        customLogoUrl,
        customBrandingText,

        // Additional 30 Advanced Features Toggles
        enableShuffleQuestions: pollType === 'EXAM' ? enableShuffleQuestions : false,
        enableShuffleOptions: pollType === 'EXAM' ? enableShuffleOptions : false,
        enableCopyPasteBlock: pollType === 'EXAM' ? enableCopyPasteBlock : false,
        enableInstantFeedback: pollType === 'EXAM' ? enableInstantFeedback : false,
        enableNegativeMarking: pollType === 'EXAM' ? enableNegativeMarking : false,
        enableCalculator: pollType === 'EXAM' ? enableCalculator : false,
        enableOtpBypass: pollType === 'EXAM' ? enableOtpBypass : false,
        enableStrictTimeBuffer: pollType === 'EXAM' ? enableStrictTimeBuffer : false,
        enableTabDepartureSound: pollType === 'EXAM' ? enableTabDepartureSound : false,

        enableDemographicWeighting: pollType === 'POLL' ? enableDemographicWeighting : false,
        enableVpnBlocking: pollType === 'POLL' ? enableVpnBlocking : false,
        enableWriteInOptions: pollType === 'POLL' ? enableWriteInOptions : false,
        enableQuadraticVoting: pollType === 'POLL' ? enableQuadraticVoting : false,
        enableTieBreakerEngine: pollType === 'POLL' ? enableTieBreakerEngine : false,
        enableConsensusScore: pollType === 'POLL' ? enableConsensusScore : false,
        enableSentimentChat: pollType === 'POLL' ? enableSentimentChat : false,
        enableSwingMap: pollType === 'POLL' ? enableSwingMap : false,

        enableCustomNavLabels: pollType === 'SURVEY' ? enableCustomNavLabels : false,
        enablePreOnboarding: pollType === 'SURVEY' ? enablePreOnboarding : false,
        enableBranchingLogic: pollType === 'SURVEY' ? enableBranchingLogic : false,
        enableDomainRestriction: pollType === 'SURVEY' ? enableDomainRestriction : false,
        enableDirectInbox: pollType === 'SURVEY' ? enableDirectInbox : false,
        enableDraftSave: pollType === 'SURVEY' ? enableDraftSave : false,
        customTheme,
        enableSaveAndResumeLater: ['EXAM', 'SURVEY'].includes(pollType) ? enableSaveAndResumeLater : false,
        studentWhiteboardDriveUrl: ['EXAM', 'SURVEY'].includes(pollType) && studentWhiteboardDriveUrl ? studentWhiteboardDriveUrl : null,
      },
      allowedVoters: isOpenVoting 
        ? [] 
        : allowedVoters.map(v => {
            const authType = v.voterAuthType && v.voterAuthType !== 'GLOBAL' ? v.voterAuthType : (verificationMethod === 'PHONE' ? 'PHONE_PASSWORD' : (verificationType === 'PASSWORD' ? 'EMAIL_PASSWORD' : 'EMAIL_OTP'));
            const cleanEmail = v.email?.trim() || (authType === 'PHONE_PASSWORD' ? `${v.phone || v.identifier || Math.random().toString(36).substring(7)}@phone.pollstar` : '');
            const confirmer2Val = pollType === 'EXAM' 
              ? JSON.stringify({
                  session: v.session || 'General',
                  class: v.classYear || v.class || 'General',
                  department: v.department || 'General',
                })
              : (useConfirmer2 ? v.confirmer2 : '');
            return {
              identifier: v.identifier,
              confirmer1: v.confirmer1,
              confirmer2: confirmer2Val,
              email: cleanEmail,
              phone: v.phone || null,
              password: v.password || null,
              voterAuthType: v.voterAuthType || 'GLOBAL',
            };
          }),
      identifierLabel: isOpenVoting ? 'Roll Number' : identifierLabel,
      confirmer1Label: isOpenVoting ? 'Student Name' : confirmer1Label,
      confirmer2Label: isOpenVoting ? 'Parent Name' : (useConfirmer2 ? confirmer2Label : ''),
      invoiceId: selectedInvoiceId || undefined,
    };

    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create poll');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // DRAFT EDIT: PATCH when editingPollId is set
  // ────────────────────────────────────────────────────────
  const handleUpdateDraftPoll = async (status: 'DRAFT' | 'ACTIVE') => {
    if (!editingPollId) return;
    setLoading(true);
    setError('');

    const payload = {
      title,
      description: ballotPriority === 'LOW' && !isOpenVoting && pollType !== 'SURVEY' ? `${description} [priority: LOW]` : description,
      posterUrl,
      isOpenVoting,
      isAnonymous: pollType === 'EXAM' ? false : isAnonymous,
      isResultPublic,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      status,
      questions: questions.map((q, idx) => ({
        questionText: q.questionText,
        type: q.type,
        options: ['SHORT_TEXT', 'LONG_TEXT', 'RATING'].includes(q.type) ? [] : q.options,
        pageNumber: q.pageNumber || 1,
        order: idx + 1,
        logicRules: q.logicRules || null,
        correctAnswer: q.correctAnswer || null,
        correctAnswers: q.correctAnswers || null,
        marks: q.marks !== undefined && q.marks !== null ? parseFloat(String(q.marks)) : 1.0,
        inputConstraint: q.inputConstraint || 'NONE',
        fileUploadDriveUrl: q.fileUploadDriveUrl || null,
        enableWhiteboard: !!q.enableWhiteboard,
      })),
      settings: {
        limitOneVotePerUser,
        limitOneVotePerIP,
        limitOneVotePerISP,
        hideResultsUntilEnd,
        publicShowMaps,
        publicShowCharts,
        publicShowStats,
        enableConfidenceSlider: questions.some(q => q.type === 'SINGLE') ? enableConfidenceSlider : false,
        enableDragAndDropPodium,
        enableHotStreaks,
        enableLiveTicker,
        enableFomoPopups: false,
        enableSmartDebrief,
        leaderboardVisibility,
        ...Object.fromEntries(Object.entries(rankedFeatures).map(([key, enabled]) => [key, hasRankedQuestion ? enabled : false])),
        ...Object.fromEntries(Object.entries(singleFeatures).map(([key, enabled]) => [key, hasSingleQuestion ? enabled : false])),
        ...Object.fromEntries(Object.entries(knockoutFeatures).map(([key, enabled]) => [key, hasKnockoutQuestion ? enabled : false])),
        rankedTieBreakerRule,
        rankedCompletenessRule,
        postSurveyAction: pollType === 'SURVEY' ? postSurveyAction : pollType === 'EXAM' ? postExamMessage : null,
        resultsReleased: pollType === 'EXAM' ? resultsReleased : false,
        collectEmail: pollType === 'SURVEY' ? collectEmail : false,
        postEmailMessage: pollType === 'SURVEY' ? postEmailMessage : null,
        enableDropOffTracking: pollType === 'SURVEY' ? enableDropOffTracking : false,
        enableSemanticAnalysis: pollType === 'SURVEY' ? enableSemanticAnalysis : false,
        enableCrossTabulation: pollType === 'SURVEY' ? enableCrossTabulation : false,
        enableTimeAnalytics: pollType === 'SURVEY' ? enableTimeAnalytics : false,
        verificationMethod,
        verificationType,
        examTimerDuration: pollType === 'EXAM' ? examTimerDuration : null,
        enableProctorCamera: pollType === 'EXAM' ? enableProctorCamera : false,
        enableProctorMicrophone: pollType === 'EXAM' ? enableProctorMicrophone : false,
        proctorDriveFolderUrl: pollType === 'EXAM' ? proctorDriveFolderUrl : null,
        enableAutoSubmitOnTabLeave: pollType === 'EXAM' ? enableAutoSubmitOnTabLeave : false,
        enableAutoSubmitOnCacheClear: pollType === 'EXAM' ? enableAutoSubmitOnCacheClear : false,
        enableAutoSubmitOnLeave: pollType === 'EXAM' ? enableAutoSubmitOnLeave : false,
        enableCustomBranding,
        customLogoUrl,
        customBrandingText,
        enableShuffleQuestions: pollType === 'EXAM' ? enableShuffleQuestions : false,
        enableShuffleOptions: pollType === 'EXAM' ? enableShuffleOptions : false,
        enableCopyPasteBlock: pollType === 'EXAM' ? enableCopyPasteBlock : false,
        enableInstantFeedback: pollType === 'EXAM' ? enableInstantFeedback : false,
        enableNegativeMarking: pollType === 'EXAM' ? enableNegativeMarking : false,
        enableCalculator: pollType === 'EXAM' ? enableCalculator : false,
        enableOtpBypass: pollType === 'EXAM' ? enableOtpBypass : false,
        enableStrictTimeBuffer: pollType === 'EXAM' ? enableStrictTimeBuffer : false,
        enableTabDepartureSound: pollType === 'EXAM' ? enableTabDepartureSound : false,
        enableDemographicWeighting: pollType === 'POLL' ? enableDemographicWeighting : false,
        enableVpnBlocking: pollType === 'POLL' ? enableVpnBlocking : false,
        enableWriteInOptions: pollType === 'POLL' ? enableWriteInOptions : false,
        enableQuadraticVoting: pollType === 'POLL' ? enableQuadraticVoting : false,
        enableTieBreakerEngine: pollType === 'POLL' ? enableTieBreakerEngine : false,
        enableConsensusScore: pollType === 'POLL' ? enableConsensusScore : false,
        enableSentimentChat: pollType === 'POLL' ? enableSentimentChat : false,
        enableSwingMap: pollType === 'POLL' ? enableSwingMap : false,
        enableCustomNavLabels: pollType === 'SURVEY' ? enableCustomNavLabels : false,
        enablePreOnboarding: pollType === 'SURVEY' ? enablePreOnboarding : false,
        enableBranchingLogic: pollType === 'SURVEY' ? enableBranchingLogic : false,
        enableDomainRestriction: pollType === 'SURVEY' ? enableDomainRestriction : false,
        enableDirectInbox: pollType === 'SURVEY' ? enableDirectInbox : false,
        enableDraftSave: pollType === 'SURVEY' ? enableDraftSave : false,
        customTheme,
        enableSaveAndResumeLater: ['EXAM', 'SURVEY'].includes(pollType) ? enableSaveAndResumeLater : false,
        studentWhiteboardDriveUrl: ['EXAM', 'SURVEY'].includes(pollType) && studentWhiteboardDriveUrl ? studentWhiteboardDriveUrl : null,
      },
      allowedVoters: isOpenVoting 
        ? [] 
        : allowedVoters.map(v => {
            const authType = v.voterAuthType && v.voterAuthType !== 'GLOBAL' ? v.voterAuthType : (verificationMethod === 'PHONE' ? 'PHONE_PASSWORD' : (verificationType === 'PASSWORD' ? 'EMAIL_PASSWORD' : 'EMAIL_OTP'));
            const cleanEmail = v.email?.trim() || (authType === 'PHONE_PASSWORD' ? `${v.phone || v.identifier || Math.random().toString(36).substring(7)}@phone.pollstar` : '');
            const confirmer2Val = pollType === 'EXAM' 
              ? JSON.stringify({
                  session: v.session || 'General',
                  class: v.classYear || v.class || 'General',
                  department: v.department || 'General',
                })
              : (useConfirmer2 ? v.confirmer2 : '');
            return {
              identifier: v.identifier,
              confirmer1: v.confirmer1,
              confirmer2: confirmer2Val,
              email: cleanEmail,
              phone: v.phone || null,
              password: v.password || null,
              voterAuthType: v.voterAuthType || 'GLOBAL',
            };
          }),
      identifierLabel: isOpenVoting ? 'Roll Number' : identifierLabel,
      confirmer1Label: isOpenVoting ? 'Student Name' : confirmer1Label,
      confirmer2Label: isOpenVoting ? 'Parent Name' : (useConfirmer2 ? confirmer2Label : ''),
    };

    try {
      const res = await fetch(`/api/polls/${editingPollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update poll');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // FETCH AUDIT LOGS FOR THIS POLL
  // ────────────────────────────────────────────────────────
  const fetchLogs = async () => {
    if (!editingPollId) return;
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/polls/${editingPollId}/logs`);
      const data = await res.json();
      if (data.success) {
        setLogsList(data.logs || []);
      }
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  // EXAM skips the anonymity/privacy step → 8 steps total
  const stepsList = pollType === 'EXAM'
    ? ['Details', 'Questions', 'Completion', 'Audience', 'Security', 'Schedule', 'Visibility', 'Settings']
    : pollType === 'SURVEY'
      ? ['Details', 'Question', 'Completion', 'Audience', 'Security', 'Privacy', 'Schedule', 'Visibility', 'Advanced']
      : ['Details', 'Question', 'Type', 'Audience', 'Security', 'Anonymity', 'Schedule', 'Visibility', 'Advanced'];

  // For EXAM, steps 6+ are shifted up by 1 to skip the anonymity slot
  const renderStep = pollType === 'EXAM' && currentStep >= 6 ? currentStep + 1 : currentStep;

  const showPhoneColumn = pollType === 'EXAM' || verificationMethod === 'PHONE' || allowedVoters.some(v => v.voterAuthType === 'PHONE_PASSWORD');
  const showPasswordColumn = verificationType === 'PASSWORD' || allowedVoters.some(v => v.voterAuthType === 'EMAIL_PASSWORD' || v.voterAuthType === 'PHONE_PASSWORD');

  // Helper: get which collaborator (if any) is focused on the given field
  const getCollabOnField = (fieldName: string) => {
    return activeCollaborators.find((c: any) => c.focus === fieldName) || null;
  };

  const collabRingColors = ['ring-violet-500', 'ring-cyan-500', 'ring-rose-500', 'ring-amber-500', 'ring-green-500'];
  const getCollabRingColor = (collab: any) => {
    const idx = activeCollaborators.indexOf(collab);
    return collabRingColors[idx % collabRingColors.length];
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <header className="w-full border-b border-white/5 bg-[#080d1a]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <BrandLogo iconSize={22} textSize="text-xl" />
          </Link>

          <div className="flex items-center gap-3">
            {/* Collaborator presence badges */}
            {editingPollId && activeCollaborators.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {activeCollaborators.slice(0, 5).map((collab: any, i: number) => {
                    const colors = ['bg-violet-500', 'bg-cyan-500', 'bg-rose-500', 'bg-amber-500', 'bg-green-500'];
                    const name = collab.fullName || collab.email || 'User';
                    return (
                      <div
                        key={collab.id || i}
                        title={`${name} is editing`}
                        className={`w-7 h-7 rounded-full ${colors[i % colors.length]} border-2 border-[#080d1a] flex items-center justify-center text-white text-[9px] font-black uppercase shadow-md`}
                      >
                        {name.charAt(0)}
                      </div>
                    );
                  })}
                </div>
                <span className="text-[10px] text-gray-400 font-semibold">
                  {activeCollaborators.length} editing
                </span>
              </div>
            )}

            {/* Logs button (only visible when editing existing poll) */}
            {editingPollId && (
              <button
                type="button"
                onClick={() => { setShowLogsModal(true); fetchLogs(); }}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Activity className="w-3.5 h-3.5" />
                Logs
              </button>
            )}

            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white flex items-center space-x-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Wizard container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 flex flex-col justify-between space-y-10">
        
        {/* Top Progress bar */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs text-gray-500 uppercase tracking-widest font-bold">
            <span>Step {currentStep} of {stepsList.length}</span>
            <span className="text-indigo-400">{stepsList[currentStep - 1]}</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex">
            {stepsList.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-full transition-all border-r border-[#030712] last:border-0 ${
                  index < currentStep ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Wizard Steps */}
        <div className="flex-1 flex flex-col justify-center" data-wizard-step={currentStep}>
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-6 flex items-center space-x-2 animate-shake">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Core Details */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Basics</h2>
                <p className="text-gray-400 text-sm mt-1">Provide a title and a description to engage your audience.</p>
              </div>

              <div className="p-4.5 rounded-2xl border bg-white/2 border-white/5 flex items-center justify-between shadow-lg shadow-indigo-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                    {pollType === 'POLL' && <Vote className="w-5 h-5" />}
                    {pollType === 'SURVEY' && <FileText className="w-5 h-5" />}
                    {pollType === 'EXAM' && <Award className="w-5 h-5 text-violet-400" />}
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">Creation Mode</span>
                    <h4 className="text-sm font-bold text-white">
                      {pollType === 'POLL' && 'Standard Poll'}
                      {pollType === 'SURVEY' && 'Survey Questionnaire'}
                      {pollType === 'EXAM' && 'Online Proctored Exam'}
                    </h4>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest font-mono">
                  {pollType}
                </span>
              </div>

              {/* Allocation Selector */}
              {(() => {
                const options = getAllocationOptions();
                if (options.length <= 1) return null;
                return (
                  <div className="space-y-3 p-5 rounded-2xl border border-white/5 bg-white/2">
                    <label className="block text-indigo-300 text-xs font-extrabold uppercase tracking-wider">
                      Allocate Creation To:
                    </label>
                    <p className="text-[10px] text-gray-500">You have multiple active plans/add-ons. Choose where to deduct this creation credit.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {options.map((opt) => {
                        const isSelected = selectedInvoiceId === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedInvoiceId(opt.id)}
                            className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                              isSelected
                                ? 'bg-indigo-500/10 border-indigo-500/40 text-white shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/30'
                                : 'bg-white/2 border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/4'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-3 right-3 p-1 rounded-full bg-indigo-500 text-white">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                            <div>
                              <h5 className="font-bold text-xs text-white">{opt.name}</h5>
                              <p className="text-[10px] text-gray-500 mt-1">Participant Limit: <strong className="text-gray-400">{opt.participantLimit}</strong></p>
                            </div>
                            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] uppercase tracking-wider font-bold">
                              <span>Remaining creations:</span>
                              <span className={isSelected ? 'text-indigo-400' : 'text-gray-400'}>{opt.remaining}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    Title
                  </label>
                  {(() => {
                    const collab = getCollabOnField('title');
                    return (
                      <div className="relative">
                        {collab && (
                          <div className="absolute -top-5 left-0 flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full bg-violet-400 animate-pulse`} />
                            <span className="text-[9px] text-violet-400 font-semibold">{collab.fullName || collab.email} is editing this</span>
                          </div>
                        )}
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          onFocus={() => setFocusedField('title')}
                          onBlur={() => setFocusedField('')}
                          placeholder={pollType === 'POLL' ? "e.g. Student Council Presidential Election 2026" : "e.g. Customer Satisfaction Survey"}
                          className={`w-full glass-input placeholder-gray-600 text-sm transition-all ${collab ? `ring-2 ${getCollabRingColor(collab)} ring-offset-0 ring-offset-transparent` : ''}`}
                        />
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    {pollType === 'SURVEY' ? 'Description / Survey Guidelines' : 'Description / Voter Guidelines'}
                  </label>
                  {(() => {
                    const collab = getCollabOnField('description');
                    return (
                      <div className="relative">
                        {collab && (
                          <div className="absolute -top-5 left-0 flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full bg-cyan-400 animate-pulse`} />
                            <span className="text-[9px] text-cyan-400 font-semibold">{collab.fullName || collab.email} is editing this</span>
                          </div>
                        )}
                        <textarea
                          required
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          onFocus={() => setFocusedField('description')}
                          onBlur={() => setFocusedField('')}
                          placeholder={pollType === 'SURVEY' 
                            ? "Provide details about the survey's purpose, scope, guidelines, and other rules." 
                            : "Provide details about the poll candidate bios, voting guidelines, and other rules."}
                          className={`w-full glass-input placeholder-gray-600 text-sm resize-none transition-all ${collab ? `ring-2 ${getCollabRingColor(collab)} ring-offset-0 ring-offset-transparent` : ''}`}
                        />
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    {pollType === 'SURVEY' ? 'Survey Banner (Optional)' : 'Poll Poster (Optional)'}
                  </label>
                  <div className="flex items-center space-x-6">
                    <label className="cursor-pointer px-5 py-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold transition-all flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Upload Poster</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {posterUrl && (
                      <div className="relative w-16 h-16 rounded-xl border border-white/10 overflow-hidden bg-white/5">
                        <img src={posterUrl} alt="Poster preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPosterUrl('')}
                          className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Questions & Options */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Questions</h2>
                  <p className="text-gray-400 text-sm mt-1">Define the questions being asked.</p>
                </div>
                {(pollType === 'SURVEY' || pollType === 'EXAM') && (
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleAddPage}
                      className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Page Break</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Question</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {questions.map((q, qIndex) => (
                  <div
                    key={q.id}
                    draggable={['SURVEY', 'EXAM'].includes(pollType)}
                    onDragStart={() => setDraggedIndex(qIndex)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropQuestion(qIndex)}
                    onDragEnd={() => setDraggedIndex(null)}
                    className={`p-5 rounded-2xl border border-white/10 bg-[#080d1a] space-y-4 relative group transition-all duration-300 ${
                      draggedIndex === qIndex ? 'opacity-40 scale-95 border-dashed border-indigo-500/50' : 'opacity-100 hover:border-white/15'
                    }`}
                  >
                    {['SURVEY', 'EXAM'].includes(pollType) && questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    <div>
                      <label className="flex justify-between items-center text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                        <span className="flex items-center gap-1.5">
                          {['SURVEY', 'EXAM'].includes(pollType) && (
                            <span title="Drag to reorder" className="cursor-grab active:cursor-grabbing shrink-0">
                              <GripVertical className="w-4 h-4 hover:text-indigo-400 text-gray-500" />
                            </span>
                          )}
                          <span>Question {qIndex + 1}</span>
                        </span>
                        {['SURVEY', 'EXAM'].includes(pollType) && (
                          <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[10px]">Page {q.pageNumber}</span>
                        )}
                      </label>
                      {(() => {
                        const fieldName = `question-${qIndex}`;
                        const collab = getCollabOnField(fieldName);
                        return (
                          <div className="relative">
                            {collab && (
                              <div className="absolute -top-5 left-0 flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                <span className="text-[9px] text-amber-400 font-semibold">{collab.fullName || collab.email} is editing this</span>
                              </div>
                            )}
                            <input
                              type="text"
                              required
                              value={q.questionText}
                              onChange={(e) => {
                                const updated = [...questions];
                                updated[qIndex].questionText = e.target.value;
                                setQuestions(updated);
                              }}
                              onFocus={() => setFocusedField(fieldName)}
                              onBlur={() => setFocusedField('')}
                              placeholder={pollType === 'EXAM' ? "Type exam question here..." : "Type your question here..."}
                              className={`w-full glass-input placeholder-gray-600 text-sm pr-12 transition-all ${collab ? `ring-2 ${getCollabRingColor(collab)} ring-offset-0 ring-offset-transparent` : ''}`}
                            />
                          </div>
                        );
                      })()}
                    </div>

                    {['SURVEY', 'EXAM'].includes(pollType) && (
                      <div>
                        <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                          Question Type
                        </label>
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[qIndex].type = e.target.value;
                            // Clean up options or properties when switching types
                            if (['SHORT_TEXT', 'LONG_TEXT', 'FILE_UPLOAD'].includes(e.target.value)) {
                              updated[qIndex].options = [];
                            } else if (updated[qIndex].options.length === 0) {
                              updated[qIndex].options = ['Option 1', 'Option 2'];
                            }
                            setQuestions(updated);
                          }}
                          className="w-full glass-input placeholder-gray-600 text-sm"
                        >
                          {pollType === 'EXAM' ? (
                            <>
                              <option value="SINGLE">Single Choice MCQ</option>
                              <option value="MULTI_SELECT">Multiple Correct MCQ</option>
                              <option value="SHORT_TEXT">Short Answer (SAQ)</option>
                              <option value="LONG_TEXT">Long Answer (LAQ)</option>
                              <option value="FILE_UPLOAD">File Upload Question</option>
                            </>
                          ) : (
                            <>
                              <option value="SINGLE">Single Choice</option>
                              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                              <option value="SHORT_TEXT">Short Text</option>
                              <option value="LONG_TEXT">Long Text / Paragraph</option>
                              <option value="RATING">Rating (1-5 Stars)</option>
                              <option value="RANKED">Ranked Choice (Borda)</option>
                              <option value="KNOCKOUT">Knockout Tournament</option>
                            </>
                          )}
                        </select>
                      </div>
                    )}

                    {/* ASSIGNED MARKS FOR EXAMS */}
                    {pollType === 'EXAM' && (
                      <div className="pt-1">
                        <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                          Assigned Question Marks
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          required
                          value={q.marks !== undefined ? q.marks : 1}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[qIndex].marks = parseFloat(e.target.value) || 1;
                            setQuestions(updated);
                          }}
                          className="w-full glass-input text-sm"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                          Specify points awarded for this question. Must be a multiple of 0.5 (e.g. 1.0, 1.5, 2.0).
                        </p>

                        {/* Per-Question Negative Marking (Gated under plan features) */}
                        {['SINGLE', 'MULTIPLE_CHOICE', 'MULTI_SELECT'].includes(q.type) && (() => {
                          const isLocked = isFeatureLocked('negativeMarking');
                          
                          // Safely parse rules
                          let rules: any = {};
                          if (typeof q.logicRules === 'string') {
                            try { rules = JSON.parse(q.logicRules) || {}; } catch(e) {}
                          } else if (q.logicRules && typeof q.logicRules === 'object') {
                            rules = q.logicRules;
                          }
                          
                          const enableNeg = !!rules.enableNegativeMarking;
                          const penalty = typeof rules.negativeMarkingPenalty === 'number' ? rules.negativeMarkingPenalty : 0.25;
                          
                          const updateRules = (updates: any) => {
                            const updated = [...questions];
                            const currentRules = { ...rules, ...updates };
                            updated[qIndex].logicRules = currentRules;
                            setQuestions(updated);
                          };
                          
                          return (
                            <div className="mt-3 p-3.5 rounded-xl border border-white/5 bg-white/2 space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                                  Negative Marking Penalty?
                                  {isLocked && (
                                    <span className="text-[8px] font-black text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded border border-indigo-400/25 flex items-center gap-1">
                                      🔒 PRO
                                    </span>
                                  )}
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isLocked) {
                                      router.push('/plans');
                                      return;
                                    }
                                    updateRules({ enableNegativeMarking: !enableNeg });
                                  }}
                                  className={`w-10 h-5 rounded-full p-0.5 transition-all duration-300 ${
                                    enableNeg ? 'bg-indigo-500 flex justify-end' : 'bg-white/10 flex justify-start'
                                  }`}
                                >
                                  <div className="w-4 h-4 rounded-full bg-white shadow-md animate-fade-in" />
                                </button>
                              </div>
                              
                              {enableNeg && !isLocked && (
                                <div className="space-y-1.5 animate-fade-in-up">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Negative marking penalty</span>
                                  <input
                                    type="number"
                                    step="0.05"
                                    min="0.05"
                                    max={q.marks || 1}
                                    value={penalty}
                                    onChange={(e) => {
                                      let val = parseFloat(e.target.value) || 0.25;
                                      if (val < 0.05) val = 0.05;
                                      updateRules({ negativeMarkingPenalty: val });
                                    }}
                                    className="w-full glass-input text-xs py-1.5"
                                    placeholder="e.g. 0.25"
                                  />
                                  <p className="text-[9px] text-gray-500 font-outfit block">
                                    Points to deduct for wrong answers. Typically 0.25 or 0.33.
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {q.type === 'MULTI_SELECT' && (() => {
                          // Safely parse rules
                          let rules: any = {};
                          if (typeof q.logicRules === 'string') {
                            try { rules = JSON.parse(q.logicRules) || {}; } catch(e) {}
                          } else if (q.logicRules && typeof q.logicRules === 'object') {
                            rules = q.logicRules;
                          }
                          const markingScheme = rules.markingScheme || 'ALL_OR_NOTHING';
                          const updateRules = (updates: any) => {
                            const updated = [...questions];
                            const currentRules = { ...rules, ...updates };
                            updated[qIndex].logicRules = currentRules;
                            setQuestions(updated);
                          };
                          return (
                            <div className="mt-3 p-3.5 rounded-xl border border-white/5 bg-white/2 space-y-2">
                              <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider">
                                MCQ Multiple Correct Marking Scheme
                              </label>
                              <select
                                value={markingScheme}
                                onChange={(e) => updateRules({ markingScheme: e.target.value })}
                                className="w-full bg-[#030712] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                              >
                                <option value="ALL_OR_NOTHING">ALL_OR_NOTHING (Strict: 0 marks if any choice is wrong/missing)</option>
                                <option value="PARTIAL">PARTIAL (Proportional credit, no penalty)</option>
                                <option value="PARTIAL_WITH_PENALTY">PARTIAL_WITH_PENALTY (Proportional credit, deduct penalty for incorrect selections)</option>
                                <option value="ZERO_ON_INCORRECT">ZERO_ON_INCORRECT (Proportional credit, but 0 marks if any incorrect choice is made)</option>
                              </select>
                              <p className="text-[9px] text-gray-500 font-outfit block mt-1">
                                Specify how partial and incorrect choices are scored for multiple correct choice questions.
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {['SINGLE', 'MULTIPLE_CHOICE', 'RANKED', 'KNOCKOUT', 'MULTI_SELECT'].includes(q.type) && (
                      <div className="space-y-3 pt-2">
                        <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider">
                          Options / Choices
                        </label>
                        <div className="space-y-2">
                          {q.options.map((opt: string, optIdx: number) => {
                            const fieldName = `question-${qIndex}-option-${optIdx}`;
                            const collab = getCollabOnField(fieldName);
                            return (
                              <div key={optIdx} className="flex items-center space-x-2.5 relative">
                                <div className="flex-1 relative">
                                  {collab && (
                                    <div className="absolute -top-5 left-0 flex items-center gap-1 z-10">
                                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                      <span className="text-[9px] text-amber-400 font-semibold">{collab.fullName || collab.email} is editing this</span>
                                    </div>
                                  )}
                                  <input
                                    type="text"
                                    required
                                    value={opt}
                                    onChange={(e) => handleOptionChange(e.target.value, qIndex, optIdx)}
                                    onFocus={() => setFocusedField(fieldName)}
                                    onBlur={() => setFocusedField('')}
                                    placeholder={`Option ${optIdx + 1}`}
                                    className={`w-full glass-input placeholder-gray-600 text-sm py-2 transition-all ${collab ? `ring-2 ${getCollabRingColor(collab)} ring-offset-0 ring-offset-transparent` : ''}`}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(qIndex, optIdx)}
                                  disabled={q.options.length <= 2}
                                  className={`p-2.5 rounded-xl border border-white/5 transition-all ${
                                    q.options.length > 2
                                      ? 'text-red-400 hover:bg-red-500/10 hover:border-red-500/20'
                                      : 'text-gray-600 cursor-not-allowed'
                                  }`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddOption(qIndex)}
                          className="mt-2 px-4 py-2 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 hover:text-indigo-300 text-[10px] font-bold transition-all flex items-center space-x-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Another Option</span>
                        </button>
                      </div>
                    )}

                    {/* MCQ SINGLE CORRECT ANSWER SELECTOR */}
                    {pollType === 'EXAM' && q.type === 'SINGLE' && (
                      <div className="pt-2">
                        <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                          Correct Answer Option Choice
                        </label>
                        <select
                          value={q.correctAnswer || ''}
                          required
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[qIndex].correctAnswer = e.target.value;
                            setQuestions(updated);
                          }}
                          className="w-full glass-input text-sm"
                        >
                          <option value="" disabled>-- Select Correct Option --</option>
                          {q.options.map((opt: string, optIdx: number) => (
                            <option key={optIdx} value={opt || `Option ${optIdx + 1}`}>{opt || `Option ${optIdx + 1}`}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* MCQ MULTIPLE CORRECT OPTIONS SELECTOR */}
                    {pollType === 'EXAM' && q.type === 'MULTI_SELECT' && (
                      <div className="pt-2 space-y-2">
                        <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider">
                          Select Correct Answer Options (Multiple Selection Allowed)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt: string, optIdx: number) => {
                            const correctAnswersList = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];
                            const isChecked = correctAnswersList.includes(opt);
                            return (
                              <div
                                key={optIdx}
                                onClick={() => {
                                  const updated = [...questions];
                                  const currentList = Array.isArray(updated[qIndex].correctAnswers) ? [...updated[qIndex].correctAnswers] : [];
                                  if (currentList.includes(opt)) {
                                    updated[qIndex].correctAnswers = currentList.filter(item => item !== opt);
                                  } else {
                                    updated[qIndex].correctAnswers = [...currentList, opt];
                                  }
                                  setQuestions(updated);
                                }}
                                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                                  isChecked ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/5 bg-white/2 hover:border-white/8'
                                }`}
                              >
                                <span className="text-xs text-gray-300">{opt || `Option ${optIdx + 1}`}</span>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  isChecked ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* SAQ & LAQ INPUT CONSTRAINTS & SAMPLE ANSWER */}
                    {pollType === 'EXAM' && ['SHORT_TEXT', 'LONG_TEXT'].includes(q.type) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                        <div className="space-y-1.5">
                          <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider">
                            Sample Model Answer (For AI Semantic Evaluation)
                          </label>
                          <textarea
                            rows={q.type === 'LONG_TEXT' ? 3 : 2}
                            placeholder="Type sample answer. AI will match keywords and calculate similarity..."
                            value={q.correctAnswer || ''}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[qIndex].correctAnswer = e.target.value;
                              setQuestions(updated);
                            }}
                            className="w-full glass-input text-xs placeholder-gray-600"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider">
                            Examinee Input Restriction Constraint
                          </label>
                          <select
                            value={q.inputConstraint || 'NONE'}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[qIndex].inputConstraint = e.target.value;
                              setQuestions(updated);
                            }}
                            className="w-full glass-input text-xs"
                          >
                            <option value="NONE">No Constraints (Letters, numbers, special symbols)</option>
                            <option value="NUMBERS">Numbers Only (Numeric inputs only)</option>
                            <option value="CHARACTERS">Characters Only (Alphabets only)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* FILE UPLOAD DRIVE LINK MAPPING */}
                    {pollType === 'EXAM' && q.type === 'FILE_UPLOAD' && (
                      <div className="pt-2 space-y-1.5 border-t border-white/5">
                        <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider">
                          Google Drive Shared Upload Folder URL (Publicly Editable)
                        </label>
                        <input
                          type="url"
                          required
                          placeholder="https://drive.google.com/drive/folders/..."
                          value={q.fileUploadDriveUrl || ''}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[qIndex].fileUploadDriveUrl = e.target.value;
                            setQuestions(updated);
                          }}
                          className="w-full glass-input text-sm placeholder-gray-600"
                        />
                        <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                          Examinee uploaded answer documents will go to this GDrive folder. Set shared folder permissions to "Anyone with the link can edit/organize/upload".
                        </p>
                      </div>
                    )}

                    {/* STUDENT DRAWING WHITEBOARD TOGGLE */}
                    {['EXAM', 'SURVEY'].includes(pollType) && (
                      <div className="pt-3 mt-3 border-t border-white/5 relative">
                        {userPlan && userPlan.features && !userPlan.features['studentWhiteboardQuestion'] && (
                          <div className="absolute inset-0 bg-[#030712]/90 backdrop-blur-[2px] rounded-xl flex items-center justify-between px-4 py-2 z-10">
                            <span className="text-[10px] font-bold text-amber-400 flex items-center space-x-1">
                              <span>🔒 Upgrade Plan to Unlock Student Whiteboard</span>
                            </span>
                            <a
                              href="/plans"
                              className="text-[9px] font-extrabold text-white bg-amber-500 hover:bg-amber-600 px-2 py-1 rounded transition-all"
                            >
                              Upgrade
                            </a>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider">
                              Enable Student Whiteboard / Sketchpad
                            </label>
                            <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                              Renders an interactive whiteboard directly under this question for sketches, charts, or math flows.
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={!!q.enableWhiteboard}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[qIndex].enableWhiteboard = e.target.checked;
                              setQuestions(updated);
                            }}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {pollType === 'SURVEY' && q.type === 'SINGLE' && q.options.length > 0 && (
                      <div className="mt-4 p-4 rounded-xl border border-indigo-500/10 bg-[#6366f1]/5 space-y-3">
                        <div className="flex items-center space-x-2">
                          <Layers className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">Skip Logic &amp; Branching Rules</span>
                        </div>
                        <p className="text-[10px] text-gray-400">
                          Configure custom routing flows depending on which option the respondent selects.
                        </p>
                        <div className="space-y-2.5 pt-1">
                          {q.options.map((opt: string, optIdx: number) => {
                            const existingRule = q.logicRules && (q.logicRules as any).rules 
                              ? (q.logicRules as any).rules.find((r: any) => r.option === opt)
                              : null;
                            const currentTarget = existingRule ? existingRule.goToPage : 'DEFAULT';

                            return (
                              <div key={optIdx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 bg-[#030712]/50 border border-white/5 rounded-lg text-xs">
                                <span className="font-semibold text-gray-300">If respondent selects "{opt || `Option ${optIdx + 1}`}" :</span>
                                <select
                                  value={currentTarget}
                                  onChange={(e) => {
                                    const nextTarget = e.target.value;
                                    const updated = [...questions];
                                    const rules = q.logicRules && (q.logicRules as any).rules ? [...(q.logicRules as any).rules] : [];
                                    const ruleIndex = rules.findIndex((r: any) => r.option === opt);

                                    if (nextTarget === 'DEFAULT') {
                                      if (ruleIndex > -1) rules.splice(ruleIndex, 1);
                                    } else {
                                      const newRule = { option: opt, goToPage: nextTarget === 'END' ? 'END' : parseInt(nextTarget) };
                                      if (ruleIndex > -1) {
                                        rules[ruleIndex] = newRule;
                                      } else {
                                        rules.push(newRule);
                                      }
                                    }

                                    updated[qIndex].logicRules = rules.length > 0 ? { rules } : null;
                                    setQuestions(updated);
                                  }}
                                  className="bg-[#030712] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                                >
                                  <option value="DEFAULT">Default Flow (Next Page)</option>
                                  {Array.from({ length: Math.max(...questions.map((qu) => qu.pageNumber || 1)) }, (_, i) => i + 1).map((pNum) => (
                                    <option key={pNum} value={pNum}>Go to Page {pNum}</option>
                                  ))}
                                  <option value="END">Submit / End Survey</option>
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Choice Logic (Polls only) */}
          {currentStep === 3 && pollType === 'POLL' && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Voting Type</h2>
                <p className="text-gray-400 text-sm mt-1">Select the mathematical choice structure for your poll.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {/* Single Choice */}
                <div
                  onClick={() => {
                    if (isSubtypeLocked('mcq')) {
                      router.push('/plans');
                      return;
                    }
                    const updated = [...questions];
                    updated[0].type = 'SINGLE';
                    setQuestions(updated);
                  }}
                  className={`glass-card rounded-3xl p-6 border cursor-pointer transition-all flex flex-col justify-between h-48 relative overflow-hidden ${
                    questions[0].type === 'SINGLE'
                      ? 'border-indigo-500/60 shadow-[0_0_24px_rgba(99,102,241,0.15)] bg-indigo-500/5'
                      : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  {isSubtypeLocked('mcq') && (
                    <div className="absolute inset-0 bg-[#030712]/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 z-20 transition-all rounded-3xl">
                      <Lock className="w-5 h-5 text-purple-400 mb-1 animate-pulse" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Upgrade Required</span>
                      <p className="text-[8px] text-gray-400 mt-0.5">Locked under "{userPlan?.name || 'Free'}"</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                      <Check className="w-6 h-6" />
                    </div>
                    {questions[0].type === 'SINGLE' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-outfit text-lg font-bold text-white mb-1.5">Single Choice</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Voters pick exactly one option. Whoever gets the most votes wins. Simple and fast.
                    </p>
                  </div>
                </div>

                {/* Ranked Choice Borda Count */}
                <div
                  onClick={() => {
                    if (isSubtypeLocked('ranked')) {
                      router.push('/plans');
                      return;
                    }
                    const updated = [...questions];
                    updated[0].type = 'RANKED';
                    setQuestions(updated);
                  }}
                  className={`glass-card rounded-3xl p-6 border cursor-pointer transition-all flex flex-col justify-between h-48 relative overflow-hidden ${
                    questions[0].type === 'RANKED'
                      ? 'border-indigo-500/60 shadow-[0_0_24px_rgba(99,102,241,0.15)] bg-indigo-500/5'
                      : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  {isSubtypeLocked('ranked') && (
                    <div className="absolute inset-0 bg-[#030712]/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 z-20 transition-all rounded-3xl">
                      <Lock className="w-5 h-5 text-purple-400 mb-1 animate-pulse" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Upgrade Required</span>
                      <p className="text-[8px] text-gray-400 mt-0.5">Locked under "{userPlan?.name || 'Free'}"</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                      <Award className="w-6 h-6" />
                    </div>
                    {questions[0].type === 'RANKED' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-outfit text-lg font-bold text-white mb-1.5">Ranked Choice (Points-Based)</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Voters rank all options from favourite to least favourite. 1st place gets the most points, last gets the fewest. The option with the most total points wins.
                    </p>
                  </div>
                </div>

                {/* Knockout Tournament */}
                <div
                  onClick={() => {
                    if (isSubtypeLocked('knockout')) {
                      router.push('/plans');
                      return;
                    }
                    const updated = [...questions];
                    updated[0].type = 'KNOCKOUT';
                    setQuestions(updated);
                  }}
                  className={`glass-card rounded-3xl p-6 border cursor-pointer transition-all flex flex-col justify-between h-48 relative overflow-hidden ${
                    questions[0].type === 'KNOCKOUT'
                      ? 'border-indigo-500/60 shadow-[0_0_24px_rgba(99,102,241,0.15)] bg-indigo-500/5'
                      : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  {isSubtypeLocked('knockout') && (
                    <div className="absolute inset-0 bg-[#030712]/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 z-20 transition-all rounded-3xl">
                      <Lock className="w-5 h-5 text-purple-400 mb-1 animate-pulse" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Upgrade Required</span>
                      <p className="text-[8px] text-gray-400 mt-0.5">Locked under "{userPlan?.name || 'Free'}"</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                      <Trophy className="w-6 h-6" />
                    </div>
                    {questions[0].type === 'KNOCKOUT' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-outfit text-lg font-bold text-white mb-1.5">Knockout Tournament</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Options face off one-on-one in tournament brackets, like a sports competition. Voters pick the winner of each matchup. Last one standing wins!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Survey Type Step 3 Replacement: Post-Survey Action */}
          {currentStep === 3 && pollType === 'SURVEY' && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Survey Completion</h2>
                <p className="text-gray-400 text-sm mt-1">Configure what happens after a user submits the survey.</p>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    Post-Survey Thank You Message
                  </label>
                  <textarea
                    rows={4}
                    value={postSurveyAction}
                    onChange={(e) => setPostSurveyAction(e.target.value)}
                    placeholder="e.g. Thank you for your valuable feedback! Your response has been recorded."
                    className="w-full glass-input placeholder-gray-600 text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Exam Type Step 3 Replacement: Exam Completion & Grading Settings */}
          {currentStep === 3 && pollType === 'EXAM' && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Exam Completion & Scores</h2>
                <p className="text-gray-400 text-sm mt-1">Configure post-exam message and results release mode.</p>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    Post-Exam Thank You Message
                  </label>
                  <textarea
                    rows={4}
                    value={postExamMessage}
                    onChange={(e) => setPostExamMessage(e.target.value)}
                    placeholder="e.g. Thank you for completing the exam! Your answers have been recorded."
                    className="w-full glass-input placeholder-gray-600 text-sm resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-1 font-outfit">
                    Scorecard & Grade Release Mode
                  </label>
                  <div className="space-y-3">
                    {[
                      {
                        id: 'immediate',
                        title: 'Immediately upon submission',
                        desc: 'Students can see their detailed gradecards, marks, and correct answer feedback the second they submit.',
                        active: resultsReleased && enableInstantFeedback && !hideResultsUntilEnd,
                        select: () => {
                          setResultsReleased(true);
                          setEnableInstantFeedback(true);
                          setHideResultsUntilEnd(false);
                        }
                      },
                      {
                        id: 'ended',
                        title: 'When the exam duration officially ends',
                        desc: 'Withholds results during active testing. Scores and correct answer keys are released automatically once the countdown timer or overall exam window expires.',
                        active: resultsReleased && !enableInstantFeedback && hideResultsUntilEnd,
                        select: () => {
                          setResultsReleased(true);
                          setEnableInstantFeedback(false);
                          setHideResultsUntilEnd(true);
                        }
                      },
                      {
                        id: 'manual',
                        title: 'Manually by the teacher later',
                        desc: 'Scores and answers are kept completely hidden. You can manually release them to the class from your gradebook when grading is fully complete.',
                        active: !resultsReleased,
                        select: () => {
                          setResultsReleased(false);
                          setEnableInstantFeedback(false);
                          setHideResultsUntilEnd(true);
                        }
                      }
                    ].map((opt) => (
                      <div
                        key={opt.id}
                        onClick={opt.select}
                        className={`glass-card rounded-2xl p-4 border cursor-pointer flex items-center justify-between transition-all hover:scale-[1.01] ${
                          opt.active 
                            ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10' 
                            : 'border-white/5 bg-white/2 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2.5 rounded-xl shrink-0 ${opt.active ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-gray-400'}`}>
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-outfit font-bold text-white text-sm block">{opt.title}</span>
                            <span className="text-gray-400 text-xs mt-0.5 block leading-relaxed font-outfit">{opt.desc}</span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          opt.active ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                        }`}>
                          {opt.active && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Access Settings & Dynamic Spreadsheet */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Audience Controls</h2>
                <p className="text-gray-400 text-sm mt-1">Select who is authorized to participate in this {pollType === 'SURVEY' ? 'survey' : (pollType === 'EXAM' ? 'exam' : 'poll')}.</p>
              </div>

              <div className="flex justify-between items-center bg-white/3 border border-white/5 rounded-2xl p-4 gap-4">
                <span className="text-sm font-semibold text-gray-300">Allow Open Public Access?</span>
                <div className="flex items-center space-x-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsOpenVoting(true)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      isOpenVoting ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {pollType === 'EXAM' ? 'Open Exam' : (pollType === 'SURVEY' ? 'Open Survey' : 'Open Vote')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpenVoting(false)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      !isOpenVoting ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {pollType === 'EXAM' ? 'Closed Exam' : (pollType === 'SURVEY' ? 'Closed Survey' : 'Closed Vote')}
                  </button>
                </div>
              </div>

              {!isOpenVoting && voterTemplates.length > 0 && (
                <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 bg-indigo-500/5 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-bold text-white">
                      {pollType === 'SURVEY' ? 'Import Previous Respondent Roster' : (pollType === 'EXAM' ? 'Import Previous Student Roster' : 'Import Previous Voter Roster')}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Instantly re-import {pollType === 'EXAM' ? 'student' : (pollType === 'SURVEY' ? 'respondent' : 'voter')} profiles, custom confirmation labels, and secondary settings from your past closed {pollType === 'EXAM' ? 'exams' : (pollType === 'SURVEY' ? 'surveys' : 'polls')}.
                  </p>
                  <div className="flex flex-col gap-3 pt-1">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                      <input
                        type="text"
                        placeholder={pollType === 'SURVEY' ? "Search past surveys by title..." : (pollType === 'EXAM' ? "Search past exams by title..." : "Search past polls by title...")}
                        value={templateSearchQuery}
                        onChange={(e) => setTemplateSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-[#030712] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all placeholder-gray-500"
                      />
                    </div>
                    <select
                      onChange={(e) => handleImportTemplate(e.target.value)}
                      defaultValue=""
                      className="w-full bg-[#030712] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="" disabled>-- Select a previous closed {pollType === 'SURVEY' ? 'survey' : (pollType === 'EXAM' ? 'exam' : 'poll')} --</option>
                      {voterTemplates
                        .filter((t) => t.title.toLowerCase().includes(templateSearchQuery.toLowerCase()))
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} ({t.allowedVoters?.length || 0} {pollType === 'SURVEY' ? 'Respondents' : (pollType === 'EXAM' ? 'Students' : 'Voters')})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Dynamic Voter Import Table */}
              {!isOpenVoting && (
                <div className="space-y-6">
                  {/* Headline controls */}
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center space-x-2.5">
                      <Users className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-outfit text-lg font-bold text-white">
                        {pollType === 'SURVEY' ? 'Respondent Register' : 'Voter Register'}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-3 w-full md:w-auto">
                      <label className="text-xs font-semibold text-gray-500 uppercase shrink-0">
                        {pollType === 'SURVEY' ? 'Respondent Count' : 'Voter Count'}:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={numVoters}
                        onChange={(e) => handleVoterCountChange(parseInt(e.target.value) || 1)}
                        className="w-20 glass-input text-xs py-1.5 text-center font-bold"
                      />
                    </div>
                  </div>

                  {/* Google Sheet Import Control */}
                  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold bg-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded uppercase">
                        Spreadsheet Import
                      </span>
                      <h4 className="text-sm font-bold text-white">Paste Google Sheet Link</h4>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Paste your public Google Spreadsheet URL below. We will ignore the first row as the header, and import all rows from row 2 whose column names match your custom labels below case-insensitively.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit?usp=sharing"
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        className="flex-1 glass-input text-xs py-2"
                      />
                      <button
                        type="button"
                        onClick={handleImportGoogleSheet}
                        disabled={importingSheet}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5"
                      >
                        {importingSheet ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Importing...</span>
                          </>
                        ) : (
                          <span>Import Data</span>
                        )}
                      </button>
                    </div>
                    {sheetImportError && (
                      <p className="text-red-400 text-xs font-semibold mt-1">{sheetImportError}</p>
                    )}
                    {sheetImportSuccess && (
                      <p className="text-emerald-400 text-xs font-semibold mt-1">{sheetImportSuccess}</p>
                    )}
                  </div>

                  {/* Verification matrices selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/2 p-5 rounded-2xl border border-white/5">
                    <div>
                      <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                        Verification Method
                      </label>
                      <select
                        value={verificationMethod}
                        onChange={(e) => {
                          const nextMethod = e.target.value;
                          setVerificationMethod(nextMethod);
                          // Enforce OTP disablement for phone verification
                          if (nextMethod === 'PHONE') {
                            setVerificationType('PASSWORD');
                          }
                        }}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                      >
                        <option value="EMAIL">📧 Email Verification</option>
                        <option value="PHONE">📱 Phone Verification</option>
                      </select>
                      <p className="text-[10px] text-gray-500 mt-1.5">
                        {verificationMethod === 'EMAIL'
                          ? 'Voters will be verified using their registered email addresses.'
                          : 'Phone verification is active. Requires pre-assigned passwords as SMS is disabled.'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                        Access Format / Type
                      </label>
                      <select
                        value={verificationType}
                        disabled={verificationMethod === 'PHONE'}
                        onChange={(e) => setVerificationType(e.target.value)}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="OTP">🔢 One-Time Password (OTP)</option>
                        <option value="PASSWORD">🔑 Pre-Defined Static Password</option>
                      </select>
                      <p className="text-[10px] text-gray-500 mt-1.5">
                        {verificationType === 'OTP'
                          ? 'A 6-digit dynamic OTP will be sent to the voter’s destination address.'
                          : 'Voters will authenticate instantly using their unique assigned password.'}
                      </p>
                    </div>
                  </div>

                  {/* Confirmer 2 Toggle Option Selector */}
                  <div className="flex items-center space-x-3 bg-white/2 p-4 rounded-xl border border-white/5 mb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-white">{pollType === 'SURVEY' ? 'Enable 2nd Respondent Confirmer Field (Optional)' : 'Enable 2nd Voter Confirmer Field (Optional)'}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{pollType === 'SURVEY' ? 'Respondents must match two confirmation items before accessing the survey.' : 'Voters must match two confirmation items (e.g. Student Name AND Parent Name) before voting.'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseConfirmer2(!useConfirmer2)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        useConfirmer2 
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md' 
                          : 'bg-white/5 hover:bg-white/10 text-gray-400'
                      }`}
                    >
                      {useConfirmer2 ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  {/* Header Rename controls */}
                  <div className={`grid gap-4 bg-white/2 p-4 rounded-xl border border-white/5 ${useConfirmer2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <div>
                      <label className="block text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1.5">
                        Rename Unique Field
                      </label>
                      <input
                        type="text"
                        value={identifierLabel}
                        onChange={(e) => setIdentifierLabel(e.target.value)}
                        className="w-full glass-input text-xs py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1.5">
                        Rename Confirmer 1
                      </label>
                      <input
                        type="text"
                        value={confirmer1Label}
                        onChange={(e) => setConfirmer1Label(e.target.value)}
                        className="w-full glass-input text-xs py-1.5"
                      />
                    </div>
                    {useConfirmer2 && (
                      <div>
                        <label className="block text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1.5">
                          Rename Confirmer 2
                        </label>
                        <input
                          type="text"
                          value={confirmer2Label}
                          onChange={(e) => setConfirmer2Label(e.target.value)}
                          className="w-full glass-input text-xs py-1.5"
                        />
                      </div>
                    )}
                  </div>

                  {/* Interactive Spreadsheet-like layout */}
                  <div className="space-y-3">
                    <div className="overflow-x-auto border border-white/5 rounded-2xl">
                      <table 
                        onPaste={handleTablePaste}
                        className="w-full text-left text-xs"
                      >
                        <thead>
                          <tr className="bg-white/5 text-gray-400 font-bold border-b border-white/10 uppercase tracking-wider">
                            <th className="py-3.5 px-4 w-12 text-center">Row</th>
                            <th className="py-3.5 px-4 min-w-[120px]">{identifierLabel} <span className="text-red-400">*</span></th>
                            <th className="py-3.5 px-4 min-w-[120px]">{confirmer1Label} <span className="text-red-400">*</span></th>
                            {pollType === 'EXAM' ? (
                              <>
                                <th className="py-3.5 px-4 min-w-[110px]">Session</th>
                                <th className="py-3.5 px-4 min-w-[110px]">Class/Year</th>
                                <th className="py-3.5 px-4 min-w-[110px]">Department</th>
                              </>
                            ) : (
                              useConfirmer2 && <th className="py-3.5 px-4 min-w-[120px]">{confirmer2Label}</th>
                            )}
                            <th className="py-3.5 px-4 min-w-[130px]">Auth Type</th>
                            <th className="py-3.5 px-4 min-w-[180px]">Email Address <span className="text-red-400">*</span></th>
                            {showPhoneColumn && <th className="py-3.5 px-4 min-w-[150px]">Phone Number <span className="text-red-400">*</span></th>}
                            {showPasswordColumn && <th className="py-3.5 px-4 min-w-[150px]">Password <span className="text-red-400">*</span></th>}
                            <th className="py-3.5 px-4 w-16 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allowedVoters.map((voter, idx) => (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                              <td className="py-2.5 px-4 text-center font-mono text-gray-500 font-bold">{idx + 1}</td>
                              <td className="py-2.5 px-2">
                                <input
                                  type="text"
                                  required
                                  value={voter.identifier}
                                  onChange={(e) => handleVoterCellChange(e.target.value, idx, 'identifier')}
                                  data-row-idx={idx}
                                  data-field-key="identifier"
                                  placeholder="e.g. 2021BCS012"
                                  className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-1 text-white placeholder-gray-700"
                                />
                              </td>
                              <td className="py-2.5 px-2">
                                <input
                                  type="text"
                                  required
                                  value={voter.confirmer1}
                                  onChange={(e) => handleVoterCellChange(e.target.value, idx, 'confirmer1')}
                                  data-row-idx={idx}
                                  data-field-key="confirmer1"
                                  placeholder="e.g. Adrish banerjee"
                                  className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-1 text-white placeholder-gray-700"
                                />
                              </td>
                              {pollType === 'EXAM' ? (
                                <>
                                  <td className="py-2.5 px-2">
                                    <input
                                      type="text"
                                      value={voter.session || ''}
                                      onChange={(e) => handleVoterCellChange(e.target.value, idx, 'session')}
                                      data-row-idx={idx}
                                      data-field-key="session"
                                      placeholder="e.g. 2024-2028"
                                      className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-1 text-white placeholder-gray-700"
                                    />
                                  </td>
                                  <td className="py-2.5 px-2">
                                    <input
                                      type="text"
                                      value={voter.classYear || ''}
                                      onChange={(e) => handleVoterCellChange(e.target.value, idx, 'classYear')}
                                      data-row-idx={idx}
                                      data-field-key="classYear"
                                      placeholder="e.g. CSE-A"
                                      className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-1 text-white placeholder-gray-700"
                                    />
                                  </td>
                                  <td className="py-2.5 px-2">
                                    <input
                                      type="text"
                                      value={voter.department || ''}
                                      onChange={(e) => handleVoterCellChange(e.target.value, idx, 'department')}
                                      data-row-idx={idx}
                                      data-field-key="department"
                                      placeholder="e.g. Computer Science"
                                      className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-1 text-white placeholder-gray-700"
                                    />
                                  </td>
                                </>
                              ) : (
                                useConfirmer2 && (
                                  <td className="py-2.5 px-2">
                                    <input
                                      type="text"
                                      value={voter.confirmer2}
                                      onChange={(e) => handleVoterCellChange(e.target.value, idx, 'confirmer2')}
                                      data-row-idx={idx}
                                      data-field-key="confirmer2"
                                      placeholder="Optional text"
                                      className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-1 text-white placeholder-gray-700"
                                    />
                                  </td>
                                )
                              )}
                              <td className="py-2.5 px-2">
                                <select
                                  value={voter.voterAuthType || 'GLOBAL'}
                                  onChange={(e) => handleVoterCellChange(e.target.value, idx, 'voterAuthType')}
                                  className="w-full bg-[#030712] border border-white/10 rounded-xl px-2 py-1 text-white outline-none focus:border-purple-500 font-semibold"
                                >
                                  <option value="GLOBAL">
                                    Global (Inherit: {verificationMethod === 'PHONE' ? 'Phone + Password' : (verificationType === 'PASSWORD' ? 'Email + Password' : 'Email + OTP')})
                                  </option>
                                  <option value="EMAIL_OTP">Email + OTP</option>
                                  <option value="EMAIL_PASSWORD">Email + Password</option>
                                  <option value="PHONE_PASSWORD">Phone + Password</option>
                                </select>
                              </td>
                              <td className="py-2.5 px-2">
                                <input
                                  type="email"
                                  required={voter.voterAuthType !== 'PHONE_PASSWORD'}
                                  value={voter.email}
                                  onChange={(e) => handleVoterCellChange(e.target.value, idx, 'email')}
                                  data-row-idx={idx}
                                  data-field-key="email"
                                  placeholder={voter.voterAuthType === 'PHONE_PASSWORD' ? 'Optional email' : 'e.g. adrish@banerjee.edu'}
                                  className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-1 text-white placeholder-gray-700"
                                />
                              </td>
                              {showPhoneColumn && (
                                <td className="py-2.5 px-2">
                                  <input
                                    type="text"
                                    required={voter.voterAuthType === 'PHONE_PASSWORD'}
                                    value={voter.phone || ''}
                                    onChange={(e) => handleVoterCellChange(e.target.value, idx, 'phone')}
                                    data-row-idx={idx}
                                    data-field-key="phone"
                                    placeholder="e.g. +919876543210"
                                    className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-1 text-white placeholder-gray-700"
                                  />
                                </td>
                              )}
                              {showPasswordColumn && (
                                <td className="py-2.5 px-2">
                                  <input
                                    type="text"
                                    required={voter.voterAuthType === 'EMAIL_PASSWORD' || voter.voterAuthType === 'PHONE_PASSWORD'}
                                    value={voter.password || ''}
                                    onChange={(e) => handleVoterCellChange(e.target.value, idx, 'password')}
                                    data-row-idx={idx}
                                    data-field-key="password"
                                    placeholder="e.g. Secret123"
                                    className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-1 text-white placeholder-gray-700"
                                  />
                                </td>
                              )}
                              <td className="py-2.5 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = allowedVoters.filter((_, vIdx) => vIdx !== idx);
                                    setAllowedVoters(updated.length > 0 ? updated : [{ identifier: '', confirmer1: '', confirmer2: '', email: '', phone: '', password: '' }]);
                                    setNumVoters(updated.length > 0 ? updated.length : 1);
                                  }}
                                  className="text-red-400 hover:text-red-300 hover:scale-105 active:scale-95 transition-all text-xs font-bold font-mono"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add row manually & pasting advice */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAllowedVoters([...allowedVoters, { identifier: '', confirmer1: '', confirmer2: '', email: '', phone: '', password: '', session: '', classYear: '', department: '' }]);
                          setNumVoters(allowedVoters.length + 1);
                        }}
                        className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl text-xs font-bold transition-all border border-indigo-500/10 shrink-0 flex items-center justify-center gap-1.5"
                      >
                        <span>➕ Add New Row</span>
                      </button>
                      <span className="text-[10px] text-gray-500 font-medium">
                        💡 Pro-Tip: You can directly copy-paste cells from Excel / Google Sheets onto this table wrapper!
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Security Restrictions */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Stop Cheating</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Add protections to keep {pollType === 'SURVEY' ? 'submissions' : pollType === 'EXAM' ? 'exam attempts' : 'votes'} fair and stop anyone from submitting multiple times.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                {/* Priority Selection for Closed Polls */}
                {!isOpenVoting && (
                  <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Security Priority (Closed {pollType === 'SURVEY' ? 'Survey' : pollType === 'EXAM' ? 'Exam' : 'Voting'} Only)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div
                        onClick={() => setBallotPriority('HIGH')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          ballotPriority === 'HIGH' 
                            ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                            : 'border-white/5 bg-white/2 text-gray-400 hover:border-white/10'
                        }`}
                      >
                        <span className="block font-bold text-sm">🔴 High Security</span>
                        <span className="block text-[10px] text-gray-500 mt-1 leading-relaxed">
                          {pollType === 'SURVEY' ? 'Respondents' : pollType === 'EXAM' ? 'Students' : 'Voters'} must enter a 6-digit email code before they can submit or see results.
                        </span>
                      </div>
                      <div
                        onClick={() => setBallotPriority('LOW')}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          ballotPriority === 'LOW' 
                            ? 'border-amber-500 bg-amber-500/10 text-white' 
                            : 'border-white/5 bg-white/2 text-gray-400 hover:border-white/10'
                        }`}
                      >
                        <span className="block font-bold text-sm">🟢 Easy Access</span>
                        <span className="block text-[10px] text-gray-500 mt-1 leading-relaxed">
                          No email code needed. {pollType === 'SURVEY' ? 'Respondents' : pollType === 'EXAM' ? 'Students' : 'Voters'} go straight to the form and submit immediately.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Limit 1: Email */}
                <div
                  onClick={() => setLimitOneVotePerUser(!limitOneVotePerUser)}
                  className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all ${
                    limitOneVotePerUser ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-outfit font-bold text-white text-sm">One Response Per Person (by Email)</h4>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                        Each person can only submit once using their email. If they try again with a different email alias, it won't count.
                      </p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    limitOneVotePerUser ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                  }`}>
                    {limitOneVotePerUser && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Limit 2: Device/IP */}
                <div
                  onClick={() => setLimitOneVotePerIP(!limitOneVotePerIP)}
                  className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all ${
                    limitOneVotePerIP ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-outfit font-bold text-white text-sm">One Response Per Device</h4>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                        Detects if the same phone or computer tries to submit more than once and flags suspicious attempts.
                      </p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    limitOneVotePerIP ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                  }`}>
                    {limitOneVotePerIP && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Limit 3: WiFi/ISP */}
                <div
                  onClick={() => setLimitOneVotePerISP(!limitOneVotePerISP)}
                  className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all ${
                    limitOneVotePerISP ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-outfit font-bold text-white text-sm">One Response Per WiFi Network</h4>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                        Stops multiple submissions from the same internet connection or WiFi hotspot.
                      </p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    limitOneVotePerISP ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                  }`}>
                    {limitOneVotePerISP && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Privacy / Anonymity Settings (skipped for EXAM — renderStep jumps to 7) */}
          {renderStep === 6 && (
            pollType === 'POLL' ? (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Voter Privacy</h2>
                  <p className="text-gray-400 text-sm mt-1">Decide if you want to know who voted for what, or keep everything fully anonymous.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                  {/* Anonymous */}
                  <div
                    onClick={() => setIsAnonymous(true)}
                    className={`glass-card rounded-3xl p-6 border cursor-pointer transition-all flex flex-col justify-between h-44 ${
                      isAnonymous
                        ? 'border-indigo-500/60 shadow-[0_0_24px_rgba(99,102,241,0.15)] bg-indigo-500/5'
                        : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                        <Users className="w-6 h-6" />
                      </div>
                      {isAnonymous && <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />}
                    </div>
                    <div>
                      <h3 className="font-outfit text-lg font-bold text-white mb-1.5">Fully Anonymous</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Voter choices are never linked to names or emails in your reports. Completely private. No one can see who voted what.
                      </p>
                    </div>
                  </div>

                  {/* Known Voting */}
                  <div
                    onClick={() => setIsAnonymous(false)}
                    className={`glass-card rounded-3xl p-6 border cursor-pointer transition-all flex flex-col justify-between h-44 ${
                      !isAnonymous
                        ? 'border-indigo-500/60 shadow-[0_0_24px_rgba(99,102,241,0.15)] bg-indigo-500/5'
                        : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                        <Calendar className="w-6 h-6" />
                      </div>
                      {!isAnonymous && <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />}
                    </div>
                    <div>
                      <h3 className="font-outfit text-lg font-bold text-white mb-1.5">Tracked Voting</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Voter names and emails are recorded next to their choices in your reports. You can see exactly who voted for what.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : pollType === 'EXAM' ? (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Student Identity &amp; Integrity</h2>
                  <p className="text-gray-400 text-sm mt-1">Configure student tracking and exam anonymity controls.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                  {/* Anonymous Exam */}
                  <div
                    onClick={() => setIsAnonymous(true)}
                    className={`glass-card rounded-3xl p-6 border cursor-pointer transition-all flex flex-col justify-between h-44 ${
                      isAnonymous
                        ? 'border-indigo-500/60 shadow-[0_0_24px_rgba(99,102,241,0.15)] bg-indigo-500/5'
                        : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                        <Users className="w-6 h-6" />
                      </div>
                      {isAnonymous && <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />}
                    </div>
                    <div>
                      <h3 className="font-outfit text-lg font-bold text-white mb-1.5">Anonymous Assessments</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Student scores are kept strictly anonymous. Perfect for low-stakes self-evaluation tests.
                      </p>
                    </div>
                  </div>

                  {/* Tracked Exam */}
                  <div
                    onClick={() => setIsAnonymous(false)}
                    className={`glass-card rounded-3xl p-6 border cursor-pointer transition-all flex flex-col justify-between h-44 ${
                      !isAnonymous
                        ? 'border-indigo-500/60 shadow-[0_0_24px_rgba(99,102,241,0.15)] bg-indigo-500/5'
                        : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                        <Calendar className="w-6 h-6" />
                      </div>
                      {!isAnonymous && <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />}
                    </div>
                    <div>
                      <h3 className="font-outfit text-lg font-bold text-white mb-1.5">Tracked Assessments</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Each student's name, email, and detailed score report are saved in the teacher gradebook.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Respondent Privacy &amp; Collection</h2>
                  <p className="text-gray-400 text-sm mt-1">Configure email collection and automated post-survey replies.</p>
                </div>

                <div className="space-y-4 pt-4">
                  {/* Email collection toggle */}
                  <div
                    onClick={() => setCollectEmail(!collectEmail)}
                    className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all ${
                      collectEmail ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-outfit font-bold text-white text-sm">Collect Email Addresses</h4>
                        <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                          Require respondents to input a verified email address before completing the survey.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      collectEmail ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                    }`}>
                      {collectEmail && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Custom reply email message */}
                  {collectEmail && (
                    <div className="glass-card rounded-2xl p-5 border border-white/5 bg-white/2 space-y-3 animate-fade-in-up">
                      <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider">
                        Auto-Response Message
                      </label>
                      <p className="text-[10px] text-gray-400">
                        This message will be displayed or sent to the respondents right after they complete the survey and provide their email.
                      </p>
                      <textarea
                        rows={3}
                        value={postEmailMessage}
                        onChange={(e) => setPostEmailMessage(e.target.value)}
                        placeholder="e.g. Thanks for participating! Your responses have been recorded and we've registered your email for our follow-up newsletter."
                        className="w-full bg-[#030712] border border-[#ffffff15] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* STEP 7: Time Scheduling */}
          {renderStep === 7 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Set the Schedule</h2>
                <p className="text-gray-400 text-sm mt-1">Choose exactly when your poll opens and when it closes.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full glass-input text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Review & Results Visibility Toggles */}
          {renderStep === 8 && (
            pollType === 'POLL' ? (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Results &amp; Visibility</h2>
                  <p className="text-gray-400 text-sm mt-1">Choose what voters see and when they can see it.</p>
                </div>

                <div className="space-y-4 pt-4">
                  {/* Results Visibility */}
                  <div
                    onClick={() => {
                      const nextVal = !hideResultsUntilEnd;
                      setHideResultsUntilEnd(nextVal);
                      if (nextVal) {
                        setIsResultPublic(false);
                      }
                    }}
                    className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all ${
                      hideResultsUntilEnd ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-outfit font-bold text-white text-sm">Keep Results Hidden Until Poll Ends</h4>
                        <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                          Voters can't see any results while voting is happening. Results only appear after the poll officially closes.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      hideResultsUntilEnd ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                    }`}>
                      {hideResultsUntilEnd && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Make Report Public */}
                  <div
                    onClick={() => {
                      const nextVal = !isResultPublic;
                      setIsResultPublic(nextVal);
                      if (nextVal) {
                        setHideResultsUntilEnd(false);
                      }
                    }}
                    className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all ${
                      isResultPublic ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 shrink-0">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-outfit font-bold text-white text-sm">Let Anyone See the Full Results</h4>
                        <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                          When turned on, anyone with the link can see vote charts, maps, and totals — no login needed.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      isResultPublic ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                    }`}>
                      {isResultPublic && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Granular Analytics Controls */}
                  {isResultPublic && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 animate-fade-in-up">
                      <div
                        onClick={() => setPublicShowCharts(!publicShowCharts)}
                        className={`glass-card rounded-xl p-4 border cursor-pointer flex flex-col items-center text-center transition-all ${
                          publicShowCharts ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5 opacity-60'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border mb-2 flex items-center justify-center ${publicShowCharts ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'}`}>
                          {publicShowCharts && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-bold text-white">Show Charts</span>
                        <span className="text-[10px] text-gray-500 mt-1">Bar/Pie charts of votes</span>
                      </div>

                      <div
                        onClick={() => setPublicShowMaps(!publicShowMaps)}
                        className={`glass-card rounded-xl p-4 border cursor-pointer flex flex-col items-center text-center transition-all ${
                          publicShowMaps ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5 opacity-60'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border mb-2 flex items-center justify-center ${publicShowMaps ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'}`}>
                          {publicShowMaps && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-bold text-white">Show Maps</span>
                        <span className="text-[10px] text-gray-500 mt-1">Live geolocation tracking</span>
                      </div>

                      <div
                        onClick={() => setPublicShowStats(!publicShowStats)}
                        className={`glass-card rounded-xl p-4 border cursor-pointer flex flex-col items-center text-center transition-all ${
                          publicShowStats ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5 opacity-60'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border mb-2 flex items-center justify-center ${publicShowStats ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'}`}>
                          {publicShowStats && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-bold text-white">Show Stats</span>
                        <span className="text-[10px] text-gray-500 mt-1">Total vote counts</span>
                      </div>
                    </div>
                  )}

                  {/* Confidence Slider Toggle — only for Single Choice polls */}
                  {questions.some((q: any) => q.type === 'SINGLE') && (
                    <div
                      onClick={() => setEnableConfidenceSlider(!enableConfidenceSlider)}
                      className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all animate-fade-in-up ${
                        enableConfidenceSlider ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-outfit font-bold text-white text-sm">Ask Voters How Confident They Are</h4>
                          <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                            After picking a choice, voters move a slider from 1–100 to show how sure they are. You'll see a <strong className="text-amber-400">Conviction Score</strong> in your results showing the overall certainty level.
                          </p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        enableConfidenceSlider ? 'border-amber-500 bg-amber-500 text-white' : 'border-white/20'
                      }`}>
                        {enableConfidenceSlider && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  )}

                  {/* Drag and Drop Podium Toggle - Ranked choice only */}
                  {questions.some((q: any) => q.type === 'RANKED') && (
                    <div
                      onClick={() => setEnableDragAndDropPodium(!enableDragAndDropPodium)}
                      className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all animate-fade-in-up mt-4 ${
                        enableDragAndDropPodium ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-outfit font-bold text-white text-sm">Let Voters Drag Options to a Podium</h4>
                          <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                            Instead of picking numbers, voters physically drag their top picks onto a Gold, Silver, and Bronze podium for a hands-on ranking experience.
                          </p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        enableDragAndDropPodium ? 'border-amber-500 bg-amber-500 text-white' : 'border-white/20'
                      }`}>
                        {enableDragAndDropPodium && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  )}

                  {/* Hot Streak Momentum Toggle */}
                  {questions.some((q: any) => ['SINGLE', 'RANKED'].includes(q.type)) && (
                    <div
                      onClick={() => setEnableHotStreaks(!enableHotStreaks)}
                      className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all animate-fade-in-up mt-4 ${
                        enableHotStreaks ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-outfit font-bold text-white text-sm">Show Which Option Is Going Viral 🔥</h4>
                          <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                            A glowing fire badge appears on whichever option is suddenly getting a rush of new votes. Perfect for keeping energy high at live events!
                          </p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        enableHotStreaks ? 'border-amber-500 bg-amber-500 text-white' : 'border-white/20'
                      }`}>
                        {enableHotStreaks && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  )}

                  {/* Live Ticker Toggle */}
                  <div
                    onClick={() => setEnableLiveTicker(!enableLiveTicker)}
                    className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all animate-fade-in-up mt-4 ${
                      enableLiveTicker ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-outfit font-bold text-white text-sm">Add a Live Score Ticker to Dashboard</h4>
                        <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                          Adds a scrolling live feed to your dashboard — like a stock market ticker. Green means an option is gaining votes, red means it's dropping.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      enableLiveTicker ? 'border-amber-500 bg-amber-500 text-white' : 'border-white/20'
                    }`}>
                      {enableLiveTicker && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Smart Debrief Toggle */}
                  <div
                    onClick={() => setEnableSmartDebrief(!enableSmartDebrief)}
                    className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all animate-fade-in-up mt-4 ${
                      enableSmartDebrief ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-outfit font-bold text-white text-sm">Auto-Generate a Result Summary</h4>
                        <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                          Automatically writes a short, plain-English breakdown of your results after the poll ends — who won, by how much, and what stood out.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      enableSmartDebrief ? 'border-amber-500 bg-amber-500 text-white' : 'border-white/20'
                    }`}>
                      {enableSmartDebrief && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Leaderboard Visibility Option (Keep it separate from reports) */}
                  <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-3 mt-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-outfit font-bold text-white text-sm">Leaderboard Visibility</h4>
                        <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                          Define when the live voter leaderboard (who voted first, frequency etc.) should be visible. (Kept independent from statistical reports).
                        </p>
                      </div>
                    </div>
                    <select
                      value={leaderboardVisibility}
                      onChange={(e) => setLeaderboardVisibility(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="HIDDEN" className="bg-slate-900 text-white">Hidden (Never Visible)</option>
                      <option value="SHOWN_AFTER_VOTE" className="bg-slate-900 text-white">Shown After Vote (Ballot Completion Screen)</option>
                      <option value="LIVE" className="bg-slate-900 text-white">Live (Always Visible to Electorate)</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : pollType === 'EXAM' ? (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Class Summary &amp; Gradebook</h2>
                  <p className="text-gray-400 text-sm mt-1">Configure teacher summaries and gradebook results access parameters.</p>
                </div>

                <div className="space-y-4 pt-4">
                  {/* Smart Debrief for Exams */}
                  <div
                    onClick={() => setEnableSmartDebrief(!enableSmartDebrief)}
                    className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all ${
                      enableSmartDebrief ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-outfit font-bold text-white text-sm">Auto-Generate an AI Class Diagnostics Report</h4>
                        <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                          Automatically writes a comprehensive class summary, identifying overall strengths, topics requiring revision, and student misconceptions.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      enableSmartDebrief ? 'border-amber-500 bg-amber-500 text-white' : 'border-white/20'
                    }`}>
                      {enableSmartDebrief && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Redundant score withhold toggle removed for exams as it is consolidated in Step 3 */}
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Survey Flow &amp; Visibility</h2>
                  <p className="text-gray-400 text-sm mt-1">Configure respondent access to statistics and auto-summary parameters.</p>
                </div>

                <div className="space-y-4 pt-4">
                  {/* Results Visibility */}
                  <div
                    onClick={() => {
                      const nextVal = !hideResultsUntilEnd;
                      setHideResultsUntilEnd(nextVal);
                      if (nextVal) {
                        setIsResultPublic(false);
                      }
                    }}
                    className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all ${
                      hideResultsUntilEnd ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                        <EyeOff className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-outfit font-bold text-white text-sm">Private Survey Results</h4>
                        <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                          Respondents cannot see any aggregated responses. Results are only visible to the survey owner and collaborators.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      hideResultsUntilEnd ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                    }`}>
                      {hideResultsUntilEnd && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Make Results Public */}
                  <div
                    onClick={() => {
                      const nextVal = !isResultPublic;
                      setIsResultPublic(nextVal);
                      if (nextVal) {
                        setHideResultsUntilEnd(false);
                      }
                    }}
                    className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all ${
                      isResultPublic ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 shrink-0">
                        <Eye className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-outfit font-bold text-white text-sm">Show Aggregated Metrics to Respondents</h4>
                        <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                          Allow respondents to view real-time anonymous statistics and summary charts immediately after submitting their feedback.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      isResultPublic ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                    }`}>
                      {isResultPublic && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Executive Smart Summary Debrief */}
                  <div
                    onClick={() => setEnableSmartDebrief(!enableSmartDebrief)}
                    className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all mt-4 ${
                      enableSmartDebrief ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-outfit font-bold text-white text-sm">Auto-Generate Executive Summary</h4>
                        <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                          Enables our smart analytics pipeline to compile an automated executive digest of key takeaways, main trends, and text sentiment breakdowns.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      enableSmartDebrief ? 'border-amber-500 bg-amber-500 text-white' : 'border-white/20'
                    }`}>
                      {enableSmartDebrief && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Enable Cohort Filtering */}
                  <div
                    onClick={() => setEnableCrossTabulation(!enableCrossTabulation)}
                    className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all mt-4 ${
                      enableCrossTabulation ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-outfit font-bold text-white text-sm">Geographic &amp; Age Group Cross-Tabulation</h4>
                        <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                          Prepends mandatory, smart demographic selectors (Region, Age Cohort) to capture segment data for premium analytics grouping.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      enableCrossTabulation ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                    }`}>
                      {enableCrossTabulation && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* STEP 9: Advanced Features */}
          {renderStep === 9 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Advanced Features</h2>
                <p className="text-gray-400 text-sm mt-1">Turn on special capabilities and settings for your {pollType.toLowerCase()} below.</p>
              </div>

              <div className="space-y-6 pt-4">
                {/* 10 Advanced Exam Controls */}
                {pollType === 'EXAM' && (
                  <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 bg-indigo-500/5 space-y-4 animate-fade-in-up">
                    <div>
                      <h4 className="font-outfit font-bold text-white text-sm text-indigo-400">Exam Integrity &amp; Administration Extras</h4>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                        Customize strict anti-cheating measures, question delivery, and calculator features.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'enableShuffleQuestions', setter: setEnableShuffleQuestions, val: enableShuffleQuestions, label: 'Randomize Question Order', desc: 'Show questions in a completely different, random order for each student to prevent copying.', gateKey: 'questionRandomizationSurvey' },
                        { key: 'enableShuffleOptions', setter: setEnableShuffleOptions, val: enableShuffleOptions, label: 'Randomize Multiple Choice Options', desc: 'Shuffle the choice options inside each question randomly for every student.', gateKey: 'dragAndDropQuestionOrderingExam' },
                        { key: 'enableCopyPasteBlock', setter: setEnableCopyPasteBlock, val: enableCopyPasteBlock, label: 'Disable Copying & Copy-Pasting', desc: 'Block copy-pasting, right-clicking, and text highlighting to secure your test content.', gateKey: 'copyPastePrevention' },
                        { key: 'enableCalculator', setter: setEnableCalculator, val: enableCalculator, label: 'Floating Scientific Calculator', desc: 'Provide a helpful popup calculator on the screen during the exam.', gateKey: 'inbuiltScientificCalculator' },
                        {
                          key: 'enableOtpBypass',
                          setter: setEnableOtpBypass,
                          val: enableOtpBypass,
                          label: 'Password Logins (Skip Email Code)',
                          desc: 'Allow registered students to enter instantly with a password instead of waiting for an email or phone code.',
                          gateKey: 'studentRosterManagement',
                          customClick: () => {
                            if (isOpenVoting) {
                              alert("Password Logins require Closed Audience Access. Please select 'Closed Exam' in Step 4 first!");
                              return;
                            }
                            const hasEmptyPasswords = allowedVoters.some(v => !v.password || !v.password.trim());
                            if (hasEmptyPasswords) {
                              alert("Password Logins require passwords to be configured for all students in the Step 4 closed roster. Please fill in passwords in the spreadsheet table first!");
                              return;
                            }
                            const nextVal = !enableOtpBypass;
                            setEnableOtpBypass(nextVal);
                            if (nextVal) {
                              setVerificationType('PASSWORD');
                            } else {
                              setVerificationType('OTP');
                            }
                          }
                        },
                        { key: 'enableStrictTimeBuffer', setter: setEnableStrictTimeBuffer, val: enableStrictTimeBuffer, label: 'Strict Timer Cutoff', desc: 'Forcefully submit the test the exact second the countdown timer hits zero.', gateKey: 'timedExams' },
                        { key: 'enableProctorCamera', setter: setEnableProctorCamera, val: enableProctorCamera, label: 'Monitor via Webcam snap', desc: 'Automatically check student presence and capture periodic screenshots through the camera to stop cheating.', gateKey: 'fullScreenLockdown' },
                        { key: 'enableTabDepartureSound', setter: setEnableTabDepartureSound, val: enableTabDepartureSound, label: 'Alert Sound on Switch Tab', desc: 'Play a loud warning buzzer sound if the student switches tabs or exits the exam window.', gateKey: 'tabSwitchDetection' }
                      ].map((item: any) => {
                        const isVal = item.val;
                        const isLocked = isFeatureLocked(item.gateKey);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              if (isLocked) {
                                router.push('/plans');
                                return;
                              }
                              if (item.customClick) {
                                item.customClick();
                              } else {
                                item.setter(!isVal);
                              }
                            }}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 relative overflow-hidden ${
                              isLocked 
                                ? 'border-white/5 bg-[#030712]/50 opacity-60 cursor-pointer hover:border-red-500/20 hover:bg-red-950/5' 
                                : isVal 
                                ? 'border-indigo-500/50 bg-indigo-500/10' 
                                : 'border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/3'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full gap-3">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                {item.label}
                                {isLocked && <span className="text-[9px] font-black text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded border border-indigo-400/25 flex items-center gap-1">🔒 PRO</span>}
                              </span>
                              {!isLocked && (
                                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  isVal ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                                }`}>
                                  {isVal && <Check className="w-3 h-3" />}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 leading-normal">{item.desc}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Quota inputs or inputs for timer duration and Drive folders */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-4 mt-4">
                      <div>
                        <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2 font-outfit">
                          ⏳ Exam Timer Duration (Minutes)
                        </label>
                        <input
                          type="number"
                          value={examTimerDuration}
                          onChange={(e) => setExamTimerDuration(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full bg-[#030712] border border-[#ffffff15] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-outfit"
                        />
                        <span className="text-[9px] text-gray-500 mt-1 block font-outfit">Specify countdown timer for test attempts in minutes.</span>
                      </div>
                      
                      {enableProctorCamera && (
                        <div className="animate-fade-in-up">
                          <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2 font-outfit">
                            📂 Google Drive Proctoring Backup Folder URL
                          </label>
                          <input
                            type="text"
                            value={proctorDriveFolderUrl}
                            onChange={(e) => setProctorDriveFolderUrl(e.target.value)}
                            placeholder="https://drive.google.com/drive/folders/..."
                            className="w-full bg-[#030712] border border-[#ffffff15] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-outfit"
                          />
                          <span className="text-[9px] text-gray-500 mt-1 block font-outfit">Webcam snapshots and proctoring logs will be compiled and uploaded here.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dynamic Advanced Poll Controls */}
                {pollType === 'POLL' && (
                  <div className="glass-card rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5 space-y-4 animate-fade-in-up">
                    <div>
                      <h4 className="font-outfit font-bold text-white text-sm text-amber-400">
                        {questions[0]?.type === 'RANKED' 
                          ? 'Ranked Choice advanced Extras' 
                          : questions[0]?.type === 'KNOCKOUT' 
                          ? 'Knockout advanced Extras' 
                          : 'Advanced Polling Extras'}
                      </h4>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                        {questions[0]?.type === 'RANKED' 
                          ? 'Enrich your ranked choice poll with custom ballots, simulations, and tie resolutions.' 
                          : questions[0]?.type === 'KNOCKOUT' 
                          ? 'Enrich your knockout tournament bracket with predictions, overtime, and factsheets.' 
                          : 'Enrich your audience poll with custom voting systems, live charts, and predictions.'}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {getDynamicPollExtras().map((item) => {
                        const isVal = !!item.val;
                        const isLocked = isFeatureLocked(item.gateKey);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              if (isLocked) {
                                router.push('/plans');
                                return;
                              }
                              if (item.setter) {
                                item.setter(!isVal);
                              } else {
                                toggleFeatureState(item.key, !isVal);
                              }
                            }}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 relative overflow-hidden ${
                              isLocked 
                                ? 'border-white/5 bg-[#030712]/50 opacity-60 cursor-pointer hover:border-red-500/20 hover:bg-red-950/5' 
                                : isVal 
                                ? 'border-amber-500/50 bg-amber-500/10' 
                                : 'border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/3'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full gap-3">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                {item.label}
                                {isLocked && <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/25 flex items-center gap-1">🔒 PRO</span>}
                              </span>
                              {!isLocked && (
                                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  isVal ? 'border-amber-500 bg-amber-500 text-white' : 'border-white/20'
                                }`}>
                                  {isVal && <Check className="w-3 h-3" />}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 leading-normal">{item.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 10 Advanced Survey Controls */}
                {pollType === 'SURVEY' && (
                  <div className="glass-card rounded-2xl p-5 border border-purple-500/20 bg-purple-500/5 space-y-4 animate-fade-in-up">
                    <div>
                      <h4 className="font-outfit font-bold text-white text-sm text-purple-400">Enterprise Survey Engine Suite</h4>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                        Add deeper page navigation, demographic inputs, and local draft recovery features.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'enableDropOffTracking', setter: setEnableDropOffTracking, val: enableDropOffTracking, label: 'Respondent Leave-Page Analytics', desc: 'Pinpoint exactly which survey page or question triggers respondents to quit early.', gateKey: 'enableDropOffTracking' },
                        { key: 'enableSemanticAnalysis', setter: setEnableSemanticAnalysis, val: enableSemanticAnalysis, label: 'AI Text Sentiment & Keyword Finder', desc: 'Analyze and group text box submissions by positive/negative feelings and find common words.', gateKey: 'aiSentimentAnalysis' },
                        { key: 'enableCrossTabulation', setter: setEnableCrossTabulation, val: enableCrossTabulation, label: 'Demographic & Segment Pivoting', desc: 'Compare response groups based on age brackets, regions, and professional categories.', gateKey: 'enableCrossTabulation' },
                        { key: 'enableTimeAnalytics', setter: setEnableTimeAnalytics, val: enableTimeAnalytics, label: 'Page-Level Completion Timers', desc: 'Monitor the exact seconds spent on each page to find confusing sections.', gateKey: 'responseTimeLimits' },
                        { key: 'enableCustomNavLabels', setter: setEnableCustomNavLabels, val: enableCustomNavLabels, label: 'Custom Button Text Labels', desc: 'Write your own custom text for "Next Page", "Previous Page", and "Complete" buttons.', gateKey: 'multiPageSurveys' },
                        { key: 'enablePreOnboarding', setter: setEnablePreOnboarding, val: enablePreOnboarding, label: 'Demographic Pre-Survey Onboarding', desc: 'Collect attendee age, gender, and workspace sector before starting the survey.', gateKey: 'targetedDistribution' },
                        { key: 'enableBranchingLogic', setter: setEnableBranchingLogic, val: enableBranchingLogic, label: 'Dynamic Question Paths (Skip Logic)', desc: 'Direct respondents to different survey pages depending on what they chose in earlier steps.', gateKey: 'conditionalLogicBranching' },
                        { key: 'enableDomainRestriction', setter: setEnableDomainRestriction, val: enableDomainRestriction, label: 'Authorized Email Domains Only', desc: 'Permit entries strictly from specified corporate/organizational domains (e.g., @school.edu).', gateKey: 'enableDomainRestriction' },
                        { key: 'enableDirectInbox', setter: setEnableDirectInbox, val: enableDirectInbox, label: 'Direct Private Messenger', desc: 'Provide a private feedback chatbox directly between the respondent and the author.', gateKey: 'enableDirectInbox' },
                        { key: 'enableDraftSave', setter: setEnableDraftSave, val: enableDraftSave, label: 'Save Progress & Resume Later', desc: 'Allow users to save answers locally so they can return later to submit.', gateKey: 'saveResumeLater' }
                      ].map((item) => {
                        const isVal = item.val;
                        const isLocked = isFeatureLocked(item.gateKey);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              if (isLocked) {
                                router.push('/plans');
                                return;
                              }
                              item.setter(!isVal);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 relative overflow-hidden ${
                              isLocked 
                                ? 'border-white/5 bg-[#030712]/50 opacity-60 cursor-pointer hover:border-red-500/20 hover:bg-red-950/5' 
                                : isVal 
                                ? 'border-purple-500/50 bg-purple-500/10' 
                                : 'border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/3'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full gap-3">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                {item.label}
                                {isLocked && <span className="text-[9px] font-black text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded border border-purple-400/25 flex items-center gap-1">🔒 PRO</span>}
                              </span>
                              {!isLocked && (
                                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  isVal ? 'border-purple-500 bg-purple-500 text-white' : 'border-white/20'
                                }`}>
                                  {isVal && <Check className="w-3 h-3" />}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 leading-normal">{item.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Premium White-Label Custom Branding Card */}
                <div className="glass-card rounded-2xl p-5 border border-purple-500/20 bg-purple-500/5 space-y-4 animate-fade-in-up mt-6 relative overflow-hidden">
                  {userPlan && userPlan.features && !userPlan.features['customBranding'] && (
                    <div className="absolute inset-0 bg-[#030712]/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-20 animate-fade-in">
                      <Shield className="w-8 h-8 text-purple-400 mb-2 animate-pulse-glow" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">🔒 Upgrade Plan Required</span>
                      <p className="text-[10px] text-gray-400 max-w-xs mt-1">
                        White-Label Custom Branding is locked under your current "{userPlan.name}" plan.
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-outfit font-bold text-white text-sm">White-Label Custom Branding</h4>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                        Replace Pollstar logos and names with your own custom logo and manual header text.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableCustomBranding(!enableCustomBranding)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        enableCustomBranding ? 'bg-purple-600 text-white shadow-md' : 'bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {enableCustomBranding ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  {enableCustomBranding && (
                    <div className="space-y-4 pt-2 border-t border-white/5 animate-fade-in-up">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-300 text-[10px] uppercase font-bold tracking-wider mb-2">
                            Custom Branding Title / Text
                          </label>
                          <input
                            type="text"
                            value={customBrandingText}
                            onChange={(e) => setCustomBrandingText(e.target.value)}
                            placeholder="e.g. Acme Corporation Survey"
                            className="w-full glass-input text-xs py-2.5"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-300 text-[10px] uppercase font-bold tracking-wider mb-2">
                            Custom Logo Image
                          </label>
                          <div className="flex items-center space-x-3">
                            {customLogoUrl ? (
                              <div className="relative w-12 h-12 bg-white/5 rounded-xl border border-white/10 p-1 shrink-0 overflow-hidden">
                                <img src={customLogoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                                <button
                                  type="button"
                                  onClick={() => setCustomLogoUrl('')}
                                  className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 text-[10px] font-bold"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <label className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 cursor-pointer flex items-center justify-center shrink-0 text-gray-400 transition-colors">
                                <Upload className="w-5 h-5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setCustomLogoUrl(reader.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            )}
                            <span className="text-[10px] text-gray-500">Upload custom brand icon/logo (transparency recommended).</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center justify-between border-t border-white/5 pt-8">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1 || loading}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 ${
              currentStep === 1
                ? 'text-gray-600 cursor-not-allowed'
                : 'glass-card border-white/10 text-gray-300 hover:text-white'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-3">
            {currentStep < stepsList.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 rounded-xl font-bold gradient-btn text-white text-sm flex items-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => editingPollId ? handleUpdateDraftPoll('DRAFT') : handleSubmitPoll('DRAFT')}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-bold glass-card border-white/15 text-indigo-300 hover:text-white text-sm flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingPollId ? 'Save Changes' : 'Save Draft'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => editingPollId ? handleUpdateDraftPoll('ACTIVE') : handleSubmitPoll('ACTIVE')}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-bold gradient-btn text-white text-sm flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingPollId ? 'Publish Now' : 'Launch Poll'}</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════ */}
      {/* LOGS MODAL                                         */}
      {/* ═══════════════════════════════════════════════════ */}
      {showLogsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowLogsModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-[#0a0f1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#080d1a]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Edit Audit Logs</h3>
                  <p className="text-[10px] text-gray-500">All tracked changes and collaborator activity for this poll</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLogsModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Active Collaborators Section */}
            {activeCollaborators.length > 0 && (
              <div className="px-6 py-3 border-b border-white/5 bg-indigo-500/5">
                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider mb-2">Currently Editing</p>
                <div className="flex flex-wrap gap-2">
                  {activeCollaborators.map((collab: any, i: number) => {
                    const colorPairs = [
                      { bg: 'bg-violet-500/20', text: 'text-violet-300', border: 'border-violet-500/30' },
                      { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' },
                      { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30' },
                      { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
                      { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' },
                    ];
                    const cp = colorPairs[i % colorPairs.length];
                    const name = collab.fullName || collab.email || 'User';
                    return (
                      <div
                        key={collab.id || i}
                        className={`flex items-center gap-2 px-2.5 py-1 rounded-full ${cp.bg} border ${cp.border}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${cp.text.replace('text-', 'bg-')} animate-pulse`} />
                        <span className={`text-[10px] font-semibold ${cp.text}`}>{name}</span>
                        {collab.focusedField && (
                          <span className="text-[9px] text-gray-500">editing {collab.focusedField}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Logs Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {loadingLogs ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              ) : logsList.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-5 h-5 text-gray-600" />
                  </div>
                  <p className="text-gray-500 text-sm font-semibold">No activity logged yet</p>
                  <p className="text-gray-600 text-xs mt-1">Changes made to this poll will appear here</p>
                </div>
              ) : (
                logsList.map((log: any, idx: number) => {
                  const actionColors: Record<string, string> = {
                    COEDIT_UPDATE: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                    MODIFY_POLL: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                    CREATE_POLL: 'text-green-400 bg-green-500/10 border-green-500/20',
                    STATUS_CHANGE: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                    DELETE_POLL: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                  };
                  const color = actionColors[log.action] || 'text-gray-400 bg-white/5 border-white/10';
                  const timestamp = new Date(log.timestamp);
                  const relTime = (() => {
                    const diffMs = Date.now() - timestamp.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHrs = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);
                    if (diffMins < 1) return 'just now';
                    if (diffMins < 60) return `${diffMins}m ago`;
                    if (diffHrs < 24) return `${diffHrs}h ago`;
                    return `${diffDays}d ago`;
                  })();

                  return (
                    <div
                      key={log.id || idx}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-white/2 border border-white/5 hover:border-white/10 transition-all"
                    >
                      {/* Timeline dot */}
                      <div className="shrink-0 mt-0.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center border text-[9px] font-black uppercase ${color}`}>
                          {log.action === 'COEDIT_UPDATE' ? '✎' : log.action === 'CREATE_POLL' ? '+' : log.action === 'MODIFY_POLL' ? '△' : '⬤'}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold text-white truncate">
                              {log.admin?.fullName || log.admin?.email || 'System'}
                            </span>
                            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${color}`}>
                              {log.action?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span className="text-[9px] text-gray-600 shrink-0">{relTime}</span>
                        </div>
                        {log.details && (
                          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{log.details}</p>
                        )}
                        <p className="text-[9px] text-gray-600 mt-0.5">
                          {timestamp.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-white/5 bg-[#080d1a]/80 flex items-center justify-between">
              <span className="text-[10px] text-gray-600">{logsList.length} log entries found</span>
              <button
                type="button"
                onClick={() => { fetchLogs(); }}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🧠 Floating Creator Brain Board Button */}
      <button
        type="button"
        onClick={() => setBrainBoardOpen(true)}
        style={{
          transform: `translate(${brainDragOffset.x}px, ${brainDragOffset.y}px)`,
          touchAction: 'none',
          cursor: brainActiveDrag ? 'grabbing' : 'grab',
        }}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          onBrainDragStart(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          if (e.touches[0]) {
            onBrainDragStart(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        className="fixed z-40 p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl transition-all border border-indigo-400/30 hover:scale-110 active:scale-95 group animate-pulse-glow bottom-36 right-6 sm:bottom-6 sm:right-[335px]"
        title="Open Brain Board & Sketch Canvas (Draggable)"
      >
        <Brain className="w-6 h-6 animate-pulse" />
        <span className="absolute right-14 top-1/2 -translate-y-1/2 bg-[#080d1a]/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Creator Brain Board
        </span>
      </button>

      {/* 🧠 Sliding Creator Brain Board Drawer */}
      {brainBoardOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          {/* Backdrop blur overlay */}
          <div 
            onClick={() => setBrainBoardOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all"
          />

          {/* Drawer container */}
          <div className="relative w-[460px] h-full bg-[#080d1a]/95 border-l border-white/10 shadow-2xl flex flex-col justify-between z-10 animate-slide-in-right overflow-hidden">
            {/* Background glowing gradient */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Drawer Header */}
            <div className="p-6 border-b border-white/5 relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-outfit text-base font-bold text-white">Creator Brain Board</h3>
                  <p className="text-[10px] text-gray-500">Plan redirection flows & store reference links</p>
                </div>
              </div>
              <button
                onClick={() => setBrainBoardOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selectors */}
            <div className="px-6 py-2 border-b border-white/5 relative z-10 flex gap-2">
              {(['draw', 'notes', 'links'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setBrainBoardTab(tab)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    brainBoardTab === tab
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                      : 'bg-white/3 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab === 'draw' ? '🎨 Scribble Canvas' : tab === 'notes' ? '📝 Text Planner' : '🔗 Link Cards'}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">
              {/* 🎨 SCRIBBLE CANVAS */}
              {brainBoardTab === 'draw' && (
                <div className="space-y-4 animate-fade-in flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Interactive Drawing Board</span>
                  
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
                      onMouseMove={(e) => draw(e.clientX, e.clientY)}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={(e) => {
                        if (e.touches[0]) {
                          startDrawing(e.touches[0].clientX, e.touches[0].clientY);
                        }
                      }}
                      onTouchMove={(e) => {
                        if (e.touches[0]) {
                          draw(e.touches[0].clientX, e.touches[0].clientY);
                        }
                      }}
                      onTouchEnd={stopDrawing}
                      className="w-full h-[280px] bg-[#030712] border border-white/10 rounded-xl cursor-crosshair touch-none"
                    />
                  </div>

                  {/* Canvas Toolbar Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white/3 border border-white/5 p-3 rounded-xl">
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setIsEraser(false)}
                        className={`p-2 rounded-lg border transition-all ${
                          !isEraser ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400' : 'bg-transparent border-transparent text-gray-400 hover:text-white'
                        }`}
                        title="Pencil Tool"
                      >
                        <Palette className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEraser(true)}
                        className={`p-2 rounded-lg border transition-all ${
                          isEraser ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400' : 'bg-transparent border-transparent text-gray-400 hover:text-white'
                        }`}
                        title="Eraser Tool"
                      >
                        <Eraser className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 border border-transparent hover:border-red-500/20 transition-all"
                        title="Clear Canvas"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Brush Sizes */}
                    <div className="flex items-center space-x-1 bg-[#030712] p-1 rounded-lg border border-white/5 shrink-0">
                      {([2, 5, 8] as const).map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setStrokeWidth(size)}
                          className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                            strokeWidth === size ? 'bg-white/10 text-white font-extrabold' : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          <span className="text-[10px]">{size === 2 ? 'Thin' : size === 5 ? 'Med' : 'Thick'}</span>
                        </button>
                      ))}
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      {['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ffffff'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setStrokeColor(color);
                            setIsEraser(false);
                          }}
                          className={`w-5 h-5 rounded-full border transition-all ${
                            strokeColor === color && !isEraser ? 'scale-125 border-white' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 📝 TEXT PLANNER */}
              {brainBoardTab === 'notes' && (
                <div className="space-y-4 animate-fade-in flex flex-col h-full">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Notes & Redirect Pathway Notes</span>
                  <textarea
                    rows={12}
                    value={brainNotes}
                    onChange={(e) => saveBrainNotes(e.target.value)}
                    placeholder="Type branching flows or logic details here (e.g. Q1 Option A -> redirect to page 3)..."
                    className="w-full bg-[#030712] border border-white/10 rounded-xl p-4 text-xs text-white placeholder-gray-600 outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                  />
                  
                  {/* Draft Questions Helper List */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">Current Question List Reference</span>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {questions.map((q, idx) => (
                        <div key={q.id || idx} className="p-2 rounded-lg bg-white/2 border border-white/5 flex items-center justify-between text-[10px] text-gray-400">
                          <span className="truncate max-w-[280px]">
                            <strong className="text-white">Q{idx + 1}:</strong> {q.questionText || '(No Question Text yet)'}
                          </span>
                          <span className="bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 text-[8px] uppercase tracking-wide font-extrabold shrink-0">
                            {q.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 🔗 REFERENCES LINKS */}
              {brainBoardTab === 'links' && (
                <div className="space-y-5 animate-fade-in">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Reference Links Registry</span>

                  {/* Add New Link Card form */}
                  <div className="p-4 rounded-xl bg-white/3 border border-white/5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Label</label>
                        <input
                          type="text"
                          value={newLinkLabel}
                          onChange={(e) => setNewLinkLabel(e.target.value)}
                          placeholder="e.g. Grading Specs"
                          className="w-full bg-[#030712] border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-indigo-500 placeholder-gray-700"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-1">URL</label>
                        <input
                          type="text"
                          value={newLinkUrl}
                          onChange={(e) => setNewLinkUrl(e.target.value)}
                          placeholder="e.g. drive.google.com/..."
                          className="w-full bg-[#030712] border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-indigo-500 placeholder-gray-700"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addBrainLink}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-md active:scale-95"
                    >
                      Attach Reference Link Card
                    </button>
                  </div>

                  {/* Links List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {brainLinks.length === 0 ? (
                      <div className="p-6 text-center text-gray-600 border border-dashed border-white/5 rounded-xl text-[10px]">
                        No links attached. Add files, drive folders, or specifications cards above.
                      </div>
                    ) : (
                      brainLinks.map((link) => (
                        <div key={link.id} className="p-3 rounded-lg border border-white/5 bg-[#030712] flex items-center justify-between gap-3 group/link hover:border-white/10 transition-colors">
                          <div className="flex items-center space-x-2.5 truncate">
                            <div className="p-1.5 bg-indigo-500/10 rounded border border-indigo-500/20 text-indigo-400 shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate text-[10px]">
                              <span className="font-semibold text-white block truncate leading-tight">{link.label}</span>
                              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline truncate block text-[9px] mt-0.5">{link.url}</a>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBrainLink(link.id)}
                            className="p-1 rounded bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 opacity-0 group-hover/link:opacity-100 transition-all shrink-0"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer info */}
            <div className="p-4 bg-[#030712]/50 border-t border-white/5 text-center text-[9px] text-gray-600 relative z-10 uppercase tracking-widest font-bold">
              ⚡ Safe Auto-Cache Enabled
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
