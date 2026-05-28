'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';
import {
  Vote, ArrowLeft, Sparkles, Shield, BarChart3, Globe, Zap, TrendingUp, Trophy, ArrowRightCircle,
  // Polls
  Lock, Users, Timer, Eye, Shuffle, SlidersHorizontal, Hash, Palette,
  MonitorSmartphone, Share2, Code2, MessageSquare, ThumbsUp, ListOrdered,
  Image, PieChart, Activity, Layers, Bell, Radio,
  // Surveys
  FileText, AlignLeft, ToggleLeft, Star, Grid3X3, Upload, ClipboardList,
  GitBranch, Languages, BarChart, Send, Percent, Brain, Type, Calendar,
  Smartphone, Bookmark, Filter, Download,
  // Exams
  GraduationCap, Clock, BookOpen, CheckCircle, AlertTriangle,
  Maximize, Copy, Scissors, Printer, Calculator, Award, Target,
  Fingerprint, FileCheck, TrendingDown, HelpCircle, Settings, Mail,
  // Platform
  Moon, Cpu, RefreshCw, Webhook, KeyRound, Building2, HeartHandshake,
  Accessibility, Search, Gauge
} from 'lucide-react';

type FeatureItem = {
  icon: React.ElementType;
  title: string;
  description: string;
  tag?: string;
};

type FeatureCategory = {
  id: string;
  label: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  headerIcon: React.ElementType;
  description: string;
  features: FeatureItem[];
};

export default function FeaturesPage() {
  const categories: FeatureCategory[] = [
    // ──────────────────────── POLLS ────────────────────────
    {
      id: 'polls',
      label: 'Polls & Voting',
      accent: 'text-emerald-400',
      accentBg: 'bg-emerald-500/10',
      accentBorder: 'border-emerald-500/20',
      headerIcon: Vote,
      description: 'Create secure, real-time, beautifully designed polls with advanced voting mechanisms and anti-fraud protections.',
      features: [
        { icon: Shield, title: 'OTP Voter Verification', description: 'Voters verify their identity with a one-time password sent to their email before voting. Prevents impersonation and unauthorized access.', tag: 'Security' },
        { icon: Lock, title: 'Closed Voter Lists', description: 'Upload a list of authorized voter emails or roll numbers. Only verified participants can access and vote in the poll.', tag: 'Security' },
        { icon: Users, title: 'Open Public Polls', description: 'Create polls anyone can participate in with just a link. No login or verification required — perfect for quick opinions.', tag: 'Access' },
        { icon: BarChart3, title: 'Real-Time Live Results', description: 'Watch votes roll in live with auto-updating bar charts, pie charts, and percentage breakdowns. Zero page refresh needed.', tag: 'Analytics' },
        { icon: Globe, title: 'Live Geolocation Map', description: 'See where votes are coming from on an interactive map. Highlights clusters and flags suspicious duplicate locations.', tag: 'Analytics' },
        { icon: Zap, title: 'Live Vote Ticker', description: 'Scrolling live feed showing each new vote as it arrives — with green/red indicators for which options are gaining or losing momentum.', tag: 'Engagement' },
        { icon: TrendingUp, title: 'Viral Vote Indicators', description: 'Options experiencing a sudden surge of votes get a glowing "🔥 Trending" badge to build excitement and engagement.', tag: 'Engagement' },
        { icon: Trophy, title: 'Ranked Choice / Borda Count', description: 'Voters drag and rank their preferences on a podium. Results use the Borda count method for fair, mathematical winner selection.', tag: 'Voting Method' },
        { icon: SlidersHorizontal, title: 'Quadratic Voting', description: 'Voters allocate a budget of credits across options. Buying more votes for one option costs exponentially more — prevents tyranny of the majority.', tag: 'Voting Method' },
        { icon: Hash, title: 'Single Choice / Multi-Select', description: 'Choose between letting voters pick one option or multiple options. Multi-select shows aggregate percentages for each choice.', tag: 'Voting Method' },
        { icon: ArrowRightCircle, title: 'AI Result Summary', description: 'After the poll closes, get an AI-generated plain-English summary explaining who won, by how much, and key insights.', tag: 'AI' },
        { icon: Timer, title: 'Timed Polls', description: 'Set auto-start and auto-close times. Polls automatically open and close on schedule — no manual intervention needed.', tag: 'Scheduling' },
        { icon: Eye, title: 'Result Visibility Control', description: 'Choose when voters see results: live during voting, only after they vote, or only after the poll closes.', tag: 'Settings' },
        { icon: Shuffle, title: 'Option Randomization', description: 'Randomize the order of poll options for each voter to eliminate position bias and ensure fair representation.', tag: 'Settings' },
        { icon: Palette, title: 'Custom Branding', description: 'Replace Pollstar branding with your own logo and custom header text on the poll page. White-label experience for organizations.', tag: 'Branding' },
        { icon: MonitorSmartphone, title: 'Mobile-First Design', description: 'Every poll is fully responsive and optimized for mobile devices. Touch-friendly buttons, swipe gestures, and mobile-optimized charts.', tag: 'UX' },
        { icon: Share2, title: 'Shareable Links & QR Codes', description: 'Every poll gets a unique short link and auto-generated QR code for easy sharing via social media, print, or presentation.', tag: 'Sharing' },
        { icon: Code2, title: 'Embeddable Widget', description: 'Embed your poll directly into any website or blog with a simple iframe code. Fully functional voting inside the embed.', tag: 'Integration' },
        { icon: MessageSquare, title: 'Opinion Chatbox', description: 'Voters can discuss options in a live chat sidebar. Comments are auto-tagged with sentiment emojis (👍😐👎).', tag: 'Engagement' },
        { icon: ThumbsUp, title: 'Sentiment Reactions', description: 'Voters can react to individual options with emoji reactions alongside their vote — adding qualitative depth to quantitative data.', tag: 'Engagement' },
        { icon: ListOrdered, title: 'Voter Leaderboard', description: 'Optional leaderboard showing who voted first and engagement stats. Gamifies participation and encourages quick turnout.', tag: 'Engagement' },
        { icon: Image, title: 'Rich Media Options', description: 'Add images, GIFs, or thumbnails to poll options. Visual polls get higher engagement and clearer communication.', tag: 'Content' },
        { icon: PieChart, title: 'Multiple Chart Types', description: 'View results as bar charts, pie charts, donut charts, or data tables. Switch between views with one click.', tag: 'Analytics' },
        { icon: Activity, title: 'Vote Timeline Graph', description: 'Interactive timeline showing when votes were cast. Identify peak voting periods and detect suspicious patterns.', tag: 'Analytics' },
        { icon: Layers, title: 'Multi-Round Polls', description: 'Create tournament-style elimination polls where the lowest-voted option is eliminated each round. Double elimination supported.', tag: 'Voting Method' },
        { icon: Bell, title: 'Notification Alerts', description: 'Get email or push notifications when your poll reaches milestones (100 votes, poll closed, fraud detected).', tag: 'Notifications' },
        { icon: Radio, title: 'Live Broadcast Mode', description: 'Full-screen presentation mode designed for projecting results at events, meetings, or classrooms.', tag: 'Presentation' },
        { icon: Fingerprint, title: 'Device Fingerprinting', description: 'Advanced browser fingerprinting detects duplicate votes from the same device — even across different browsers or incognito windows.', tag: 'Security' },
        { icon: Download, title: 'Export Results', description: 'Download complete poll results as CSV, PDF, or Excel. Includes timestamps, voter metadata, and statistical summaries.', tag: 'Export' },
        { icon: RefreshCw, title: 'Revote / Change Vote', description: 'Optionally allow voters to change their vote within a time window. Toggle on/off per poll.', tag: 'Settings' },
      ],
    },

    // ──────────────────────── SURVEYS ────────────────────────
    {
      id: 'surveys',
      label: 'Surveys & Feedback',
      accent: 'text-cyan-400',
      accentBg: 'bg-cyan-500/10',
      accentBorder: 'border-cyan-500/20',
      headerIcon: ClipboardList,
      description: 'Build professional multi-page surveys with logic branching, rich question types, AI-powered analytics, and beautiful response dashboards.',
      features: [
        { icon: FileText, title: 'Multiple Question Types', description: 'MCQ, checkboxes, dropdowns, short answer, long answer, rating scales, Likert scales, date pickers, number inputs, and more.', tag: 'Questions' },
        { icon: AlignLeft, title: 'Long-Form Text Responses', description: 'Open-ended questions with character limits, word counters, and optional rich text formatting for detailed feedback.', tag: 'Questions' },
        { icon: Star, title: 'Star & Emoji Ratings', description: 'Drag-to-rate star ratings (1–5 or 1–10) and emoji-based satisfaction scales (😡😐😊) for intuitive feedback.', tag: 'Questions' },
        { icon: Grid3X3, title: 'Matrix / Grid Questions', description: 'Create rating matrices where respondents rate multiple items across multiple criteria in a single grid view.', tag: 'Questions' },
        { icon: ToggleLeft, title: 'Yes/No & Toggle Questions', description: 'Simple boolean questions with clean toggle switches. Perfect for consent forms and quick binary choices.', tag: 'Questions' },
        { icon: Upload, title: 'File Upload Questions', description: 'Allow respondents to upload images, documents, or screenshots. Files stored via Google Drive integration.', tag: 'Questions' },
        { icon: GitBranch, title: 'Conditional Logic Branching', description: 'Show or skip questions based on previous answers. Build complex survey flows without programming.', tag: 'Logic' },
        { icon: Layers, title: 'Multi-Page Surveys', description: 'Break long surveys into pages with progress indicators. Respondents see how far along they are.', tag: 'Structure' },
        { icon: Shuffle, title: 'Question Randomization', description: 'Randomize question order to eliminate sequence bias. Randomize within pages or across the entire survey.', tag: 'Settings' },
        { icon: Timer, title: 'Response Time Limits', description: 'Set overall survey deadlines or per-question time limits. Auto-submit when time expires.', tag: 'Settings' },
        { icon: Languages, title: 'Required vs Optional Questions', description: 'Mark questions as required or optional. Required questions show validation errors if skipped.', tag: 'Validation' },
        { icon: Type, title: 'Input Validation Rules', description: 'Restrict responses to specific formats: numbers only, email format, phone number, date, URL, custom regex patterns.', tag: 'Validation' },
        { icon: BarChart, title: 'Real-Time Response Dashboard', description: 'Watch responses come in live with auto-updating charts, counts, and percentage breakdowns per question.', tag: 'Analytics' },
        { icon: Brain, title: 'AI Sentiment Analysis', description: 'AI analyzes open-ended responses to determine positive, negative, or neutral sentiment. See aggregate mood scores.', tag: 'AI' },
        { icon: MessageSquare, title: 'Word Cloud Generator', description: 'Auto-generated word clouds from text responses highlighting the most frequently mentioned terms and themes.', tag: 'AI' },
        { icon: ArrowRightCircle, title: 'AI Summary Report', description: 'AI generates a comprehensive plain-English summary of survey findings, key trends, and actionable insights.', tag: 'AI' },
        { icon: Send, title: 'Automated Reminders', description: 'Send follow-up email reminders to participants who haven\'t completed the survey. Customizable frequency.', tag: 'Engagement' },
        { icon: Percent, title: 'Completion Rate Tracking', description: 'Track how many people started vs completed the survey. Identify drop-off points to optimize question flow.', tag: 'Analytics' },
        { icon: Lock, title: 'Anonymous Responses', description: 'Toggle anonymous mode so no identifying information is attached to responses. Builds trust for sensitive topics.', tag: 'Privacy' },
        { icon: Users, title: 'Targeted Distribution', description: 'Send surveys to specific email lists. Track who responded and who hasn\'t for follow-up.', tag: 'Distribution' },
        { icon: Calendar, title: 'Scheduled Launch & Close', description: 'Set precise open and close dates/times. Surveys auto-activate and auto-close on schedule.', tag: 'Scheduling' },
        { icon: Smartphone, title: 'Mobile-Optimized Surveys', description: 'Every survey is fully responsive. Touch-friendly sliders, tappable options, and swipe navigation between pages.', tag: 'UX' },
        { icon: Bookmark, title: 'Save & Resume Later', description: 'Respondents can save their progress and complete the survey later. Partial responses are preserved.', tag: 'UX' },
        { icon: Filter, title: 'Response Filtering & Segmentation', description: 'Filter and segment responses by demographics, answers to specific questions, or custom tags.', tag: 'Analytics' },
        { icon: Download, title: 'Export to CSV/PDF/Excel', description: 'Download all survey responses with full metadata. Export individual questions or the entire dataset.', tag: 'Export' },
        { icon: Palette, title: 'Custom Branding & Themes', description: 'Replace Pollstar branding with your own logo and colors. White-label surveys for professional distribution.', tag: 'Branding' },
        { icon: Share2, title: 'Shareable Links & QR Codes', description: 'Unique short links and QR codes for each survey. Easy sharing via any channel.', tag: 'Sharing' },
        { icon: Code2, title: 'Embed in Websites', description: 'Embed surveys directly into your website with responsive iframe code. Seamless user experience.', tag: 'Integration' },
        { icon: ListOrdered, title: 'Drag-and-Drop Question Ordering', description: 'Reorder questions with drag-and-drop. Rearrange pages and sections with intuitive controls.', tag: 'Builder' },
        { icon: Fingerprint, title: 'Duplicate Response Prevention', description: 'Prevent the same person from submitting multiple responses using email verification or device fingerprinting.', tag: 'Security' },
      ],
    },

    // ──────────────────────── EXAMS ────────────────────────
    {
      id: 'exams',
      label: 'Exams & Assessments',
      accent: 'text-purple-400',
      accentBg: 'bg-purple-500/10',
      accentBorder: 'border-purple-500/20',
      headerIcon: GraduationCap,
      description: 'Conduct secure, timed exams with auto-grading, anti-cheat proctoring, detailed gradebooks, and AI-powered performance analytics.',
      features: [
        { icon: CheckCircle, title: 'MCQ (Single Correct)', description: 'Multiple choice questions with one correct answer. Auto-graded instantly. Supports 2–10 options per question.', tag: 'Question Type' },
        { icon: ListOrdered, title: 'MCQ (Multiple Correct)', description: 'Questions where multiple options can be correct. Partial marking supported — marks for each correct selection.', tag: 'Question Type' },
        { icon: AlignLeft, title: 'Short Answer Questions (SAQ)', description: 'Text input answers with exact or fuzzy keyword matching for auto-grading. Set acceptable answers and variations.', tag: 'Question Type' },
        { icon: FileText, title: 'Long Answer Questions (LAQ)', description: 'Paragraph-length responses. Teacher provides model answers for AI-assisted comparison and manual grading.', tag: 'Question Type' },
        { icon: ToggleLeft, title: 'True or False', description: 'Simple binary questions with auto-grading. Great for quick concept checks and fundamentals testing.', tag: 'Question Type' },
        { icon: Hash, title: 'Fill in the Blanks', description: 'Cloze-style questions where students type missing words. Auto-graded with spelling tolerance.', tag: 'Question Type' },
        { icon: Layers, title: 'Match the Following', description: 'Drag-and-drop matching between two columns. Auto-graded based on correct pairings.', tag: 'Question Type' },
        { icon: Type, title: 'Numerical Input', description: 'Questions requiring exact numerical answers. Input restricted to numbers with optional decimal precision and range tolerance.', tag: 'Question Type' },
        { icon: Upload, title: 'File Upload Answers', description: 'Students upload documents, images, or PDFs as answers. Files go directly to the teacher\'s Google Drive folder.', tag: 'Question Type' },
        { icon: Clock, title: 'Timed Exams', description: 'Set overall exam duration and optional per-question time limits. Auto-submit when time runs out. Live countdown timer.', tag: 'Proctoring' },
        { icon: Maximize, title: 'Full-Screen Lockdown', description: 'Force the exam into full-screen mode. Track and log every time a student exits full-screen.', tag: 'Proctoring' },
        { icon: Copy, title: 'Tab-Switch Detection', description: 'Detect and log when students switch to another tab or window. Configurable maximum tab-switches allowed.', tag: 'Proctoring' },
        { icon: Scissors, title: 'Copy-Paste Prevention', description: 'Disable right-click, copy, paste, and text selection during the exam to prevent cheating.', tag: 'Proctoring' },
        { icon: AlertTriangle, title: 'Cheat Probability Score', description: 'AI calculates a per-student cheat probability score based on tab switches, answer timing patterns, and behavioral anomalies.', tag: 'AI' },
        { icon: Calculator, title: 'Per-Question Marks', description: 'Assign different marks to each question. Supports positive marks, negative marks, and partial credit.', tag: 'Grading' },
        { icon: Award, title: 'Auto-Grading Engine', description: 'Instant automatic grading for MCQ, True/False, Fill-in-the-Blank, and numerical questions. Results available immediately.', tag: 'Grading' },
        { icon: Target, title: 'Manual Grading Interface', description: 'Teacher grading panel for LAQ and SAQ with the model answer displayed side-by-side. Assign marks per question.', tag: 'Grading' },
        { icon: Shuffle, title: 'Question Randomization', description: 'Randomize question order for each student. Option to randomize answer choices within MCQs too.', tag: 'Security' },
        { icon: Layers, title: 'Page Breaks / Sections', description: 'Organize exams into sections with page breaks. Students navigate between pages with progress indicators.', tag: 'Structure' },
        { icon: ListOrdered, title: 'Drag-and-Drop Question Ordering', description: 'Reorder questions by dragging them. Move questions between sections with intuitive controls.', tag: 'Builder' },
        { icon: BarChart3, title: 'Detailed Score Reports', description: 'Per-student breakdown showing marks per question, total score, percentage, rank, and time taken.', tag: 'Reports' },
        { icon: TrendingUp, title: 'Class Performance Analytics', description: 'See class-wide statistics: average score, median, standard deviation, score distribution histogram, and pass rate.', tag: 'Reports' },
        { icon: TrendingDown, title: 'Weakness Analysis', description: 'AI identifies which topics or questions students struggled with most. Recommends focus areas for improvement.', tag: 'AI' },
        { icon: Brain, title: 'AI Concept Explanations', description: 'When results are released, students see AI-generated explanations for each wrong answer — teaching the concept behind the correct answer.', tag: 'AI' },
        { icon: Printer, title: 'Printable Results PDF', description: 'Generate and download a beautifully formatted PDF report card for each student with detailed score breakdowns.', tag: 'Export' },
        { icon: Download, title: 'Bulk Results Export', description: 'Export all results as CSV/Excel with student names, roll numbers, question-wise marks, total scores, and ranks.', tag: 'Export' },
        { icon: Mail, title: 'Email Results to Students', description: 'When "Release Results" is toggled, each student gets an email with their score, rank, and a link to their detailed analysis.', tag: 'Communication' },
        { icon: FileCheck, title: 'Teacher Gradebook', description: 'Comprehensive gradebook with all exams and students in one view. Sort by name, score, date, or status. Override grades inline.', tag: 'Management' },
        { icon: Lock, title: 'Access Code Protection', description: 'Exams require a unique access code to start. Distribute codes only to authorized students.', tag: 'Security' },
        { icon: Calendar, title: 'Scheduled Start & End', description: 'Set precise exam windows. Exam auto-activates at start time and auto-closes at end time.', tag: 'Scheduling' },
        { icon: HelpCircle, title: 'Question Hints', description: 'Optionally provide hints for difficult questions. Configurable point deduction for using hints.', tag: 'Settings' },
        { icon: Palette, title: 'Custom Branding', description: 'Replace Pollstar branding with your institution\'s logo and header text. White-label exam experience.', tag: 'Branding' },
        { icon: Settings, title: 'Negative Marking', description: 'Enable negative marks for wrong answers on MCQ questions. Configurable penalty per question.', tag: 'Grading' },
        { icon: Users, title: 'Student Roster Management', description: 'Upload student lists via CSV. Track who attempted, who passed, and who hasn\'t started yet.', tag: 'Management' },
        { icon: Activity, title: 'Time-per-Question Analytics', description: 'See how long each student spent on each question. Identify questions that were too hard or too easy.', tag: 'Analytics' },
      ],
    },

    // ──────────────────────── PLATFORM ────────────────────────
    {
      id: 'platform',
      label: 'Platform & Infrastructure',
      accent: 'text-amber-400',
      accentBg: 'bg-amber-500/10',
      accentBorder: 'border-amber-500/20',
      headerIcon: Cpu,
      description: 'Enterprise-grade infrastructure, beautiful design system, admin controls, and accessibility features built into every layer.',
      features: [
        { icon: Moon, title: 'Premium Dark Mode', description: 'Stunning dark glassmorphism design system across the entire platform. Ambient glow effects and smooth animations.', tag: 'Design' },
        { icon: MonitorSmartphone, title: 'Fully Responsive', description: 'Every page, form, and dashboard works beautifully on desktop, tablet, and mobile. Touch-optimized interactions.', tag: 'UX' },
        { icon: Gauge, title: 'Real-Time Updates', description: 'WebSocket-powered live updates. Votes, results, and exam submissions appear instantly without page refresh.', tag: 'Performance' },
        { icon: Shield, title: 'Admin Dashboard', description: 'Superadmin panel with user management, poll oversight, system health monitoring, and audit log viewer.', tag: 'Admin' },
        { icon: KeyRound, title: 'Secure Authentication', description: 'Email + password login, Google OAuth, OTP verification, and session management with secure HTTP-only cookies.', tag: 'Security' },
        { icon: Fingerprint, title: 'Anti-Fraud Engine', description: 'Multi-layered fraud detection: IP monitoring, device fingerprinting, geo-spoofing detection, and behavior analysis.', tag: 'Security' },
        { icon: Building2, title: 'Organization Accounts', description: 'Create an organization with multiple admin and teacher accounts. Shared poll/exam library and centralized analytics.', tag: 'Enterprise' },
        { icon: Accessibility, title: 'Accessibility (A11y)', description: 'Keyboard navigation, screen reader support, ARIA labels, and high-contrast mode for inclusive participation.', tag: 'Accessibility' },
        { icon: Search, title: 'Global Search', description: 'Search across all your polls, surveys, and exams. Filter by type, status, date, or keyword.', tag: 'Navigation' },
        { icon: HeartHandshake, title: 'Raise an Issue Button', description: 'One-click bug reporting and feature request button on every page. Goes directly to the development team.', tag: 'Support' },
        { icon: Webhook, title: 'API & Webhooks', description: 'RESTful API for programmatic poll creation and result retrieval. Webhooks for real-time event notifications.', tag: 'Developer' },
        { icon: Globe, title: 'CDN-Optimized Assets', description: 'Static assets served via global CDN for fast load times worldwide. Lazy loading for optimal performance.', tag: 'Performance' },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-gray-200">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.04] rounded-full blur-3xl pointer-events-none" />

      {/* Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/20">
            <Vote className="w-6 h-6 text-white" />
          </div>
          <span className="font-outfit text-2xl font-bold tracking-tight text-white">
            Poll<span className="text-emerald-400">star</span>
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white transition-all group"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>
      </header>

      <div className="flex-1 z-10">
        {/* Hero */}
        <section className="w-full max-w-5xl mx-auto px-6 pt-12 pb-6 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Feature Showcase</span>
          </div>
          <h1 className="font-outfit text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
            Everything You Need,<br className="hidden sm:inline" />
            <span className="gradient-text"> All in One Platform</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed mb-8">
            From simple quick polls to secure proctored exams — Pollstar ships with 100+ features out of the box.
            Every feature is toggleable from the creation wizard. Here&apos;s the complete list.
          </p>

          {/* Quick nav pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all hover:scale-105 ${cat.accentBg} ${cat.accentBorder} ${cat.accent}`}
              >
                <cat.headerIcon className="w-3.5 h-3.5" />
                {cat.label}
                <span className="ml-1 text-[10px] opacity-60">({cat.features.length})</span>
              </a>
            ))}
          </div>
        </section>

        {/* Feature Categories */}
        {categories.map((category) => (
          <section key={category.id} id={category.id} className="w-full max-w-6xl mx-auto px-6 py-12 scroll-mt-20">
            {/* Category Header */}
            <div className="text-center mb-10">
              <div className={`p-3 ${category.accentBg} rounded-2xl border ${category.accentBorder} ${category.accent} w-fit mx-auto mb-4`}>
                <category.headerIcon className="w-7 h-7" />
              </div>
              <h2 className="font-outfit text-2xl sm:text-3xl font-bold text-white mb-2">
                {category.label}
              </h2>
              <p className="text-gray-500 text-sm max-w-xl mx-auto">
                {category.description}
              </p>
              <p className={`text-xs font-semibold mt-2 ${category.accent} opacity-70`}>
                {category.features.length} features
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="glass-card rounded-2xl p-5 hover:border-white/10 transition-all group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2 ${category.accentBg} rounded-xl border ${category.accentBorder} ${category.accent} shrink-0 mt-0.5`}>
                      <feature.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="font-outfit text-sm font-bold text-white">{feature.title}</h3>
                        {feature.tag && (
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${category.accentBg} ${category.accent} opacity-60`}>
                            {feature.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <section className="w-full max-w-3xl mx-auto px-6 pb-20 text-center">
          <div className="glass-card rounded-3xl p-10 sm:p-14 border border-emerald-500/10">
            <h2 className="font-outfit text-3xl font-bold text-white mb-4">
              Ready to Try All of This?
            </h2>
            <p className="text-gray-400 text-sm mb-8 max-w-lg mx-auto">
              Create your free account and start building polls, surveys, and exams with every feature listed above.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="gradient-btn px-8 py-3.5 rounded-xl font-bold text-white text-sm flex items-center gap-2"
              >
                Get Started Free
                <Sparkles className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3.5 rounded-xl font-semibold text-gray-300 hover:text-white border border-white/10 hover:bg-white/5 text-sm transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
