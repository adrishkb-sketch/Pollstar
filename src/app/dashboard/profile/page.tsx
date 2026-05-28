'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Vote, LogOut, Loader2, User, Phone, Briefcase, GraduationCap, School, 
  FlaskConical, HelpCircle, Check, AlertTriangle, ShieldCheck, FileText, 
  ExternalLink, Send, ArrowRight, Calendar
} from 'lucide-react';

const AVATARS: Record<string, { name: string; src: string; bg: string }> = {
  'avatar-boy': { name: 'Joyful Boy', src: '/avatars/avatar-boy.png', bg: 'from-blue-500 to-indigo-600' },
  'avatar-girl': { name: 'Cheerful Girl', src: '/avatars/avatar-girl.png', bg: 'from-pink-500 to-rose-600' },
  'avatar-ninja': { name: 'Playful Ninja', src: '/avatars/avatar-ninja.png', bg: 'from-red-500 to-rose-600' },
  'avatar-astronaut': { name: 'Curious Astro', src: '/avatars/avatar-astronaut.png', bg: 'from-purple-500 to-indigo-600' },
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
      if (data.user.verificationDocUrl) {
        setDocUrl(data.user.verificationDocUrl);
      }
    } catch (err) {
      setError('Failed to sync profile status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleApplyVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!docUrl.trim()) {
      setError('Please provide a Google Drive document URL.');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch('/api/auth/apply-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationDocUrl: docUrl })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit verification request.');
      }
      setSuccessMsg('Your verification document has been submitted successfully.');
      await loadProfile(); // Reload user state
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="text-gray-400 text-sm mt-4 font-semibold">Syncing Creator Profile...</span>
      </div>
    );
  }

  const avatarInfo = AVATARS[user?.avatar || 'avatar-boy'] || AVATARS['avatar-boy'];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#030712]">
      {/* Header */}
      <header className="w-full border-b border-white/5 bg-[#080d1a]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                <Vote className="w-6 h-6" />
              </div>
              <span className="font-outfit text-xl font-bold tracking-tight text-white">
                Poll<span className="text-indigo-400">star</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/5">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-gray-400 hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/profile"
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-white bg-indigo-600/90 shadow"
              >
                My Profile
              </Link>
              <Link
                href="/dashboard/plans"
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-gray-400 hover:text-white"
              >
                Plans & Features
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-white flex items-center justify-end gap-1.5">
                {user?.fullName || user?.email}
                {user?.isVerifiedUser && (
                  <span className="inline-flex items-center justify-center p-0.5 bg-blue-500 text-white rounded-full" title="Verified Creator">
                    <Check className="w-2.5 h-2.5 stroke-[4]" />
                  </span>
                )}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                {user?.role === 'ADMIN' ? '👑 SYSTEM ADMIN' : 'CREATOR'}
              </span>
            </div>
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:text-white transition-all"
              >
                Admin Control
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 space-y-8 relative">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <h2 className="font-outfit text-2xl font-bold text-white">Creator Settings</h2>
          <p className="text-gray-400 text-sm mt-0.5">Manage your credentials, verify your identity, and inspect account statuses.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Details Card */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass-card rounded-3xl p-6 border border-white/5 space-y-6 bg-[#080d1a]">
              <div className="flex items-center space-x-4 pb-6 border-b border-white/5">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${avatarInfo.bg} p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/10`}>
                  <img src={avatarInfo.src} alt={avatarInfo.name} className="w-full h-full object-cover rounded-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                    {user?.fullName || 'Anonymous Creator'}
                    {user?.isVerifiedUser && (
                      <span className="inline-flex items-center justify-center p-0.5 bg-blue-500 text-white rounded-full" title="Verified Creator">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{user?.email}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1.5 bg-white/5 border border-white/5 rounded px-2 py-0.5 inline-block">
                    {user?.occupation || 'No Occupation Set'}
                  </p>
                </div>
              </div>

              {/* Bio block */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Creator Biography</h4>
                <p className="text-sm text-gray-300 leading-relaxed bg-white/2 border border-white/5 p-4 rounded-xl whitespace-pre-wrap">
                  {user?.bio || 'No biography written.'}
                </p>
              </div>

              {/* Detailed credentials */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Demographic Credentials</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center space-x-3">
                    <User className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold block uppercase">Gender</span>
                      <span className="text-xs text-white font-medium">{user?.gender || 'Not Specified'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold block uppercase">Phone Number</span>
                      <span className="text-xs text-white font-medium">{user?.phoneNumber || 'Not Specified'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center space-x-3">
                    <Briefcase className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold block uppercase">Institution / Company</span>
                      <span className="text-xs text-white font-medium">{user?.institution || 'Not Specified'}</span>
                    </div>
                  </div>

                  {user?.occupation === 'STUDENT' && (
                    <>
                      <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center space-x-3">
                        <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-gray-500 font-bold block uppercase">Field of Study</span>
                          <span className="text-xs text-white font-medium">{user?.studyField || 'Not Specified'}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-gray-500 font-bold block uppercase">Graduation Year</span>
                          <span className="text-xs text-white font-medium">{user?.gradYear || 'Not Specified'}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {user?.occupation === 'PROFESSIONAL' && (
                    <>
                      <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center space-x-3">
                        <Briefcase className="w-4 h-4 text-purple-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-gray-500 font-bold block uppercase">Job Title</span>
                          <span className="text-xs text-white font-medium">{user?.jobTitle || 'Not Specified'}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center space-x-3">
                        <School className="w-4 h-4 text-purple-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-gray-500 font-bold block uppercase">Industry</span>
                          <span className="text-xs text-white font-medium">{user?.industry || 'Not Specified'}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {user?.occupation === 'EDUCATOR' && (
                    <>
                      <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center space-x-3">
                        <School className="w-4 h-4 text-purple-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-gray-500 font-bold block uppercase">Subject Taught</span>
                          <span className="text-xs text-white font-medium">{user?.educatorSubject || 'Not Specified'}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center space-x-3">
                        <School className="w-4 h-4 text-purple-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-gray-500 font-bold block uppercase">Department</span>
                          <span className="text-xs text-white font-medium">{user?.educatorDept || 'Not Specified'}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {user?.occupation === 'RESEARCHER' && (
                    <>
                      <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center space-x-3">
                        <FlaskConical className="w-4 h-4 text-purple-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-gray-500 font-bold block uppercase">Research Domain</span>
                          <span className="text-xs text-white font-medium">{user?.researchDomain || 'Not Specified'}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center space-x-3">
                        <FlaskConical className="w-4 h-4 text-purple-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-gray-500 font-bold block uppercase">Research Position</span>
                          <span className="text-xs text-white font-medium">{user?.researchPos || 'Not Specified'}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {user?.occupation === 'OTHER' && (
                    <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center space-x-3 sm:col-span-2">
                      <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold block uppercase">Details</span>
                        <span className="text-xs text-white font-medium">{user?.otherDetail || 'Not Specified'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Verification Apply Cards (Right side) */}
          <div className="space-y-6">
            <div className="glass-card rounded-3xl p-6 border border-white/5 bg-[#080d1a] space-y-6">
              <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-outfit text-base font-bold text-white">Blue Badge Verification</h3>
              </div>

              {/* DYNAMIC VERIFICATION STATUSES */}
              {user?.verificationStatus === 'UNAPPLIED' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-gray-400 text-xs leading-relaxed space-y-2">
                    <p className="font-bold text-white">Why apply for verification?</p>
                    <p>Verified creators display a trusted blue badge check mark next to their names on public portals to establish voting session authenticity.</p>
                  </div>

                  <form onSubmit={handleApplyVerification} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> ID Proof Link (Google Drive)
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://drive.google.com/..."
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        className="w-full bg-white/3 border border-white/8 hover:border-white/15 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                      />
                      <p className="text-[9px] text-gray-500 leading-relaxed">
                        Please upload a copy of your Student/Employee photo ID proof to Google Drive, make the link public/accessible, and paste it above.
                      </p>
                    </div>

                    {error && (
                      <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {successMsg && (
                      <div className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>{successMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="w-full py-2.5 rounded-xl gradient-btn text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Apply For Verification</span>
                    </button>
                  </form>
                </div>
              )}

              {user?.verificationStatus === 'PENDING' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                    <div>
                      <h4 className="font-outfit text-sm font-bold text-white">Review In Progress</h4>
                      <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                        Your verification application is currently pending admin review.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 bg-white/2 border border-white/5 p-3 rounded-xl">
                    <span className="text-[9px] text-gray-500 font-bold block uppercase">Submitted Document Link</span>
                    <a
                      href={user.verificationDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>View Uploaded Proof</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {user?.verificationStatus === 'VERIFIED' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>
                    <div>
                      <h4 className="font-outfit text-sm font-bold text-white">Account Verified</h4>
                      <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                        Congratulations! Your creator status has been verified by the administrator.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white/2 border border-white/5 p-3.5 rounded-xl">
                    <span className="text-xs font-semibold text-gray-400">Verification Tick</span>
                    <span className="px-3 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      ACTIVE
                    </span>
                  </div>
                </div>
              )}

              {user?.verificationStatus === 'REJECTED' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-2">
                    <div className="flex items-center space-x-2 text-red-400 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Application Rejected</span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Your previous verification application was rejected by the admin.
                    </p>
                    {user.verificationReason && (
                      <div className="p-2.5 bg-red-500/10 border border-red-500/10 rounded-lg text-red-300 text-xs italic font-medium">
                        Reason: "{user.verificationReason}"
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleApplyVerification} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Re-apply ID Proof Link
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://drive.google.com/..."
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        className="w-full bg-white/3 border border-white/8 hover:border-white/15 focus:border-indigo-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                      />
                    </div>

                    {error && (
                      <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {successMsg && (
                      <div className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>{successMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Re-submit Application</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Moderation Warnings status */}
            <div className="glass-card rounded-3xl p-6 border border-white/5 bg-[#080d1a] space-y-4">
              <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-outfit text-base font-bold text-white">Platform Privilege Status</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Activity Restrictions</span>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                    user?.isActivityRestricted 
                      ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                      : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  }`}>
                    {user?.isActivityRestricted ? 'RESTRICTED' : 'ACTIVE'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Account Subscription Plan</span>
                  <span className="px-2 py-0.5 rounded font-bold uppercase text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    {user?.plan?.name || 'Free'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
