'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, ArrowRight, Save, Check, Vote, 
  Trash2, Plus, Upload, Shield, Calendar, Users, AlertCircle, Award, Trophy
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState(''); // holds base64 string

  // Step 2 & 3: Question & Type
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'SINGLE' | 'RANKED' | 'KNOCKOUT'>('SINGLE');
  const [options, setOptions] = useState<string[]>(['Option 1', 'Option 2']);

  // Step 4: Closed vs Open Voting
  const [isOpenVoting, setIsOpenVoting] = useState(true);
  const [numVoters, setNumVoters] = useState(5);
  // Dynamically renameable fields
  const [identifierLabel, setIdentifierLabel] = useState('Roll Number');
  const [confirmer1Label, setConfirmer1Label] = useState('Student Name');
  const [confirmer2Label, setConfirmer2Label] = useState('Parent Name');
  const [allowedVoters, setAllowedVoters] = useState<any[]>([
    { identifier: '', confirmer1: '', confirmer2: '', email: '' },
    { identifier: '', confirmer1: '', confirmer2: '', email: '' },
    { identifier: '', confirmer1: '', confirmer2: '', email: '' },
    { identifier: '', confirmer1: '', confirmer2: '', email: '' },
    { identifier: '', confirmer1: '', confirmer2: '', email: '' },
  ]);

  // Google Sheets import states
  const [sheetUrl, setSheetUrl] = useState('');
  const [importingSheet, setImportingSheet] = useState(false);
  const [sheetImportError, setSheetImportError] = useState('');
  const [sheetImportSuccess, setSheetImportSuccess] = useState('');

  // Step 5: Restrictions
  const [limitOneVotePerUser, setLimitOneVotePerUser] = useState(true);
  const [limitOneVotePerIP, setLimitOneVotePerIP] = useState(false);
  const [limitOneVotePerISP, setLimitOneVotePerISP] = useState(false);

  // Step 6: Anonymity
  const [isAnonymous, setIsAnonymous] = useState(true);

  // Step 7: Schedule
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Step 8: Results & Visibility Toggles
  const [hideResultsUntilEnd, setHideResultsUntilEnd] = useState(false);
  const [isResultPublic, setIsResultPublic] = useState(false);

  // Initialize date defaults
  useEffect(() => {
    const start = new Date();
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days later
    
    // Format to YYYY-MM-DDTHH:MM
    const format = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    
    setStartTime(format(start));
    setEndTime(format(end));
  }, []);

  // ────────────────────────────────────────────────────────
  // DYNAMIC HELPERS & VALIDATORS
  // ────────────────────────────────────────────────────────

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
  const handleAddOption = () => {
    setOptions([...options, `Option ${options.length + 1}`]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, idx) => idx !== index));
    }
  };

  const handleOptionChange = (value: string, index: number) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
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
      if (!questionText.trim()) {
        setError('Please input the question text.');
        return false;
      }
      if (options.some((o) => !o.trim())) {
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
    if (currentStep === 7) {
      if (new Date(startTime) >= new Date(endTime)) {
        setError('Poll end date must fall after the starting date.');
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
      description,
      posterUrl,
      isOpenVoting,
      isAnonymous,
      isResultPublic,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      status,
      questions: [
        {
          questionText,
          type: questionType,
          options,
        },
      ],
      settings: {
        limitOneVotePerUser,
        limitOneVotePerIP,
        limitOneVotePerISP,
        hideResultsUntilEnd,
      },
      allowedVoters: isOpenVoting ? [] : allowedVoters,
      identifierLabel: isOpenVoting ? 'Roll Number' : identifierLabel,
      confirmer1Label: isOpenVoting ? 'Student Name' : confirmer1Label,
      confirmer2Label: isOpenVoting ? 'Parent Name' : confirmer2Label,
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

  const stepsList = [
    'Details', 'Question', 'Type', 'Audience', 'Security', 'Anonymity', 'Schedule', 'Finalize'
  ];

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
            <span>Step {currentStep} of 8</span>
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
        <div className="flex-1 flex flex-col justify-center">
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
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Poll Basics</h2>
                <p className="text-gray-400 text-sm mt-1">Provide a title and a description to engage your voters.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    Poll Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Student Council Presidential Election 2026"
                    className="w-full glass-input placeholder-gray-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    Description / Voter Guidelines
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about the poll candidate bios, voting guidelines, and other rules."
                    className="w-full glass-input placeholder-gray-600 text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    Poll Poster (Optional)
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
              <div>
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Question & Choices</h2>
                <p className="text-gray-400 text-sm mt-1">Define the question being asked and list the choices.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    Poll Question
                  </label>
                  <input
                    type="text"
                    required
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="e.g. Who should be elected Student Council President?"
                    className="w-full glass-input placeholder-gray-600 text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider">
                    Options / Candidates
                  </label>
                  
                  <div className="space-y-3">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center space-x-2.5">
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => handleOptionChange(e.target.value, idx)}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 glass-input placeholder-gray-600 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          disabled={options.length <= 2}
                          className={`p-3 rounded-xl border border-white/5 transition-all ${
                            options.length > 2
                              ? 'text-red-400 hover:bg-red-500/10 hover:border-red-500/20'
                              : 'text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="mt-2 px-4 py-2.5 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-all flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Another Option</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Choice Logic */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Voting Type</h2>
                <p className="text-gray-400 text-sm mt-1">Select the mathematical choice structure for your poll.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {/* Single Choice */}
                <div
                  onClick={() => setQuestionType('SINGLE')}
                  className={`glass-card rounded-3xl p-6 border cursor-pointer transition-all flex flex-col justify-between h-48 ${
                    questionType === 'SINGLE'
                      ? 'border-indigo-500/60 shadow-[0_0_24px_rgba(99,102,241,0.15)] bg-indigo-500/5'
                      : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                      <Check className="w-6 h-6" />
                    </div>
                    {questionType === 'SINGLE' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-outfit text-lg font-bold text-white mb-1.5">Single Choice Selection</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Voters select exactly one choice from the options list. Standard first-past-the-post rules.
                    </p>
                  </div>
                </div>

                {/* Ranked Choice Borda Count */}
                <div
                  onClick={() => setQuestionType('RANKED')}
                  className={`glass-card rounded-3xl p-6 border cursor-pointer transition-all flex flex-col justify-between h-48 ${
                    questionType === 'RANKED'
                      ? 'border-indigo-500/60 shadow-[0_0_24px_rgba(99,102,241,0.15)] bg-indigo-500/5'
                      : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                      <Award className="w-6 h-6" />
                    </div>
                    {questionType === 'RANKED' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-outfit text-lg font-bold text-white mb-1.5">Ranked Choice (Borda Count)</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Voters rank options in order of priority. Scoring weights are applied mathematically (1st choice gets highest weight).
                    </p>
                  </div>
                </div>

                {/* Knockout Tournament */}
                <div
                  onClick={() => setQuestionType('KNOCKOUT')}
                  className={`glass-card rounded-3xl p-6 border cursor-pointer transition-all flex flex-col justify-between h-48 ${
                    questionType === 'KNOCKOUT'
                      ? 'border-indigo-500/60 shadow-[0_0_24px_rgba(99,102,241,0.15)] bg-indigo-500/5'
                      : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                      <Trophy className="w-6 h-6" />
                    </div>
                    {questionType === 'KNOCKOUT' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-outfit text-lg font-bold text-white mb-1.5">Knockout Tournament</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Automated tournament brackets. Voters go head-to-head through randomized pairings individually (32 ➔ 16 ➔ 8 ➔ 4 ➔ 2 ➔ Champion).
                    </p>
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
                <p className="text-gray-400 text-sm mt-1">Select who is authorized to vote on this poll.</p>
              </div>

              <div className="flex justify-between items-center bg-white/3 border border-white/5 rounded-2xl p-4 gap-4">
                <span className="text-sm font-semibold text-gray-300">Allow Open Public Voting?</span>
                <div className="flex items-center space-x-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsOpenVoting(true)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      isOpenVoting ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Open Vote
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpenVoting(false)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      !isOpenVoting ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Closed Vote
                  </button>
                </div>
              </div>

              {/* Dynamic Voter Import Table */}
              {!isOpenVoting && (
                <div className="space-y-6">
                  {/* Headline controls */}
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center space-x-2.5">
                      <Users className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-outfit text-lg font-bold text-white">Voter Register</h3>
                    </div>
                    <div className="flex items-center space-x-3 w-full md:w-auto">
                      <label className="text-xs font-semibold text-gray-500 uppercase shrink-0">Voter Count:</label>
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

                  {/* Header Rename controls */}
                  <div className="grid grid-cols-3 gap-4 bg-white/2 p-4 rounded-xl border border-white/5">
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
                    <div>
                      <label className="block text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1.5">
                        Rename Confirmer 2 (Optional)
                      </label>
                      <input
                        type="text"
                        value={confirmer2Label}
                        onChange={(e) => setConfirmer2Label(e.target.value)}
                        className="w-full glass-input text-xs py-1.5"
                      />
                    </div>
                  </div>

                  {/* Interactive Spreadsheet-like layout */}
                  <div className="overflow-x-auto border border-white/5 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-white/5 text-gray-400 font-bold border-b border-white/10 uppercase tracking-wider">
                          <th className="py-3.5 px-4 w-12 text-center">Row</th>
                          <th className="py-3.5 px-4 min-w-[120px]">{identifierLabel} <span className="text-red-400">*</span></th>
                          <th className="py-3.5 px-4 min-w-[120px]">{confirmer1Label} <span className="text-red-400">*</span></th>
                          <th className="py-3.5 px-4 min-w-[120px]">{confirmer2Label}</th>
                          <th className="py-3.5 px-4 min-w-[180px]">Email Address <span className="text-red-400">*</span></th>
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
                                placeholder="e.g. Alan Turing"
                                className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-1 text-white placeholder-gray-700"
                              />
                            </td>
                            <td className="py-2.5 px-2">
                              <input
                                type="text"
                                value={voter.confirmer2}
                                onChange={(e) => handleVoterCellChange(e.target.value, idx, 'confirmer2')}
                                placeholder="Optional text"
                                className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-1 text-white placeholder-gray-700"
                              />
                            </td>
                            <td className="py-2.5 px-2">
                              <input
                                type="email"
                                required
                                value={voter.email}
                                onChange={(e) => handleVoterCellChange(e.target.value, idx, 'email')}
                                placeholder="e.g. alan@turing.edu"
                                className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-1 text-white placeholder-gray-700"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Security Restrictions */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Fraud Prevention</h2>
                <p className="text-gray-400 text-sm mt-1">Protect the integrity of the vote with advanced device restrictions.</p>
              </div>

              <div className="space-y-4 pt-4">
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
                      <h4 className="font-outfit font-bold text-white text-sm">Limit One Vote Per User (Email)</h4>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                        Compulsory email checking prevents voters from submitting multiple times with different email aliases.
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
                      <h4 className="font-outfit font-bold text-white text-sm">Limit One Vote Per Device (IP)</h4>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                        Tracks and warns if the same computer or mobile device attempts to cast multiple votes, flagging duplicates as suspicious.
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
                      <h4 className="font-outfit font-bold text-white text-sm">Limit One Vote Per Network (ISP)</h4>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                        Prevents ballot stuffing by tracking internet service providers. Restricts multiple votes from identical local WiFi nodes.
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

          {/* STEP 6: Anonymity Settings */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Anonymity Mode</h2>
                <p className="text-gray-400 text-sm mt-1">Configure whether voter identities are visible on dashboards.</p>
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
                    <h3 className="font-outfit text-lg font-bold text-white mb-1.5">Strictly Anonymous Voting</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Voter choices are unlinked from their emails and credentials on creator reports. Total privacy guaranteed.
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
                    <h3 className="font-outfit text-lg font-bold text-white mb-1.5">Known Voting Session</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Voter details (Roll number, email) are actively logged alongside their cast choices, fully visible on reports.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Time Scheduling */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Election Timeline</h2>
                <p className="text-gray-400 text-sm mt-1">Specify precisely when this poll is open for casting votes.</p>
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
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h2 className="font-outfit text-3xl font-extrabold text-white leading-tight">Final Details</h2>
                <p className="text-gray-400 text-sm mt-1">Confirm results visibility settings before publishing.</p>
              </div>

              <div className="space-y-4 pt-4">
                {/* Results Visibility */}
                <div
                  onClick={() => setHideResultsUntilEnd(!hideResultsUntilEnd)}
                  className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all ${
                    hideResultsUntilEnd ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-outfit font-bold text-white text-sm">Hide Live Results From Voters</h4>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                        Results are kept hidden from voters until the poll schedule ends, ensuring absolute fairness.
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
                  onClick={() => setIsResultPublic(!isResultPublic)}
                  className={`glass-card rounded-2xl p-5 border cursor-pointer flex items-center justify-between transition-all ${
                    isResultPublic ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-outfit font-bold text-white text-sm">Make Detailed Analytics Public</h4>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                        Once checked, voters can see real-time charts, map geolocation clusters, and full report cards.
                      </p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    isResultPublic ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-white/20'
                  }`}>
                    {isResultPublic && <Check className="w-3.5 h-3.5" />}
                  </div>
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
            {currentStep < 8 ? (
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
