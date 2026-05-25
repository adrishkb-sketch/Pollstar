'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle, Scale, AlertOctagon } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col justify-between relative bg-[#030712] text-gray-200">
      
      {/* Background Ambience glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-16 space-y-10 z-10">
        
        {/* Navigation */}
        <Link 
          href="/" 
          className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-white transition-all group"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>

        {/* Title Block */}
        <div className="space-y-4 border-b border-white/5 pb-8">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 w-fit">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="font-outfit text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-gray-500 text-xs font-semibold">
            Last Updated: May 25, 2026
          </p>
        </div>

        {/* Content Details */}
        <div className="space-y-8 text-sm leading-relaxed text-gray-400">
          
          <section className="space-y-3">
            <h2 className="font-outfit text-lg font-bold text-white flex items-center space-x-2">
              <Scale className="w-4.5 h-4.5 text-indigo-400" />
              <span>1. Agreement to Terms</span>
            </h2>
            <p>
              By accessing or using the Pollstar application, you consent to be legally bound by these terms. 
              If you disagree with any segment of these clauses, you must suspend your access to our voting dashboards 
              and poll administration tools immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-outfit text-lg font-bold text-white flex items-center space-x-2">
              <CheckCircle className="w-4.5 h-4.5 text-purple-400" />
              <span>2. Acceptable Platform Use</span>
            </h2>
            <p>
              Voters agree to utilize verification identifiers owned strictly by them and refrain from using 
              temporary email servers, location masking proxies, or automated scripts. Poll creators represent 
              and warrant that all voter databases uploaded or spreadsheet lists imported are acquired legally and ethically.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-outfit text-lg font-bold text-white flex items-center space-x-2">
              <AlertOctagon className="w-4.5 h-4.5 text-pink-400" />
              <span>3. Anti-Fraud & Account Audits</span>
            </h2>
            <p>
              Our systems actively monitor ballot actions for network collisions, ISP abnormalities, and device duplicate 
              manipulation. Administrators hold absolute authority to override ballots, reject spoofed geolocations, 
              and suspend accounts violating these conditions with logged trail audits.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-outfit text-lg font-bold text-white flex items-center space-x-2">
              <span>4. Disclaimer of Warranties</span>
            </h2>
            <p>
              Pollstar provides services on an "as is" and "as available" basis. While we offer real-time synchronizations 
              and cryptographic voter shields, we make no absolute guarantees against sudden localized service downtimes 
              caused by regional internet provider outages.
            </p>
          </section>

        </div>

      </div>

      {/* Footer */}
      <footer className="w-full max-w-3xl mx-auto px-6 py-8 border-t border-white/5 text-center text-gray-600 text-xs z-10">
        © 2026 Pollstar. Guaranteed secure digital democratic solutions.
      </footer>

    </div>
  );
}
