'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';
import {
  ArrowLeft, Vote, Shield, Lock, Eye, Database, Globe,
  Clock, RefreshCw, Baby, Cookie, Mail, UserCheck, Server,
  Fingerprint, FileWarning
} from 'lucide-react';

export default function PrivacyPolicy() {
  const sections = [
    {
      id: 'overview',
      icon: Shield,
      iconColor: 'text-emerald-400',
      title: '1. Overview',
      content: [
        'Pollstar ("we", "us", "our") is committed to protecting the privacy and personal data of our users. This Privacy Policy describes how we collect, use, store, and protect your information when you use our platform — whether as a poll creator, survey administrator, exam teacher, or participant.',
        'This policy applies to all users accessing Pollstar through our website, embedded widgets, APIs, and any future mobile applications. By using Pollstar, you consent to the practices described in this policy.',
      ],
    },
    {
      id: 'data-collection',
      icon: Database,
      iconColor: 'text-indigo-400',
      title: '2. Information We Collect',
      content: [
        'We collect different categories of information depending on how you interact with Pollstar:',
        'Account Information: When you register, we collect your name, email address, profile avatar, and optional organization name. If you sign in via Google OAuth, we receive your Google profile name and email.',
        'Poll/Survey/Exam Responses: We collect all answers, choices, rankings, and text responses submitted by participants. For exams, this includes submitted answers, time taken per question, and any uploaded files (via Google Drive).',
        'Voter Verification Data: For closed polls, we collect email addresses, roll numbers, or custom identifiers provided by poll creators to build voter eligibility lists. OTP verification codes are generated and stored temporarily (30 minutes).',
        'Device & Technical Data: We automatically collect IP addresses, browser type and version, operating system, screen resolution, device type, and approximate geolocation (city/region level) derived from IP addresses.',
        'Anti-Cheat Telemetry: When exam proctoring features are enabled, we collect tab-switch counts, browser focus/blur events, full-screen exit events, clipboard paste attempts, and time-per-question metrics.',
        'Usage Analytics: We track feature usage patterns, page views, session duration, and interaction metrics to improve the platform. This data is aggregated and anonymized.',
      ],
    },
    {
      id: 'data-use',
      icon: Eye,
      iconColor: 'text-purple-400',
      title: '3. How We Use Your Information',
      content: [
        'We use the information collected for the following purposes:',
        '• Service Delivery: To enable poll creation, vote submission, survey collection, exam administration, and result reporting\n• Voter Verification: To verify participant eligibility through email OTP, roll number matching, or custom identifier validation\n• Fraud Prevention: To detect and prevent duplicate voting, bot submissions, location spoofing, and other forms of manipulation\n• Analytics & Insights: To generate real-time charts, voter maps, sentiment analysis, word clouds, and performance reports for creators\n• Exam Integrity: To power anti-cheat features including tab-switch detection, time monitoring, and suspicious behavior flagging\n• Platform Improvement: To analyze usage patterns, identify bugs, and prioritize feature development\n• Communication: To send essential service notifications, OTP codes, exam result releases, and (if opted-in) product updates',
        'We do NOT sell your personal data to third parties. We do NOT use individual poll/survey responses for advertising purposes.',
      ],
    },
    {
      id: 'cookies',
      icon: Cookie,
      iconColor: 'text-amber-400',
      title: '4. Cookies & Tracking Technologies',
      content: [
        'Pollstar uses the following cookies and similar technologies:',
        'Essential Cookies: Session authentication cookies that keep you logged in. These are strictly necessary and cannot be disabled while using the Service.',
        'Functional Cookies: Preferences such as dark mode settings, dashboard layout configurations, and language preferences.',
        'Analytics Cookies: We may use first-party analytics to understand feature adoption and performance. We do not use third-party ad tracking cookies.',
        'Device Fingerprinting: For anti-fraud purposes, we may generate a device fingerprint combining browser, OS, screen resolution, and timezone data to detect duplicate voting from the same device. This fingerprint is hashed and does not identify you personally.',
      ],
    },
    {
      id: 'data-storage',
      icon: Server,
      iconColor: 'text-cyan-400',
      title: '5. Data Storage & Security',
      content: [
        'All data is stored on secure cloud infrastructure with industry-standard protections:',
        '• Encryption: All data in transit is encrypted using TLS 1.3. Sensitive data at rest (passwords, OTP codes) is encrypted using bcrypt/AES-256 hashing\n• Database Security: Our PostgreSQL databases use role-based access control, automated backups, and point-in-time recovery\n• Access Control: Internal access to user data is strictly limited to authorized personnel and requires multi-factor authentication\n• Audit Logging: All administrative actions (vote overrides, account suspensions, data exports) are logged in an immutable audit trail',
        'While we implement robust security measures, no system is 100% secure. We encourage users to use strong, unique passwords and to enable two-factor authentication when available.',
      ],
    },
    {
      id: 'data-sharing',
      icon: UserCheck,
      iconColor: 'text-teal-400',
      title: '6. Data Sharing & Third Parties',
      content: [
        'We share your data only in the following limited circumstances:',
        '• With Poll/Exam Creators: Response data, analytics, and (if configured) voter identity information is shared with the creator who set up the poll, survey, or exam\n• Google Drive Integration: When file upload is enabled for exams, uploaded files are stored directly in the Google Drive folder specified by the exam creator. Pollstar does not retain copies of uploaded files\n• Service Providers: We may use third-party infrastructure providers (hosting, email delivery, payment processing) that process data on our behalf under strict data processing agreements\n• Legal Compliance: We may disclose data if required by law, court order, or governmental regulation, or to protect our rights, safety, or property',
        'We do NOT sell personal data to advertisers, data brokers, or any other commercial third parties.',
      ],
    },
    {
      id: 'data-retention',
      icon: Clock,
      iconColor: 'text-orange-400',
      title: '7. Data Retention',
      content: [
        'We retain data for as long as necessary to provide the Service and fulfill the purposes outlined in this policy:',
        '• Active Account Data: Retained for the duration of your account\'s existence\n• Poll/Survey/Exam Responses: Retained until the creator deletes the activity or their account\n• OTP Codes: Automatically deleted 30 minutes after generation\n• Anti-Cheat Telemetry: Retained for 90 days after exam completion\n• Audit Logs: Retained for 12 months\n• Deleted Account Data: Permanently purged within 30 days of account deletion request',
        'Creators can delete individual polls, surveys, or exams at any time, which permanently removes all associated response data.',
      ],
    },
    {
      id: 'your-rights',
      icon: Fingerprint,
      iconColor: 'text-rose-400',
      title: '8. Your Privacy Rights',
      content: [
        'Depending on your jurisdiction, you may have the following rights regarding your personal data:',
        '• Right to Access: Request a copy of all personal data we hold about you\n• Right to Rectification: Request correction of inaccurate personal data\n• Right to Deletion: Request deletion of your account and associated data\n• Right to Portability: Request your data in a machine-readable format\n• Right to Object: Object to processing of your data for certain purposes\n• Right to Withdraw Consent: Withdraw consent for optional data processing at any time',
        'To exercise any of these rights, please contact us at support@pollstar.app with the subject line "Privacy Request". We will respond within 30 days.',
        'For participants who voted or took exams without a Pollstar account, please contact the poll/exam creator to request data modifications, as they are the data controller for their specific activity.',
      ],
    },
    {
      id: 'children',
      icon: Baby,
      iconColor: 'text-pink-400',
      title: '9. Children\'s Privacy',
      content: [
        'Pollstar is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13 without verifiable parental consent.',
        'If you are an educator using Pollstar with students under 13, you are responsible for obtaining appropriate parental consent and ensuring compliance with COPPA (Children\'s Online Privacy Protection Act) or equivalent local regulations.',
        'If we discover that we have inadvertently collected data from a child under 13 without proper consent, we will take steps to delete that information promptly. Please contact us at support@pollstar.app if you believe we have collected such data.',
      ],
    },
    {
      id: 'international',
      icon: Globe,
      iconColor: 'text-blue-400',
      title: '10. International Data Transfers',
      content: [
        'Pollstar\'s servers are located in India. If you access the Service from outside India, your data will be transferred to and processed in India.',
        'For users in the European Economic Area (EEA): We ensure adequate protection for your data through standard contractual clauses and by implementing appropriate technical and organizational security measures.',
        'For users in California (USA): Under the CCPA, you have the right to know what personal information we collect, to delete it, and to opt-out of its sale (we do not sell personal data).',
      ],
    },
    {
      id: 'breach',
      icon: FileWarning,
      iconColor: 'text-red-400',
      title: '11. Data Breach Notification',
      content: [
        'In the unlikely event of a data breach that affects your personal information, we will:',
        '• Notify affected users via email within 72 hours of discovering the breach\n• Provide details about the nature of the breach, the data affected, and steps we are taking to mitigate the impact\n• Report the breach to relevant supervisory authorities as required by applicable law\n• Offer guidance on steps you can take to protect yourself',
      ],
    },
    {
      id: 'changes',
      icon: RefreshCw,
      iconColor: 'text-violet-400',
      title: '12. Changes to This Policy',
      content: [
        'We may update this Privacy Policy from time to time. Material changes will be communicated via email to registered users and through a prominent notice on the platform.',
        'The "Last Updated" date at the top of this page indicates the most recent revision. We encourage you to review this policy periodically.',
      ],
    },
    {
      id: 'contact',
      icon: Mail,
      iconColor: 'text-emerald-400',
      title: '13. Contact Us',
      content: [
        'If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:',
        '• Email: support@pollstar.app\n• Contact Page: pollstar.app/contact\n• Registered Address: Kolkata, West Bengal, India',
        'For privacy-specific inquiries, please include "PRIVACY" in your email subject line for priority handling.',
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-gray-200">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.04] rounded-full blur-3xl pointer-events-none" />

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

      {/* Main Content */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-8 space-y-10 z-10">
        {/* Title Block */}
        <div className="space-y-4 border-b border-white/5 pb-8 text-center">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 w-fit mx-auto">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="font-outfit text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-gray-500 text-xs font-semibold">
            Last Updated: May 25, 2026 · Your privacy is our priority
          </p>
          <p className="text-gray-400 text-sm max-w-xl mx-auto leading-relaxed">
            This Privacy Policy explains how Pollstar collects, uses, stores, and protects your personal information. We believe in full transparency and give you control over your data.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-outfit text-sm font-bold text-white mb-3 uppercase tracking-wider">Table of Contents</h2>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-xs text-gray-500 hover:text-emerald-400 transition-colors py-1 flex items-center gap-1.5"
              >
                <span className="w-1 h-1 rounded-full bg-gray-700" />
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-sm leading-relaxed text-gray-400">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="space-y-4 scroll-mt-24">
              <h2 className="font-outfit text-lg font-bold text-white flex items-center space-x-2.5">
                <section.icon className={`w-5 h-5 ${section.iconColor} shrink-0`} />
                <span>{section.title}</span>
              </h2>
              {section.content.map((paragraph, idx) => (
                <p key={idx} className="whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
