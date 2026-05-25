'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye } from 'lucide-react';

export default function PrivacyPolicy() {
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
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-outfit text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-gray-500 text-xs font-semibold">
            Last Updated: May 25, 2026
          </p>
        </div>

        {/* Content Details */}
        <div className="space-y-8 text-sm leading-relaxed text-gray-400">
          
          <section className="space-y-3">
            <h2 className="font-outfit text-lg font-bold text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>1. Data We Collect</span>
            </h2>
            <p>
              Pollstar collects only the necessary information to verify voter eligibility and ensure 
              the integrity of voting results. This includes email addresses, voter identifiers (such as Roll Numbers 
              where configured by poll creators), dynamic geolocations, IP addresses, and basic browser information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-outfit text-lg font-bold text-white flex items-center space-x-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <span>2. How We Use Your Information</span>
            </h2>
            <p>
              We utilize collected parameters to protect polls against malicious attacks, multiple vote submissions 
              from the same device, and location spoofing. Geolocation records are used exclusively to chart voter 
              distributions on analytical maps for poll creators and administrators.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-outfit text-lg font-bold text-white flex items-center space-x-2">
              <Shield className="w-4 h-4 text-pink-400" />
              <span>3. Data Storage & Protection</span>
            </h2>
            <p>
              All answers, OTP verifications, and voter details are secured using robust encryption protocols 
              and persistent database clustering. We maintain full transparency through admin audit log files 
              tracking internal overrides and security modifications.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-outfit text-lg font-bold text-white flex items-center space-x-2">
              <span>4. Your Rights</span>
            </h2>
            <p>
              Under our transparent voting standards, poll creators control the retention limits of their polls. 
              Voters participating in closed-list sessions can request their session access states to be reviewed 
              or cleared by reaching out to the respective poll administrator.
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
