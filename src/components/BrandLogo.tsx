import React from 'react';
import { CheckSquare } from 'lucide-react';

interface BrandLogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
}

export default function BrandLogo({ className = '', iconSize = 20, textSize = 'text-xl' }: BrandLogoProps) {
  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      {/* Round-cornered deep indigo square ballot box */}
      <div 
        className="p-2 rounded-xl flex items-center justify-center bg-[#0c0a24] border border-[#312e81]/50 shadow-lg shadow-indigo-950/30 shrink-0"
      >
        <CheckSquare className="text-[#818cf8] stroke-[2.5]" style={{ width: iconSize, height: iconSize }} />
      </div>
      
      {/* Brand text PollStar */}
      <span className={`font-outfit ${textSize} font-black tracking-tight text-white`}>
        Poll<span className="text-[#818cf8]">Star</span>
      </span>
    </div>
  );
}
