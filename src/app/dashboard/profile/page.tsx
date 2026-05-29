'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Vote, LogOut, Loader2, User, Phone, Briefcase, GraduationCap, School, 
  FlaskConical, HelpCircle, Check, AlertTriangle, ShieldCheck, FileText, 
  ExternalLink, Send, ArrowRight, Calendar, Edit2, X
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';

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

  // Edit Profile States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // 2FA Security states
  const [toggling2FA, setToggling2FA] = useState(false);
  const [toggling2FAMSG, setToggling2FAMSG] = useState('');

  const handleToggle2FA = async () => {
    if (!user) return;
    setToggling2FA(true);
    setToggling2FAMSG('');
    try {
      const nextVal = !user.twoFactorEnabled;
      const res = await fetch('/api/auth/toggle-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twoFactorEnabled: nextVal })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update security settings.');
      
      setUser((prev: any) => ({ ...prev, twoFactorEnabled: nextVal }));
      setToggling2FAMSG(nextVal ? '2-Step Verification activated! 🔒' : '2-Step Verification deactivated.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setToggling2FA(false);
    }
  };

  // Edit fields
  const [fullName, setFullName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [primaryPurpose, setPrimaryPurpose] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  const [institution, setInstitution] = useState('');
  const [studyField, setStudyField] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [educatorSubject, setEducatorSubject] = useState('');
  const [educatorDept, setEducatorDept] = useState('');
  const [researchDomain, setResearchDomain] = useState('');
  const [researchPos, setResearchPos] = useState('');
  const [otherDetail, setOtherDetail] = useState('');

  const handleOpenEditProfile = () => {
    if (!user) return;
    setFullName(user.fullName || '');
    setSelectedAvatar(user.avatar || 'avatar-boy');
    setPhoneNumber(user.phoneNumber || '');
    setGender(user.gender || '');
    setPrimaryPurpose(user.primaryPurpose || '');
    setOccupation(user.occupation || '');
    setBio(user.bio || '');
    setInstitution(user.institution || '');
    setStudyField(user.studyField || '');
    setGradYear(user.gradYear ? user.gradYear.toString() : '');
    setJobTitle(user.jobTitle || '');
    setIndustry(user.industry || '');
    setEducatorSubject(user.educatorSubject || '');
    setEducatorDept(user.educatorDept || '');
    setResearchDomain(user.researchDomain || '');
    setResearchPos(user.researchPos || '');
    setOtherDetail(user.otherDetail || '');
    
    setEditError('');
    setEditSuccess('');
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    
    if (!fullName.trim()) {
      setEditError('Please enter your full name');
      return;
    }
    if (!selectedAvatar) {
      setEditError('Please choose a profile avatar');
      return;
    }
    if (!phoneNumber.trim()) {
      setEditError('Please enter a valid phone number');
      return;
    }
    if (!gender) {
      setEditError('Please select your gender');
      return;
    }
    if (!primaryPurpose) {
      setEditError('Please select your primary usage purpose');
      return;
    }
    if (!occupation) {
      setEditError('Please select your occupation role');
      return;
    }

    // Verify occupation specific inputs
    if (occupation === 'STUDENT' && (!institution.trim() || !studyField.trim() || !gradYear)) {
      setEditError('Please complete all student credential fields');
      return;
    }
    if (occupation === 'PROFESSIONAL' && (!institution.trim() || !jobTitle.trim() || !industry.trim())) {
      setEditError('Please complete all professional details');
      return;
    }
    if (occupation === 'EDUCATOR' && (!institution.trim() || !educatorDept.trim() || !educatorSubject.trim())) {
      setEditError('Please complete all school & subject credentials');
      return;
    }
    if (occupation === 'RESEARCHER' && (!institution.trim() || !researchDomain.trim() || !researchPos.trim())) {
      setEditError('Please complete all researcher details');
      return;
    }
    if (occupation === 'OTHER' && !otherDetail.trim()) {
      setEditError('Please specify your current occupation/role details');
      return;
    }

    setEditLoading(true);
    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          avatar: selectedAvatar,
          phoneNumber,
          gender,
          primaryPurpose,
          occupation,
          bio,
          institution: ['STUDENT', 'PROFESSIONAL', 'EDUCATOR', 'RESEARCHER'].includes(occupation) ? institution : null,
          studyField: occupation === 'STUDENT' ? studyField : null,
          gradYear: occupation === 'STUDENT' ? gradYear : null,
          jobTitle: occupation === 'PROFESSIONAL' ? jobTitle : null,
          industry: occupation === 'PROFESSIONAL' ? industry : null,
          educatorSubject: occupation === 'EDUCATOR' ? educatorSubject : null,
          educatorDept: occupation === 'EDUCATOR' ? educatorDept : null,
          researchDomain: occupation === 'RESEARCHER' ? researchDomain : null,
          researchPos: occupation === 'RESEARCHER' ? researchPos : null,
          otherDetail: occupation === 'OTHER' ? otherDetail : null,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile details.');
      }

      setEditSuccess('Profile details successfully updated.');
      await loadProfile(); // Refresh profile details
      setTimeout(() => {
        setShowEditModal(false);
      }, 800);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

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
      <DashboardHeader user={user} />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 space-y-8 relative">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="font-outfit text-2xl font-bold text-white">Creator Settings</h2>
            <p className="text-gray-400 text-sm mt-0.5">Manage your credentials, verify your identity, and inspect account statuses.</p>
          </div>
          <button
            onClick={handleOpenEditProfile}
            className="px-4 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 self-start sm:self-auto"
          >
            <Edit2 className="w-4 h-4 text-indigo-200" />
            <span>Edit Profile Details</span>
          </button>
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

            {/* Security Settings: 2FA */}
            <div className="glass-card rounded-3xl p-6 border border-white/5 bg-[#080d1a] space-y-4">
              <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <h3 className="font-outfit text-base font-bold text-white">🔒 Security Controls</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-gray-200 font-bold block">2-Step Verification (Optional)</span>
                    <p className="text-gray-500 text-[10px] leading-relaxed">Require a 6-digit OTP code sent to your email on every login attempt.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input 
                      type="checkbox" 
                      checked={user?.twoFactorEnabled || false} 
                      onChange={handleToggle2FA}
                      disabled={toggling2FA}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>
                
                {toggling2FAMSG && (
                  <p className="text-[10px] text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1.5 rounded-xl">{toggling2FAMSG}</p>
                )}
              </div>
            </div>

            {/* Logo and Favicon Downloads */}
            <div className="glass-card rounded-3xl p-6 border border-white/5 bg-[#080d1a] space-y-4">
              <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="font-outfit text-base font-bold text-white">🎨 Brand Assets Downloads</h3>
              </div>

              <div className="space-y-3.5 text-xs text-gray-400">
                <p className="leading-relaxed text-[11px] text-gray-500">Download high-fidelity official Pollstar brand assets to embed on your voting pages, email rosters, or presentations.</p>
                
                <div className="flex items-center justify-between p-2.5 bg-white/2 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-[#0b0f19] border border-white/5 p-1 flex items-center justify-center font-black text-emerald-400 text-[10px]">Logo</div>
                    <div>
                      <span className="text-white block font-bold text-[11px]">Official Logo</span>
                      <span className="text-[9px] text-gray-500">High-Res PNG</span>
                    </div>
                  </div>
                  <a 
                    href="/logo.png" 
                    download="pollstar_logo.png"
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold transition-all"
                  >
                    Download
                  </a>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white/2 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-[#0b0f19] border border-white/5 p-1 flex items-center justify-center font-black text-indigo-400 text-[10px]">Icon</div>
                    <div>
                      <span className="text-white block font-bold text-[11px]">Favicon Icon</span>
                      <span className="text-[9px] text-gray-500">Standard PNG</span>
                    </div>
                  </div>
                  <a 
                    href="/favicon.png" 
                    download="pollstar_favicon.png"
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold transition-all"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── EDIT PROFILE MODAL ─────────────────────────────────────────── */}
        {showEditModal && (
          <div className="fixed inset-0 bg-[#020612]/95 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in animate-duration-300">
            <div className="glass-card rounded-3xl border border-white/10 p-6 md:p-8 max-w-2xl w-full bg-[#080d1a] relative max-h-[90vh] overflow-y-auto space-y-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all p-1 bg-white/5 rounded-lg border border-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest block">Account Settings</span>
                <h4 className="text-white text-lg font-bold mt-1">Edit Creator Profile</h4>
                <p className="text-gray-400 text-xs mt-0.5">Modify your demographic credentials, avatar illustrations, and biography details.</p>
              </div>

              {editError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {editSuccess && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{editSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Avatar Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Choose Cartoon Avatar Illustration</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(AVATARS).map(([id, info]) => {
                      const isSelected = selectedAvatar === id;
                      return (
                        <div
                          key={id}
                          onClick={() => setSelectedAvatar(id)}
                          className={`p-2 rounded-2xl border cursor-pointer transition-all flex flex-col items-center gap-2 ${
                            isSelected 
                              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5' 
                              : 'border-white/5 bg-white/2 hover:border-white/10'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${info.bg} p-0.5 flex items-center justify-center`}>
                            <img src={info.src} alt={info.name} className="w-full h-full object-cover rounded-lg" />
                          </div>
                          <span className="text-[10px] text-gray-300 font-semibold">{info.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Legal Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/60 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +1 555-0199"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/60 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Gender Selection</label>
                    <select
                      value={gender}
                      required
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500/60 transition-all"
                    >
                      <option value="" disabled>-- Select Gender --</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Primary Usage Intended</label>
                    <select
                      value={primaryPurpose}
                      required
                      onChange={(e) => setPrimaryPurpose(e.target.value)}
                      className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500/60 transition-all"
                    >
                      <option value="" disabled>-- Select Intended Primary Usage --</option>
                      <option value="POLLS">Creating interactive real-time polls</option>
                      <option value="SURVEYS">Deploying demographic multi-page surveys</option>
                      <option value="EXAMS">Conducting dynamic exams with AI grading</option>
                      <option value="OTHER">Personal or academic other uses</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Occupation Category</label>
                    <select
                      value={occupation}
                      required
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500/60 transition-all"
                    >
                      <option value="" disabled>-- Select Occupation --</option>
                      <option value="STUDENT">Student</option>
                      <option value="PROFESSIONAL">Industry Professional</option>
                      <option value="EDUCATOR">Educator / Academician</option>
                      <option value="RESEARCHER">Scientific Researcher</option>
                      <option value="OTHER">Other Role</option>
                    </select>
                  </div>
                </div>

                {/* Occupation Specific Fields */}
                {occupation && occupation !== 'OTHER' && (
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest block">Occupation Credentials</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {occupation === 'STUDENT' ? 'University / School' : 'Institution / Company Name'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Stanford University, Google"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/60 transition-all"
                        />
                      </div>

                      {occupation === 'STUDENT' && (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Field of Study</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Computer Science"
                              value={studyField}
                              onChange={(e) => setStudyField(e.target.value)}
                              className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/60 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Graduation Year</label>
                            <input
                              type="number"
                              required
                              placeholder="e.g. 2027"
                              value={gradYear}
                              onChange={(e) => setGradYear(e.target.value)}
                              className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/60 transition-all"
                            />
                          </div>
                        </>
                      )}

                      {occupation === 'PROFESSIONAL' && (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Job Title</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Senior Software Engineer"
                              value={jobTitle}
                              onChange={(e) => setJobTitle(e.target.value)}
                              className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/60 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Industry Sector</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Technology, Healthcare"
                              value={industry}
                              onChange={(e) => setIndustry(e.target.value)}
                              className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/60 transition-all"
                            />
                          </div>
                        </>
                      )}

                      {occupation === 'EDUCATOR' && (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Subject Taught</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Calculus, Physics"
                              value={educatorSubject}
                              onChange={(e) => setEducatorSubject(e.target.value)}
                              className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/60 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Department Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. School of Engineering"
                              value={educatorDept}
                              onChange={(e) => setEducatorDept(e.target.value)}
                              className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/60 transition-all"
                            />
                          </div>
                        </>
                      )}

                      {occupation === 'RESEARCHER' && (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Research Domain</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Machine Learning, BioTech"
                              value={researchDomain}
                              onChange={(e) => setResearchDomain(e.target.value)}
                              className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/60 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Research Position</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Postdoctoral Fellow"
                              value={researchPos}
                              onChange={(e) => setResearchPos(e.target.value)}
                              className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/60 transition-all"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {occupation === 'OTHER' && (
                  <div className="space-y-1.5 pt-4 border-t border-white/5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Specify Occupation Details</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Freelance Creator, Hobbyist"
                      value={otherDetail}
                      onChange={(e) => setOtherDetail(e.target.value)}
                      className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/60 transition-all"
                    />
                  </div>
                )}

                <div className="space-y-1.5 pt-4 border-t border-white/5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Short Creator Biography</label>
                  <textarea
                    placeholder="Tell us a little bit about yourself, your survey goals, or your specialized field..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full bg-white/3 border border-white/10 text-white placeholder-gray-500 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500/60 resize-none transition-all"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 border border-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 py-3 gradient-btn text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
