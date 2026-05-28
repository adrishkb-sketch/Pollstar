'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Vote, Mail, ArrowRight, Globe2, AtSign, ExternalLink } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [tagline, setTagline] = useState("The premium platform for real-time polls, surveys & exams. Trusted by educators, teams, and organizations worldwide.");
  const [copyright, setCopyright] = useState(`© ${new Date().getFullYear()} Pollstar. All rights reserved.`);

  useEffect(() => {
    fetch('/api/admin/site-config')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.configs) {
          const tag = data.configs.find((c: any) => c.key === 'footer_tagline')?.value;
          const copy = data.configs.find((c: any) => c.key === 'footer_copyright')?.value;
          if (tag) setTagline(tag);
          if (copy) setCopyright(copy);
        }
      })
      .catch(e => console.error(e));
  }, []);

  const productLinks = [
    { label: 'Features', href: '/features' },
    { label: 'Create a Poll', href: '/dashboard/create' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Embed Widget', href: '/features#embed' },
  ];

  const companyLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
  ];

  const legalLinks = [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Cookie Policy', href: '/privacy#cookies' },
    { label: 'Acceptable Use', href: '/terms#acceptable-use' },
  ];

  return (
    <footer className="w-full border-t border-white/5 bg-[#020617] relative z-10">
      {/* Newsletter CTA strip */}
      <div className="max-w-7xl mx-auto px-6 py-10 border-b border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-outfit text-xl font-bold text-white mb-1">
              Stay in the loop
            </h3>
            <p className="text-gray-500 text-sm">
              Get product updates, tips, and new feature announcements.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto max-w-md">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="you@example.com"
                className="glass-input w-full pl-10 pr-4 py-2.5 text-sm rounded-xl"
              />
            </div>
            <button className="gradient-btn px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-1.5 shrink-0">
              Subscribe
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-5 gap-10">
        {/* Brand Column */}
        <div className="col-span-2">
          <Link href="/" className="flex items-center space-x-2.5 mb-4">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/20">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <span className="font-outfit text-xl font-bold tracking-tight text-white">
              Poll<span className="text-emerald-400">star</span>
            </span>
          </Link>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-6">
            {tagline}
          </p>
          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="Social"
              className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-gray-500 hover:text-emerald-400"
            >
              <AtSign className="w-4 h-4" />
            </a>
            <a
              href="#"
              aria-label="Website"
              className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-gray-500 hover:text-emerald-400"
            >
              <Globe2 className="w-4 h-4" />
            </a>
            <a
              href="#"
              aria-label="More"
              className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-gray-500 hover:text-emerald-400"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Product Links */}
        <div>
          <h4 className="font-outfit text-xs font-bold text-gray-300 uppercase tracking-widest mb-4">
            Product
          </h4>
          <ul className="space-y-2.5">
            {productLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-gray-500 hover:text-emerald-400 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company Links */}
        <div>
          <h4 className="font-outfit text-xs font-bold text-gray-300 uppercase tracking-widest mb-4">
            Company
          </h4>
          <ul className="space-y-2.5">
            {companyLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-gray-500 hover:text-emerald-400 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal Links */}
        <div>
          <h4 className="font-outfit text-xs font-bold text-gray-300 uppercase tracking-widest mb-4">
            Legal
          </h4>
          <ul className="space-y-2.5">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-gray-500 hover:text-emerald-400 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-6 py-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-gray-600 text-xs">
          {copyright}
        </p>
        <p className="text-gray-700 text-xs">
          Made with ❤️ by Adrish &amp; the Pollstar team
        </p>
      </div>
    </footer>
  );
}
