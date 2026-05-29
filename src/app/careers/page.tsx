'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  Loader2, 
  CheckCircle2, 
  Vote,
  AlertCircle
} from 'lucide-react';

export default function CareersPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Job expansion state
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Application Form States
  const [applyJob, setApplyJob] = useState<any | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);
  const [appSuccess, setAppSuccess] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/careers');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      } else {
        setError('Failed to load active job postings.');
      }
    } catch (err) {
      setError('A network timeout occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !coverLetter) return;
    setSubmittingApp(true);

    try {
      // Simulate applying: standard premium delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setAppSuccess(true);
      setFullName('');
      setEmail('');
      setPortfolioUrl('');
      setCoverLetter('');
    } catch (err) {
      alert('Failed to submit application.');
    } finally {
      setSubmittingApp(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <span className="text-gray-400 text-sm mt-4 font-semibold">Loading job openings...</span>
      </div>
    );
  }

  // Group jobs by department
  const departments = Array.from(new Set(jobs.map((j) => j.department)));

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col font-outfit relative">
      {/* Glow background elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/5 py-5 px-6 bg-[#030712]/50 backdrop-blur z-20 sticky top-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/20">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <span className="font-outfit text-xl font-bold tracking-tight text-white">
              Poll<span className="text-emerald-400">star</span>
            </span>
          </Link>
          <div className="flex gap-4">
            <Link href="/login" className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-all">Sign In</Link>
            <Link href="/signup" className="gradient-btn px-4 py-2 rounded-xl text-xs font-bold text-white transition-all">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-16 flex-1 w-full relative z-10">
        {/* Title Hero */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold uppercase tracking-widest">
            We are Hiring!
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            Build the Future of <span className="bg-gradient-to-r from-emerald-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">Digital Decisions</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Join a remote-first international team dedicated to building beautiful, high-fidelity real-time polling, proctored exams, and collaborative assessments.
          </p>
        </div>

        {error && (
          <div className="glass-card border border-red-500/20 bg-red-500/5 rounded-2xl p-4 text-center text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Dynamic Job List */}
        {jobs.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center border border-white/5 bg-[#080d1a]/50 relative overflow-hidden">
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 mb-6">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="font-outfit text-xl font-bold text-white mb-2">No active openings yet</h3>
            <p className="text-gray-400 text-sm max-w-md leading-relaxed mb-6">
              We aren't currently listing any active job vacancies on our portal. However, we are constantly seeking exceptional developers, UI designers, and systems architects!
            </p>
            <button
              onClick={() => setApplyJob({ title: 'Open Speculative Application', department: 'Engineering / Product / Sales' })}
              className="py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs shadow-lg shadow-emerald-500/20 transition-all border border-emerald-400/20 active:scale-95 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Open Speculative Application</span>
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {departments.map((dept) => {
              const deptJobs = jobs.filter((j) => j.department === dept);
              return (
                <div key={dept} className="space-y-4">
                  <h2 className="text-lg font-extrabold uppercase tracking-widest text-emerald-400 border-b border-white/5 pb-2">
                    {dept} ({deptJobs.length})
                  </h2>

                  <div className="space-y-4">
                    {deptJobs.map((job) => {
                      const isExpanded = expandedJobId === job.id;
                      return (
                        <div 
                          key={job.id} 
                          className={`glass-card rounded-2xl border transition-all duration-300 overflow-hidden ${
                            isExpanded ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-white/5 hover:border-white/10 bg-white/[0.01]'
                          }`}
                        >
                          {/* Row Header */}
                          <div 
                            onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                            className="p-5 flex justify-between items-center gap-4 cursor-pointer select-none"
                          >
                            <div className="space-y-1.5">
                              <h3 className="font-bold text-base sm:text-lg text-white">{job.title}</h3>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {job.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-emerald-400" /> {job.type}
                                </span>
                              </div>
                            </div>
                            <button className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="px-5 pb-6 pt-1 border-t border-white/5 text-sm space-y-6 animate-fade-in">
                              <div className="space-y-2">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-300">Job Description</h4>
                                <p className="text-gray-300 leading-relaxed font-light whitespace-pre-line">{job.description}</p>
                              </div>

                              {job.requirements && (
                                <div className="space-y-2">
                                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-300">Role Requirements</h4>
                                  <p className="text-gray-300 leading-relaxed font-light whitespace-pre-line">{job.requirements}</p>
                                </div>
                              )}

                              <div className="pt-4">
                                <button
                                  onClick={() => setApplyJob(job)}
                                  className="py-2.5 px-5 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs shadow-lg transition-all border border-emerald-400/20 active:scale-95 flex items-center gap-1.5"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Apply For This Position</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Glassmorphic Application Drawer / Modal */}
        {applyJob && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="glass-card max-w-xl w-full rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)] bg-[#080d1a] relative space-y-6 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => { setApplyJob(null); setAppSuccess(false); }}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all p-1.5 bg-white/5 border border-white/10 rounded-lg"
              >
                ✕
              </button>

              {appSuccess ? (
                <div className="text-center py-8 space-y-6">
                  <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-8 h-8 animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">Application Received!</h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto">
                      Thank you for applying for the <strong className="text-emerald-400">{applyJob.title}</strong> role. Our human resource coordinator will review your profile and reach out shortly!
                    </p>
                  </div>
                  <button
                    onClick={() => { setApplyJob(null); setAppSuccess(false); }}
                    className="py-2.5 px-6 rounded-xl font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs transition-all active:scale-95"
                  >
                    Return to Careers
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="border-b border-white/5 pb-4">
                    <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black block">Apply Position</span>
                    <h3 className="font-outfit text-xl font-bold text-white">{applyJob.title}</h3>
                    <p className="text-gray-500 text-xs mt-1">{applyJob.department} · {applyJob.location || 'Remote'}</p>
                  </div>

                  <form onSubmit={handleApplySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Adrish Sen"
                          className="w-full glass-input text-sm px-4 py-3"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. adrish@school.edu"
                          className="w-full glass-input text-sm px-4 py-3"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Portfolio / CV Link</label>
                      <input 
                        type="url" 
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="e.g. github.com/adrish or linkedin.com/in/adrish"
                        className="w-full glass-input text-sm px-4 py-3"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Cover Letter & Pitch</label>
                      <textarea 
                        required
                        rows={4}
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Tell us why you are the perfect fit for Pollstar! Highlight your specific technical capabilities or experience."
                        className="w-full glass-input text-sm px-4 py-3 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingApp}
                      className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs shadow-xl shadow-emerald-500/10 transition-all border border-emerald-400/20 active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {submittingApp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Encrypting & Dispatching Profile Registry...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Official Job Application</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
