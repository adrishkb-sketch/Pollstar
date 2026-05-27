'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, ArrowRight, Save, Check, Vote, 
  Trash2, Plus, Upload, Shield, Calendar, Users, AlertCircle, Award, Trophy,
  Zap, Brain, TrendingUp, Mail, Eye, EyeOff, Sparkles, Layers, Search
} from 'lucide-react';

export default function CreatePoll() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ────────────────────────────────────────────────────────
  // POLL FORM STATES
  // ────────────────────────────────────────────────────────
  
  // Step 1: Core details
  const [pollType, setPollType] = useState<'POLL' | 'SURVEY'>('POLL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState(''); // holds base64 string

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

  const toggleRankedFeature = (key: string) => {
    setRankedFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
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

  // Initialize date defaults in Indian Standard Time (IST)
  useEffect(() => {
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
      const mappedVoters = selected.allowedVoters.map((v: any) => ({
        identifier: v.identifier || '',
        confirmer1: v.confirmer1 || '',
        confirmer2: v.confirmer2 || '',
        email: v.email || '',
      }));
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
    setQuestions([...questions, { id: Date.now(), questionText: '', type: 'SINGLE', options: ['Option 1', 'Option 2'], pageNumber: lastPage, logicRules: null }]);
  };

  const handleAddPage = () => {
    const lastPage = questions.length > 0 ? questions[questions.length - 1].pageNumber : 0;
    setQuestions([...questions, { id: Date.now(), questionText: '', type: 'SINGLE', options: ['Option 1', 'Option 2'], pageNumber: lastPage + 1, logicRules: null }]);
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

      if (emailIdx === -1) {
        throw new Error('Required column "Email" was not found in the spreadsheet header row.');
      }

      const parsedVoters: any[] = [];
      for (let i = 1; i < rows.length; i++) {
        const cols = parseCSVLine(rows[i]);
        const email = emailIdx !== -1 ? (cols[emailIdx] || '').trim() : '';
        if (!email) continue; // Skip blank emails

        parsedVoters.push({
          identifier: identifierIdx !== -1 ? (cols[identifierIdx] || '').trim() : '',
          confirmer1: confirmer1Idx !== -1 ? (cols[confirmer1Idx] || '').trim() : '',
          confirmer2: confirmer2Idx !== -1 ? (cols[confirmer2Idx] || '').trim() : '',
          email
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

    const fieldOrder = useConfirmer2
      ? ['identifier', 'confirmer1', 'confirmer2', 'email']
      : ['identifier', 'confirmer1', 'email'];

    const startFieldIdx = fieldOrder.indexOf(startFieldKey);
    const startIdx = startFieldIdx >= 0 ? startFieldIdx : 0;

    const updated = [...allowedVoters];
    parsedRows.forEach((cols, rOffset) => {
      const targetRowIdx = startRow + rOffset;
      if (!updated[targetRowIdx]) {
        updated[targetRowIdx] = { identifier: '', confirmer1: '', confirmer2: '', email: '' };
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
    const finalRows = filtered.length > 0 ? filtered : [{ identifier: '', confirmer1: '', confirmer2: '', email: '' }];
    
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
      // Verify closed voters email addresses
      const invalidEmails = allowedVoters.some(
        (v) => !v.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())
      );
      if (invalidEmails) {
        setError('Please enter valid email addresses for all rows in the voter table.');
        return false;
      }
      const missingIdentifiers = allowedVoters.some((v) => !v.identifier.trim() || !v.confirmer1.trim());
      if (missingIdentifiers) {
        setError(`Compulsory spreadsheet cells (${identifierLabel} and ${confirmer1Label}) cannot be left blank.`);
        return false;
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
      isAnonymous,
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
        postSurveyAction: pollType === 'SURVEY' ? postSurveyAction : null,
        collectEmail: pollType === 'SURVEY' ? collectEmail : false,
        postEmailMessage: pollType === 'SURVEY' ? postEmailMessage : null,
        enableDropOffTracking: pollType === 'SURVEY' ? enableDropOffTracking : false,
        enableSemanticAnalysis: pollType === 'SURVEY' ? enableSemanticAnalysis : false,
        enableCrossTabulation: pollType === 'SURVEY' ? enableCrossTabulation : false,
        enableTimeAnalytics: pollType === 'SURVEY' ? enableTimeAnalytics : false,
      },
      allowedVoters: isOpenVoting 
        ? [] 
        : allowedVoters.map(v => ({
            identifier: v.identifier,
            confirmer1: v.confirmer1,
            confirmer2: useConfirmer2 ? v.confirmer2 : '',
            email: v.email
          })),
      identifierLabel: isOpenVoting ? 'Roll Number' : identifierLabel,
      confirmer1Label: isOpenVoting ? 'Student Name' : confirmer1Label,
      confirmer2Label: isOpenVoting ? 'Parent Name' : (useConfirmer2 ? confirmer2Label : ''),
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

  const stepsList = pollType === 'SURVEY'
    ? ['Details', 'Question', 'Completion', 'Audience', 'Security', 'Privacy', 'Schedule', 'Visibility', 'Advanced']
    : ['Details', 'Question', 'Type', 'Audience', 'Security', 'Anonymity', 'Schedule', 'Visibility', 'Advanced'];

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

          <Link
            href="/dashboard"
            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white flex items-center space-x-1.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </Link>
        </div>
      </header>

      {/* Wizard container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 flex flex-col justify-between space-y-10">
        
        {/* Top Progress bar */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs text-gray-500 uppercase tracking-widest font-bold">
            <span>Step {currentStep} of 9</span>
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

              <div className="flex gap-4 border-b border-white/5 pb-6">
                <button
                  type="button"
                  onClick={() => { setPollType('POLL'); setIdentifierLabel('Roll Number'); setConfirmer1Label('Student Name'); setConfirmer2Label('Parent Name'); }}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all border flex flex-col items-center justify-center ${
                    pollType === 'POLL' ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-white/5 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <span>Create Standard Poll</span>
                  <span className="text-[10px] font-normal text-gray-500 mt-1">One question, advanced security</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setPollType('SURVEY'); setIdentifierLabel('Respondent ID'); setConfirmer1Label('Full Name'); setConfirmer2Label('Department'); }}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all border flex flex-col items-center justify-center ${
                    pollType === 'SURVEY' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/5 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <div>Create Survey <span className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded ml-2 uppercase animate-pulse">New</span></div>
                  <span className="text-[10px] font-normal text-gray-500 mt-1">Multiple questions, open public responses</span>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={pollType === 'POLL' ? "e.g. Student Council Presidential Election 2026" : "e.g. Customer Satisfaction Survey"}
                    className="w-full glass-input placeholder-gray-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    {pollType === 'SURVEY' ? 'Description / Survey Guidelines' : 'Description / Voter Guidelines'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={pollType === 'SURVEY' 
                      ? "Provide details about the survey's purpose, scope, guidelines, and other rules." 
                      : "Provide details about the poll candidate bios, voting guidelines, and other rules."}
                    className="w-full glass-input placeholder-gray-600 text-sm resize-none"
                  />
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
                {pollType === 'SURVEY' && (
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
                  <div key={q.id} className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4 relative group">
                    {pollType === 'SURVEY' && questions.length > 1 && (
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
                        <span>Question {qIndex + 1}</span>
                        {pollType === 'SURVEY' && (
                          <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[10px]">Page {q.pageNumber}</span>
                        )}
                      </label>
                      <input
                        type="text"
                        required
                        value={q.questionText}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIndex].questionText = e.target.value;
                          setQuestions(updated);
                        }}
                        placeholder="Type your question here..."
                        className="w-full glass-input placeholder-gray-600 text-sm pr-12"
                      />
                    </div>

                    {pollType === 'SURVEY' && (
                      <div>
                        <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                          Question Type
                        </label>
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[qIndex].type = e.target.value;
                            setQuestions(updated);
                          }}
                          className="w-full glass-input placeholder-gray-600 text-sm"
                        >
                          <option value="SINGLE">Single Choice</option>
                          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                          <option value="SHORT_TEXT">Short Text</option>
                          <option value="LONG_TEXT">Long Text / Paragraph</option>
                          <option value="RATING">Rating (1-5 Stars)</option>
                          <option value="RANKED">Ranked Choice (Borda)</option>
                          <option value="KNOCKOUT">Knockout Tournament</option>
                        </select>
                      </div>
                    )}

                    {['SINGLE', 'MULTIPLE_CHOICE', 'RANKED', 'KNOCKOUT'].includes(q.type) && (
                      <div className="space-y-3 pt-2">
                        <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider">
                          Options / Choices
                        </label>
                        <div className="space-y-2">
                          {q.options.map((opt: string, optIdx: number) => (
                            <div key={optIdx} className="flex items-center space-x-2.5">
                              <input
                                type="text"
                                required
                                value={opt}
                                onChange={(e) => handleOptionChange(e.target.value, qIndex, optIdx)}
                                placeholder={`Option ${optIdx + 1}`}
                                className="flex-1 glass-input placeholder-gray-600 text-sm py-2"
                              />
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
                          ))}
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
                    const updated = [...questions];
                    updated[0].type = 'SINGLE';
                    setQuestions(updated);
                  }}
                  className={`glass-card rounded-3xl p-6 border cursor-pointer transition-all flex flex-col justify-between h-48 ${
                    questions[0].type === 'SINGLE'
                      ? 'border-indigo-500/60 shadow-[0_0_24px_rgba(99,102,241,0.15)] bg-indigo-500/5'
                      : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                  }`}
                >
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
                    const updated = [...questions];
                    updated[0].type = 'RANKED';
                    setQuestions(updated);
                  }}
                  className={`glass-card rounded-3xl p-6 border cursor-pointer transition-all flex flex-col justify-between h-48 ${
                    questions[0].type === 'RANKED'
                      ? 'border-indigo-500/60 shadow-[0_0_24px_rgba(99,102,241,0.15)] bg-indigo-500/5'
                      : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                  }`}
                >
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
                    const updated = [...questions];
                    updated[0].type = 'KNOCKOUT';
                    setQuestions(updated);
                  }}
                  className={`glass-card rounded-3xl p-6 border cursor-pointer transition-all flex flex-col justify-between h-48 ${
                    questions[0].type === 'KNOCKOUT'
                      ? 'border-indigo-500/60 shadow-[0_0_24px_rgba(99,102,241,0.15)] bg-indigo-500/5'
                      : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                  }`}
                >
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

          {/* STEP 4: Access Settings & Dynamic Spreadsheet */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Audience Controls</h2>
                <p className="text-gray-400 text-sm mt-1">Select who is authorized to participate in this {pollType === 'SURVEY' ? 'survey' : 'poll'}.</p>
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
                    {pollType === 'SURVEY' ? 'Open Survey' : 'Open Vote'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpenVoting(false)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      !isOpenVoting ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {pollType === 'SURVEY' ? 'Closed Survey' : 'Closed Vote'}
                  </button>
                </div>
              </div>

              {!isOpenVoting && voterTemplates.length > 0 && (
                <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 bg-indigo-500/5 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-bold text-white">
                      {pollType === 'SURVEY' ? 'Import Previous Respondent Roster' : 'Import Previous Voter Roster'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Instantly re-import respondent/voter profiles, custom confirmation labels, and secondary settings from your past closed surveys/polls.
                  </p>
                  <div className="flex flex-col gap-3 pt-1">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                      <input
                        type="text"
                        placeholder={pollType === 'SURVEY' ? "Search past surveys by title..." : "Search past polls by title..."}
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
                      <option value="" disabled>-- Select a previous closed {pollType === 'SURVEY' ? 'survey' : 'poll'} --</option>
                      {voterTemplates
                        .filter((t) => t.title.toLowerCase().includes(templateSearchQuery.toLowerCase()))
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} ({t.allowedVoters?.length || 0} {pollType === 'SURVEY' ? 'Respondents' : 'Voters'})
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
                            {useConfirmer2 && <th className="py-3.5 px-4 min-w-[120px]">{confirmer2Label}</th>}
                            <th className="py-3.5 px-4 min-w-[180px]">Email Address <span className="text-red-400">*</span></th>
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
                                  placeholder="e.g. Adrish Kumar Banerjee"
                                  className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-1 text-white placeholder-gray-700"
                                />
                              </td>
                              {useConfirmer2 && (
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
                              )}
                              <td className="py-2.5 px-2">
                                <input
                                  type="email"
                                  required
                                  value={voter.email}
                                  onChange={(e) => handleVoterCellChange(e.target.value, idx, 'email')}
                                  data-row-idx={idx}
                                  data-field-key="email"
                                  placeholder="e.g. adrish@banerjee.edu"
                                  className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-1 text-white placeholder-gray-700"
                                />
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = allowedVoters.filter((_, vIdx) => vIdx !== idx);
                                    setAllowedVoters(updated.length > 0 ? updated : [{ identifier: '', confirmer1: '', confirmer2: '', email: '' }]);
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
                          setAllowedVoters([...allowedVoters, { identifier: '', confirmer1: '', confirmer2: '', email: '' }]);
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
                  Add protections to keep {pollType === 'SURVEY' ? 'submissions' : 'votes'} fair and stop anyone from submitting multiple times.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                {/* Priority Selection for Closed Polls */}
                {!isOpenVoting && (
                  <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Security Priority (Closed {pollType === 'SURVEY' ? 'Survey' : 'Voting'} Only)
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
                          {pollType === 'SURVEY' ? 'Respondents' : 'Voters'} must enter a 6-digit email code before they can submit or see results.
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
                          No email code needed. {pollType === 'SURVEY' ? 'Respondents' : 'Voters'} go straight to the form and submit immediately.
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

          {/* STEP 6: Privacy / Anonymity Settings */}
          {currentStep === 6 && (
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
          {currentStep === 7 && (
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
          {currentStep === 8 && (
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
          {currentStep === 9 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Advanced Features</h2>
                <p className="text-gray-400 text-sm mt-1">Turn on special analytics and tools for your {pollType === 'SURVEY' ? 'survey' : 'poll'} type.</p>
              </div>

              <div className="space-y-6 pt-4">
                {pollType === 'SURVEY' ? (
                  <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 bg-indigo-500/5 space-y-4 animate-fade-in-up">
                    <div>
                      <h4 className="font-outfit font-bold text-white text-sm">Premium Survey Analysis Suite</h4>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                        Add enterprise-grade tracking and deep analytical capabilities to your survey.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        [enableDropOffTracking, setEnableDropOffTracking, 'Respondent Drop-Off & Abandonment', 'Pinpoint exactly which survey page or specific question is causing respondents to quit early.'],
                        [enableSemanticAnalysis, setEnableSemanticAnalysis, 'Semantic Grouping & Sentiment Profiling', 'Automatically aggregates open-text answers by sentiment tones and extracts common thematic keywords.'],
                        [enableCrossTabulation, setEnableCrossTabulation, 'Demographic & Cohort Cross-Tabulation', 'Allows you to slice, dice, filter, and sort survey results by age groups, region, and responder segments.'],
                        [enableTimeAnalytics, setEnableTimeAnalytics, 'Time-to-Complete & Attention Tracking', 'Measure the precise seconds spent by respondents on each page to identify question friction.']
                      ].map(([val, setter, label, desc], idx) => {
                        const isVal = val as boolean;
                        const labelStr = label as string;
                        const descStr = desc as string;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => (setter as any)(!isVal)}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                              isVal ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/5 bg-white/2'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full gap-3">
                              <span className="text-xs font-bold text-white">{labelStr}</span>
                              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isVal ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                              }`}>
                                {isVal && <Check className="w-3 h-3" />}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 leading-normal">{descStr}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Single Choice features */}
                    {hasSingleQuestion && (
                      <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 bg-indigo-500/5 space-y-4 animate-fade-in-up">
                        <div>
                          <h4 className="font-outfit font-bold text-white text-sm">Single Choice Extras</h4>
                          <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                            Add advanced options to your single choice questions.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            ['enableQuadraticVoting', 'Quadratic Voting (Point-based)', 'Voters get points to split among choices. Buying more votes for one option costs exponentially more.'],
                            ['enableAiProjection', 'AI Vote Projection', 'Predicts the final vote outcome early on by analyzing voting speed and patterns.'],
                            ['enableCohortCrossTab', 'Voter Group Comparison', 'Filters and shows results by different groups like age, location, or department.'],
                            ['enableSentimentChat', 'Opinion Chatbox', 'Adds a live chat sidebar where voter comments are automatically marked with feeling/sentiment tags.'],
                            ['enableSwingMap', 'Voter Shift Map', 'Shows how voter preferences shift from one choice to another over time.']
                          ].map(([key, label, desc]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => toggleSingleFeature(key)}
                              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                                singleFeatures[key] ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/5 bg-white/2'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full gap-3">
                                <span className="text-xs font-bold text-white">{label}</span>
                                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  singleFeatures[key] ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                                }`}>
                                  {singleFeatures[key] && <Check className="w-3 h-3" />}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400 leading-normal">{desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ranked Choice features */}
                    {hasRankedQuestion && (
                      <div className="glass-card rounded-2xl p-5 border border-purple-500/20 bg-purple-500/5 space-y-4 animate-fade-in-up">
                        <div>
                          <h4 className="font-outfit font-bold text-white text-sm">Ranked Choice Extras</h4>
                          <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                            Add advanced voting modules and deep analytics to your ranked questions.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            ['enablePreferenceFlowMap', 'Preference Flow Map', 'Shows where votes go when lower-ranked options get eliminated.'],
                            ['enableHeadToHeadMatrix', 'Head-to-Head Duel Matrix', 'A table showing how every choice fares head-to-head against every other.'],
                            ['enableConsensusScore', 'Consensus Score', 'Finds the choice that most voters find acceptable, even if it is not their first choice.'],
                            ['enablePolarizationDetector', 'Polarization Detector', 'Flags options that voters either love (1st place) or hate (last place).'],
                            ['enableKingmakerAnalysis', 'Kingmaker Analysis', 'Identifies which eliminated option had the most power to decide the winner.'],
                            ['enableRankHeatmap', 'Rank Distribution Heatmap', 'A map showing exactly how many 1st, 2nd, and 3rd place votes each choice got.'],
                            ['enableRankConfidence', 'Voter Confidence by Rank', 'Measures how sure voters were about their choices at each rank level.'],
                            ['enableScenarioSimulator', 'Scenario Simulator', 'Lets you temporarily remove a choice to see how it changes the winner.'],
                            ['enableTieBreakerEngine', 'Tie-Breaker Engine', 'Uses custom rules to resolve close ties.'],
                            ['enableRankCompleteness', 'Rank Completeness Rules', 'Sets whether voters must rank all choices or just their top ones.'],
                            ['enablePodiumResults', 'Podium Result Mode', 'Displays the top three choices on a gold, silver, and bronze podium.'],
                            ['enableCoalitionFinder', 'Preference Coalition Finder', 'Finds groups of voters who made similar top ranking patterns.'],
                            ['enableMinorityProtection', 'Minority Protection Score', 'Checks if choices favored by smaller groups were completely ignored.'],
                            ['enableAuditReplay', 'Audit Replay', 'Lets you review and replay the elimination rounds step-by-step.']
                          ].map(([key, label, desc]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => toggleRankedFeature(key)}
                              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                                rankedFeatures[key] ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/5 bg-white/2'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full gap-3">
                                <span className="text-xs font-bold text-white">{label}</span>
                                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  rankedFeatures[key] ? 'border-purple-500 bg-purple-500 text-white' : 'border-white/20'
                                }`}>
                                  {rankedFeatures[key] && <Check className="w-3 h-3" />}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400 leading-normal">{desc}</span>
                            </button>
                          ))}
                        </div>

                        {rankedFeatures.enableTieBreakerEngine && (
                          <select
                            value={rankedTieBreakerRule}
                            onChange={(e) => setRankedTieBreakerRule(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors"
                          >
                            <option value="FIRST_PLACE" className="bg-slate-900 text-white">Tie-break by most first-place votes</option>
                            <option value="AVERAGE_RANK" className="bg-slate-900 text-white">Tie-break by best average rank</option>
                            <option value="HEAD_TO_HEAD" className="bg-slate-900 text-white">Tie-break by head-to-head preference</option>
                          </select>
                        )}

                        {rankedFeatures.enableRankCompleteness && (
                          <select
                            value={rankedCompletenessRule}
                            onChange={(e) => setRankedCompletenessRule(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors"
                          >
                            <option value="PARTIAL" className="bg-slate-900 text-white">Allow partial rankings</option>
                            <option value="TOP_3" className="bg-slate-900 text-white">Require at least top 3</option>
                            <option value="FULL" className="bg-slate-900 text-white">Require full ranking</option>
                          </select>
                        )}
                      </div>
                    )}

                    {/* Knockout features */}
                    {hasKnockoutQuestion && (
                      <div className="glass-card rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5 space-y-4 animate-fade-in-up">
                        <div>
                          <h4 className="font-outfit font-bold text-white text-sm">Knockout Extras</h4>
                          <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                            Add bracket guessing and other game-like features to your knockout tournament questions.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            ['enableBracketPredictions', 'Playoff Bracket Guessing', 'Voters can guess the tournament bracket winner before matches start, earning prediction points.'],
                            ['enableDoubleElimination', 'Double Elimination', 'Options must lose twice before being knocked out, giving underdogs a second chance.'],
                            ['enableUnderdogTracker', 'Underdog Tracker', 'Highlights matches where the lower-seeded option beats the favorite.'],
                            ['enableOptionStatsCards', 'Option Factsheets', 'Displays key stats, player cards, or descriptions for each option directly on the ballot.'],
                            ['enableSuddenDeath', 'Sudden Death Overtime', 'Instantly breaks tie matches using a quick voter shootout or coin toss.']
                          ].map(([key, label, desc]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => toggleKnockoutFeature(key)}
                              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                                knockoutFeatures[key] ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/5 bg-white/2'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full gap-3">
                                <span className="text-xs font-bold text-white">{label}</span>
                                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  knockoutFeatures[key] ? 'border-amber-500 bg-amber-500 text-white' : 'border-white/20'
                                }`}>
                                  {knockoutFeatures[key] && <Check className="w-3 h-3" />}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400 leading-normal">{desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* If none of the advanced features are applicable */}
                    {!hasSingleQuestion && !hasRankedQuestion && !hasKnockoutQuestion && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No advanced features are available for the selected question types.
                      </div>
                    )}
                  </>
                )}
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
            {currentStep < 9 ? (
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
                  onClick={() => handleSubmitPoll('DRAFT')}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-bold glass-card border-white/15 text-indigo-300 hover:text-white text-sm flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitPoll('ACTIVE')}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-bold gradient-btn text-white text-sm flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Launch Poll</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
