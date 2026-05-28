'use client';

import { useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import {
  ArrowLeft, Vote, Mail, MessageSquare, MapPin, Clock, Phone,
  Send, Sparkles, HelpCircle, ChevronDown, ChevronUp, Check
} from 'lucide-react';

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // 🎯 Advertising Inquiry States
  const [companyName, setCompanyName] = useState('');
  const [targetAudience, setTargetAudience] = useState('General Public');
  const [adFormats, setAdFormats] = useState({ desktop: true, tablet: false, mobile: false });
  const [monthlyBudget, setMonthlyBudget] = useState('< $500/mo');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let compiledMessage = formState.message;
    if (formState.subject === 'Advertise with Us') {
      const chosenFormats = Object.keys(adFormats).filter(k => (adFormats as any)[k]).join(', ');
      compiledMessage += `\n\n--- 🎯 ADVERTISING INQUIRY DETAILS ---\n• Company Name: ${companyName}\n• Target Audience: ${targetAudience}\n• Formats Wanted: ${chosenFormats}\n• Monthly Budget: ${monthlyBudget}`;
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formState,
          message: compiledMessage
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      setSubmitted(true);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email Us',
      value: 'support@pollstar.app',
      description: 'We usually respond within 24 hours',
      color: 'emerald',
    },
    {
      icon: MapPin,
      label: 'Headquarters',
      value: 'Kolkata, India',
      description: 'Building the future of voting',
      color: 'cyan',
    },
    {
      icon: Clock,
      label: 'Support Hours',
      value: 'Mon–Sat, 9 AM – 9 PM IST',
      description: 'Weekend emergencies covered',
      color: 'purple',
    },
    {
      icon: Phone,
      label: 'Call Us',
      value: '+91 (XXX) XXX-XXXX',
      description: 'Business enquiries only',
      color: 'amber',
    },
  ];

  const faqs = [
    {
      question: 'Is Pollstar free to use?',
      answer: 'Yes! Pollstar offers a generous free tier that includes unlimited polls, surveys, and basic exam features. Premium features like AI analytics, advanced anti-cheat, and custom branding are available on paid plans.',
    },
    {
      question: 'How do I report a bug or suggest a feature?',
      answer: 'You can use the "Raise an Issue" button available on every page, send us an email at support@pollstar.app, or use the contact form on this page. We actively review every submission.',
    },
    {
      question: 'Can I use Pollstar for large-scale elections?',
      answer: 'Absolutely. Pollstar is designed for scale — from a 10-person classroom to a 100,000-person organization. Our infrastructure handles concurrent voters with real-time result updates.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Security is our top priority. We use industry-standard encryption, secure OTP verification, IP-based fraud detection, and complete audit trails. Read our Privacy Policy for full details.',
    },
    {
      question: 'Do you offer custom enterprise solutions?',
      answer: 'Yes. For organizations that need custom branding, dedicated support, SSO integration, or on-premise deployment, reach out to us via the contact form and we will arrange a consultation.',
    },
    {
      question: 'Can students upload files in exams?',
      answer: 'Yes! Exam creators can enable file uploads through Google Drive integration. Students upload directly to a shared Drive folder — keeping your server load minimal while allowing rich submissions.',
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-gray-200">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/[0.04] rounded-full blur-3xl pointer-events-none" />

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
        <section className="w-full max-w-5xl mx-auto px-6 pt-12 pb-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Get In Touch</span>
          </div>
          <h1 className="font-outfit text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4">
            We&apos;d Love to <span className="gradient-text">Hear From You</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Have a question, need support, or want to discuss enterprise solutions? Reach out and our team will get back to you promptly.
          </p>
        </section>

        {/* Contact Info Cards */}
        <section className="w-full max-w-5xl mx-auto px-6 pb-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {contactInfo.map((info) => {
              const c = colorMap[info.color];
              return (
                <div key={info.label} className="glass-card rounded-2xl p-5 text-center">
                  <div className={`p-2.5 ${c.bg} rounded-xl border ${c.border} ${c.text} mx-auto w-fit mb-3`}>
                    <info.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-outfit text-sm font-bold text-white mb-1">{info.label}</h3>
                  <p className="text-emerald-400 text-xs font-semibold mb-1">{info.value}</p>
                  <p className="text-gray-600 text-[10px]">{info.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact Form + FAQ */}
        <section className="w-full max-w-5xl mx-auto px-6 pb-16">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="glass-card rounded-2xl p-8">
              <h2 className="font-outfit text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                Send Us a Message
              </h2>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 mx-auto w-fit mb-5">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="font-outfit text-xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Thank you for reaching out. We will get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormState({ name: '', email: '', subject: '', message: '' });
                    }}
                    className="text-emerald-400 text-sm font-semibold hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        placeholder="Your name"
                        className="glass-input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
                      <input
                        type="email"
                        required
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        placeholder="you@example.com"
                        className="glass-input w-full text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Subject</label>
                    <select
                      required
                      value={formState.subject}
                      onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                      className="glass-input w-full text-sm bg-[#030712]"
                    >
                      <option value="">-- Select a Subject --</option>
                      <option value="General Inquiries & Feedback">General Inquiries & Feedback</option>
                      <option value="Creator Platform Assistance">Creator Platform Assistance</option>
                      <option value="Enterprise Upgrade Inquiries">Enterprise Upgrade Inquiries</option>
                      <option value="Advertise with Us">Advertise with Us (Monetization Slots)</option>
                    </select>
                  </div>

                  {formState.subject === 'Advertise with Us' && (
                    <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-4 animate-slide-in">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block border-b border-emerald-500/10 pb-1.5">
                        🎯 Advertising Inquiry Details
                      </span>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-gray-400">Company / Brand Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Acme Corp"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            className="glass-input w-full text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-gray-400">Target Audience Focus</label>
                          <select
                            value={targetAudience}
                            onChange={e => setTargetAudience(e.target.value)}
                            className="glass-input w-full text-sm bg-[#030712]"
                          >
                            <option value="General Public">General Public</option>
                            <option value="Students & Educators">Students & Educators</option>
                            <option value="Developer Community">Developer Community</option>
                            <option value="Enterprise Teams">Enterprise Teams</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-gray-400">Ad Formats Wanted</label>
                          <div className="flex gap-4 pt-1">
                            {['desktop', 'tablet', 'mobile'].map(formatKey => {
                              const isChecked = (adFormats as any)[formatKey];
                              return (
                                <div
                                  key={formatKey}
                                  onClick={() => setAdFormats({ ...adFormats, [formatKey]: !isChecked })}
                                  className="flex items-center space-x-1.5 cursor-pointer select-none"
                                >
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                    isChecked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-white/20 bg-white/3'
                                  }`}>
                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <span className="text-xs text-gray-300 capitalize">{formatKey}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-gray-400">Estimated Monthly Ad Budget</label>
                          <select
                            value={monthlyBudget}
                            onChange={e => setMonthlyBudget(e.target.value)}
                            className="glass-input w-full text-sm bg-[#030712]"
                          >
                            <option value="< $500/mo">&lt; $500/mo</option>
                            <option value="$500 - $2,000/mo">$500 - $2,000/mo</option>
                            <option value="$2,000 - $5,000/mo">$2,000 - $5,000/mo</option>
                            <option value="> $5,000/mo">&gt; $5,000/mo</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                      placeholder="Tell us everything..."
                      className="glass-input w-full text-sm resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="gradient-btn w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                </form>
              )}
            </div>

            {/* FAQ */}
            <div>
              <h2 className="font-outfit text-xl font-bold text-white mb-6 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="glass-card rounded-xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <span className="text-sm font-semibold text-white pr-4">{faq.question}</span>
                      {openFaq === idx ? (
                        <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                      )}
                    </button>
                    {openFaq === idx && (
                      <div className="px-4 pb-4 pt-0">
                        <p className="text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
