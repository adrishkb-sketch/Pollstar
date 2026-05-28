'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';
import {
  ArrowLeft, Vote, Target, Eye, Lightbulb, Users, Globe2,
  Shield, Zap, Heart, BookOpen, BarChart3, Award, Sparkles,
  GraduationCap, Building2, TrendingUp
} from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { value: '10K+', label: 'Polls Created', icon: BarChart3 },
    { value: '500K+', label: 'Votes Cast', icon: Vote },
    { value: '120+', label: 'Countries', icon: Globe2 },
    { value: '99.9%', label: 'Uptime', icon: Zap },
  ];

  const values = [
    {
      icon: Shield,
      title: 'Integrity First',
      description: 'Every vote matters. Our anti-fraud systems and transparent audit trails ensure that results reflect genuine choices — no manipulation, no duplicates.',
      color: 'emerald',
    },
    {
      icon: Eye,
      title: 'Radical Transparency',
      description: 'From real-time live results to detailed analytics dashboards, we believe that full visibility builds trust between creators and participants.',
      color: 'cyan',
    },
    {
      icon: Lightbulb,
      title: 'Continuous Innovation',
      description: 'Quadratic voting, AI-powered insights, sentiment analysis — we constantly push boundaries to make decision-making more intelligent and fair.',
      color: 'purple',
    },
    {
      icon: Users,
      title: 'Accessibility for All',
      description: 'Whether you\'re a small classroom or a large enterprise, Pollstar is designed to be intuitive, mobile-friendly, and accessible to everyone.',
      color: 'amber',
    },
    {
      icon: Heart,
      title: 'Community Driven',
      description: 'Our roadmap is shaped by our users. Feature requests, feedback, and bug reports from the community drive every update we ship.',
      color: 'pink',
    },
    {
      icon: BookOpen,
      title: 'Education Empowerment',
      description: 'Built with educators in mind — from timed exams with auto-grading to gradebooks and detailed performance analytics for every student.',
      color: 'indigo',
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400' },
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
  };

  const useCases = [
    { icon: GraduationCap, label: 'Education & Classrooms', desc: 'Exams, quizzes, attendance, and student feedback' },
    { icon: Building2, label: 'Corporate & Teams', desc: 'Team polls, engagement surveys, and decision votes' },
    { icon: TrendingUp, label: 'Research & Analytics', desc: 'Academic studies, market research, and public opinion' },
    { icon: Award, label: 'Events & Competitions', desc: 'Live audience voting, contests, and award ceremonies' },
  ];

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

      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-6 pt-12 pb-16 text-center z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Our Story</span>
        </div>
        <h1 className="font-outfit text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
          The Platform That Makes<br className="hidden sm:inline" />
          <span className="gradient-text"> Every Voice Count</span>
        </h1>
        <p className="text-gray-400 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
          Pollstar was born from a simple frustration — existing polling tools were either too basic, too insecure, or too ugly.
          We set out to build the most comprehensive, secure, and beautifully designed voting platform on the internet.
        </p>
      </section>

      {/* Stats Row */}
      <section className="w-full max-w-5xl mx-auto px-6 pb-16 z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card rounded-2xl p-6 text-center">
              <stat.icon className="w-6 h-6 text-emerald-400 mx-auto mb-3" />
              <p className="font-outfit text-2xl sm:text-3xl font-extrabold text-white mb-1">
                {stat.value}
              </p>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="w-full max-w-5xl mx-auto px-6 pb-16 z-10">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-8 sm:p-10">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 w-fit mb-5">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="font-outfit text-2xl font-bold text-white mb-4">Our Mission</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              To democratize decision-making by providing the world&apos;s most powerful, secure, and accessible
              polling and assessment platform. We believe every organization — from a single classroom to a
              multinational enterprise — deserves tools that ensure fair, transparent, and engaging participation.
            </p>
          </div>
          <div className="glass-card rounded-2xl p-8 sm:p-10">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400 w-fit mb-5">
              <Eye className="w-6 h-6" />
            </div>
            <h2 className="font-outfit text-2xl font-bold text-white mb-4">Our Vision</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              A world where gathering opinions, conducting exams, and running surveys is effortless, inclusive,
              and fraud-proof. We envision Pollstar as the standard for digital democratic participation — used
              in classrooms, boardrooms, and communities across every continent.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="w-full max-w-5xl mx-auto px-6 pb-16 z-10">
        <h2 className="font-outfit text-3xl font-bold text-white text-center mb-3">Our Core Values</h2>
        <p className="text-gray-500 text-sm text-center mb-10 max-w-xl mx-auto">
          The principles that guide every line of code we write and every feature we ship.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {values.map((val) => {
            const c = colorMap[val.color];
            return (
              <div key={val.title} className="glass-card rounded-2xl p-7 hover:border-white/10 transition-all">
                <div className={`p-3 ${c.bg} rounded-2xl border ${c.border} ${c.text} w-fit mb-4`}>
                  <val.icon className="w-5 h-5" />
                </div>
                <h3 className="font-outfit text-lg font-bold text-white mb-2">{val.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{val.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Use Cases */}
      <section className="w-full max-w-5xl mx-auto px-6 pb-16 z-10">
        <h2 className="font-outfit text-3xl font-bold text-white text-center mb-3">Who Uses Pollstar?</h2>
        <p className="text-gray-500 text-sm text-center mb-10 max-w-xl mx-auto">
          Trusted by educators, companies, researchers, and event organizers around the globe.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {useCases.map((uc) => (
            <div key={uc.label} className="glass-card rounded-2xl p-6 text-center hover:border-white/10 transition-all">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 mx-auto w-fit mb-4">
                <uc.icon className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-outfit text-base font-bold text-white mb-1.5">{uc.label}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{uc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="w-full max-w-3xl mx-auto px-6 pb-20 text-center z-10">
        <div className="glass-card rounded-3xl p-10 sm:p-14 border border-emerald-500/10">
          <h2 className="font-outfit text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-400 text-sm mb-8 max-w-lg mx-auto">
            Join thousands of educators and teams already using Pollstar to make smarter decisions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="gradient-btn px-8 py-3.5 rounded-xl font-bold text-white text-sm flex items-center gap-2"
            >
              Create Free Account
              <Sparkles className="w-4 h-4" />
            </Link>
            <Link
              href="/features"
              className="px-8 py-3.5 rounded-xl font-semibold text-gray-300 hover:text-white border border-white/10 hover:bg-white/5 text-sm transition-all"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
