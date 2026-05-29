'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Vote, 
  Sparkles, 
  Loader2, 
  ArrowLeft 
} from 'lucide-react';

export default function PublicCareersPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/admin/careers');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedJobId(expandedJobId === id ? null : id);
  };

  const getJobTypeLabel = (type: string) => {
    const mapping: Record<string, string> = {
      FULL_TIME: 'Full-time',
      PART_TIME: 'Part-time',
      CONTRACT: 'Contract',
      INTERNSHIP: 'Internship'
    };
    return mapping[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        <span className="text-gray-400 text-xs mt-4 font-mono tracking-widest uppercase">Syncing openings...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col font-outfit relative overflow-hidden">
      {/* Background ambient elements */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/5 py-5 px-6 bg-[#030712]/50 backdrop-blur z-20 sticky top-0">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/20">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <span className="font-outfit text-xl font-bold tracking-tight text-white">
              Poll<span className="text-emerald-400">star</span>
            </span>
          </Link>
          <Link 
            href="/"
            className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-16 flex-1 w-full space-y-12 relative z-10">
        {/* Title */}
        <div className="text-center space-y-4 max-w-lg mx-auto">
          <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-extrabold uppercase tracking-widest">
            Careers at Pollstar
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Build the Future of <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Decision Intelligence</span>
          </h1>
          <p className="text-gray-400 text-xs leading-relaxed">
            We are a high-octane engineering team building electoral-grade security protocols, live geotargeting, and next-generation analytical frameworks.
          </p>
        </div>

        {/* Job Listings List */}
        <div className="space-y-6">
          <h2 className="text-base font-extrabold tracking-wider text-indigo-400 uppercase font-mono border-b border-white/5 pb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span>Active Openings</span>
          </h2>

          {jobs.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 border border-white/5 bg-[#080d1a]/50 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto text-gray-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-white">No active job listings</h3>
                <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
                  Currently, there are no active openings at Pollstar. However, we are always on the lookout for stellar talent! Drop us a note or report feedback to stay on our radar.
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all shadow-md shadow-purple-600/20"
              >
                Get in Touch
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const isExpanded = expandedJobId === job.id;
                return (
                  <div 
                    key={job.id}
                    className={`glass-card rounded-2xl border transition-all duration-300 ${
                      isExpanded 
                        ? 'border-purple-500/20 bg-purple-950/[0.03] shadow-lg shadow-purple-600/[0.02]' 
                        : 'border-white/5 bg-[#080d1a]/40 hover:bg-[#080d1a]/80'
                    }`}
                  >
                    {/* Header Summary */}
                    <div 
                      onClick={() => toggleExpand(job.id)}
                      className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="space-y-2 text-left">
                        <span className="text-[9px] font-extrabold uppercase font-mono tracking-widest text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                          {job.department}
                        </span>
                        <h3 className="font-bold text-sm text-white font-outfit">{job.title}</h3>
                        
                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{job.location}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{getJobTypeLabel(job.type)}</span>
                          </span>
                        </div>
                      </div>

                      <button className="p-2 hover:bg-white/5 rounded-xl text-gray-400 transition-colors shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Expanded Bounding details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-3 border-t border-white/5 space-y-4 text-left animate-slide-down">
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-wider">Role Overview</h4>
                          <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                            {job.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <span className="text-[10px] text-gray-500 font-mono">Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                          <a
                            href={`mailto:careers@pollstar.com?subject=Application for ${encodeURIComponent(job.title)}`}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/15"
                          >
                            Apply for Role
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
