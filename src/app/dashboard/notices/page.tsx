'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Megaphone, 
  Loader2, 
  Clock, 
  Tag, 
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';

interface Notice {
  id: string;
  title: string;
  content: string;
  targetType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  publishedAt: string;
  referencedNoticeId?: string;
  referencedNotice?: Notice | null;
}

export default function NoticesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Toggled sections for tagged referenced notices
  const [expandedMentions, setExpandedMentions] = useState<Record<string, boolean>>({});

  const fetchNoticesAndUser = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);

      const noticesRes = await fetch('/api/notices');
      if (noticesRes.ok) {
        const noticesData = await noticesRes.json();
        setNotices(noticesData.notices || []);
      } else {
        throw new Error('Failed to fetch announcements feed.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred fetching notices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoticesAndUser();
  }, []);

  const toggleMention = (noticeId: string) => {
    setExpandedMentions(prev => ({ ...prev, [noticeId]: !prev[noticeId] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="text-gray-400 text-sm mt-4 font-semibold">Loading official announcements...</span>
      </div>
    );
  }

  const borderColors = {
    HIGH: 'border-red-500/30 bg-red-500/[0.02] text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.05)]',
    MEDIUM: 'border-amber-500/20 bg-amber-500/[0.01] text-amber-400',
    LOW: 'border-indigo-500/20 bg-indigo-500/[0.01] text-indigo-400',
  };

  const tagColors = {
    HIGH: 'bg-red-500/10 border-red-500/20 text-red-300',
    MEDIUM: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    LOW: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#030712]">
      {/* Header */}
      <DashboardHeader user={user} />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 space-y-8 relative">
        <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Back and Title */}
        <div className="space-y-4">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white font-bold uppercase transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="space-y-1">
            <h2 className="font-outfit text-2xl font-bold text-white flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-indigo-400" />
              <span>📣 Official Announcements Feed</span>
            </h2>
            <p className="text-gray-400 text-sm mt-0.5 leading-relaxed">
              Stay up-to-date with official platform notifications, scheduled maintenance alerts, verification updates, and special feature releases.
            </p>
          </div>
        </div>

        {error && (
          <div className="glass-card border border-red-500/20 bg-red-500/5 rounded-2xl p-4 text-center text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Timeline View */}
        <div className="space-y-6">
          {notices.length === 0 ? (
            <div className="glass-card rounded-3xl border border-white/5 bg-[#080d1a] p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-white text-base font-bold font-outfit">No Active Announcements</h3>
              <p className="text-gray-500 text-xs leading-relaxed max-w-sm mx-auto">
                Announcements targeted to your plan or verification status will display permanently on this feed. Please check back later!
              </p>
            </div>
          ) : (
            <div className="relative border-l border-white/5 ml-4 pl-6 space-y-6">
              {notices.map((n) => {
                const priorityClass = borderColors[n.priority as keyof typeof borderColors] || borderColors.LOW;
                const tagClass = tagColors[n.priority as keyof typeof tagColors] || tagColors.LOW;
                
                return (
                  <div key={n.id} className="relative group">
                    {/* Timeline bullet dot */}
                    <div className="absolute -left-[31px] top-5 w-2.5 h-2.5 rounded-full border border-[#030712] bg-indigo-500 group-hover:scale-125 transition-transform" />
                    
                    <div className={`glass-card rounded-3xl p-6 border transition-all duration-300 bg-[#080d1a] ${priorityClass} ${
                      n.priority === 'HIGH' ? 'animate-pulse-glow border-red-500/20' : ''
                    }`}>
                      <div className="space-y-4">
                        {/* Notice Header details */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-outfit text-base font-bold text-white tracking-tight leading-snug">{n.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${tagClass}`}>
                              {n.priority} PRIORITY
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            <span>{new Date(n.publishedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</span>
                          </div>
                        </div>

                        {/* Description content */}
                        <p className="text-gray-300 text-xs leading-relaxed max-w-3xl whitespace-pre-wrap font-medium">
                          {n.content}
                        </p>

                        {/* Nested Tagged Mentions */}
                        {n.referencedNotice && (
                          <div className="border border-white/5 bg-black/40 rounded-2xl overflow-hidden mt-3">
                            <button
                              onClick={() => toggleMention(n.id)}
                              className="w-full px-4 py-2.5 text-left text-[10px] text-purple-300 font-bold hover:bg-white/5 transition-all flex items-center justify-between"
                            >
                              <span className="flex items-center gap-1.5">
                                🔗 Mentions Announcement: "{n.referencedNotice.title}"
                              </span>
                              {expandedMentions[n.id] ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {expandedMentions[n.id] && (
                              <div className="p-4 border-t border-white/5 bg-black/50 space-y-2 animate-fade-in">
                                <div className="flex justify-between items-center text-[8px] text-purple-400 font-extrabold uppercase tracking-wider">
                                  <span>Priority: {n.referencedNotice.priority}</span>
                                  <span>Date: {new Date(n.referencedNotice.publishedAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-400 text-[11px] leading-relaxed whitespace-pre-wrap italic">
                                  {n.referencedNotice.content}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Audience footer info */}
                        <div className="flex items-center gap-1.5 text-[9px] text-gray-600 font-bold uppercase tracking-wider pt-1">
                          <Tag className="w-3 h-3 text-gray-600" />
                          <span>Target Audience: {n.targetType === 'ALL' ? 'Everyone' : n.targetType === 'REGISTERED' ? 'All Registered Users' : `${n.targetType} Members`}</span>
                        </div>
                      </div>
                    </div>
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
