'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';
import BrandLogo from '@/components/BrandLogo';
import {
  ArrowLeft, FileText, CheckCircle, Scale, AlertOctagon,
  Shield, Eye, Clock, RefreshCw, Ban, Globe, CreditCard,
  Gavel, Mail, Lock
} from 'lucide-react';

export default function TermsOfService() {
  const sections = [
    {
      id: 'agreement',
      icon: Scale,
      iconColor: 'text-indigo-400',
      title: '1. Agreement to Terms',
      content: [
        'By accessing or using the Pollstar platform ("Service"), including the website, APIs, embedded widgets, and mobile-optimized interfaces, you ("User") agree to be bound by these Terms of Service ("Terms").',
        'If you are using Pollstar on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms. If you do not agree to any part of these Terms, you must immediately stop using the Service.',
        'These Terms constitute a legally binding agreement between you and Pollstar. We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the revised Terms.',
      ],
    },
    {
      id: 'acceptable-use',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      title: '2. Acceptable Use Policy',
      content: [
        'You agree to use Pollstar only for lawful purposes and in accordance with these Terms. Specifically, you agree NOT to:',
        '• Use automated scripts, bots, or scraping tools to interact with the Service\n• Create fake accounts, impersonate others, or use proxy/VPN services to circumvent voter verification\n• Upload voter lists or contact databases obtained without proper consent\n• Use the platform to conduct harassment, spam, or distribute misleading content\n• Attempt to reverse-engineer, decompile, or extract source code from the Service\n• Use the exam/survey features to administer assessments that violate institutional academic integrity policies without proper authorization',
        'Poll, survey, and exam creators ("Creators") are solely responsible for ensuring that the content they create does not violate any local, national, or international laws. Creators warrant that all imported voter/participant lists are obtained ethically and with explicit consent.',
      ],
    },
    {
      id: 'accounts',
      icon: Lock,
      iconColor: 'text-cyan-400',
      title: '3. User Accounts & Registration',
      content: [
        'To create polls, surveys, or exams, you must register for an account. You agree to provide accurate, complete, and current information during registration and to keep your account credentials confidential.',
        'You are responsible for all activities that occur under your account. If you suspect unauthorized access, you must notify us immediately at support@pollstar.app.',
        'We reserve the right to suspend or terminate accounts that violate these Terms, display suspicious activity, or remain inactive for an extended period. Account termination may result in the deletion of all associated polls, responses, and data.',
      ],
    },
    {
      id: 'content',
      icon: FileText,
      iconColor: 'text-purple-400',
      title: '4. User Content & Intellectual Property',
      content: [
        'You retain ownership of all content you create on Pollstar, including poll questions, survey forms, exam materials, options, descriptions, and uploaded media ("User Content").',
        'By using the Service, you grant Pollstar a non-exclusive, worldwide, royalty-free license to store, process, display, and transmit your User Content solely for the purpose of providing and improving the Service.',
        'Pollstar does not claim ownership of your exam questions, survey responses, or poll results. However, we may use aggregated, anonymized usage data (e.g., total polls created, average response times) for platform analytics and marketing purposes.',
        'You must not upload copyrighted material without proper authorization. This includes images, text, music, or other media used in polls or exams that you do not have the right to use.',
      ],
    },
    {
      id: 'anti-fraud',
      icon: AlertOctagon,
      iconColor: 'text-pink-400',
      title: '5. Anti-Fraud & Integrity Measures',
      content: [
        'Pollstar employs multiple layers of fraud detection and prevention to maintain the integrity of every poll, survey, and exam conducted on the platform:',
        '• IP address monitoring and device fingerprinting to detect duplicate submissions\n• Geolocation verification to flag spoofed or suspicious voting locations\n• Browser and network anomaly detection\n• OTP (One-Time Password) email verification for closed voter lists\n• Tab-switch detection and full-screen enforcement for exam integrity\n• Time-based analysis to identify auto-fill scripts or bots',
        'Administrators and platform moderators reserve the right to invalidate suspicious responses, flag accounts, and override results when fraud is detected. All moderation actions are logged in an immutable audit trail.',
        'Creators who enable "Anti-Cheat Mode" for exams consent to the collection of tab-switch counts, browser focus events, and clipboard activity from examinees during the exam session.',
      ],
    },
    {
      id: 'exams',
      icon: Shield,
      iconColor: 'text-amber-400',
      title: '6. Exam & Assessment Terms',
      content: [
        'When using the Exam features, additional terms apply:',
        '• Exam creators are responsible for the accuracy and fairness of their questions, answer keys, and grading rubrics\n• Auto-grading is provided on a "best effort" basis for objective questions (MCQ, True/False, Fill-in-the-Blank). Pollstar is not liable for grading errors caused by ambiguous questions or incorrect answer keys set by creators\n• File uploads during exams are stored via Google Drive integration. Creators must provide a publicly accessible Drive folder link; Pollstar does not store uploaded files on its servers\n• AI-generated analytics, performance insights, and cheating probability reports are advisory only and should not be used as the sole basis for academic disciplinary actions',
        'Examinees consent to proctoring features (if enabled by the creator) including tab-switch tracking, full-screen enforcement, and time monitoring.',
      ],
    },
    {
      id: 'surveys',
      icon: Eye,
      iconColor: 'text-teal-400',
      title: '7. Survey & Data Collection Terms',
      content: [
        'Survey creators are responsible for complying with all applicable data protection regulations (including GDPR, CCPA, and FERPA) when collecting responses from participants.',
        'Anonymous surveys must not be reverse-engineered to identify respondents. Pollstar does not guarantee complete anonymity if the survey creator has configured identifying fields or restricted participant lists.',
        'Survey response data belongs to the survey creator. Pollstar will not access, sell, or share individual survey responses with third parties. However, survey responses may be processed by AI features (if enabled) for sentiment analysis, word cloud generation, and summary reports.',
      ],
    },
    {
      id: 'availability',
      icon: Clock,
      iconColor: 'text-orange-400',
      title: '8. Service Availability & Uptime',
      content: [
        'Pollstar strives to maintain 99.9% platform uptime. However, we do not guarantee uninterrupted, error-free service. Scheduled maintenance, infrastructure upgrades, and force majeure events may cause temporary service interruptions.',
        'We will make reasonable efforts to notify users in advance of planned maintenance that may affect active polls or exams. In the event of unplanned outages affecting ongoing exams, creators may extend exam deadlines through the dashboard.',
        'Pollstar is not liable for data loss, missed votes, or exam disruptions caused by factors beyond our control, including but not limited to: internet provider outages, browser incompatibilities, user device failures, or third-party service disruptions.',
      ],
    },
    {
      id: 'termination',
      icon: Ban,
      iconColor: 'text-red-400',
      title: '9. Termination & Account Deletion',
      content: [
        'You may delete your account at any time through the dashboard settings. Upon deletion, all your polls, surveys, exams, and associated response data will be permanently removed within 30 days.',
        'Pollstar reserves the right to suspend or terminate your account without prior notice if you:\n• Violate these Terms or our Acceptable Use Policy\n• Engage in fraudulent, abusive, or harmful behavior\n• Use the platform for illegal activities\n• Fail to respond to repeated warnings about policy violations',
        'Upon termination, your right to use the Service ceases immediately. Data associated with terminated accounts may be retained for a limited period for legal compliance and audit purposes.',
      ],
    },
    {
      id: 'payment',
      icon: CreditCard,
      iconColor: 'text-emerald-400',
      title: '10. Payment & Premium Features',
      content: [
        'Pollstar offers both free and premium subscription tiers. Free accounts have access to core features including unlimited polls, basic surveys, and standard exam capabilities.',
        'Premium subscriptions are billed on a monthly or annual basis. All payments are processed securely through our third-party payment processor. Prices are subject to change with 30 days advance notice.',
        'Refunds may be issued at our sole discretion for unused subscription periods. No refunds will be provided for partial months of usage or for accounts terminated due to Terms violations.',
      ],
    },
    {
      id: 'international',
      icon: Globe,
      iconColor: 'text-blue-400',
      title: '11. International Use',
      content: [
        'Pollstar is accessible globally. By using the Service from outside India, you consent to the transfer and processing of your data in India and other jurisdictions where our servers operate.',
        'You are solely responsible for ensuring that your use of Pollstar complies with local laws and regulations in your jurisdiction, including but not limited to data protection laws, election laws, and educational assessment regulations.',
      ],
    },
    {
      id: 'changes',
      icon: RefreshCw,
      iconColor: 'text-violet-400',
      title: '12. Changes to These Terms',
      content: [
        'Pollstar reserves the right to modify these Terms at any time. Material changes will be communicated via email notification to registered users and/or through a prominent banner on the platform.',
        'Your continued use of the Service following any changes constitutes acceptance of the updated Terms. If you disagree with any modification, you must discontinue use of the Service.',
      ],
    },
    {
      id: 'liability',
      icon: Gavel,
      iconColor: 'text-rose-400',
      title: '13. Limitation of Liability',
      content: [
        'TO THE MAXIMUM EXTENT PERMITTED BY LAW, POLLSTAR AND ITS DIRECTORS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.',
        'This includes but is not limited to: loss of data, loss of profits, exam score disputes, incorrect auto-grading results, survey data breaches caused by creator negligence, or service interruptions.',
        'Pollstar\'s total aggregate liability for any claim arising from or related to the Service shall not exceed the amount you have paid to Pollstar in the 12 months preceding the claim.',
      ],
    },
    {
      id: 'contact',
      icon: Mail,
      iconColor: 'text-emerald-400',
      title: '14. Contact Information',
      content: [
        'If you have any questions about these Terms, please contact us at:',
        '• Email: support@pollstar.app\n• Contact Page: pollstar.app/contact\n• Registered Address: Kolkata, West Bengal, India',
        'For urgent legal matters, please include "LEGAL" in the subject line of your email.',
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
        <Link href="/">
          <BrandLogo iconSize={22} textSize="text-2xl" />
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
            <FileText className="w-7 h-7" />
          </div>
          <h1 className="font-outfit text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-gray-500 text-xs font-semibold">
            Last Updated: May 25, 2026 · Effective immediately for all new and existing users
          </p>
          <p className="text-gray-400 text-sm max-w-xl mx-auto leading-relaxed">
            Please read these Terms carefully before using Pollstar. By accessing or using any part of the platform, you acknowledge that you have read, understood, and agree to be bound by these Terms.
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
