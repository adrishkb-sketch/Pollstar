'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Rocket, Shield, PenTool, FlaskConical, ChefHat, Search, BookOpen, Trophy, 
  User, Phone, Briefcase, GraduationCap, School, MapPin, Award, CheckCircle2,
  Loader2, AlertTriangle, ChevronRight, HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

const AVATARS = [
  { id: 'avatar-boy', name: 'Joyful Boy', src: '/avatars/avatar-boy.png', bg: 'from-blue-500 to-indigo-600' },
  { id: 'avatar-girl', name: 'Cheerful Girl', src: '/avatars/avatar-girl.png', bg: 'from-pink-500 to-rose-600' },
  { id: 'avatar-ninja', name: 'Playful Ninja', src: '/avatars/avatar-ninja.png', bg: 'from-red-500 to-rose-600' },
  { id: 'avatar-astronaut', name: 'Curious Astro', src: '/avatars/avatar-astronaut.png', bg: 'from-purple-500 to-indigo-600' },
];

const PUBLIC_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'yandex.ru', 'mail.ru', 'zoho.com', 'protonmail.com', 'proton.me'];

function inferInstitution(email: string): string {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length < 2) return '';
  const domain = parts[1].toLowerCase();
  
  if (domain.endsWith('.edu') || domain.endsWith('.ac.in') || domain.endsWith('.edu.in') || domain.endsWith('.edu.co')) {
    let base = domain.replace(/(\.edu|\.ac\.in|\.edu\.in|\.edu\.co)/g, '');
    const baseParts = base.split('.');
    let name = baseParts[baseParts.length - 1];
    if (name.length <= 4) {
      return name.toUpperCase();
    }
    return name.charAt(0).toUpperCase() + name.slice(1) + " University";
  }

  if (!PUBLIC_DOMAINS.includes(domain)) {
    let name = domain.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  return '';
}

export default function Onboarding() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Page Step: 1 = Basic Info, 2 = Occupation Details, 3 = Short Bio
  const [step, setStep] = useState(1);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  const [primaryPurpose, setPrimaryPurpose] = useState('');

  // Occupation-specific fields
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

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.user.profileCompleted) {
          router.push('/dashboard');
          return;
        }
        setUserEmail(data.user.email);
        
        // Auto-fill institution based on edu/ac.in/company domain
        const autoFilledInst = inferInstitution(data.user.email);
        if (autoFilledInst) {
          setInstitution(autoFilledInst);
        }
      } catch (err) {
        setError('Failed to initialize onboarding session.');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, []);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!selectedAvatar) {
      setError('Please choose a profile avatar');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Please enter a valid phone number');
      return;
    }
    if (!gender) {
      setError('Please select your gender');
      return;
    }
    if (!primaryPurpose) {
      setError('Please select what you will primarily use Pollstar for');
      return;
    }

    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!occupation) {
      setError('Please select your occupation role');
      return;
    }

    // Verify occupation specific inputs
    if (occupation === 'STUDENT' && (!institution.trim() || !studyField.trim() || !gradYear)) {
      setError('Please complete all student credential fields');
      return;
    }
    if (occupation === 'PROFESSIONAL' && (!institution.trim() || !jobTitle.trim() || !industry.trim())) {
      setError('Please complete all professional details');
      return;
    }
    if (occupation === 'EDUCATOR' && (!institution.trim() || !educatorDept.trim() || !educatorSubject.trim())) {
      setError('Please complete all school & subject credentials');
      return;
    }
    if (occupation === 'RESEARCHER' && (!institution.trim() || !researchDomain.trim() || !researchPos.trim())) {
      setError('Please complete all researcher details');
      return;
    }
    if (occupation === 'OTHER' && !otherDetail.trim()) {
      setError('Please specify your current occupation/role details');
      return;
    }

    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitLoading(true);

    if (!bio.trim() || bio.length < 10) {
      setError('Please write a short bio of at least 10 characters.');
      setSubmitLoading(false);
      return;
    }

    const payload = {
      fullName,
      avatar: selectedAvatar,
      phoneNumber,
      occupation,
      gender,
      institution,
      studyField,
      gradYear: gradYear ? parseInt(gradYear, 10) : null,
      jobTitle,
      industry,
      educatorSubject,
      educatorDept,
      researchDomain,
      researchPos,
      otherDetail,
      bio,
      primaryPurpose,
    };

    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete profile onboarding.');
      }

      // Confetti celebration
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        <span className="text-gray-400 text-sm mt-4 font-semibold">Loading Profile Gateway...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden">
      
      {/* Glow backgrounds */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl z-10 space-y-8">
        
        {/* Step Indicator Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center space-x-2 mb-3">
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] uppercase font-bold tracking-widest">
              Step {step} of 3
            </span>
            <span className="text-gray-600 text-xs">•</span>
            <span className="text-gray-400 text-xs">Profile Completion</span>
          </div>
          <h2 className="font-outfit text-3xl font-extrabold text-white">Complete Your Account</h2>
          <p className="text-gray-400 text-sm max-w-md mt-1.5 leading-relaxed">
            Configure your professional profiles to begin launching secure polls and custom surveys.
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-3xl p-8 border border-white/5 shadow-2xl">
          {error && (
            <div className="flex items-center space-x-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs mb-6">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: BASIC INFORMATION */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Adrish Banerjee"
                      className="w-full !pl-12 glass-input text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full !pl-12 glass-input text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="w-full bg-[#080c16] border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="" disabled>-- Select Gender --</option>
                    <option value="Male">👨 Male</option>
                    <option value="Female">👩 Female</option>
                    <option value="Non-binary">⚧ Non-binary</option>
                    <option value="Prefer not to say">🤫 Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    Primary Usage Purpose
                  </label>
                  <select
                    value={primaryPurpose}
                    onChange={(e) => setPrimaryPurpose(e.target.value)}
                    required
                    className="w-full bg-[#080c16] border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="" disabled>-- What will you primarily use Pollstar for? --</option>
                    <option value="POLLS">🗳️ Creating interactive real-time polls</option>
                    <option value="SURVEYS">📋 Deploying demographic multi-page surveys</option>
                    <option value="EXAMS">📝 Conducting dynamic exams with AI grading</option>
                    <option value="OTHER">🏢 Personal, organizational, or academic other uses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    Choose Your Avatar
                  </label>
                  <div className="grid grid-cols-4 gap-3 pt-1">
                    {AVATARS.map((av) => {
                      const isSelected = selectedAvatar === av.id;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setSelectedAvatar(av.id)}
                          className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all border ${
                            isSelected 
                              ? 'bg-purple-500/10 border-purple-500 shadow-lg shadow-purple-500/10 scale-105' 
                              : 'bg-white/2 border-white/5 hover:bg-white/5 hover:border-white/10'
                          }`}
                          title={av.name}
                        >
                          <div className={`w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-tr ${av.bg} p-0.5 flex items-center justify-center shadow-md`}>
                            <img src={av.src} alt={av.name} className="w-full h-full object-cover rounded-lg" />
                          </div>
                          <span className="text-[9px] text-gray-400 font-bold mt-1.5">{av.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm flex items-center justify-center space-x-2 hover:opacity-95 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                >
                  <span>Continue Credentials</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PROFESSIONAL / OCCUPATION CREDENTIALS */}
          {step === 2 && (
            <form onSubmit={handleNextStep2} className="space-y-6 animate-fade-in">
              <div className="space-y-5">
                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    What best describes your current occupation?
                  </label>
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    required
                    className="w-full bg-[#080c16] border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="" disabled>-- Select Occupation Role --</option>
                    <option value="STUDENT">🎓 Student (School / College / University)</option>
                    <option value="PROFESSIONAL">💼 Corporate Professional / Employee</option>
                    <option value="EDUCATOR">🏫 Academic Educator / Professor</option>
                    <option value="RESEARCHER">🔬 Academic Researcher / Scientist</option>
                    <option value="OTHER">⚙️ Other Occupations</option>
                  </select>
                </div>

                {/* STUDENT ADDITIONAL FIELDS */}
                {occupation === 'STUDENT' && (
                  <div className="space-y-4 p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 animate-fade-in-up">
                    <div className="flex items-center space-x-2 text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">
                      <GraduationCap className="w-4 h-4" />
                      <span>Student Academic Details</span>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                        Institution / University Name
                      </label>
                      <input
                        type="text"
                        required
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="e.g. IIT Beleghata"
                        className="w-full glass-input text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                          Field of Study
                        </label>
                        <input
                          type="text"
                          required
                          value={studyField}
                          onChange={(e) => setStudyField(e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="w-full glass-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                          Expected Graduation Year
                        </label>
                        <input
                          type="number"
                          required
                          value={gradYear}
                          onChange={(e) => setGradYear(e.target.value)}
                          placeholder="e.g. 2027"
                          min="2020"
                          max="2035"
                          className="w-full glass-input text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PROFESSIONAL ADDITIONAL FIELDS */}
                {occupation === 'PROFESSIONAL' && (
                  <div className="space-y-4 p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 animate-fade-in-up">
                    <div className="flex items-center space-x-2 text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">
                      <Briefcase className="w-4 h-4" />
                      <span>Professional Work Details</span>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                        Company / Organization Name
                      </label>
                      <input
                        type="text"
                        required
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="e.g. Google LLC"
                        className="w-full glass-input text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                          Job Title
                        </label>
                        <input
                          type="text"
                          required
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="e.g. Product Manager"
                          className="w-full glass-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                          Industry Sector
                        </label>
                        <input
                          type="text"
                          required
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder="e.g. Tech, Healthcare"
                          className="w-full glass-input text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* EDUCATOR ADDITIONAL FIELDS */}
                {occupation === 'EDUCATOR' && (
                  <div className="space-y-4 p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 animate-fade-in-up">
                    <div className="flex items-center space-x-2 text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">
                      <School className="w-4 h-4" />
                      <span>Educator Institutional Details</span>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                        School / College Name
                      </label>
                      <input
                        type="text"
                        required
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="e.g. Harvard High School"
                        className="w-full glass-input text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          required
                          value={educatorDept}
                          onChange={(e) => setEducatorDept(e.target.value)}
                          placeholder="e.g. Mathematics"
                          className="w-full glass-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                          Subject Taught
                        </label>
                        <input
                          type="text"
                          required
                          value={educatorSubject}
                          onChange={(e) => setEducatorSubject(e.target.value)}
                          placeholder="e.g. Algebra & Calculus"
                          className="w-full glass-input text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* RESEARCHER ADDITIONAL FIELDS */}
                {occupation === 'RESEARCHER' && (
                  <div className="space-y-4 p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 animate-fade-in-up">
                    <div className="flex items-center space-x-2 text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">
                      <FlaskConical className="w-4 h-4" />
                      <span>Researcher Institutional Details</span>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                        Research Center / Lab Name
                      </label>
                      <input
                        type="text"
                        required
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="e.g. CERN or IIT Beleghata Research Institute"
                        className="w-full glass-input text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                          Research Domain
                        </label>
                        <input
                          type="text"
                          required
                          value={researchDomain}
                          onChange={(e) => setResearchDomain(e.target.value)}
                          placeholder="e.g. Quantum Physics"
                          className="w-full glass-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                          Research Position
                        </label>
                        <input
                          type="text"
                          required
                          value={researchPos}
                          onChange={(e) => setResearchPos(e.target.value)}
                          placeholder="e.g. Postdoctoral Fellow"
                          className="w-full glass-input text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* OTHER ADDITIONAL FIELDS */}
                {occupation === 'OTHER' && (
                  <div className="space-y-4 p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 animate-fade-in-up">
                    <div className="flex items-center space-x-2 text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">
                      <HelpCircle className="w-4 h-4" />
                      <span>Specify Custom Occupation</span>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                        Please specify your exact occupation details
                      </label>
                      <input
                        type="text"
                        required
                        value={otherDetail}
                        onChange={(e) => setOtherDetail(e.target.value)}
                        placeholder="e.g. Freelance Journalist, Independent Consultant"
                        className="w-full glass-input text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-4 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-xl font-semibold border border-white/5 bg-white/5 text-gray-300 text-sm hover:text-white"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3.5 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm flex items-center justify-center space-x-2 hover:opacity-95 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                >
                  <span>Continue Bio</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: BIO SUMMARY & ONBOARDING SUBMISSION */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                    Write a short biography about yourself
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a bit about yourself, what you plan to use Pollstar for, or your organizational goals..."
                    className="w-full glass-input text-sm p-4 resize-none leading-relaxed"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-semibold">
                    <span>Write at least 10 characters.</span>
                    <span className={bio.length >= 10 ? 'text-emerald-400' : 'text-amber-500'}>
                      {bio.length} characters typed
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3.5 rounded-xl font-semibold border border-white/5 bg-white/5 text-gray-300 text-sm hover:text-white"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || bio.length < 10}
                  className="flex-[2] py-3.5 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-emerald-500 text-white text-sm flex items-center justify-center space-x-2 hover:opacity-95 shadow-lg shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Profile & Finish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
