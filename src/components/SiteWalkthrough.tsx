"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { 
  Sparkles, HelpCircle, X, ChevronRight, 
  ChevronLeft, CheckCircle, Info, Compass 
} from "lucide-react";

interface TourStep {
  selector?: string;
  title: string;
  description: string;
}

export default function SiteWalkthrough() {
  const pathname = usePathname();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [highlightCoords, setHighlightCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [wizardStep, setWizardStep] = useState<number | null>(null);

  // Monitor viewport size for mobile layout fallback
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sense active wizard step in the creation form
  useEffect(() => {
    if (pathname !== "/dashboard/create") {
      setWizardStep(null);
      return;
    }

    const interval = setInterval(() => {
      const el = document.querySelector("[data-wizard-step]");
      if (el) {
        const stepVal = parseInt(el.getAttribute("data-wizard-step") || "1", 10);
        setWizardStep(stepVal);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [pathname]);

  // Predefined context-specific walkthrough steps with warm, friendly human-written copy
  const getStepsForPage = (): TourStep[] => {
    // 1. Creation Wizard steps
    if (pathname === "/dashboard/create") {
      const step = wizardStep || 1;
      switch (step) {
        case 1:
          return [
            {
              selector: "[data-wizard-step]",
              title: "Step 1: Poll Basics",
              description: "Welcome! Let's get started. Give your poll a catchy title and describe what it's about. You can also upload a beautiful background poster to make it look super premium and stand out!"
            }
          ];
        case 2:
          return [
            {
              selector: "[data-wizard-step]",
              title: "Step 2: Question Format",
              description: "Choose how voters will make their choice. 'Single Choice' is the standard ballot. 'Ranked Priority' lets voters rank candidates in order of preference (which we score using Borda Count). 'Knockout Tournament' sets up a fun, head-to-head bracket battle!"
            }
          ];
        case 3:
          return [
            {
              selector: "[data-wizard-step]",
              title: "Step 3: Candidates & Options",
              description: "Type in your options or candidates. Click 'Add Option' to add as many as you need. For Tournament brackets, we'll automatically pad the list with rest matches if needed!"
            }
          ];
        case 4:
          return [
            {
              selector: "[data-wizard-step]",
              title: "Step 4: Who Can Vote?",
              description: "Decide your voter list. 'Open' lets anyone with the link join in. 'Closed' keeps it strictly secure—voters must be on your spreadsheet roster, and we can import past rosters instantly using the dropdown to save you time!"
            }
          ];
        case 5:
          return [
            {
              selector: "[data-wizard-step]",
              title: "Step 5: Security & Verification",
              description: "Prevent fraud! Limit voting by IP Address or ISP network to stop duplicate submissions. Set to 'High Priority' to require 6-digit email OTP codes, or choose 'Low Priority' for quick, direct-access bypass."
            }
          ];
        case 6:
          return [
            {
              selector: "[data-wizard-step]",
              title: "Step 6: Participant Anonymity",
              description: "Decide voter privacy! Enable anonymity so individual ballot records are fully masked, ensuring voters can share their honest feedback in complete confidence."
            }
          ];
        case 7:
          return [
            {
              selector: "[data-wizard-step]",
              title: "Step 7: Schedule Timing",
              description: "Choose when voting starts and stops. Everything runs in Indian Standard Time (IST - Asia/Kolkata), keeping timelines fully synchronized for everyone without any clock drift."
            }
          ];
        case 8:
          return [
            {
              selector: "[data-wizard-step]",
              title: "Step 8: Final Review & Publish",
              description: "Almost done! Choose whether results are public or hidden until voting concludes. Save it as a draft or click 'Publish' to launch your poll and automatically notify all voters!"
            }
          ];
        default:
          return [];
      }
    }

    // 2. Main Landing Page
    if (pathname === "/") {
      return [
        {
          selector: "#hero-section",
          title: "Welcome to Pollstar!",
          description: "Hey there! Welcome to Pollstar, a modern real-time secure voting platform. Let us show you around so you can get the absolute best out of your polls!"
        },
        {
          selector: "#auth-buttons",
          title: "Join or Log In",
          description: "This is where you log in or sign up. Creating a verified account only takes a minute, and you'll immediately be ready to launch your own custom polls!"
        },
        {
          selector: "#features-grid",
          title: "Electoral Security & Integrity",
          description: "Check these out! From automated email verification receipts and anti-fraud filters, to real-time interactive charts and Leaflet maps, we keep your elections clean, fast, and gorgeous."
        }
      ];
    }

    // 3. Creator Dashboard
    if (pathname === "/dashboard") {
      return [
        {
          selector: "#dashboard-stats",
          title: "Your Dashboard Metrics",
          description: "Here is your overall dashboard overview. You can track the total number of polls created, active voting sessions, and overall votes cast in your account at a single glance!"
        },
        {
          selector: "#create-poll-btn",
          title: "Launch a New Poll",
          description: "Ready to launch an election? Click right here to start our step-by-step wizard. It will guide you through questions, roster lists, and timeline details in minutes."
        },
        {
          selector: "#polls-grid",
          title: "Electoral Sessions Registry",
          description: "All of your active, draft, and closed polls will list here. You can click on any poll to view real-time analytical reports, edit active draft details, or publish drafts instantly!"
        }
      ];
    }

    // 4. Voter Portal
    if (pathname?.startsWith("/poll/")) {
      return [
        {
          selector: "#walkthrough-slider-card",
          title: "Electoral Safety Card",
          description: "Welcome to the Voter Portal! First, take a glance at this interactive slider card. It outlines the specific anonymity and safety protocols configured by the creator for this poll."
        },
        {
          selector: "#verification-form",
          title: "Secure Verification Gateway",
          description: "Enter your official identification parameters here. If OTP verification is required, we'll send a 6-digit code to your email. If it's a low-priority poll, you'll bypass direct-access instantly!"
        },
        {
          selector: "#ballot-card",
          title: "Interactive Digital Ballot",
          description: "Cast your secure choices here! Cast standard choice selections, drag and drop ranked priorities, or advance options match-by-match in real-time tournament brackets."
        },
        {
          selector: "#recharts-container",
          title: "Live Results Analytics",
          description: "If the creator has made results public, you will see real-time Recharts visual graphs rendering dynamic, beautiful standings as soon as votes are recorded!"
        },
        {
          selector: "#leaflet-map",
          title: "Geographic Voter Turnout Map",
          description: "Our secure system maps completely anonymized coordinates of all voters. The geographic layout highlights regional turnout locations on an interactive Leaflet map!"
        }
      ];
    }

    // 5. Poll Creator Analytics
    if (pathname?.startsWith("/dashboard/polls/")) {
      return [
        {
          selector: "#analytics-summary-cards",
          title: "Live Summary Indicators",
          description: "Get key stats at a glance! View total ballots cast, turnout velocity trends, and real-time security alerts highlighting suspicious IP/ISP network activity."
        },
        {
          selector: "#recharts-container",
          title: "Dynamic Results Tabs",
          description: "Toggle between overall charts and Deep Insights. Renders Borda points matrices, knockout survival leaderboards, and hourly turnout velocity timelines."
        },
        {
          selector: "#voter-roster-table",
          title: "Voter Roster Ledger",
          description: "Track allowed voters. Inspect who has logged in, verified their email, and cast their secure ballot in real-time, helping you audit your roster."
        }
      ];
    }

    // 6. Admin Panel
    if (pathname === "/admin") {
      return [
        {
          selector: "#admin-tabs",
          title: "Administrative Control Center",
          description: "Manage global systems here! Toggle between active Creator list registrations, the global System Poll database, and secure audit logs."
        },
        {
          selector: "#creators-list",
          title: "Creator Account Verifications",
          description: "Approve pending creator accounts with a single click. Keep control of system integrity and authenticate legitimate administrators."
        },
        {
          selector: "#system-polls-grid",
          title: "Global Poll Listings",
          description: "Monitor all creator polls in the system. As an Admin, you can review results, delete malicious test entries, or access ballot overrides."
        }
      ];
    }

    return [];
  };

  const steps = getStepsForPage();
  const currentStep = steps[activeStepIndex];

  // Auto-start the walkthrough on first-time page loading
  useEffect(() => {
    if (steps.length === 0) {
      setIsActive(false);
      return;
    }

    const key = `pollstar_tour_completed_${pathname}_step_${wizardStep || ""}`;
    const completed = localStorage.getItem(key);
    if (!completed) {
      setIsActive(true);
      setActiveStepIndex(0);
    } else {
      setIsActive(false);
    }
  }, [pathname, wizardStep, steps.length]);

  // Compute spotlight bounding box coordinates around the active selector element
  useEffect(() => {
    if (!isActive || !currentStep?.selector || isMobile) {
      setHighlightCoords(null);
      return;
    }

    const updateCoordinates = () => {
      const el = document.querySelector(currentStep.selector!);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Scroll adjustment
        const top = rect.top + window.scrollY;
        const left = rect.left + window.scrollX;
        setHighlightCoords({
          top: top - 8,
          left: left - 8,
          width: rect.width + 16,
          height: rect.height + 16
        });
        // Scroll target element gently into viewport view
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setHighlightCoords(null);
      }
    };

    updateCoordinates();
    // Re-verify on resize / dynamic shifts
    const timer = setTimeout(updateCoordinates, 300);
    window.addEventListener("resize", updateCoordinates);
    window.addEventListener("scroll", updateCoordinates);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateCoordinates);
      window.removeEventListener("scroll", updateCoordinates);
    };
  }, [isActive, activeStepIndex, currentStep, isMobile]);

  const handleNext = () => {
    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(activeStepIndex - 1);
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    const key = `pollstar_tour_completed_${pathname}_step_${wizardStep || ""}`;
    localStorage.setItem(key, "true");
  };

  const handleSkip = () => {
    setIsActive(false);
    const key = `pollstar_tour_completed_${pathname}_step_${wizardStep || ""}`;
    localStorage.setItem(key, "true");
  };

  const handleStartManualTour = () => {
    setActiveStepIndex(0);
    setIsActive(true);
  };

  if (steps.length === 0) return null;

  return (
    <>
      {/* 1. Permanent Help FAB Launcher (Bottom Right corner) */}
      <button
        onClick={handleStartManualTour}
        className="fixed bottom-6 right-6 z-40 p-4 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-indigo-600 text-white font-bold text-sm shadow-2xl flex items-center space-x-2 transition-all transform hover:scale-105 active:scale-95 animate-pulse-glow"
        title="Need help? Start the Page Tour Guide!"
      >
        <HelpCircle className="w-5 h-5 shrink-0" />
        <span className="hidden sm:inline">Guide Tour</span>
      </button>

      {/* 2. Walkthrough Tour Dialog Overlay */}
      {isActive && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Spotlight Highlight Mask (Desktop only) */}
          {!isMobile && highlightCoords && (
            <div 
              className="absolute pointer-events-none border-[3px] border-emerald-400 rounded-2xl shadow-[0_0_0_9999px_rgba(3,7,18,0.85)] transition-all duration-300"
              style={{
                top: `${highlightCoords.top}px`,
                left: `${highlightCoords.left}px`,
                width: `${highlightCoords.width}px`,
                height: `${highlightCoords.height}px`
              }}
            />
          )}

          {/* Simple dark backdrop if no specific element is targeted, or if mobile viewport */}
          {(isMobile || !highlightCoords) && (
            <div className="absolute inset-0 bg-[#030712]/90 backdrop-blur-sm" />
          )}

          {/* Tooltip Content Popover card container */}
          <div className="flex items-center justify-center min-h-screen p-4 relative z-50">
            <div 
              className={`glass-card max-w-md w-full rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl space-y-6 relative transition-all animate-fade-in ${
                !isMobile && highlightCoords 
                  ? "mt-4" 
                  : ""
              }`}
            >
              {/* Card Header details */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-black block">
                      Page Guide {activeStepIndex + 1} of {steps.length}
                    </span>
                    <h4 className="text-white text-base font-bold font-outfit">
                      {currentStep.title}
                    </h4>
                  </div>
                </div>
                <button 
                  onClick={handleSkip}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Close Guide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Conversational friendly copy body */}
              <div className="space-y-3">
                <p className="text-gray-300 text-sm leading-relaxed font-medium">
                  {currentStep.description}
                </p>
                {currentStep.selector && !document.querySelector(currentStep.selector) && (
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs flex items-start space-x-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>This element will show up on this page once you complete the current active action!</span>
                  </div>
                )}
              </div>

              {/* Controls bar */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <button
                  onClick={handleSkip}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-wider"
                >
                  Skip Tour
                </button>

                <div className="flex items-center space-x-3">
                  {activeStepIndex > 0 && (
                    <button
                      onClick={handlePrev}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white border border-white/5 hover:bg-white/5 transition-all flex items-center space-x-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-white flex items-center space-x-1.5 shadow-lg shadow-emerald-500/25 transition-all hover:opacity-95 active:scale-95"
                  >
                    <span>{activeStepIndex === steps.length - 1 ? "Finish" : "Next"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
