'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, CheckCircle, Loader2 } from 'lucide-react';

export default function RaiseIssueButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageUrl(window.location.href);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim() || !description.trim()) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/support/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, description, pageUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit support request.');
      }

      setSuccess(true);
      setEmail('');
      setDescription('');
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center space-x-1.5 border border-red-400/20 font-bold text-xs"
        title="Report an Issue"
        id="raise-issue-floating-btn"
      >
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">Raise Issue</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-[#020612]/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="glass-card rounded-3xl border border-white/10 p-6 max-w-md w-full bg-[#080d1a] relative shadow-2xl space-y-5">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <h2 className="font-outfit text-lg font-bold text-white">Raise Platform Issue</h2>
              </div>
              <p className="text-gray-400 text-xs ml-10.5">
                Experiencing glitches, errors, or bugs? Tell us about it, and we will get back to you!
              </p>
            </div>

            {success ? (
              <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-3 animate-pulse-glow">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <div>
                  <h4 className="font-outfit text-sm font-bold text-white">Issue Registered</h4>
                  <p className="text-gray-400 text-xs mt-1">
                    Thank you! We've received your submission.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Contact Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/3 border border-white/8 hover:border-white/15 focus:border-red-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Describe the Problem</label>
                  <textarea
                    required
                    placeholder="Provide details of the bug, issue, or feedback..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-white/3 border border-white/8 hover:border-white/15 focus:border-red-500/60 rounded-xl p-4 text-xs text-white placeholder-gray-500 outline-none transition-all resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-gray-500 font-bold block uppercase">Pre-filled Page Url Reference</span>
                  <div className="bg-white/2 border border-white/5 rounded-lg px-2.5 py-1.5 text-[9px] text-gray-400 font-mono truncate">
                    {pageUrl}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>Report Ticket</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
