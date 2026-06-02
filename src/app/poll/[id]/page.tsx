'use client';

import { useEffect, useState, use, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  Vote as VoteIcon, Loader2, AlertCircle, CheckCircle, 
  HelpCircle, ShieldAlert, Award, ArrowRight, ArrowLeft, RefreshCw, Check, Users,
  MessageSquare, Send, MessageCircle, ClipboardList, Settings
} from 'lucide-react';
import PollChart from '@/components/PollChart';
import PollMap from '@/components/PollMap';
import confetti from 'canvas-confetti';
import AdvertisementZone from '@/components/AdvertisementZone';
import { io } from 'socket.io-client';
import { Monitor, Video } from 'lucide-react';

interface StudentWhiteboardProps {
  questionId: string;
  value: string; // Base64 image
  onChange: (base64: string) => void;
  driveUrl?: string | null;
}

function StudentWhiteboard({ questionId, value, onChange, driveUrl }: StudentWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokeColor, setStrokeColor] = useState('#6366f1');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const isDrawingRef = useRef(false);
  const prevCoordsRef = useRef({ x: 0, y: 0 });

  // Load existing drawing if it exists
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.clientWidth || 600;
    canvas.height = 280;

    // Draw grid background for premium whiteboard look
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const step = 20;
    for (let x = 0; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (value) {
      const img = new Image();
      img.src = value;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
    }
  }, []);

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL());
  };

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: any) => {
    isDrawingRef.current = true;
    prevCoordsRef.current = getCoordinates(e);
  };

  const draw = (e: any) => {
    if (!isDrawingRef.current) return;
    // Prevent default scrolling on mobile devices while sketching!
    if (e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentCoords = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(prevCoordsRef.current.x, prevCoordsRef.current.y);
    ctx.lineTo(currentCoords.x, currentCoords.y);

    ctx.strokeStyle = isEraser ? '#030712' : strokeColor; // Eraser acts by matching background color
    ctx.lineWidth = isEraser ? strokeWidth * 3 : strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    prevCoordsRef.current = currentCoords;
  };

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      saveCanvas();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid background again
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const step = 20;
    for (let x = 0; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    onChange('');
  };

  return (
    <div className="glass-card rounded-2xl p-4 border border-white/10 bg-white/5 space-y-3 animate-fade-in-up mt-3">
      <div className="flex items-center justify-between text-xs font-bold text-gray-300">
        <span className="flex items-center space-x-1.5 text-indigo-400">
          <span>🎨 Interactive Whiteboard Sketchpad</span>
        </span>
        <button
          type="button"
          onClick={clearCanvas}
          className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded transition-all text-[10px]"
        >
          Reset Board
        </button>
      </div>

      {driveUrl && (
        <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-[10px] text-purple-300 leading-normal flex items-start space-x-1.5">
          <span className="shrink-0 mt-0.5">📁</span>
          <span>
            <strong>Cloud Archiving Configured:</strong> Your sketches will be exported directly to your instructor's shared drive: <a href={driveUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold text-white hover:text-purple-200">{driveUrl}</a>
          </span>
        </div>
      )}

      {/* Actual Drawing Area */}
      <div className="rounded-xl overflow-hidden border border-white/10 bg-[#030712] relative cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="block w-full touch-none"
        />
      </div>

      {/* Toolbar controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-2">
          {/* Mode Switchers */}
          <button
            type="button"
            onClick={() => setIsEraser(false)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
              !isEraser ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            ✏️ Pen
          </button>
          <button
            type="button"
            onClick={() => setIsEraser(true)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
              isEraser ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            🧽 Eraser
          </button>
        </div>

        {/* Thickness selectors */}
        <div className="flex items-center space-x-1">
          {[2, 5, 10].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setStrokeWidth(size)}
              className={`px-2 py-1 rounded text-[9px] font-extrabold border transition-all ${
                strokeWidth === size ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {size === 2 ? 'Thin' : size === 5 ? 'Med' : 'Thick'}
            </button>
          ))}
        </div>

        {/* Colors Swatches */}
        <div className="flex items-center space-x-1.5">
          {['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ffffff'].map(color => (
            <button
              key={color}
              type="button"
              onClick={() => {
                setStrokeColor(color);
                setIsEraser(false);
              }}
              className={`w-5 h-5 rounded-full border transition-all ${
                strokeColor === color && !isEraser ? 'scale-125 border-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ScientificCalculator({ onClose }: { onClose: () => void }) {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [position, setPosition] = useState({ x: 20, y: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: any) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    if (!clientX || !clientY) return;

    setPosition({
      x: clientX - dragStart.current.x,
      y: clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const appendToExpr = (str: string) => {
    setExpression(prev => prev + str);
  };

  const clearAll = () => {
    setExpression('');
    setResult('');
  };

  const backspace = () => {
    setExpression(prev => prev.slice(0, -1));
  };

  const evaluate = () => {
    try {
      let raw = expression;
      // Replace symbols
      raw = raw.replace(/π/g, 'Math.PI');
      raw = raw.replace(/e/g, 'Math.E');
      raw = raw.replace(/sin\(/g, 'Math.sin(');
      raw = raw.replace(/cos\(/g, 'Math.cos(');
      raw = raw.replace(/tan\(/g, 'Math.tan(');
      raw = raw.replace(/log\(/g, 'Math.log10(');
      raw = raw.replace(/ln\(/g, 'Math.log(');
      raw = raw.replace(/sqrt\(/g, 'Math.sqrt(');
      raw = raw.replace(/\^/g, '**');

      // Simple safe evaluation via Function constructor
      const evalResult = new Function(`return ${raw}`)();
      if (evalResult === undefined || isNaN(evalResult)) {
        setResult('Error');
      } else {
        setResult(Number(evalResult).toLocaleString('en-US', { maximumFractionDigits: 6 }));
      }
    } catch (e) {
      setResult('Error');
    }
  };

  return (
    <div
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
      className="fixed z-50 w-72 glass-card rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl p-4 select-none touch-none animate-fade-in-up backdrop-blur-md"
    >
      {/* Header bar (draggable handle) */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          setIsDragging(true);
          const touch = e.touches[0];
          dragStart.current = {
            x: touch.clientX - position.x,
            y: touch.clientY - position.y
          };
        }}
        className="flex items-center justify-between cursor-move pb-2 border-b border-white/5 mb-3 select-none"
      >
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1">
          <span>🧮 Math Pad (Exam mode)</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors text-xs font-bold font-mono px-1.5 py-0.5 rounded hover:bg-white/5"
        >
          Close
        </button>
      </div>

      {/* Calculator Display Screen */}
      <div className="bg-[#030712] rounded-xl p-3 border border-white/5 mb-4 text-right space-y-1">
        <div className="text-xs text-gray-500 font-mono truncate h-4 leading-none">
          {expression || '0'}
        </div>
        <div className="text-lg font-black text-white font-mono truncate h-7 leading-none pt-0.5">
          {result || '0'}
        </div>
      </div>

      {/* Buttons Pad grid layout */}
      <div className="grid grid-cols-4 gap-1.5">
        {/* Trigonometric functions row */}
        {['sin(', 'cos(', 'tan(', '^'].map(fn => (
          <button
            key={fn}
            type="button"
            onClick={() => appendToExpr(fn)}
            className="py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-indigo-400 hover:bg-white/10 transition-colors"
          >
            {fn === '^' ? 'xʸ' : fn.replace('(', '')}
          </button>
        ))}

        {/* Special math row */}
        {['sqrt(', 'log(', 'ln(', '('].map(fn => (
          <button
            key={fn}
            type="button"
            onClick={() => appendToExpr(fn)}
            className="py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-indigo-400 hover:bg-white/10 transition-colors"
          >
            {fn === 'sqrt(' ? '√' : fn.replace('(', '')}
          </button>
        ))}

        {/* Third special row */}
        {['π', 'e', ')', '/'].map(fn => (
          <button
            key={fn}
            type="button"
            onClick={() => appendToExpr(fn === '/' ? ' / ' : fn)}
            className="py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-gray-300 hover:bg-white/10 transition-colors"
          >
            {fn}
          </button>
        ))}

        {/* Numbers 7, 8, 9, * */}
        {['7', '8', '9', '*'].map(fn => (
          <button
            key={fn}
            type="button"
            onClick={() => appendToExpr(fn === '*' ? ' * ' : fn)}
            className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
              fn === '*' ? 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10' : 'bg-[#030712]/50 border-white/5 text-white hover:bg-white/5'
            }`}
          >
            {fn === '*' ? '×' : fn}
          </button>
        ))}

        {/* Numbers 4, 5, 6, - */}
        {['4', '5', '6', '-'].map(fn => (
          <button
            key={fn}
            type="button"
            onClick={() => appendToExpr(fn === '-' ? ' - ' : fn)}
            className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
              fn === '-' ? 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10' : 'bg-[#030712]/50 border-white/5 text-white hover:bg-white/5'
            }`}
          >
            {fn === '-' ? '−' : fn}
          </button>
        ))}

        {/* Numbers 1, 2, 3, + */}
        {['1', '2', '3', '+'].map(fn => (
          <button
            key={fn}
            type="button"
            onClick={() => appendToExpr(fn === '+' ? ' + ' : fn)}
            className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
              fn === '+' ? 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10' : 'bg-[#030712]/50 border-white/5 text-white hover:bg-white/5'
            }`}
          >
            {fn}
          </button>
        ))}

        {/* Clear, 0, ., = */}
        <button
          type="button"
          onClick={clearAll}
          className="py-2 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-colors"
        >
          C
        </button>
        <button
          type="button"
          onClick={() => appendToExpr('0')}
          className="py-2 rounded-lg border border-white/5 bg-[#030712]/50 text-white hover:bg-white/5 text-xs font-bold transition-colors"
        >
          0
        </button>
        <button
          type="button"
          onClick={backspace}
          className="py-2 rounded-lg border border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 text-xs font-bold transition-colors"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={evaluate}
          className="py-2 rounded-lg border border-indigo-500 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-bold transition-colors shadow-lg shadow-indigo-600/20"
        >
          =
        </button>
      </div>
    </div>
  );
}

export default function VoterPortal({ params }: { params: Promise<{ id: string }> }) {
  const { id: pollId } = use(params);

  const getThemeClasses = () => {
    const themeId = poll?.settings?.customTheme || "MIDNIGHT";
    switch (themeId) {
      case "SUNSET":
        return {
          id: "SUNSET",
          bg: "bg-[#140b0c]",
          sphere1: "bg-red-500/10",
          sphere2: "bg-orange-500/10",
          cardBorder: "border-red-500/20",
          text: "text-white"
        };
      case "JADE":
        return {
          id: "JADE",
          bg: "bg-[#08120d]",
          sphere1: "bg-emerald-500/10",
          sphere2: "bg-teal-500/10",
          cardBorder: "border-emerald-500/20",
          text: "text-white"
        };
      case "OCEAN":
        return {
          id: "OCEAN",
          bg: "bg-[#08131a]",
          sphere1: "bg-sky-500/10",
          sphere2: "bg-cyan-500/10",
          cardBorder: "border-sky-500/20",
          text: "text-white"
        };
      case "ALABASTER":
        return {
          id: "ALABASTER",
          bg: "bg-gray-50",
          sphere1: "bg-indigo-200/40",
          sphere2: "bg-purple-200/40",
          cardBorder: "border-gray-200",
          text: "text-gray-900"
        };
      case "MIDNIGHT":
      default:
        return {
          id: "MIDNIGHT",
          bg: "bg-[#030712]",
          sphere1: "bg-indigo-500/10",
          sphere2: "bg-purple-500/10",
          cardBorder: "border-indigo-500/30",
          text: "text-white"
        };
    }
  };

  // Core loading & schema states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [poll, setPoll] = useState<any>(null);

  // Survey Pagination & Flow States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageHistory, setPageHistory] = useState<number[]>([]);
  
  // Closed voter entrance gate states
  const [showIntro, setShowIntro] = useState(true);
  const [introStep, setIntroStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [verifiedVoter, setVerifiedVoter] = useState(false);
  const [voterToken, setVoterToken] = useState('');
  const [voterEmail, setVoterEmail] = useState('');
  const [voterId, setVoterId] = useState('');
  const [voterIdentifier, setVoterIdentifier] = useState('');
  const [confirmer1, setConfirmer1] = useState('');
  const [confirmer2, setConfirmer2] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('EMAIL');
  const [verificationType, setVerificationType] = useState('OTP');
  const [voterPhone, setVoterPhone] = useState('');
  const [voterPassword, setVoterPassword] = useState('');

  // Closed voter lookup states
  const [lookupPassed, setLookupPassed] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [identifierLabel, setIdentifierLabel] = useState('Roll Number');
  const [confirmer1Label, setConfirmer1Label] = useState('Student Name');
  const [confirmer2Label, setConfirmer2Label] = useState('Parent Name');
  
  // OTP Verification modal states
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpSendLoading, setOtpSendLoading] = useState(false);
  const [otpSentOnce, setOtpSentOnce] = useState(false);
  const [bypassStatus, setBypassStatus] = useState<'IDLE' | 'REQUESTING' | 'WAITING' | 'GRANTED'>('IDLE');

  // Open voter email limit state
  const [openEmail, setOpenEmail] = useState('');

  // Voting answers selection states
  // answers map: { [questionId]: optionId | optionId[] }
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [rankedSelections, setRankedSelections] = useState<string[]>([]); // active array of ranks
  const [confirmVoteChecked, setConfirmVoteChecked] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  
  // Captcha states
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // Final submission state
  const [votedSuccessfully, setVotedSuccessfully] = useState(false);
  const [flaggedSuspicious, setFlaggedSuspicious] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [bypassPopup, setBypassPopup] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  // Confidence slider state: { [questionId]: number (1-100) }
  const [confidenceValues, setConfidenceValues] = useState<Record<string, number>>({});

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [screenError, setScreenError] = useState(false);
  const [isFullscreenLocked, setIsFullscreenLocked] = useState(true);
  const [isScreenShared, setIsScreenShared] = useState(true);
  const [isScreenShareFallback, setIsScreenShareFallback] = useState(false);
  const [proctorLogs, setProctorLogs] = useState<string[]>([]);
  const socketRef = useRef<any>(null);

  // Proctor images & dynamic values Refs for stable non-resetting event listeners
  const [isExamCancelled, setIsExamCancelled] = useState(false);
  const selectedAnswersRef = useRef(selectedAnswers);
  const proctorLogsRef = useRef(proctorLogs);
  const cameraStreamRef = useRef(cameraStream);
  const screenStreamRef = useRef(screenStream);
  const confidenceValuesRef = useRef(confidenceValues);
  const latestWebcamFrameRef = useRef<string>('');
  const latestScreenFrameRef = useRef<string>('');
  const localWebcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const localScreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const recordedWebcamFramesRef = useRef<string[]>([]);
  const recordedScreenFramesRef = useRef<string[]>([]);

  const isFullscreenLockedRef = useRef(isFullscreenLocked);
  const isScreenSharedRef = useRef(isScreenShared);
  const isScreenShareFallbackRef = useRef(isScreenShareFallback);
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => { selectedAnswersRef.current = selectedAnswers; }, [selectedAnswers]);
  useEffect(() => { proctorLogsRef.current = proctorLogs; }, [proctorLogs]);
  useEffect(() => { cameraStreamRef.current = cameraStream; }, [cameraStream]);
  useEffect(() => { screenStreamRef.current = screenStream; }, [screenStream]);
  useEffect(() => { confidenceValuesRef.current = confidenceValues; }, [confidenceValues]);

  useEffect(() => { isFullscreenLockedRef.current = isFullscreenLocked; }, [isFullscreenLocked]);
  useEffect(() => { isScreenSharedRef.current = isScreenShared; }, [isScreenShared]);
  useEffect(() => { isScreenShareFallbackRef.current = isScreenShareFallback; }, [isScreenShareFallback]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  // Device detection helpers evaluated on client
  const rawUA = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
  const isTabletUA = /Tablet|iPad|Playbook|Silk|Kindle/i.test(rawUA) || ( typeof navigator !== 'undefined' && /Android/i.test(rawUA) && !/Mobile/i.test(rawUA) );
  const isMobileUA = /Mobi|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|webOS|Windows Phone/i.test(rawUA) || ( typeof navigator !== 'undefined' && /Android/i.test(rawUA) && /Mobile/i.test(rawUA) );
  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator && navigator.maxTouchPoints > 1));
  const screenW = typeof window !== 'undefined' ? (window.screen.width || window.innerWidth) : 1024;
  const isMobilePlatform = typeof navigator !== 'undefined' ? (/iphone|ipod/i.test(navigator.platform || '') || ((navigator as any).userAgentData?.mobile === true)) : false;
  const isTabletPlatform = typeof navigator !== 'undefined' ? (/ipad/i.test(navigator.platform || '')) : false;

  const [examineeSessionId, setExamineeSessionId] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = `exam_session_id_${pollId}`;
      let id = sessionStorage.getItem(key);
      if (!id) {
        id = 'exam_' + Math.random().toString(36).substring(2, 11);
        sessionStorage.setItem(key, id);
      }
      setExamineeSessionId(id);
    }
  }, [pollId]);

  const handleForceCancelExam = async () => {
    setVoteLoading(true);
    try {
      let detectedDevice = 'Desktop';
      if (isMobileUA || isMobilePlatform || (isTouch && screenW <= 480)) {
        detectedDevice = 'Mobile';
      } else if (isTabletUA || isTabletPlatform || (isTouch && screenW > 480 && screenW <= 1024 && !/Macintosh/i.test(navigator?.platform || ''))) {
        detectedDevice = 'Tablet';
      } else if (isTouch && screenW <= 1024 && /MacIntel/.test(navigator?.platform || '')) {
        detectedDevice = 'Tablet';
      }

      const time = new Date().toLocaleTimeString();
      const updatedLogs = [...proctorLogsRef.current, `🚨 EXAMINATION TERMINATED BY EXAMINER at ${time}`];

      // Send to server to mark exam as voided/cancelled
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: { 
            ...selectedAnswersRef.current, 
            __proctorLogs: updatedLogs,
            __examCancelled: true,
            __markingStatus: 'CANCELLED',
            __webcamFrame: latestWebcamFrameRef.current,
            __screenFrame: latestScreenFrameRef.current,
            __webcamFrames: recordedWebcamFramesRef.current,
            __screenFrames: recordedScreenFramesRef.current,
          },
          voterToken: poll?.isOpenVoting ? undefined : voterToken,
          email: poll?.isOpenVoting && poll?.settings?.limitOneVotePerUser ? openEmail : undefined,
          latitude: null,
          longitude: null,
          device: detectedDevice,
          isAutoSubmitted: true,
        }),
      });

      setIsExamCancelled(true);
      setVotedSuccessfully(true);
      setFlaggedSuspicious(true);
      
      // Clear localStorage proctor keys so the student is not stuck in a reload loop
      localStorage.removeItem(`poll_start_time_${pollId}`);
      localStorage.removeItem(`pollstar_resume_${pollId}`);
      localStorage.removeItem(`exam_in_progress_${pollId}`);
      localStorage.removeItem(`selected_answers_${pollId}`);
      localStorage.removeItem(`proctor_logs_${pollId}`);

      // Stop media tracks
      if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(t => t.stop());
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop());
      if (socketRef.current) socketRef.current.disconnect();

      alert("🚨 This examination has been terminated by the examiner due to integrity infractions.");
    } catch (err) {
      console.error(err);
    } finally {
      setVoteLoading(false);
    }
  };

  const addProctorLog = (msg: string) => {
    setProctorLogs(prev => {
      const exists = prev.includes(msg);
      if (exists) return prev;
      return [...prev, msg];
    });
  };

  const playWarningBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartExamClick = async () => {
    if (!poll?.settings?.enableProctorCamera) {
      setShowIntro(false);
      localStorage.setItem(`exam_in_progress_${pollId}`, 'true');
      return;
    }

    try {
      // 1. Request Webcam
      const webStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: !!poll.settings.enableProctorMicrophone
      });
      
      // 2. Request Screen Share with Graceful Fallback for Mobile and Denials
      let scrStream: MediaStream | null = null;
      let fallbackActive = false;
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          scrStream = await navigator.mediaDevices.getDisplayMedia({
            video: { width: 640, height: 480 }
          });
        } else {
          console.warn("Screen sharing not supported on this device/browser context.");
          fallbackActive = true;
        }
      } catch (err) {
        console.warn("Screen sharing prompt cancelled or failed. Using simulated live screenshot feed.", err);
        fallbackActive = true;
      }

      if (scrStream) {
        // Bind screen track onended
        scrStream.getVideoTracks()[0].onended = () => {
          setIsScreenShared(false);
          addProctorLog("🚨 Stopped screen sharing");
        };
      }

      // 3. Request Fullscreen
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (fsErr) {
        console.error("Fullscreen request failed:", fsErr);
      }

      // 4. Save streams
      setCameraStream(webStream);
      setScreenStream(scrStream);
      setIsScreenShareFallback(fallbackActive);
      setCameraError(false);
      setScreenError(false);
      setIsScreenShared(true);
      setIsFullscreenLocked(true);

      // 5. Connect Socket
      const socket = io();
      socketRef.current = socket;
      socket.emit('join-poll', pollId);

      socket.on('cancel-exam', (data: any) => {
        if (data && (data.studentId === activeVoterIdentifier || data.studentId === examineeSessionId || data.identifier === voterIdentifier)) {
          handleForceCancelExam();
        }
      });

      // 6. Enter exam
      setShowIntro(false);
      localStorage.setItem(`exam_in_progress_${pollId}`, 'true');
      
      const startTime = new Date().toLocaleTimeString();
      const initialLog = fallbackActive 
        ? `🟢 Exam started at ${startTime} (Webcam active, Screen simulated)` 
        : `🟢 Exam started with live proctoring at ${startTime}`;
      setProctorLogs([initialLog]);

    } catch (err) {
      console.error("Media permission failed:", err);
      alert("⚠️ Webcam access is required to take this exam. Please check your browser settings and grant permissions.");
      setCameraError(true);
    }
  };

  // Chat Sidebar states
  const [chatMessages, setChatMessages] = useState<any[]>([
    { id: 1, author: 'Alice', text: 'I think Option 1 is clearly the superior choice here!', sentiment: 'POSITIVE', time: '2 mins ago' },
    { id: 2, author: 'Bob', text: 'Not sure, Option 2 has a lot of good points too.', sentiment: 'NEUTRAL', time: '1 min ago' },
    { id: 3, author: 'Charlie', text: 'Option 3 is just a terrible option honestly...', sentiment: 'NEGATIVE', time: 'Just now' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [chatName, setChatName] = useState('Guest Voter');

  // Voter-to-Creator Direct Message states
  const [showOwnerChat, setShowOwnerChat] = useState(false);
  const [ownerChatEmail, setOwnerChatEmail] = useState('');
  const [ownerChatMessages, setOwnerChatMessages] = useState<any[]>([]);
  const [ownerChatInput, setOwnerChatInput] = useState('');
  const [ownerChatSending, setOwnerChatSending] = useState(false);

  const activeVoterIdentifier = voterEmail || openEmail || voterIdentifier || ownerChatEmail;

  // Proctor dynamic value Refs declared here so they have all dependency variables in scope
  const activeVoterIdentifierRef = useRef(activeVoterIdentifier);
  const confirmer1Ref = useRef(confirmer1);
  const voterIdentifierRef = useRef(voterIdentifier);
  const examineeSessionIdRef = useRef(examineeSessionId);

  useEffect(() => { activeVoterIdentifierRef.current = activeVoterIdentifier; }, [activeVoterIdentifier]);
  useEffect(() => { confirmer1Ref.current = confirmer1; }, [confirmer1]);
  useEffect(() => { voterIdentifierRef.current = voterIdentifier; }, [voterIdentifier]);
  useEffect(() => { examineeSessionIdRef.current = examineeSessionId; }, [examineeSessionId]);

  // Fetch owner direct messages
  useEffect(() => {
    if (!showOwnerChat || !activeVoterIdentifier) return;
    const fetchOwnerMessages = async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}/messages?voterIdentifier=${encodeURIComponent(activeVoterIdentifier)}`);
        if (res.ok) {
          const data = await res.json();
          setOwnerChatMessages(data.messages || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchOwnerMessages();
    const interval = setInterval(fetchOwnerMessages, 10000);
    return () => clearInterval(interval);
  }, [showOwnerChat, activeVoterIdentifier, pollId]);

  const handleSendOwnerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerChatInput.trim() || !activeVoterIdentifier) return;
    
    setOwnerChatSending(true);
    const msgText = ownerChatInput;
    setOwnerChatInput('');
    try {
      const res = await fetch(`/api/polls/${pollId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: msgText,
          voterIdentifier: activeVoterIdentifier,
          isFromCreator: false
        })
      });
      if (res.ok) {
        const data = await res.json();
        setOwnerChatMessages(prev => [...prev, data.message]);
      } else {
        setOwnerChatInput(msgText); // restore on error
      }
    } catch (err) {
      console.error(err);
      setOwnerChatInput(msgText);
    } finally {
      setOwnerChatSending(false);
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage.toLowerCase();
    const positiveWords = ['love', 'like', 'great', 'best', 'good', 'win', 'awesome', 'cool', 'support', 'yes', 'agree', 'better'];
    const negativeWords = ['hate', 'bad', 'worst', 'lose', 'terrible', 'dislike', 'no', 'poor', 'waste', 'disagree', 'worse'];
    
    let sentiment = 'NEUTRAL';
    let posCount = 0;
    let negCount = 0;
    positiveWords.forEach(w => { if (text.includes(w)) posCount++; });
    negativeWords.forEach(w => { if (text.includes(w)) negCount++; });

    if (posCount > negCount) sentiment = 'POSITIVE';
    else if (negCount > posCount) sentiment = 'NEGATIVE';

    const msg = {
      id: Date.now(),
      author: chatName.trim() || (poll?.pollType === 'EXAM' ? 'Student' : 'Voter'),
      text: newMessage,
      sentiment,
      time: 'Just now'
    };

    setChatMessages([...chatMessages, msg]);
    setNewMessage('');
  };

  // Dynamic real-time charts states
  const [liveStats, setLiveStats] = useState<Record<string, any>>({});
  const [liveTotalVotes, setLiveTotalVotes] = useState(0);
  const [liveVoterLocations, setLiveVoterLocations] = useState<any[]>([]);

  // Tournament Knockout states
  const [knockoutRounds, setKnockoutRounds] = useState<any[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [knockoutWaiting, setKnockoutWaiting] = useState<any[]>([]);
  const [totalKnockoutRounds, setTotalKnockoutRounds] = useState(0);

  const initializeKnockout = (options: any[]) => {
    let N = options.length;
    if (N < 2) return;
    
    // Calculate total rounds dynamically based on the play-in logic
    let tempN = N;
    let roundsCount = 0;
    while (tempN > 1) {
      let P = 2;
      while (P * 2 <= tempN) {
        P *= 2;
      }
      let matches = tempN - P;
      if (matches === 0) {
        roundsCount += Math.log2(tempN);
        break;
      } else {
        roundsCount += 1;
        tempN = matches + (tempN - matches * 2);
      }
    }
    setTotalKnockoutRounds(roundsCount);

    // Find largest power of 2 <= N
    let P = 2;
    while (P * 2 <= N) {
      P *= 2;
    }
    
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    
    const numPlayInMatches = N - P;
    const numPlayInCandidates = numPlayInMatches * 2;
    
    const playInCandidates = shuffled.slice(0, numPlayInCandidates);
    const waitingCandidates = shuffled.slice(numPlayInCandidates);
    
    const firstRoundMatches: any[] = [];
    
    if (numPlayInMatches === 0) {
      // Perfect power of 2: no play-ins needed
      for (let i = 0; i < shuffled.length; i += 2) {
        firstRoundMatches.push({
          c1: shuffled[i],
          c2: shuffled[i + 1],
          winner: null
        });
      }
    } else {
      // Generate play-in matches for the first round
      for (let i = 0; i < playInCandidates.length; i += 2) {
        firstRoundMatches.push({
          c1: playInCandidates[i],
          c2: playInCandidates[i + 1],
          winner: null
        });
      }
    }
    
    setKnockoutRounds([firstRoundMatches]);
    setCurrentRoundIndex(0);
    setKnockoutWaiting(numPlayInMatches === 0 ? [] : waitingCandidates);
  };

  const handleKnockoutSelect = (matchIndex: number, winnerId: string, questionId: string) => {
    const updatedRounds = [...knockoutRounds];
    const currentRound = [...updatedRounds[currentRoundIndex]];
    
    currentRound[matchIndex] = {
      ...currentRound[matchIndex],
      winner: winnerId
    };
    updatedRounds[currentRoundIndex] = currentRound;
    setKnockoutRounds(updatedRounds);

    const allDecided = currentRound.every((m) => m.winner !== null);
    if (!allDecided) return;

    const winners = currentRound.map(m => [m.c1, m.c2].find(c => c.id === m.winner));
    
    // Retrieve waiting candidates for the first play-in transition
    const nextPool = currentRoundIndex === 0 ? [...winners, ...knockoutWaiting] : winners;

    if (nextPool.length === 1) {
      const ultimateWinner = nextPool[0].id;
      setSelectedAnswers((prev) => ({
        ...prev,
        [questionId]: {
          rounds: updatedRounds.map(r => r.map((m: any) => ({
            c1: { id: m.c1.id, text: m.c1.text },
            c2: { id: m.c2.id, text: m.c2.text },
            winner: m.winner
          }))),
          winner: ultimateWinner
        }
      }));
      return;
    }

    const nextRoundMatches: any[] = [];
    for (let i = 0; i < nextPool.length; i += 2) {
      nextRoundMatches.push({
        c1: nextPool[i],
        c2: nextPool[i + 1],
        winner: null
      });
    }

    setKnockoutRounds([...updatedRounds, nextRoundMatches]);
    setCurrentRoundIndex(currentRoundIndex + 1);
  };

  const handleResetKnockout = (questionId: string, options: any[]) => {
    setKnockoutWaiting([]);
    initializeKnockout(options);
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const getSessionDuration = () => {
    if (poll?.pollType === 'EXAM' && poll?.settings?.examTimerDuration) {
      return poll.settings.examTimerDuration * 60;
    }
    if (!poll || !poll.questions || !poll.questions[0]) return 90;
    const type = poll.questions[0].type;
    if (type === 'KNOCKOUT') return 300;
    if (type === 'RANKED') return 180;
    return 90;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Keep answers and proctorLogs synchronized to localStorage so we can auto-submit them if the user refreshes/reloads
  useEffect(() => {
    if (pollId && Object.keys(selectedAnswers).length > 0) {
      localStorage.setItem(`selected_answers_${pollId}`, JSON.stringify(selectedAnswers));
    }
  }, [selectedAnswers, pollId]);

  useEffect(() => {
    if (pollId && proctorLogs.length > 0) {
      localStorage.setItem(`proctor_logs_${pollId}`, JSON.stringify(proctorLogs));
    }
  }, [proctorLogs, pollId]);

  const hasCheckedReloadRef = useRef(false);

  // Page Refresh Detection & Lockout for secure exams
  useEffect(() => {
    if (!poll || poll.pollType !== 'EXAM' || hasCheckedReloadRef.current) return;
    hasCheckedReloadRef.current = true;

    const storageKey = `exam_in_progress_${pollId}`;
    const inProgress = localStorage.getItem(storageKey);

    if (inProgress === 'true') {
      // The user refreshed the page while the exam was in progress!
      setVotedSuccessfully(true);

      const autoSubmitDueToRefresh = async () => {
        try {
          const storedLogsStr = localStorage.getItem(`proctor_logs_${pollId}`) || '[]';
          let storedLogs: string[] = [];
          try {
            storedLogs = JSON.parse(storedLogsStr);
          } catch (_) {}

          const time = new Date().toLocaleTimeString();
          const refreshLog = `🚨 Page refresh / reload detected (attempt to restart blocked) at ${time}`;
          const updatedLogs = [...storedLogs, refreshLog];

          localStorage.setItem(`proctor_logs_${pollId}`, JSON.stringify(updatedLogs));

          let detectedDevice = 'Desktop';
          const rawUA = navigator?.userAgent || '';
          const isTabletUA = /Tablet|iPad|Playbook|Silk|Kindle/i.test(rawUA) || ( /Android/i.test(rawUA) && !/Mobile/i.test(rawUA) );
          const isMobileUA = /Mobi|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|webOS|Windows Phone/i.test(rawUA) || ( /Android/i.test(rawUA) && /Mobile/i.test(rawUA) );
          const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator && navigator.maxTouchPoints > 1));
          const screenW = typeof window !== 'undefined' ? (window.screen.width || window.innerWidth) : 1024;
          const isMobilePlatform = /iphone|ipod/i.test(navigator?.platform || '') || ((navigator as any)?.userAgentData?.mobile === true);
          const isTabletPlatform = /ipad/i.test(navigator?.platform || '');

          if (isMobileUA || isMobilePlatform || (isTouch && screenW <= 480)) {
            detectedDevice = 'Mobile';
          } else if (isTabletUA || isTabletPlatform || (isTouch && screenW > 480 && screenW <= 1024 && !/Macintosh/i.test(navigator?.platform || ''))) {
            detectedDevice = 'Tablet';
          } else if (isTouch && screenW <= 1024 && /MacIntel/.test(navigator?.platform || '')) {
            detectedDevice = 'Tablet';
          }

          const savedAnswersStr = localStorage.getItem(`selected_answers_${pollId}`) || '{}';
          let savedAnswers: any = {};
          try {
            savedAnswers = JSON.parse(savedAnswersStr);
          } catch (_) {}

          // Also save in DB
          const res = await fetch(`/api/polls/${pollId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              answers: { ...savedAnswers, __proctorLogs: updatedLogs },
              voterToken: poll.isOpenVoting ? undefined : voterToken,
              email: poll.isOpenVoting && poll.settings?.limitOneVotePerUser ? openEmail : undefined,
              latitude: null,
              longitude: null,
              device: detectedDevice,
              isAutoSubmitted: true,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            setFlaggedSuspicious(data.flaggedSuspicious || false);
          }

          // Clear localStorage proctor keys so the student is not stuck in a reload loop
          localStorage.removeItem(`poll_start_time_${pollId}`);
          localStorage.removeItem(`pollstar_resume_${pollId}`);
          localStorage.removeItem(`exam_in_progress_${pollId}`);
          localStorage.removeItem(`selected_answers_${pollId}`);
          localStorage.removeItem(`proctor_logs_${pollId}`);

          // Emit alert socket event so teacher gets notified immediately
          const socket = io();
          socket.emit('join-poll', pollId);
          socket.emit('student-telemetry', {
            pollId,
            studentId: activeVoterIdentifier || examineeSessionId || 'anonymous',
            studentName: confirmer1 || activeVoterIdentifier || (examineeSessionId ? `Examinee #${examineeSessionId.slice(-4)}` : 'Anonymous Student'),
            identifier: voterIdentifier || (examineeSessionId ? `Guest #${examineeSessionId.slice(-4)}` : 'Guest'),
            status: 'OFFLINE',
            alert: '🚨 Page refreshed (Attempt to restart blocked)',
            webcamFrame: '',
            screenFrame: '',
            logs: updatedLogs,
            lastActive: new Date().toLocaleTimeString()
          });
          setTimeout(() => socket.disconnect(), 1000);

        } catch (e) {
          console.error(e);
        }
      };

      autoSubmitDueToRefresh();
    }
  }, [poll, pollId, voterToken, openEmail, activeVoterIdentifier, confirmer1, voterIdentifier, examineeSessionId]);

  // 1. Session Active detection & persistent start timestamp binding
  useEffect(() => {
    const isVotingActive = (!loading && poll) && (
      (!poll.isOpenVoting && verifiedVoter && !votedSuccessfully) || 
      (poll.isOpenVoting && !showIntro && !votedSuccessfully)
    );

    if (isVotingActive) {
      const duration = getSessionDuration();
      const storageKey = `poll_start_time_${pollId}`;
      let startTimeStampStr = localStorage.getItem(storageKey);
      let remaining = duration;
      
      if (startTimeStampStr) {
        const startTimeStamp = parseInt(startTimeStampStr, 10);
        const elapsed = Math.floor((Date.now() - startTimeStamp) / 1000);
        remaining = duration - elapsed;
      } else {
        localStorage.setItem(storageKey, Date.now().toString());
      }
      
      setTimeLeft(remaining > 0 ? remaining : 0);
      setTimerActive(true);
    } else {
      setTimerActive(false);
      setTimeLeft(null);
    }
  }, [verifiedVoter, votedSuccessfully, poll, showIntro, loading, pollId]);

  // 2. Countdown decrement timer effect
  useEffect(() => {
    if (!timerActive || timeLeft === null) return;

    if (timeLeft <= 0 || (poll && poll.endTime && Date.now() > new Date(poll.endTime).getTime())) {
      setVerifiedVoter(false);
      setVoterToken('');
      setLookupPassed(false);
      setVoterIdentifier('');
      setConfirmer1('');
      setConfirmer2('');
      setVoterEmail('');
      setTimerActive(false);
      setTimeLeft(null);
      localStorage.removeItem(`poll_start_time_${pollId}`);
      
      // Auto submit paper on timeout
      const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.click();
      }
      
      alert(`⏱️ Session Expired! Your exam has been automatically submitted.`);
      return;
    }

    const interval = setInterval(() => {
      if (poll && poll.endTime && Date.now() > new Date(poll.endTime).getTime()) {
        setTimeLeft(0);
      } else {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, timeLeft, pollId, poll]);

  // 3. Tab change / leave / blur detection and Auto-submit
  useEffect(() => {
    if (!timerActive || !poll?.settings) return;

    const settings = poll.settings;
    const shouldTabLeaveSubmit = settings.enableAutoSubmitOnTabLeave;
    const shouldLeaveSubmit = settings.enableAutoSubmitOnLeave;

    const triggerAutoSubmit = async () => {
      console.log("Triggering exam auto-submit due to safeguard policy");

      // Play beep sound
      playWarningBeep();

      setVoteLoading(true);
      try {
        let detectedDevice = 'Desktop';
        const rawUA = navigator?.userAgent || '';
        const isTabletUA = /Tablet|iPad|Playbook|Silk|Kindle/i.test(rawUA) || ( /Android/i.test(rawUA) && !/Mobile/i.test(rawUA) );
        const isMobileUA = /Mobi|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|webOS|Windows Phone/i.test(rawUA) || ( /Android/i.test(rawUA) && /Mobile/i.test(rawUA) );
        const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator && navigator.maxTouchPoints > 1));
        const screenW = typeof window !== 'undefined' ? (window.screen.width || window.innerWidth) : 1024;
        const isMobilePlatform = /iphone|ipod/i.test(navigator?.platform || '') || ((navigator as any)?.userAgentData?.mobile === true);
        const isTabletPlatform = /ipad/i.test(navigator?.platform || '');

        if (isMobileUA || isMobilePlatform || (isTouch && screenW <= 480)) {
          detectedDevice = 'Mobile';
        } else if (isTabletUA || isTabletPlatform || (isTouch && screenW > 480 && screenW <= 1024 && !/Macintosh/i.test(navigator?.platform || ''))) {
          detectedDevice = 'Tablet';
        } else if (isTouch && screenW <= 1024 && /MacIntel/.test(navigator?.platform || '')) {
          detectedDevice = 'Tablet';
        }

        const res = await fetch(`/api/polls/${pollId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: { 
              ...selectedAnswersRef.current, 
              __proctorLogs: proctorLogsRef.current,
              __webcamFrame: latestWebcamFrameRef.current,
              __screenFrame: latestScreenFrameRef.current,
              __webcamFrames: recordedWebcamFramesRef.current,
              __screenFrames: recordedScreenFramesRef.current,
            },
            confidenceValues: Object.keys(confidenceValuesRef.current).length > 0 ? confidenceValuesRef.current : undefined,
            voterToken: poll.isOpenVoting ? undefined : voterToken,
            email: poll.isOpenVoting && poll.settings?.limitOneVotePerUser ? openEmail : undefined,
            latitude: null,
            longitude: null,
            device: detectedDevice,
            isAutoSubmitted: true,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to submit exam paper');
        }

        setVotedSuccessfully(true);
        setFlaggedSuspicious(data.flaggedSuspicious || false);
        localStorage.removeItem(`poll_start_time_${pollId}`);
        localStorage.removeItem(`pollstar_resume_${pollId}`);
        localStorage.removeItem(`exam_in_progress_${pollId}`);
        localStorage.removeItem(`selected_answers_${pollId}`);
        localStorage.removeItem(`proctor_logs_${pollId}`);
        
        // Stop active media streams on submission
        if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(t => t.stop());
        if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop());
        if (socketRef.current) socketRef.current.disconnect();

      } catch (err: any) {
        console.error("Auto submit submission error:", err);
        setError(err.message || "Failed to auto-submit exam.");
      } finally {
        setVoteLoading(false);
      }
    };

    let graceActive = true;
    const gracePeriodTimer = setTimeout(() => { graceActive = false; }, 10000); // Generous 10s grace period for startup transitions!

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !graceActive) {
        const time = new Date().toLocaleTimeString();
        addProctorLog(`⚠️ Tab switched / minimized at ${time}`);
        playWarningBeep();

        if (shouldTabLeaveSubmit) {
          triggerAutoSubmit();
          alert("⚠️ Tab switch detected! Your exam is being automatically submitted due to security policy.");
        } else {
          alert("⚠️ Tab switch detected! This violation has been logged to the examiner's console.");
        }
      }
    };

    let blurTimer: ReturnType<typeof setTimeout> | null = null;

    const handleWindowBlur = () => {
      if (graceActive) return;
      
      const time = new Date().toLocaleTimeString();
      addProctorLog(`⚠️ Lost window focus (clicked outside or opened other app) at ${time}`);
      playWarningBeep();

      if (shouldTabLeaveSubmit) {
        blurTimer = setTimeout(() => {
          if (!document.hasFocus()) {
            triggerAutoSubmit();
            alert("⚠️ Window focus lost! Your exam is being automatically submitted due to security policy.");
          }
        }, 2000);
      }
    };

    const handleWindowFocus = () => {
      if (blurTimer !== null) {
        clearTimeout(blurTimer);
        blurTimer = null;
      }
    };

    const handleBeforeUnload = () => {
      if (shouldLeaveSubmit) {
        const detectedDevice = 'Desktop'; 
        const bodyStr = JSON.stringify({
          answers: { 
            ...selectedAnswersRef.current, 
            __proctorLogs: proctorLogsRef.current,
            __webcamFrame: latestWebcamFrameRef.current,
            __screenFrame: latestScreenFrameRef.current,
            __webcamFrames: recordedWebcamFramesRef.current,
            __screenFrames: recordedScreenFramesRef.current,
          },
          voterToken: poll.isOpenVoting ? undefined : voterToken,
          email: poll.isOpenVoting && poll.settings?.limitOneVotePerUser ? openEmail : undefined,
          latitude: 22.5726, 
          longitude: 88.3639,
          device: detectedDevice,
          isAutoSubmitted: true,
        });
        
        navigator.sendBeacon(`/api/polls/${pollId}/vote`, bodyStr);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    if (shouldLeaveSubmit) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      clearTimeout(gracePeriodTimer);
      if (blurTimer !== null) clearTimeout(blurTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [timerActive, pollId]);

  // 4. Fullscreen enforcement and exit tracking
  useEffect(() => {
    if (!timerActive || !poll?.settings?.enableProctorCamera || showIntro) return;

    const handleFullscreenChange = () => {
      const isFullscreen = !!(document.fullscreenElement);
      setIsFullscreenLocked(isFullscreen);
      if (!isFullscreen) {
        const time = new Date().toLocaleTimeString();
        addProctorLog(`🚨 Exited fullscreen mode at ${time}`);
        playWarningBeep();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [timerActive, poll, showIntro]);

  // 5. Periodic Socket.io Webcam & Screen telemetry frame emitter
  useEffect(() => {
    const isProctorActive = !showIntro && timerActive && poll?.settings?.enableProctorCamera;
    if (!isProctorActive) return;

    // Local off-screen video elements kept as a robust fallback
    const webVideo = document.createElement('video');
    webVideo.autoplay = true;
    webVideo.playsInline = true;
    webVideo.muted = true;
    webVideo.style.position = 'fixed';
    webVideo.style.top = '-9999px';
    webVideo.style.left = '-9999px';
    webVideo.style.width = '1px';
    webVideo.style.height = '1px';
    webVideo.style.opacity = '0';
    webVideo.style.pointerEvents = 'none';
    document.body.appendChild(webVideo);

    if (cameraStream) {
      webVideo.srcObject = cameraStream;
      webVideo.play().catch(e => console.warn("Failed webVideo play:", e));
    }

    const scrVideo = document.createElement('video');
    scrVideo.autoplay = true;
    scrVideo.playsInline = true;
    scrVideo.muted = true;
    scrVideo.style.position = 'fixed';
    scrVideo.style.top = '-9999px';
    scrVideo.style.left = '-9999px';
    scrVideo.style.width = '1px';
    scrVideo.style.height = '1px';
    scrVideo.style.opacity = '0';
    scrVideo.style.pointerEvents = 'none';
    document.body.appendChild(scrVideo);

    if (screenStream) {
      scrVideo.srcObject = screenStream;
      scrVideo.play().catch(e => console.warn("Failed scrVideo play:", e));
    }

    const webCanvas = document.createElement('canvas');
    webCanvas.width = 160;
    webCanvas.height = 120;
    const webCtx = webCanvas.getContext('2d');

    const scrCanvas = document.createElement('canvas');
    scrCanvas.width = 240;
    scrCanvas.height = 180;
    const scrCtx = scrCanvas.getContext('2d');

    const sendTelemetryFrame = () => {
      let webcamFrame = '';
      let screenFrame = '';

      // Highly robust: Prioritize active DOM video elements playing/decoded inside the document
      const activeWebVideo = localWebcamVideoRef.current || webVideo;
      const activeScrVideo = localScreenVideoRef.current || scrVideo;

      if (cameraStream && webCtx && activeWebVideo) {
        try {
          webCtx.drawImage(activeWebVideo, 0, 0, 160, 120);
          webcamFrame = webCanvas.toDataURL('image/jpeg', 0.5);
        } catch (e) {
          console.error("Webcam capture error:", e);
        }
      }

      if (screenStream && scrCtx && activeScrVideo && !isScreenShareFallbackRef.current) {
        try {
          scrCtx.drawImage(activeScrVideo, 0, 0, 240, 180);
          screenFrame = scrCanvas.toDataURL('image/jpeg', 0.4);
        } catch (e) {
          console.warn("Screen capture draw error, trying fallback rendering:", e);
        }
      }

      if (!screenFrame && scrCtx) {
        try {
          // Programmatically construct a beautiful high-fidelity simulated screenshot!
          // 1. Paint dark slate background
          scrCtx.fillStyle = '#0f172a';
          scrCtx.fillRect(0, 0, 240, 180);

          // 2. Draw mock browser header
          scrCtx.fillStyle = '#1e1b4b';
          scrCtx.fillRect(0, 0, 240, 25);

          // 3. Draw MacOS window buttons
          scrCtx.fillStyle = '#ef4444'; // Red
          scrCtx.beginPath(); scrCtx.arc(10, 12, 3, 0, 2 * Math.PI); scrCtx.fill();
          scrCtx.fillStyle = '#f59e0b'; // Yellow
          scrCtx.beginPath(); scrCtx.arc(18, 12, 3, 0, 2 * Math.PI); scrCtx.fill();
          scrCtx.fillStyle = '#10b981'; // Green
          scrCtx.beginPath(); scrCtx.arc(26, 12, 3, 0, 2 * Math.PI); scrCtx.fill();

          // 4. Draw Address Bar
          scrCtx.fillStyle = '#020617';
          scrCtx.fillRect(40, 4, 160, 16);
          scrCtx.fillStyle = '#6366f1';
          scrCtx.font = '8px monospace';
          scrCtx.fillText('pollstar.com/exam/' + pollId.slice(0, 6) + '...', 46, 15);

          // 5. Draw active workspace title
          scrCtx.fillStyle = '#ffffff';
          scrCtx.font = 'bold 9px sans-serif';
          scrCtx.fillText((poll?.title || 'Exam Session').slice(0, 28), 10, 42);

          // 6. Draw Candidate status
          scrCtx.fillStyle = '#a78bfa';
          scrCtx.font = '8px sans-serif';
          scrCtx.fillText((confirmer1Ref.current || activeVoterIdentifierRef.current || 'Examinee').slice(0, 25), 10, 56);

          // 7. Draw active question details
          const totalQ = poll?.questions?.length || 0;
          const answered = poll?.questions?.filter((q: any) => {
            const ans = selectedAnswersRef.current[q.id];
            if (ans === undefined || ans === null || ans === '') return false;
            if (Array.isArray(ans) && ans.length === 0) return false;
            if (typeof ans === 'object' && Object.keys(ans).length === 0) return false;
            return true;
          }).length || 0;

          scrCtx.fillStyle = '#334155';
          scrCtx.fillRect(10, 66, 220, 70);

          scrCtx.fillStyle = '#cbd5e1';
          scrCtx.font = 'bold 8px sans-serif';
          scrCtx.fillText(`WORKSPACE STATUS: ACTIVE`, 15, 78);

          scrCtx.fillStyle = '#94a3b8';
          scrCtx.font = '7px sans-serif';
          scrCtx.fillText(`Questions Answered: ${answered} / ${totalQ}`, 15, 92);
          
          const violationCount = proctorLogsRef.current.filter((log: string) => log.includes('🚨') || log.includes('⚠️')).length;
          scrCtx.fillStyle = violationCount > 0 ? '#f87171' : '#34d399';
          scrCtx.fillText(`Security Violations: ${violationCount}`, 15, 104);

          // Display active selection overview
          scrCtx.fillStyle = '#e2e8f0';
          scrCtx.font = '7px sans-serif';
          scrCtx.fillText(`Device platform: ${isMobileUA || isMobilePlatform || (isTouch && screenW <= 480) ? 'Mobile' : (isTabletUA || isTabletPlatform ? 'Tablet' : 'Desktop')}`, 15, 116);
          scrCtx.fillText(`Focus State: ${document.hidden ? '⚠️ Tab Minimised' : '🟢 Active Workspace'}`, 15, 128);

          // 8. Draw Progress Bar
          scrCtx.fillStyle = '#1e293b';
          scrCtx.fillRect(10, 146, 220, 6);
          scrCtx.fillStyle = '#6366f1';
          const progressPct = totalQ > 0 ? (answered / totalQ) : 0;
          scrCtx.fillRect(10, 146, 220 * progressPct, 6);

          // 9. Draw Footer Timer countdown
          scrCtx.fillStyle = '#94a3b8';
          scrCtx.font = 'bold 8px monospace';
          const timeString = timeLeftRef.current !== null ? formatTime(timeLeftRef.current) : 'No Timer';
          scrCtx.fillText(`⏱️ TIME REMAINING: ${timeString}`, 10, 168);

          screenFrame = scrCanvas.toDataURL('image/jpeg', 0.4);
        } catch (e) {
          console.error("Simulated screen capture error:", e);
        }
      }

      if (webcamFrame) {
        latestWebcamFrameRef.current = webcamFrame;
        if (recordedWebcamFramesRef.current.length < 200) {
          recordedWebcamFramesRef.current.push(webcamFrame);
        }
      }
      if (screenFrame) {
        latestScreenFrameRef.current = screenFrame;
        if (recordedScreenFramesRef.current.length < 200) {
          recordedScreenFramesRef.current.push(screenFrame);
        }
      }

      if (socketRef.current) {
        socketRef.current.emit('student-telemetry', {
          pollId,
          studentId: activeVoterIdentifierRef.current || examineeSessionIdRef.current || 'anonymous',
          studentName: confirmer1Ref.current || activeVoterIdentifierRef.current || (examineeSessionIdRef.current ? `Examinee #${examineeSessionIdRef.current.slice(-4)}` : 'Anonymous Student'),
          identifier: voterIdentifierRef.current || (examineeSessionIdRef.current ? `Guest #${examineeSessionIdRef.current.slice(-4)}` : 'Guest'),
          status: (isFullscreenLockedRef.current && (isScreenSharedRef.current || isScreenShareFallbackRef.current) && !document.hidden) ? 'ACTIVE' : 'OFFLINE',
          alert: !isFullscreenLockedRef.current 
            ? '🚨 Exited Fullscreen Mode' 
            : ((!isScreenSharedRef.current && !isScreenShareFallbackRef.current) 
                ? '🚨 Stopped Screen Share' 
                : (document.hidden 
                    ? '⚠️ Tab Switched' 
                    : (isScreenShareFallbackRef.current ? '🟢 Focus Active (Simulated Screen)' : '🟢 Focus Active (No anomalies)'))),
          webcamFrame,
          screenFrame,
          webcamFrames: recordedWebcamFramesRef.current,
          screenFrames: recordedScreenFramesRef.current,
          logs: proctorLogsRef.current,
          lastActive: new Date().toLocaleTimeString()
        });
      }
    };

    sendTelemetryFrame();
    const telemetryInterval = setInterval(sendTelemetryFrame, 3000);

    return () => {
      clearInterval(telemetryInterval);
      webVideo.srcObject = null;
      scrVideo.srcObject = null;
      try {
        document.body.removeChild(webVideo);
        document.body.removeChild(scrVideo);
      } catch (_) {}
    };
  }, [showIntro, timerActive, cameraStream, screenStream]);

  // Clean up media streams and socket on component unmount
  useEffect(() => {
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
      if (screenStream) screenStream.getTracks().forEach(t => t.stop());
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [cameraStream, screenStream]);

  // Continuous lock alert warning beep effect
  useEffect(() => {
    const isLocked = poll?.settings?.enableProctorCamera && !showIntro && !votedSuccessfully && (poll.isOpenVoting || verifiedVoter) && (!isFullscreenLocked || (!isScreenShared && !isScreenShareFallback));
    if (!isLocked) return;

    const playBeep = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(650, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      } catch (e) {}
    };

    playBeep();
    const beepInterval = setInterval(playBeep, 1500);

    return () => clearInterval(beepInterval);
  }, [showIntro, timerActive, isFullscreenLocked, isScreenShared, isScreenShareFallback, votedSuccessfully, verifiedVoter, poll]);

  // Callback Ref for the video element to safely bind the stream on mount
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    localWebcamVideoRef.current = node;
    if (node && cameraStream) {
      node.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // 5. Keyboard and Copy/Paste/Select blocking for exams
  useEffect(() => {
    if (!poll?.settings?.enableCopyPasteBlock) return;

    const handleBlock = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleKeyDownBlock = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (isMeta && (key === 'c' || key === 'v' || key === 'x' || key === 'a')) {
        e.preventDefault();
        e.stopPropagation();
        alert("🔒 Copy/Paste and selection are strictly disabled for this exam.");
      }
    };

    document.addEventListener('copy', handleBlock, true);
    document.addEventListener('cut', handleBlock, true);
    document.addEventListener('paste', handleBlock, true);
    document.addEventListener('contextmenu', handleBlock, true);
    window.addEventListener('keydown', handleKeyDownBlock, true);

    const style = document.createElement('style');
    style.id = 'block-select-style';
    style.innerHTML = `
      body, html, *, input, textarea {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('copy', handleBlock, true);
      document.removeEventListener('cut', handleBlock, true);
      document.removeEventListener('paste', handleBlock, true);
      document.removeEventListener('contextmenu', handleBlock, true);
      window.removeEventListener('keydown', handleKeyDownBlock, true);
      const styleEl = document.getElementById('block-select-style');
      if (styleEl) styleEl.remove();
    };
  }, [poll]);

  // 1. Fetch Poll Metadata on Mount
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch poll details');
        }

        const fetchedPoll = data.poll;

        // Client-side deadline enforcement: if endTime has passed, treat as ENDED
        if (fetchedPoll.status === 'ACTIVE' && fetchedPoll.endTime && Date.now() > new Date(fetchedPoll.endTime).getTime()) {
          fetchedPoll.status = 'ENDED';
        }

        setPoll(fetchedPoll);
        if (fetchedPoll.pollType === 'EXAM') {
          setChatName('Guest Student');
        }
        if (fetchedPoll.pollType === 'SURVEY') {
          const startPage = fetchedPoll.settings?.enableCrossTabulation ? 0 : 1;
          setCurrentPage(startPage);
          setPageHistory([startPage]);
        }
        setLiveStats(fetchedPoll.stats || {});
        setLiveTotalVotes(fetchedPoll.totalVotes || 0);

        const activeQ = data.poll.questions?.[0];
        if (activeQ && activeQ.type === 'KNOCKOUT') {
          initializeKnockout(activeQ.options);
        }

        if (data.poll.settings) {
          setIdentifierLabel(data.poll.settings.identifierLabel || 'Roll Number');
          setConfirmer1Label(data.poll.settings.confirmer1Label || 'Student Name');
          setConfirmer2Label(data.poll.settings.confirmer2Label || 'Parent Name');
        }
        
        // Setup initial locations list if present
        if (data.poll.votes) {
          const locs = data.poll.votes.map((v: any) => ({
            ipAddress: v.ipAddress,
            isp: v.isp,
            flaggedSuspicious: v.flaggedSuspicious,
            lat: v.latitude !== null && v.latitude !== undefined ? Number(v.latitude) : 22.5726,
            lon: v.longitude !== null && v.longitude !== undefined ? Number(v.longitude) : 88.3639,
          }));
          setLiveVoterLocations(locs);
        }

        // Initialize captcha math values
        setCaptchaNum1(Math.floor(Math.random() * 9) + 2);
        setCaptchaNum2(Math.floor(Math.random() * 9) + 2);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [pollId]);

  // OTP Verification countdown decrement effect
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpCooldown]);
  // 2. Real-Time Serverless Polling Connection
  useEffect(() => {
    if (!poll || !poll.isResultPublic) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}`);
        const data = await res.json();
        if (res.ok && data.poll) {
          setLiveStats(data.poll.stats || {});
          setLiveTotalVotes(data.poll.totalVotes || 0);
          setPoll((prev: any) => (prev ? { ...prev, status: data.poll.status, votes: data.poll.votes || prev.votes } : data.poll));

          if (data.poll.votes) {
            const locs = data.poll.votes.map((v: any) => ({
              ipAddress: v.ipAddress,
              isp: v.isp,
              flaggedSuspicious: v.flaggedSuspicious,
              lat: v.latitude !== null && v.latitude !== undefined ? Number(v.latitude) : 22.5726,
              lon: v.longitude !== null && v.longitude !== undefined ? Number(v.longitude) : 88.3639,
            }));
            setLiveVoterLocations(locs);
          }
        }
      } catch (err) {
        console.error('Real-time sync error:', err);
      }
    }, 4000); // Refresh every 4 seconds

    return () => clearInterval(interval);
  }, [poll, pollId]);

  // ────────────────────────────────────────────────────────
  // CLOSED VOTER SECURE VERIFICATION PORTAL
  // ────────────────────────────────────────────────────────

  // Step 0: Lookup unique identifier in database
  const handleLookupIdentifier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLookupLoading(true);

    try {
      const res = await fetch(`/api/polls/${pollId}/verify-voter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'LOOKUP_IDENTIFIER',
          identifier: voterIdentifier,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Identifier lookup failed');
      }

      setConfirmer1(data.confirmer1Value);
      setConfirmer2(data.confirmer2Value);
      setVoterEmail(data.emailValue);
      setVoterPhone(data.phoneValue || '');
      setVerificationMethod(data.verificationMethod || 'EMAIL');
      setVerificationType(data.verificationType || 'OTP');
      setVoterId(data.voterId || '');
      
      // Update custom labels returned from backend if any
      if (data.labels) {
        setIdentifierLabel(data.labels.identifierLabel);
        setConfirmer1Label(data.labels.confirmer1Label);
        setConfirmer2Label(data.labels.confirmer2Label);
      }

      setLookupPassed(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  // Step 1: Submit allowed credentials to request email verification code
  const handleVoterRequestOtp = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const isPhoneMethod = verificationMethod === 'PHONE';
    const isPasswordType = verificationType === 'PASSWORD';

    if (!voterIdentifier || !confirmer1 || (isPhoneMethod ? !voterPhone : !voterEmail)) {
      setError(`Compulsory verification credentials (${identifierLabel}, ${confirmer1Label}, and ${isPhoneMethod ? 'Phone' : 'Email'}) are empty.`);
      return;
    }

    if (isPasswordType && !voterPassword) {
      setError('Access password is required.');
      return;
    }

    if (otpCooldown > 0 && !isPasswordType) {
      setOtpSendLoading(true);
      try {
        const res = await fetch(`/api/polls/${pollId}/verify-voter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'CHECK_BYPASS', email: voterEmail, voterId }),
        });
        const data = await res.json();

        if (data.success && data.granted && data.voterToken) {
          setBypassPopup({ visible: true, message: `30 second bypass is enabled for you. Redirecting directly to ${poll?.pollType === 'EXAM' ? 'exam paper' : (poll?.pollType === 'SURVEY' ? 'questionnaire' : 'ballot')}...` });
          setTimeout(() => {
            setVoterToken(data.voterToken);
            setVerifiedVoter(true);
            if (data.hasVotedAlready) {
              setVotedSuccessfully(true);
            }
            setShowOtpPopup(false);
            setBypassPopup({ visible: false, message: '' });
            setCaptchaNum1(Math.floor(Math.random() * 8) + 2);
            setCaptchaNum2(Math.floor(Math.random() * 8) + 2);
            setCaptchaAnswer('');
          }, 2500);
          return;
        }
      } catch (err) {
        console.error('Bypass check failed:', err);
      } finally {
        setOtpSendLoading(false);
      }

      setError(`OTP rate limited. Please wait ${otpCooldown}s before requesting a new code.`);
      return;
    }

    setOtpSendLoading(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/verify-voter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'REQUEST_OTP',
          voterId,
          identifier: voterIdentifier,
          confirmer1,
          confirmer2,
          email: voterEmail,
          phone: voterPhone,
          password: voterPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm credentials');
      }

      // Handle password direct verification bypass
      if (data.isPasswordVerify && data.voterToken) {
        setVoterToken(data.voterToken);
        setVerifiedVoter(true);
        if (data.hasVotedAlready) {
          setVotedSuccessfully(true);
        }
        setShowOtpPopup(false);
        setCaptchaNum1(Math.floor(Math.random() * 8) + 2);
        setCaptchaNum2(Math.floor(Math.random() * 8) + 2);
        setCaptchaAnswer('');
        return;
      }

      // Handle creator-granted OTP bypass (30s window)
      if (data.isBypassGranted && data.voterToken) {
        setBypassPopup({ visible: true, message: `30 second bypass is enabled for you. Redirecting directly to ${poll?.pollType === 'EXAM' ? 'exam paper' : (poll?.pollType === 'SURVEY' ? 'questionnaire' : 'ballot')}...` });
        setTimeout(() => {
          setVoterToken(data.voterToken);
          setVerifiedVoter(true);
          if (data.hasVotedAlready) {
            setVotedSuccessfully(true);
          }
          setShowOtpPopup(false);
          setBypassPopup({ visible: false, message: '' });
          setCaptchaNum1(Math.floor(Math.random() * 8) + 2);
          setCaptchaNum2(Math.floor(Math.random() * 8) + 2);
          setCaptchaAnswer('');
        }, 2500);
        return;
      }

      // Handle low-priority bypass (no OTP required)
      if (data.isLowPriority && data.voterToken) {
        setVoterToken(data.voterToken);
        setVerifiedVoter(true);
        if (data.hasVotedAlready) {
          setVotedSuccessfully(true);
        }
        setShowOtpPopup(false);
        setCaptchaNum1(Math.floor(Math.random() * 8) + 2);
        setCaptchaNum2(Math.floor(Math.random() * 8) + 2);
        setCaptchaAnswer('');
        return;
      }

      setOtpSentOnce(true);
      setOtpCooldown(15); // 15 seconds rate limit cooldown
      if (data.hasVotedAlready) {
        (window as any)._hasVotedAlready = true;
      }
      setShowOtpPopup(true);
      setOtpError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOtpSendLoading(false);
    }
  };

  // Step 2: Confirm OTP to get secure voter session Token
  const handleVerifyVoterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    try {
      const res = await fetch(`/api/polls/${pollId}/verify-voter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'VERIFY_OTP',
          email: voterEmail,
          otp: otpCode,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      setVoterToken(data.voterToken);
      setVerifiedVoter(true);
      if (data.hasVotedAlready || (window as any)._hasVotedAlready) {
        setVotedSuccessfully(true);
      }
      setShowOtpPopup(false);
      
      // Load standard captcha refresh
      setCaptchaNum1(Math.floor(Math.random() * 8) + 2);
      setCaptchaNum2(Math.floor(Math.random() * 8) + 2);
      setCaptchaAnswer('');
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // SOS Request Bypass Logic
  const handleRequestBypass = async () => {
    setBypassStatus('REQUESTING');
    try {
      const res = await fetch(`/api/polls/${pollId}/request-bypass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: voterEmail, voterId }),
      });
      if (res.ok) {
        setBypassStatus('WAITING');
      } else {
        setBypassStatus('IDLE');
        setOtpError('Failed to request bypass. Please try again.');
      }
    } catch (e) {
      setBypassStatus('IDLE');
      setOtpError('Failed to request bypass.');
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (bypassStatus === 'WAITING') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/polls/${pollId}/verify-voter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step: 'CHECK_BYPASS', email: voterEmail, voterId }),
          });
          const data = await res.json();
          if (data.success && data.granted) {
            setVerifiedVoter(true);
            setVoterToken(data.voterToken);
            if (data.hasVotedAlready || (window as any)._hasVotedAlready) {
              setVotedSuccessfully(true);
            }
            setShowOtpPopup(false);
            setBypassStatus('GRANTED');
            
            // Load standard captcha refresh
            setCaptchaNum1(Math.floor(Math.random() * 8) + 2);
            setCaptchaNum2(Math.floor(Math.random() * 8) + 2);
            setCaptchaAnswer('');
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [bypassStatus, pollId, voterEmail, voterId]);

  // ────────────────────────────────────────────────────────
  // CLICK-TO-RANK PRIORITY SELECTOR
  // ────────────────────────────────────────────────────────
  
  const handleRankClick = (optionId: string, questionId: string) => {
    let updated;
    if (rankedSelections.includes(optionId)) {
      // Remove rank
      updated = rankedSelections.filter((id) => id !== optionId);
    } else {
      // Append rank
      updated = [...rankedSelections, optionId];
    }
    
    setRankedSelections(updated);
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: updated,
    });
  };

  const handleResetRankings = (questionId: string) => {
    setRankedSelections([]);
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: [],
    });
  };

  const handleRankDrop = (draggedId: string, targetId: string, questionId: string) => {
    if (!draggedId || draggedId === targetId) return;

    const withoutDragged = rankedSelections.filter((id) => id !== draggedId);
    const targetIndex = withoutDragged.indexOf(targetId);
    const updated = [...withoutDragged];

    if (targetIndex === -1) {
      updated.push(draggedId);
    } else {
      updated.splice(targetIndex, 0, draggedId);
    }

    setRankedSelections(updated);
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: updated,
    });
  };

  // ────────────────────────────────────────────────────────
  // SURVEY NAVIGATION HANDLERS &skip branching logic
  // ────────────────────────────────────────────────────────

  const handleSurveyNext = () => {
    setError('');

    // Demographic verification (page 0)
    if (currentPage === 0) {
      if (!selectedAnswers['__demo_age'] || !selectedAnswers['__demo_region'] || !selectedAnswers['__demo_gender']) {
        setError('Please complete all demographic questions to continue.');
        return;
      }
      setCurrentPage(1);
      setPageHistory([...pageHistory, 1]);
      return;
    }

    // Filter questions on current page
    const currentQList = poll.questions.filter((q: any) => q.pageNumber === currentPage);

    // Question completeness verification
    for (const q of currentQList) {
      const ans = selectedAnswers[q.id];
      const rankedRequiredCount = poll.settings?.enableRankCompleteness
        ? (poll.settings?.rankedCompletenessRule === 'FULL'
            ? q.options?.length
            : poll.settings?.rankedCompletenessRule === 'TOP_3'
              ? Math.min(3, q.options?.length || 0)
              : 1)
        : q.options?.length;

      if (
        ans === undefined ||
        ans === null ||
        (['MULTIPLE_CHOICE', 'MULTI_SELECT'].includes(q.type) && ans.length === 0) ||
        (q.type === 'RANKED' && ans.length < rankedRequiredCount) ||
        (q.type === 'SHORT_TEXT' && ans.trim() === '') ||
        (q.type === 'LONG_TEXT' && ans.trim() === '') ||
        (q.type === 'RATING' && ans === 0)
      ) {
        setError('Please complete all questions on this page before continuing.');
        return;
      }
    }

    // Compute next page by checking logic rules
    let nextPage: number | 'END' = currentPage + 1;

    for (const q of currentQList) {
      if (q.type === 'SINGLE' && q.logicRules && (q.logicRules as any).rules) {
        const ans = selectedAnswers[q.id];
        const chosenOption = q.options.find((opt: any) => opt.id === ans);
        if (chosenOption) {
          const matchingRule = (q.logicRules as any).rules.find((r: any) => r.option === chosenOption.text);
          if (matchingRule) {
            nextPage = matchingRule.goToPage;
            break;
          }
        }
      }
    }

    const maxPages = Math.max(...poll.questions.map((qu: any) => qu.pageNumber || 1));
    if (nextPage === 'END' || (typeof nextPage === 'number' && nextPage > maxPages)) {
      setCurrentPage(maxPages + 1); // Go to final review/submit step
      setPageHistory([...pageHistory, maxPages + 1]);
    } else {
      setCurrentPage(nextPage);
      setPageHistory([...pageHistory, nextPage]);
    }
  };

  const handleSurveyPrev = () => {
    setError('');
    if (pageHistory.length > 1) {
      const newHistory = [...pageHistory];
      newHistory.pop();
      const prevPage = newHistory[newHistory.length - 1];
      setCurrentPage(prevPage);
      setPageHistory(newHistory);
    }
  };

  // Load saved draft on mount / poll load
  useEffect(() => {
    if (!poll || !pollId) return;
    const saved = localStorage.getItem(`pollstar_resume_${pollId}`);
    if (saved && poll.settings?.enableSaveAndResumeLater) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.answers) {
          setSelectedAnswers(parsed.answers);
        }
        if (parsed.currentPage !== undefined) {
          setCurrentPage(parsed.currentPage);
        }
        if (parsed.pageHistory !== undefined) {
          setPageHistory(parsed.pageHistory);
        }
        if (parsed.timeLeft !== undefined && parsed.timeLeft !== null) {
          setTimeLeft(parsed.timeLeft);
        }
      } catch (e) {
        console.error('Failed to parse saved resume state:', e);
      }
    }
  }, [poll, pollId]);

  const handleSaveDraft = () => {
    try {
      const payload = {
        answers: selectedAnswers,
        currentPage,
        pageHistory,
        timeLeft
      };
      localStorage.setItem(`pollstar_resume_${pollId}`, JSON.stringify(payload));
      setSaveSuccessMsg('💾 Progress saved successfully! You can securely close this browser and return later.');
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    } catch (e) {
      console.error(e);
      alert('Error saving draft. Please ensure localStorage is enabled in your browser settings.');
    }
  };

  // ────────────────────────────────────────────────────────
  // VOTE PLACEMENT ROUTINE
  // ────────────────────────────────────────────────────────

  const handleCastVote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCaptchaError('');
    setVoteLoading(true);

    // 1. Verify Human Math CAPTCHA (skipped for surveys)
    if (poll.pollType !== 'SURVEY') {
      const parsedAnswer = parseInt(captchaAnswer);
      if (isNaN(parsedAnswer) || parsedAnswer !== (captchaNum1 + captchaNum2)) {
        setCaptchaError('Human validation calculation is incorrect. Please check and try again.');
        setVoteLoading(false);
        return;
      }
    }

    // 2. Question completeness check
    // For surveys, only check questions that were actually shown (in the navigation path)
    const questionsToCheck = poll.pollType === 'SURVEY'
      ? poll.questions.filter((q: any) => selectedAnswers[q.id] !== undefined || pageHistory.includes(q.pageNumber || 1))
      : poll.questions;

    for (const q of questionsToCheck) {
      const ans = selectedAnswers[q.id];
      const rankedRequiredCount = poll.settings?.enableRankCompleteness
        ? (poll.settings?.rankedCompletenessRule === 'FULL'
            ? q.options?.length
            : poll.settings?.rankedCompletenessRule === 'TOP_3'
              ? Math.min(3, q.options?.length || 0)
              : 1)
        : q.options?.length;

      if (
        !ans || 
        (q.type === 'RANKED' && ans.length < rankedRequiredCount) ||
        (q.type === 'KNOCKOUT' && !ans.winner) ||
        (['MULTIPLE_CHOICE', 'MULTI_SELECT'].includes(q.type) && ans.length === 0) ||
        (q.type === 'SHORT_TEXT' && ans.trim() === '') ||
        (q.type === 'LONG_TEXT' && ans.trim() === '') ||
        (q.type === 'RATING' && ans === 0)
      ) {
        setError(q.type === 'RANKED' ? `Please rank at least ${rankedRequiredCount} choice${rankedRequiredCount === 1 ? '' : 's'} before submitting.` : 'Please complete all questions before submitting.');
        setVoteLoading(false);
        return;
      }
    }

    // 3. Confirm checkbox (always required)
    if (!confirmVoteChecked) {
      setError(poll?.pollType === 'EXAM' ? 'Please check the confirmation box to submit your exam.' : (poll?.pollType === 'SURVEY' ? 'Please check the confirmation box to submit your survey.' : 'Please check the confirmation box to submit your vote.'));
      setVoteLoading(false);
      return;
    }

    // 4. Query High-Accuracy Browser Geolocation (Compulsory)
    let userCoords: { latitude: number; longitude: number } | null = null;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        userCoords = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      } catch (err: any) {
        console.error('Compulsory geolocation permission error:', err);
        setError(`Location Access Required: To guarantee ${poll?.pollType === 'EXAM' ? 'exam' : (poll?.pollType === 'SURVEY' ? 'response' : 'vote')} uniqueness and prevent security manipulation, you must enable and grant location permissions in your browser to submit your ${poll?.pollType === 'EXAM' ? 'exam paper' : (poll?.pollType === 'SURVEY' ? 'responses' : 'ballot')}.`);
        setVoteLoading(false);
        return;
      }
    } else {
      setError(`Location Access Required: Your browser does not support Geolocation, which is mandatory to submit a secure ${poll?.pollType === 'EXAM' ? 'exam' : (poll?.pollType === 'SURVEY' ? 'response' : 'vote')} on this platform.`);
      setVoteLoading(false);
      return;
    }

    if (!userCoords || !userCoords.latitude || !userCoords.longitude) {
      setError('Location Access Required: Could not resolve valid coordinates. Please ensure location access is enabled and try again.');
      setVoteLoading(false);
      return;
    }

    try {
      let detectedDevice = 'Desktop';
      const rawUA = navigator?.userAgent || '';
      const isTabletUA = /Tablet|iPad|Playbook|Silk|Kindle/i.test(rawUA) || ( /Android/i.test(rawUA) && !/Mobile/i.test(rawUA) );
      const isMobileUA = /Mobi|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|webOS|Windows Phone/i.test(rawUA) || ( /Android/i.test(rawUA) && /Mobile/i.test(rawUA) );
      const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator && navigator.maxTouchPoints > 1));
      const screenW = typeof window !== 'undefined' ? (window.screen.width || window.innerWidth) : 1024;
      const isMobilePlatform = /iphone|ipod/i.test(navigator?.platform || '') || ((navigator as any)?.userAgentData?.mobile === true);
      const isTabletPlatform = /ipad/i.test(navigator?.platform || '');

      if (isMobileUA || isMobilePlatform || (isTouch && screenW <= 480)) {
        detectedDevice = 'Mobile';
      } else if (isTabletUA || isTabletPlatform || (isTouch && screenW > 480 && screenW <= 1024 && !/Macintosh/i.test(navigator?.platform || ''))) {
        detectedDevice = 'Tablet';
      } else if (isTouch && screenW <= 1024 && /MacIntel/.test(navigator?.platform || '')) {
         // Special handling for iPad Safari reporting as MacIntel
        detectedDevice = 'Tablet';
      } else {
        detectedDevice = 'Desktop';
      }
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: { 
            ...selectedAnswers, 
            __proctorLogs: proctorLogs,
            __webcamFrame: latestWebcamFrameRef.current,
            __screenFrame: latestScreenFrameRef.current,
            __webcamFrames: recordedWebcamFramesRef.current,
            __screenFrames: recordedScreenFramesRef.current,
          },
          confidenceValues: Object.keys(confidenceValues).length > 0 ? confidenceValues : undefined,
          voterToken: poll.isOpenVoting ? undefined : voterToken,
          email: poll.isOpenVoting && poll.settings?.limitOneVotePerUser ? openEmail : undefined,
          latitude: userCoords?.latitude || null,
          longitude: userCoords?.longitude || null,
          device: detectedDevice,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (poll?.pollType === 'EXAM' ? 'Failed to submit exam paper' : (poll?.pollType === 'SURVEY' ? 'Failed to submit survey' : 'Failed to submit vote')));
      }

      setVotedSuccessfully(true);
      setFlaggedSuspicious(data.flaggedSuspicious || false);
      localStorage.removeItem(`poll_start_time_${pollId}`);
      localStorage.removeItem(`pollstar_resume_${pollId}`);
      localStorage.removeItem(`exam_in_progress_${pollId}`);
      localStorage.removeItem(`selected_answers_${pollId}`);
      localStorage.removeItem(`proctor_logs_${pollId}`);

      // Stop active proctor feeds on submit
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
      if (screenStream) screenStream.getTracks().forEach(t => t.stop());
      if (socketRef.current) socketRef.current.disconnect();

      // Add their geoposition marker if present
      if (data.geo && data.geo.lat !== 0) {
        setLiveVoterLocations((prev) => [
          ...prev,
          {
            ipAddress: data.geo.ip,
            isp: data.geo.isp,
            lat: data.geo.lat,
            lon: data.geo.lon,
            city: data.geo.city,
            country: data.geo.country,
            flaggedSuspicious: data.flaggedSuspicious || false,
          },
        ]);
      }

      // Fire canvas confetti celebration
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setVoteLoading(false);
    }
  };

  const renderBranding = (customClass = "font-outfit text-lg font-bold tracking-tight text-white", iconSize = "w-5 h-5") => {
    const settings = poll?.settings;
    if (settings?.enableCustomBranding) {
      return (
        <div className="flex items-center space-x-2.5">
          {settings.customLogoUrl && (
            <img src={settings.customLogoUrl} alt="Custom Logo" className="h-8 object-contain rounded" />
          )}
          {settings.customBrandingText && (
            <span className={customClass}>{settings.customBrandingText}</span>
          )}
        </div>
      );
    }

    // Default branding
    const typeLabel = poll?.pollType === 'EXAM' ? 'Testing' : poll?.pollType === 'SURVEY' ? 'Survey' : 'Secure';
    const colorClass = poll?.pollType === 'EXAM' ? 'text-violet-400' : poll?.pollType === 'SURVEY' ? 'text-purple-400' : 'text-indigo-400';
    const gradient = poll?.pollType === 'EXAM' ? 'from-violet-500 to-purple-500 shadow-violet-500/20' : poll?.pollType === 'SURVEY' ? 'from-purple-500 to-indigo-500 shadow-purple-500/20' : 'from-indigo-500 to-purple-500 shadow-indigo-500/20';

    return (
      <div className="flex items-center space-x-2.5">
        <div className={`p-2.5 bg-gradient-to-tr ${gradient} rounded-xl shadow-lg`}>
          {poll?.pollType === 'SURVEY' ? (
            <ClipboardList className={`${iconSize} text-white`} />
          ) : (
            <VoteIcon className={`${iconSize} text-white`} />
          )}
        </div>
        <span className={customClass}>
          Poll<span className={colorClass}>star</span> {typeLabel}
        </span>
      </div>
    );
  };

  if (error === 'Platform is currently undergoing scheduled maintenance.') {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="glass-card rounded-3xl border border-white/10 p-8 max-w-md w-full bg-[#080d1a]/85 backdrop-blur-md relative shadow-2xl space-y-6 animate-pulse-glow">
          <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400 mx-auto w-fit">
            <Settings className="w-10 h-10 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h3 className="font-outfit text-2xl font-black text-white">Scheduled Maintenance</h3>
            <p className="text-gray-400 text-xs mt-2.5 leading-relaxed">
              Pollstar is currently undergoing database optimizations and structural upgrades to make your interactive sessions even faster and more secure. We will be back online shortly!
            </p>
          </div>
          <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl text-[10px] text-purple-300 font-mono">
            Status: System Gated Lockdown
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-[#030712]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="text-gray-400 text-sm mt-4 font-semibold">Loading, please wait...</span>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center px-6 text-center">
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="font-outfit text-xl font-bold text-white mb-2">Failed to Access Poll</h3>
        <p className="text-gray-400 text-sm max-w-md leading-relaxed">{error}</p>
        <Link href="/" className="mt-6 px-5 py-2.5 rounded-xl font-semibold gradient-btn text-white text-xs">
          Return to Home
        </Link>
      </div>
    );
  }

  // ── VOTING CLOSED SCREEN ──────────────────────────────────
  if (poll && poll.status !== 'ACTIVE' && !votedSuccessfully) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-16 text-center bg-[#030712] min-h-screen">
        <div className="max-w-lg w-full space-y-8">
          {/* Brand */}
          <div className="flex items-center justify-center space-x-2.5 mb-4">
            {renderBranding("font-outfit text-lg font-bold tracking-tight text-white")}
          </div>

          {/* Closed Badge */}
          <div className="glass-card rounded-3xl p-10 border border-red-500/20 bg-red-500/5 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-center">
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl">
                <AlertCircle className="w-10 h-10" />
              </div>
            </div>

            <h1 className="font-outfit text-3xl font-extrabold text-white">
              {poll.pollType === 'EXAM' 
                ? 'Examination Has Closed' 
                : (poll.pollType === 'SURVEY' ? 'Survey Has Closed' : 'Voting Has Closed')
              }
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              {poll.pollType === 'EXAM' ? (
                <>The exam <span className="text-white font-bold">"{poll.title}"</span> has officially ended and is no longer accepting submissions.</>
              ) : (
                poll.pollType === 'SURVEY' ? (
                  <>The survey <span className="text-white font-bold">"{poll.title}"</span> has officially closed and is no longer accepting responses.</>
                ) : (
                  <>The poll <span className="text-white font-bold">"{poll.title}"</span> has officially ended and is no longer accepting ballots.</>
                )
              )}
            </p>

            {poll.endTime && (
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold mx-auto">
                <span>⏱️ Deadline:</span>
                <span className="text-white font-mono">{new Date(poll.endTime).toLocaleString()}</span>
              </div>
            )}

            {poll.totalVotes !== undefined && (
              <p className="text-gray-500 text-xs">
                {poll.pollType === 'EXAM' 
                  ? 'Total examinee papers submitted:' 
                  : (poll.pollType === 'SURVEY' ? 'Total responses recorded:' : 'Total ballots recorded:')
                } <span className="text-white font-bold">{poll.totalVotes}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {poll.pollType !== 'EXAM' && poll.isResultPublic && (
              <button
                type="button"
                onClick={() => {
                  // Allow them through to view results by marking as "voted" 
                  setVotedSuccessfully(true);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 shadow-lg shadow-indigo-500/20 transition-all text-sm flex items-center justify-center space-x-2 active:scale-95"
              >
                <Award className="w-4 h-4" />
                <span>View Results & Report</span>
              </button>
            )}
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold glass-card hover:bg-white/5 text-gray-300 hover:text-white text-sm border border-white/10 flex items-center justify-center transition-all active:scale-95"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }


  if (showIntro) {
    if (poll.pollType === 'SURVEY') {
      return (
        <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-12 flex flex-col justify-center min-h-[80vh] space-y-8 relative animate-fade-in">
          {/* Glass background effects */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-center space-x-2.5 mb-2">
            {renderBranding("font-outfit text-xl font-bold tracking-tight text-white")}
          </div>

          <div className="glass-card rounded-3xl p-8 border border-purple-500/30 bg-[#080d1a] shadow-2xl space-y-6 animate-fade-in-up relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            
            {poll.posterUrl && (
              <div className="w-full h-56 rounded-2xl border border-white/10 overflow-hidden bg-white/5 shadow-inner">
                <img src={poll.posterUrl} alt="Survey Banner" className="w-full h-full object-cover transform hover:scale-105 transition-all duration-700" />
              </div>
            )}

            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-purple-500/10 border border-purple-500/20 text-purple-400 uppercase tracking-widest">
                Welcome to this Survey
              </span>
              <h1 className="font-outfit text-3xl font-extrabold text-white leading-tight">
                {poll.title}
              </h1>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line bg-white/3 p-4 rounded-2xl border border-white/5">
                {poll.description ? poll.description.replace(/\[domains:\s*([^\]]+)\]/i, '').replace(/\[geolock:\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(\d+)\s*\]/i, '').trim() : 'Please complete the survey questionnaire below.'}
              </p>
            </div>

            {/* Survey stats metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300">
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Length</span>
                <span className="text-white font-bold text-sm mt-1">{poll.questions.length} Question{poll.questions.length === 1 ? '' : 's'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300">
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Pages</span>
                <span className="text-white font-bold text-sm mt-1">{Math.max(...poll.questions.map((q: any) => q.pageNumber || 1))} Page{Math.max(...poll.questions.map((q: any) => q.pageNumber || 1)) === 1 ? '' : 's'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300">
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Anonymity</span>
                <span className="text-purple-300 font-bold text-xs mt-1">
                  {poll.settings?.collectEmail ? 'Email Verified' : 'Fully Anonymous'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowIntro(false)}
                className="px-6 py-3.5 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-95 shadow-lg shadow-purple-500/20 transition-all text-xs flex items-center space-x-2 active:scale-95 animate-pulse-slow"
              >
                <span>Start Survey</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-12 flex flex-col justify-center min-h-[80vh] space-y-8 relative animate-fade-in">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-center space-x-2.5 mb-2">
          {renderBranding("font-outfit text-xl font-bold tracking-tight text-white")}
        </div>

        {introStep === 1 ? (
          <div className="glass-card rounded-3xl p-8 border border-indigo-500/30 bg-[#080d1a] shadow-2xl space-y-6 animate-fade-in-up relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            {poll.posterUrl && (
              <div className="w-full h-56 rounded-2xl border border-white/10 overflow-hidden bg-white/5 shadow-inner">
                <img src={poll.posterUrl} alt="Poll Poster" className="w-full h-full object-cover transform hover:scale-105 transition-all duration-700" />
              </div>
            )}

            <div className="space-y-3">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-widest">
                Step 1 of 2: Overview & Guidelines
              </span>
              <h1 className="font-outfit text-3xl font-extrabold text-white leading-tight">
                {poll.title}
              </h1>
              {poll.creator && (
                <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                  <span>Hosted by:</span>
                  <span className="font-semibold text-gray-200">{poll.creator.fullName || poll.creator.email}</span>
                  {poll.creator.isVerifiedUser && (
                    <span className="inline-flex items-center justify-center p-0.5 bg-blue-500 text-white rounded-full" title="Verified Creator">
                      <Check className="w-2.5 h-2.5 stroke-[4]" />
                    </span>
                  )}
                </div>
              )}
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line bg-white/3 p-4 rounded-2xl border border-white/5">
                {poll.description ? poll.description.replace(/\[domains:\s*([^\]]+)\]/i, '').replace(/\[geolock:\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(\d+)\s*\]/i, '').trim() : 'No guidelines specified.'}
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIntroStep(2)}
                className="px-6 py-3 rounded-xl font-bold bg-indigo-500 text-white hover:bg-indigo-600 transition-all text-xs flex items-center space-x-2 shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                <span>Rules & Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-8 border border-indigo-500/30 bg-[#080d1a] shadow-2xl space-y-6 animate-fade-in-up relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-widest">
                Step 2 of 2: Security & Protocols
              </span>
              <h2 className="font-outfit text-2xl font-bold text-white">
                {poll.pollType === 'EXAM' 
                  ? 'Exam Integrity & Security Guidelines' 
                  : (poll.pollType === 'SURVEY' ? 'Participation & Privacy Details' : 'Electoral Integrity Features')
                }
              </h2>
              <p className="text-gray-400 text-xs">
                {poll.pollType === 'EXAM' 
                  ? 'To guarantee clean, transparent, and fair assessment, this exam session is governed by the following strict proctoring and integrity protocols:' 
                  : (poll.pollType === 'SURVEY' 
                      ? 'To maintain data integrity and research quality, this survey session is governed by the following protocols:' 
                      : 'To guarantee clean, transparent and fair outcomes, the administrator has locked this session under the following protocols:')
                }
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex items-start space-x-3 hover:border-indigo-500/30 transition-all duration-300">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <VoteIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Response Privacy</h4>
                    <p className="text-gray-400 text-[10px] mt-1 leading-relaxed">
                      {poll.isAnonymous 
                        ? (poll.pollType === 'EXAM' 
                            ? 'Your answers will be graded anonymously without disclosing your identity.' 
                            : (poll.pollType === 'SURVEY' ? 'Your responses will remain fully anonymous.' : 'Your vote won\'t be visible to anyone.')) 
                        : (poll.pollType === 'EXAM' 
                            ? 'Your answers will be securely logged and associated with your examinee profile for grading.' 
                            : (poll.pollType === 'SURVEY' ? 'Responses will be logged as per creator settings.' : 'Your vote will be visible to everyone based on choices made by the creator.'))
                      }
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex items-start space-x-3 hover:border-indigo-500/30 transition-all duration-300">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Access Scope</h4>
                    <p className="text-gray-400 text-[10px] mt-1 leading-relaxed">
                      {poll.isOpenVoting 
                        ? (poll.pollType === 'EXAM' ? 'Open Exam. Open for all eligible participants to take.' : 'Open Ballot. Open for all eligible internet participants.') 
                        : (poll.pollType === 'EXAM' ? 'Restricted Roster. Only designated, registered candidates can take this exam.' : 'Restricted Roster. Only designated, registered voters can participate.')
                      }
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex items-start space-x-3 hover:border-indigo-500/30 transition-all duration-300">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Verification</h4>
                    <p className="text-gray-400 text-[10px] mt-1 leading-relaxed">
                      {poll.description && poll.description.includes('[priority: LOW]')
                        ? 'Direct Bypass Profile. Secure lookup is active, but OTP email code is bypassed.'
                        : 'Secure OTP Required. High Priority session with 6-digit email confirmation.'
                      }
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex items-start space-x-3 hover:border-indigo-500/30 transition-all duration-300">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Session Limit</h4>
                    <p className="text-gray-400 text-[10px] mt-1 leading-relaxed">
                      Time-limited session active: <span className="text-red-400 font-extrabold">{formatTime(getSessionDuration())}</span>. {
                        poll.pollType === 'EXAM' 
                          ? 'Unfinished exam attempts automatically submit and expire.' 
                          : (poll.pollType === 'SURVEY' ? 'Unfinished survey responses automatically expire.' : 'Unfinished ballots automatically expire.')
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5 gap-4">
              <button
                type="button"
                onClick={() => setIntroStep(1)}
                className="px-5 py-3 rounded-xl font-bold bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-xs"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleStartExamClick}
                className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-95 shadow-lg shadow-indigo-500/20 transition-all text-xs flex items-center space-x-2 active:scale-95 animate-pulse-slow"
              >
                <span>
                  {poll.pollType === 'EXAM' 
                    ? 'Start Exam' 
                    : (poll.pollType === 'SURVEY' ? 'Begin Survey' : 'Start Poll')
                  }
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center space-x-1.5 pt-2">
          <button 
            type="button"
            onClick={() => setIntroStep(1)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${introStep === 1 ? 'bg-indigo-500 w-6' : 'bg-white/20'}`}
          />
          <button 
            type="button"
            onClick={() => setIntroStep(2)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${introStep === 2 ? 'bg-indigo-500 w-6' : 'bg-white/20'}`}
          />
        </div>
      </div>
    );
  }

  const theme = getThemeClasses();

  return (
    <div className={`flex-1 w-full relative min-h-screen ${theme.bg} ${theme.text} transition-colors duration-500`}>
      <style dangerouslySetInnerHTML={{ __html: `
        .gradient-btn {
          background: ${
            theme.id === 'SUNSET' ? 'linear-gradient(to right, #f97316, #ef4444) !important' :
            theme.id === 'JADE' ? 'linear-gradient(to right, #10b981, #14b8a6) !important' :
            theme.id === 'OCEAN' ? 'linear-gradient(to right, #0ea5e9, #06b6d4) !important' :
            theme.id === 'ALABASTER' ? 'linear-gradient(to right, #4f46e5, #6366f1) !important' :
            'linear-gradient(to right, #6366f1, #a855f7) !important'
          };
        }
        ${theme.id === 'ALABASTER' ? `
          .glass-card {
            background-color: rgba(255, 255, 255, 0.8) !important;
            color: #111827 !important;
            border-color: #e5e7eb !important;
          }
          .glass-input {
            background-color: rgba(255, 255, 255, 0.9) !important;
            color: #111827 !important;
            border-color: #d1d5db !important;
          }
          .text-white {
            color: #111827 !important;
          }
          .text-gray-300 {
            color: #374151 !important;
          }
          .text-gray-400 {
            color: #4b5563 !important;
          }
          input, select, textarea {
            color: #111827 !important;
          }
        ` : ''}
      ` }} />
      {timeLeft !== null && (
        <div className="fixed top-6 right-6 z-50 animate-pulse-slow">
          <div className="glass-card rounded-2xl border border-red-500/30 bg-red-500/5 backdrop-blur-md py-2.5 px-4 shadow-xl flex items-center space-x-2.5 select-none">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
            <div className="flex flex-col text-right">
              <span className="text-[8px] font-black tracking-widest text-red-400 uppercase">
                {poll?.pollType === 'EXAM' ? 'EXAM COUNTDOWN' : 'SESSION COUNTDOWN'}
              </span>
              <span className="font-mono text-sm font-extrabold text-white leading-tight font-bold">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>
      )}

      {poll?.settings?.enableProctorCamera && (poll.isOpenVoting || verifiedVoter) && !votedSuccessfully && (
        <div className="fixed bottom-24 right-6 z-40 w-52 rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl p-2.5 select-none overflow-hidden animate-fade-in-up backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-outfit px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-red-400 uppercase tracking-widest text-[8px] animate-pulse">Proctored</span>
            </span>
            <span className="font-mono text-[9px] text-indigo-400 font-semibold">Live Feed</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="relative rounded-lg overflow-hidden border border-white/5 bg-black/40 aspect-video flex items-center justify-center">
              {cameraStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <span className="text-[7px] text-red-400 text-center font-bold px-1">{cameraError ? 'Cam Blocked' : 'Camera...'}</span>
              )}
              <span className="absolute bottom-0.5 left-1 bg-black/75 px-1 py-0.2 rounded text-[7px] text-gray-300">Webcam</span>
            </div>
            
            <div className="relative rounded-lg overflow-hidden border border-white/5 bg-black/40 aspect-video flex items-center justify-center">
              {screenStream ? (
                <video
                  ref={(node) => {
                    localScreenVideoRef.current = node;
                    if (node && screenStream) node.srcObject = screenStream;
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[7px] text-red-400 text-center font-bold px-1">No Screen</span>
              )}
              <span className="absolute bottom-0.5 left-1 bg-black/75 px-1 py-0.2 rounded text-[7px] text-gray-300">Screen</span>
            </div>
          </div>
        </div>
      )}

      <div className={`w-full mx-auto px-6 py-12 relative ${
        poll.settings?.enableSentimentChat ? 'max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-8 items-start' : 'max-w-4xl space-y-10'
      }`}>
      
      {/* Dynamic Background */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className={poll.settings?.enableSentimentChat ? 'lg:col-span-3 space-y-10' : 'space-y-10'}>

      {/* Brand Icon */}
      <div className="flex items-center space-x-2.5">
        {renderBranding("font-outfit text-lg font-bold tracking-tight text-white")}
      </div>

      {/* Poll/Survey Details Header Card */}
      <div className="glass-card rounded-3xl p-8 border border-white/5 flex flex-col md:flex-row gap-8 items-start md:items-center relative overflow-hidden">
        {poll.posterUrl && (
          <div className="w-full md:w-32 h-32 rounded-2xl border border-white/10 overflow-hidden shrink-0 bg-white/5 shadow-inner">
            <img src={poll.posterUrl} alt="Poll Poster" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="space-y-3 flex-1">
          <h1 className="font-outfit text-3xl font-extrabold text-white leading-tight">
            {poll.title}
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
            {poll.description ? poll.description.replace(/\[domains:\s*([^\]]+)\]/i, '').replace(/\[geolock:\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(\d+)\s*\]/i, '').trim() : ''}
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {poll.description && poll.description.match(/\[domains:\s*([^\]]+)\]/i) && (
              <span className="px-3 py-1 rounded-xl text-[10px] font-extrabold bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center space-x-1.5 uppercase tracking-wider animate-pulse">
                <span>🛡️ Domain Lock:</span>
                <span className="font-mono text-white/90">{poll.description.match(/\[domains:\s*([^\]]+)\]/i)?.[1]}</span>
              </span>
            )}
            {poll.description && poll.description.match(/\[geolock:\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(\d+)\s*\]/i) && (
              <span className="px-3 py-1 rounded-xl text-[10px] font-extrabold bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center space-x-1.5 uppercase tracking-wider">
                <span>📍 GEOLOCKED:</span>
                <span className="text-white/90">Within {poll.description.match(/\[geolock:\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(\d+)\s*\]/i)?.[3]}km</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <AdvertisementZone removeAdvertisements={poll?.creator?.plan?.features?.removeAdvertisements === true} />

      {/* Strict Anonymity big notice */}
      {poll.isAnonymous && (
        <div className="glass-card rounded-2xl p-6 border-indigo-500/25 bg-indigo-500/5 flex items-start space-x-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
            {poll.pollType === 'SURVEY' ? <ClipboardList className="w-5 h-5" /> : <VoteIcon className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-outfit font-extrabold uppercase text-xs tracking-widest text-indigo-300">
              {poll.pollType === 'EXAM' 
                ? 'Strictly Anonymous Exam Assessment' 
                : (poll.pollType === 'SURVEY' ? 'Strictly Anonymous Survey' : 'Strictly Anonymous Election')
              }
            </h4>
            <p className="text-white text-sm font-extrabold mt-1 leading-relaxed">
              {poll.pollType === 'EXAM' 
                ? 'Your answers will be graded strictly anonymously without disclosing your identity.' 
                : (poll.pollType === 'SURVEY' ? 'Your responses will remain strictly anonymous.' : "Your vote won't be visible to anyone.")
              }
            </p>
          </div>
        </div>
      )}

      {/* Closed Voter Entrance gate */}
      {!poll.isOpenVoting && !verifiedVoter && !votedSuccessfully && (
        <div className="glass-card rounded-3xl p-8 border border-white/5 shadow-2xl space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-outfit text-xl font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              <span>Identity Verification Gateway</span>
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              {!lookupPassed
                ? `Please enter your registered ${identifierLabel} below to verify identity.`
                : `Double-check your credentials to make sure you are at the right place.`
              }
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!lookupPassed ? (
            <form onSubmit={handleLookupIdentifier} className="space-y-6">
              <div>
                <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                  {identifierLabel}
                </label>
                <input
                  type="text"
                  required
                  value={voterIdentifier}
                  onChange={(e) => setVoterIdentifier(e.target.value)}
                  placeholder={`Enter your unique ${identifierLabel.toLowerCase()}`}
                  className="w-full glass-input text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={lookupLoading}
                className="w-full py-3.5 rounded-xl font-bold gradient-btn text-white transition-all text-sm flex items-center justify-center space-x-2"
              >
                {lookupLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify Identifier</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVoterRequestOtp} className="space-y-6">
              {/* Profile Confirmation Card */}
              <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Profile Retrieved</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLookupPassed(false);
                      setVoterId('');
                      setVoterIdentifier('');
                      setConfirmer1('');
                      setConfirmer2('');
                      setVoterEmail('');
                    }}
                    className="text-[10px] text-gray-500 hover:text-red-400 font-bold transition-all"
                  >
                    Change ID
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 block mb-0.5">{identifierLabel}</span>
                    <span className="text-white font-mono font-bold text-sm">{voterIdentifier}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">{confirmer1Label}</span>
                    <span className="text-white font-bold">{confirmer1}</span>
                  </div>
                  {confirmer2 && (
                    <div>
                      <span className="text-gray-500 block mb-0.5">{confirmer2Label}</span>
                      <span className="text-white font-bold">{confirmer2}</span>
                    </div>
                  )}
                  {verificationMethod === 'PHONE' ? (
                    <div className="sm:col-span-2">
                      <span className="text-gray-500 block mb-0.5">Registered Phone Number</span>
                      <span className="text-indigo-300 font-semibold">{voterPhone || 'N/A'}</span>
                    </div>
                  ) : (
                    <div className="sm:col-span-2">
                      <span className="text-gray-500 block mb-0.5">Registered Email (OTP Destination)</span>
                      <span className="text-indigo-300 font-semibold">{voterEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {verificationType === 'PASSWORD' && (
                <div className="space-y-2 animate-fade-in-up">
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider">
                    Access Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={voterPassword}
                    onChange={(e) => setVoterPassword(e.target.value)}
                    placeholder="Enter your assigned access password"
                    className="w-full glass-input text-sm py-2.5"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={otpSendLoading || (verificationType === 'OTP' && otpCooldown > 0)}
                className="w-full py-3.5 rounded-xl font-bold gradient-btn text-white transition-all text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpSendLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : verificationType === 'PASSWORD' ? (
                  <span>Verify Password & Access Session</span>
                ) : otpCooldown > 0 ? (
                  <span>Resend OTP in {otpCooldown}s</span>
                ) : (poll.description && /\[priority:\s*LOW\]/i.test(poll.description)) ? (
                  <span>{poll.pollType === 'EXAM' ? 'Confirm Profile & Start Exam' : (poll.pollType === 'SURVEY' ? 'Confirm Profile & Access Survey' : 'Confirm Profile & Access Ballot')}</span>
                ) : otpSentOnce ? (
                  <span>Resend OTP Code</span>
                ) : (
                  <span>Confirm Profile & Send OTP</span>
                )}
                {!otpSendLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Closed Voter OTP verification popup */}
      {showOtpPopup && (
        <div className="fixed inset-0 bg-[#030712]/80 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="glass-card rounded-3xl p-8 border border-white/10 shadow-2xl max-w-md w-full text-center space-y-6">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 w-14 h-14 flex items-center justify-center mx-auto">
              <VoteIcon className="w-6 h-6" />
            </div>
            
            <div>
              <h3 className="font-outfit text-xl font-bold text-white">Enter Email OTP</h3>
              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                Confirm your identity by entering the 6-digit OTP code dispatched to <br/>
                <span className="text-indigo-300 font-semibold">{voterEmail}</span>.
              </p>
            </div>

            {otpError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyVoterOtp} className="space-y-6">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-[12px] pl-3 glass-input text-2xl font-bold font-mono placeholder-gray-800"
              />

              <div className="text-center py-1 select-none">
                {otpCooldown > 0 ? (
                  <span className="text-gray-500 text-xs font-bold">Resend available in {otpCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    disabled={otpSendLoading}
                    onClick={() => handleVoterRequestOtp(null as any)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-all disabled:opacity-50"
                  >
                    {otpSendLoading ? 'Requesting resend...' : 'Didn\'t receive code? Resend OTP'}
                  </button>
                )}
              </div>

              {/* SOS Bypass Request Section */}
              <div className="text-center pb-2">
                {bypassStatus === 'IDLE' && (
                  <button
                    type="button"
                    onClick={handleRequestBypass}
                    className="text-xs text-red-400 hover:text-red-300 font-bold transition-all"
                  >
                    Can't access email? Request OTP Bypass
                  </button>
                )}
                {bypassStatus === 'REQUESTING' && (
                  <span className="text-xs text-amber-400 font-bold animate-pulse">Sending request...</span>
                )}
                {bypassStatus === 'WAITING' && (
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    <span className="text-xs text-amber-400 font-bold">Request sent! Waiting for creator approval...</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOtpPopup(false)}
                  className="flex-1 py-3 rounded-xl text-xs font-bold border border-white/5 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpLoading || otpCode.length !== 6}
                  className="flex-1 py-3 rounded-xl text-xs font-bold gradient-btn text-white flex items-center justify-center"
                >
                  {otpLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirm OTP</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Ballot Casting Form */}
      {(poll.isOpenVoting || verifiedVoter) && !votedSuccessfully && (
        <div className="glass-card rounded-3xl p-4 sm:p-8 border border-white/5 shadow-2xl space-y-6 sm:space-y-8 animate-fade-in-up">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-outfit text-xl font-bold text-white flex items-center space-x-2">
              <VoteIcon className="w-5 h-5 text-indigo-400" />
              <span>{poll.pollType === 'EXAM' ? 'Official Exam Paper' : (poll.pollType === 'SURVEY' ? 'Survey Questionnaire' : 'Official Voting Ballot')}</span>
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              {poll.pollType === 'EXAM'
                ? 'Read each question carefully and select the most accurate answers.'
                : (poll.pollType === 'SURVEY'
                    ? 'Answer each section honestly. Your responses help us understand different perspectives.'
                    : 'Please review candidate selections and cast your secure vote below.')}
            </p>
          </div>

          {error && poll.pollType !== 'SURVEY' && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCastVote} className="space-y-8">
            
            {/* Open voting Email check */}
            {poll.isOpenVoting && poll.settings?.limitOneVotePerUser && (
              <div>
                <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                  {poll.pollType === 'EXAM' ? 'Confirm Your Student Email' : (poll.pollType === 'SURVEY' ? 'Confirm Your Email' : 'Confirm Your Email Address')}
                </label>
                <input
                  type="email"
                  required
                  value={openEmail}
                  onChange={(e) => setOpenEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full glass-input text-sm"
                />
                <span className="text-[10px] text-gray-500 mt-2 block">
                  {poll.pollType === 'EXAM' 
                    ? 'Email verification is required to enforce unique exam attempts.' 
                    : (poll.pollType === 'SURVEY' 
                        ? 'Email verification is required to enforce unique submission limits.' 
                        : 'Email verification is compulsory to enforce unique voting limits.')
                  }
                </span>
              </div>
            )}

            {poll.pollType === 'SURVEY' && (
              <div className="space-y-2 animate-fade-in-up">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <span>Survey Progress</span>
                  <span>
                    {currentPage === 0 
                      ? 'Demographics' 
                      : currentPage > Math.max(...poll.questions.map((q: any) => q.pageNumber || 1))
                        ? 'Verification & Submit'
                        : `Page ${currentPage} of ${Math.max(...poll.questions.map((q: any) => q.pageNumber || 1))}`}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                    style={{
                      width: `${
                        currentPage === 0
                          ? 5
                          : currentPage > Math.max(...poll.questions.map((q: any) => q.pageNumber || 1))
                            ? 100
                            : (currentPage / Math.max(...poll.questions.map((q: any) => q.pageNumber || 1))) * 90
                      }%`
                    }}
                  />
                </div>
              </div>
            )}

            {poll.pollType === 'SURVEY' && currentPage === 0 && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="p-5 rounded-2xl border border-white/5 bg-indigo-500/5 space-y-4">
                  <h4 className="text-white text-base font-bold flex items-center space-x-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <span>Basic Demographic Information</span>
                  </h4>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Please provide these anonymous metrics to help us filter and analyze responses based on different segments (Age, Location, etc.).
                  </p>
                  
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                        Age Group <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={selectedAnswers['__demo_age'] || ''}
                        onChange={(e) => setSelectedAnswers({ ...selectedAnswers, '__demo_age': e.target.value })}
                        className="w-full bg-[#030712] border border-[#ffffff15] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="" disabled>-- Select Age Group --</option>
                        <option value="Under 18">Under 18</option>
                        <option value="18-24">18-24</option>
                        <option value="25-34">25-34</option>
                        <option value="35-44">35-44</option>
                        <option value="45-54">45-54</option>
                        <option value="55-64">55-64</option>
                        <option value="65+">65+</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                        Geographic Region <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={selectedAnswers['__demo_region'] || ''}
                        onChange={(e) => setSelectedAnswers({ ...selectedAnswers, '__demo_region': e.target.value })}
                        placeholder="e.g. California, US or West Bengal, IN"
                        className="w-full bg-[#030712] border border-[#ffffff15] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
                        Gender <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={selectedAnswers['__demo_gender'] || ''}
                        onChange={(e) => setSelectedAnswers({ ...selectedAnswers, '__demo_gender': e.target.value })}
                        className="w-full bg-[#030712] border border-[#ffffff15] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="" disabled>-- Select Gender --</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Questions block */}
            <div className="space-y-10">
              {poll.questions
                .filter((q: any) => poll.pollType === 'POLL' || (q.pageNumber || 1) === currentPage)
                .map((q: any, qIdx: number) => {
                const ans = selectedAnswers[q.id];
                
                return (
                  <div key={q.id} className="space-y-6">
                    <div className="p-4 bg-white/2 rounded-2xl border border-white/5">
                      <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                        Question {poll.questions.length > 1 ? qIdx + 1 : ''}
                      </span>
                      <h4 className="text-white text-base font-bold mt-1 leading-snug">{q.questionText}</h4>
                    </div>

                    {/* SINGLE CHOICE LAYOUT */}
                    {q.type === 'SINGLE' && (
                      <>
                        {poll.settings?.enableQuadraticVoting ? (
                          <div className="space-y-4 animate-fade-in-up">
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                              <div>
                                <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider block">Quadratic Voting Budget</span>
                                <p className="text-gray-500 text-[10px] mt-0.5">Allocate up to 100 points. Points cost is the square of votes (1 vote = 1 pt, 2 votes = 4 pts, 3 votes = 9 pts).</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-2xl font-black text-white block tabular-nums">
                                  {100 - Object.values(selectedAnswers[q.id] || {}).reduce((sum: number, v: any) => sum + v * v, 0) as number}
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Points Left</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                              {q.options.map((opt: any) => {
                                const currentAlloc = selectedAnswers[q.id] || {};
                                const votes = currentAlloc[opt.id] || 0;
                                const pointsUsed = Object.values(currentAlloc).reduce((sum: number, v: any) => sum + v * v, 0) as number;
                                const nextCost = (votes + 1) * (votes + 1) - votes * votes;
                                const pointsLeft = 100 - pointsUsed;

                                return (
                                  <div key={opt.id} className="p-4 rounded-xl border border-white/5 bg-white/2 flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                      <span className="text-sm font-semibold text-white">{opt.text}</span>
                                      <span className="text-[10px] text-gray-500 block">
                                        Allocated: <strong className="text-indigo-400">{votes} vote{votes === 1 ? '' : 's'}</strong> ({votes * votes} points)
                                      </span>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                      <button
                                        type="button"
                                        disabled={votes === 0}
                                        onClick={() => {
                                          const nextAlloc = { ...currentAlloc, [opt.id]: votes - 1 };
                                          if (nextAlloc[opt.id] === 0) delete nextAlloc[opt.id];
                                          setSelectedAnswers({ ...selectedAnswers, [q.id]: nextAlloc });
                                        }}
                                        className={`w-8 h-8 rounded-lg border text-sm font-black flex items-center justify-center transition-all ${
                                          votes > 0 
                                            ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white' 
                                            : 'border-white/5 text-gray-600 cursor-not-allowed'
                                        }`}
                                      >
                                        -
                                      </button>
                                      <span className="text-sm font-black text-white w-4 text-center tabular-nums">{votes}</span>
                                      <button
                                        type="button"
                                        disabled={pointsLeft < nextCost}
                                        onClick={() => {
                                          setSelectedAnswers({
                                            ...selectedAnswers,
                                            [q.id]: { ...currentAlloc, [opt.id]: votes + 1 }
                                          });
                                        }}
                                        className={`w-8 h-8 rounded-lg border text-sm font-black flex items-center justify-center transition-all ${
                                          pointsLeft >= nextCost
                                            ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white' 
                                            : 'border-white/5 text-gray-600 cursor-not-allowed'
                                        }`}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {q.options.map((opt: any) => {
                              const isSelected = ans === opt.id;
                              return (
                                <div
                                  key={opt.id}
                                  onClick={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: opt.id })}
                                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                    isSelected
                                      ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-md'
                                      : 'border-white/5 hover:border-white/10 hover:bg-white/3 text-gray-300'
                                  }`}
                                >
                                  <span className="text-sm font-semibold">{opt.text}</span>
                                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-white/20'
                                  }`}>
                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* CONFIDENCE SLIDER — shown after selecting an option if enabled */}
                        {q.type === 'SINGLE' && (poll.settings?.enableQuadraticVoting ? Object.keys(selectedAnswers[q.id] || {}).length > 0 : ans) && poll.settings?.enableConfidenceSlider && (
                          <div className="mt-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3 animate-fade-in-up">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block">How confident are you?</span>
                                <p className="text-gray-500 text-[10px] mt-0.5">Drag the slider to show how sure you are about your choice.</p>
                              </div>
                              <span className="text-2xl font-extrabold text-amber-400 tabular-nums">
                                {confidenceValues[q.id] ?? 50}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={100}
                              value={confidenceValues[q.id] ?? 50}
                              onChange={(e) => setConfidenceValues({ ...confidenceValues, [q.id]: parseInt(e.target.value) })}
                              className="w-full accent-amber-500"
                            />
                          </div>
                        )}
                      </>
                    )}


                    {/* MULTIPLE CHOICE LAYOUT */}
                    {['MULTIPLE_CHOICE', 'MULTI_SELECT'].includes(q.type) && (
                      <div className="grid grid-cols-1 gap-3">
                        {q.options.map((opt: any) => {
                          const currentList = Array.isArray(ans) ? ans : [];
                          const isSelected = currentList.includes(opt.id);

                          return (
                            <div
                              key={opt.id}
                              onClick={() => {
                                let nextList = [...currentList];
                                if (isSelected) {
                                  nextList = nextList.filter((item) => item !== opt.id);
                                } else {
                                  nextList.push(opt.id);
                                }
                                setSelectedAnswers({ ...selectedAnswers, [q.id]: nextList });
                              }}
                              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-md'
                                  : 'border-white/5 hover:border-white/10 hover:bg-white/3 text-gray-300'
                              }`}
                            >
                              <span className="text-sm font-semibold">{opt.text}</span>
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-white/20'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* SHORT TEXT LAYOUT */}
                    {q.type === 'SHORT_TEXT' && (
                      <div>
                        <input
                          type="text"
                          required
                          value={ans || ''}
                          onChange={(e) => setSelectedAnswers({ ...selectedAnswers, [q.id]: e.target.value })}
                          placeholder="Type your response here..."
                          className="w-full glass-input text-sm py-3"
                        />
                      </div>
                    )}

                    {/* LONG TEXT LAYOUT */}
                    {q.type === 'LONG_TEXT' && (
                      <div>
                        <textarea
                          rows={4}
                          required
                          value={ans || ''}
                          onChange={(e) => setSelectedAnswers({ ...selectedAnswers, [q.id]: e.target.value })}
                          placeholder="Type your detailed feedback here..."
                          className="w-full glass-input text-sm py-3 resize-none"
                        />
                      </div>
                    )}

                    {/* RATING CHOICE LAYOUT */}
                    {q.type === 'RATING' && (
                      <div className="flex items-center space-x-2 pt-2 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = (ans || 0) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: star })}
                              className="focus:outline-none transition-all scale-105 hover:scale-125"
                            >
                              <Award
                                className={`w-10 h-10 ${
                                  isFilled ? 'text-amber-400 fill-amber-400' : 'text-gray-600'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* RANKED CHOICE LAYOUT */}
                    {q.type === 'RANKED' && (
                      <div className="space-y-4">
                        <p className="text-[10px] text-gray-500 leading-normal">
                          Drag or click choices to rank them in order of your preference. Top choice represents first priority.
                        </p>
                        <div className="grid grid-cols-1 gap-2.5">
                          {(Array.isArray(ans) ? ans : []).map((optId: string, rIdx: number) => {
                            const option = q.options.find((o: any) => o.id === optId);
                            if (!option) return null;
                            return (
                              <div
                                key={optId}
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData('text/plain', optId)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const draggedId = e.dataTransfer.getData('text/plain');
                                  handleRankDrop(draggedId, optId, q.id);
                                }}
                                className="p-3.5 rounded-xl border border-indigo-500/30 bg-[#6366f1]/5 flex items-center justify-between gap-3 cursor-grab"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="w-6 h-6 rounded-lg bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center tabular-nums">
                                    {rIdx + 1}
                                  </span>
                                  <span className="text-sm font-semibold text-white">{option.text}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentList = Array.isArray(ans) ? ans : [];
                                    const nextList = currentList.filter((id) => id !== optId);
                                    setSelectedAnswers({ ...selectedAnswers, [q.id]: nextList });
                                  }}
                                  className="text-red-400 hover:text-red-300 text-xs font-bold font-mono"
                                >
                                  Remove
                                </button>
                              </div>
                            );
                          })}

                          {q.options
                            .filter((o: any) => !(Array.isArray(ans) ? ans : []).includes(o.id))
                            .map((option: any) => (
                              <div
                                key={option.id}
                                onClick={() => {
                                  const currentList = Array.isArray(ans) ? ans : [];
                                  setSelectedAnswers({ ...selectedAnswers, [q.id]: [...currentList, option.id] });
                                }}
                                className="p-3.5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10 flex items-center justify-between gap-3 cursor-pointer text-gray-300 hover:text-white"
                              >
                                <span className="text-sm font-medium">{option.text}</span>
                                <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                  Rank Option
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* TOURNAMENT BRACKET KNOCKOUT LAYOUT */}
                    {q.type === 'KNOCKOUT' && knockoutRounds.length > 0 && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-white/5 pb-2">
                          <span>Bracket Stage</span>
                          <span>Match {currentRoundIndex + 1}</span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {knockoutRounds[currentRoundIndex]?.map((match: any, matchIdx: number) => {
                            if (!match.c1) return null;
                            return (
                              <div key={matchIdx} className="p-4 rounded-2xl border border-white/5 bg-white/2 space-y-4">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Duel Match #{matchIdx + 1}</span>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  {/* Candidate Option 1 */}
                                  <div className="space-y-2">
                                    <div
                                      onClick={() => {
                                        if (match.c1.text !== 'BYE' && match.c2.text !== 'BYE') {
                                          handleKnockoutSelect(matchIdx, match.c1.id, q.id);
                                        }
                                      }}
                                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                                        match.c1.text === 'BYE' ? 'opacity-30 cursor-not-allowed border-dashed border-white/5' : 'cursor-pointer'
                                      } ${
                                        match.winner === match.c1.id
                                          ? 'border-indigo-500 bg-indigo-500/15 text-white font-bold'
                                          : 'border-white/5 hover:border-white/10 hover:bg-white/3 text-gray-300'
                                      }`}
                                    >
                                      <span className="text-xs">{match.c1.text}</span>
                                      {match.winner === match.c1.id && (
                                        <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold">
                                          ✓
                                        </div>
                                      )}
                                    </div>
                                    {poll.settings?.enableOptionStatsCards && match.c1.text !== 'BYE' && (
                                      <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] space-y-1 animate-fade-in-up">
                                        <div className="flex justify-between text-gray-400">
                                          <span>Seed Rating:</span>
                                          <span className="font-bold text-indigo-300">#{(match.c1.id.charCodeAt(0) % 8) + 1} Seed</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                          <span>Est. Win Rate:</span>
                                          <span className="font-bold text-indigo-300">{70 + (match.c1.id.charCodeAt(1) % 25)}%</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                          <span>Style/Trait:</span>
                                          <span className="font-bold text-indigo-300">
                                            {['Defensive Wall', 'Championship Pedigree', 'Fan Favorite', 'Dark Horse', 'Tactical Genius', 'High Tempo'][match.c1.id.charCodeAt(2) % 6]}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Candidate Option 2 */}
                                  <div className="space-y-2">
                                    <div
                                      onClick={() => {
                                        if (match.c1.text !== 'BYE' && match.c2.text !== 'BYE') {
                                          handleKnockoutSelect(matchIdx, match.c2.id, q.id);
                                        }
                                      }}
                                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                                        match.c2.text === 'BYE' ? 'opacity-30 cursor-not-allowed border-dashed border-white/5' : 'cursor-pointer'
                                      } ${
                                        match.winner === match.c2.id
                                          ? 'border-indigo-500 bg-indigo-500/15 text-white font-bold'
                                          : 'border-white/5 hover:border-white/10 hover:bg-white/3 text-gray-300'
                                      }`}
                                    >
                                      <span className="text-xs">{match.c2.text}</span>
                                      {match.winner === match.c2.id && (
                                        <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold">
                                          ✓
                                        </div>
                                      )}
                                    </div>
                                    {poll.settings?.enableOptionStatsCards && match.c2.text !== 'BYE' && (
                                      <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] space-y-1 animate-fade-in-up">
                                        <div className="flex justify-between text-gray-400">
                                          <span>Seed Rating:</span>
                                          <span className="font-bold text-indigo-300">#{(match.c2.id.charCodeAt(0) % 8) + 1} Seed</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                          <span>Est. Win Rate:</span>
                                          <span className="font-bold text-indigo-300">{70 + (match.c2.id.charCodeAt(1) % 25)}%</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                          <span>Style/Trait:</span>
                                          <span className="font-bold text-indigo-300">
                                            {['Defensive Wall', 'Championship Pedigree', 'Fan Favorite', 'Dark Horse', 'Tactical Genius', 'High Tempo'][match.c2.id.charCodeAt(2) % 6]}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Showcase ultimate winner once decided! */}
                        {ans && (
                          <div className="p-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 text-center space-y-3 animate-fade-in-up">
                            <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider block">Your Selected Champion</span>
                            <h4 className="text-white text-xl font-black">
                              🏆 {
                                q.options.find((o: any) => o.id === ans.winner)?.text || 'BYE'
                              }
                            </h4>
                            <p className="text-gray-400 text-[10px]">Your final tournament bracket choice is locked. You can submit your {poll.pollType === 'EXAM' ? 'exam' : (poll.pollType === 'SURVEY' ? 'survey' : 'ballot')} below.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {q.enableWhiteboard && (
                      <StudentWhiteboard
                        questionId={q.id}
                        value={selectedAnswers[q.id + "_whiteboard"] || ""}
                        onChange={(base64) => setSelectedAnswers(prev => ({ ...prev, [q.id + "_whiteboard"]: base64 }))}
                        driveUrl={poll.settings?.studentWhiteboardDriveUrl}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── SURVEY PAGINATION CONTROLS ─────────────────────── */}
            {poll.pollType === 'SURVEY' && (() => {
              const maxPage = Math.max(...poll.questions.map((q: any) => q.pageNumber || 1));
              const isOnDemoPage = currentPage === 0;
              const isOnFinalPage = currentPage > maxPage;
              const isOnRegularPage = !isOnDemoPage && !isOnFinalPage;

              // Final review/submit page — show answer summary + confirmation + submit
              if (isOnFinalPage) return (
                <div className="space-y-6 animate-fade-in-up">
                  {/* Answer Review Summary */}
                  <div className="space-y-3">
                    <h4 className="text-white text-sm font-bold uppercase tracking-wider flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Review Your Responses</span>
                    </h4>
                    <p className="text-gray-500 text-xs">Please review your answers before submitting. Once submitted, responses cannot be changed.</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {poll.settings?.enableCrossTabulation && (
                        <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-1.5">Demographics</span>
                          <div className="flex flex-wrap gap-2">
                            {selectedAnswers['__demo_age'] && (
                              <span className="px-2 py-0.5 rounded-lg bg-white/5 text-gray-300 text-xs">Age: <strong className="text-white">{selectedAnswers['__demo_age']}</strong></span>
                            )}
                            {selectedAnswers['__demo_region'] && (
                              <span className="px-2 py-0.5 rounded-lg bg-white/5 text-gray-300 text-xs">Region: <strong className="text-white">{selectedAnswers['__demo_region']}</strong></span>
                            )}
                            {selectedAnswers['__demo_gender'] && (
                              <span className="px-2 py-0.5 rounded-lg bg-white/5 text-gray-300 text-xs">Gender: <strong className="text-white">{selectedAnswers['__demo_gender']}</strong></span>
                            )}
                          </div>
                        </div>
                      )}
                      {poll.questions.map((q: any, idx: number) => {
                        const ans = selectedAnswers[q.id];
                        if (!ans) return null;
                        let ansText = '';
                        if (q.type === 'SINGLE') {
                          ansText = q.options?.find((o: any) => o.id === ans)?.text || ans;
                        } else if (['MULTIPLE_CHOICE', 'MULTI_SELECT'].includes(q.type)) {
                          ansText = (Array.isArray(ans) ? ans : []).map((id: string) => q.options?.find((o: any) => o.id === id)?.text || id).join(', ');
                        } else if (q.type === 'RANKED') {
                          ansText = (Array.isArray(ans) ? ans : []).map((id: string, i: number) => `${i + 1}. ${q.options?.find((o: any) => o.id === id)?.text || id}`).join(' → ');
                        } else if (q.type === 'RATING') {
                          ansText = `${'★'.repeat(ans)}${'☆'.repeat(5 - ans)} (${ans}/5)`;
                        } else {
                          ansText = String(ans);
                        }
                        return (
                          <div key={q.id} className="p-3 rounded-xl bg-white/3 border border-white/5 space-y-1">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Q{idx + 1}</span>
                            <p className="text-xs text-gray-300 leading-snug">{q.questionText}</p>
                            <p className="text-xs text-white font-semibold mt-0.5 truncate">{ansText}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Confirmation checkbox */}
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <div className="mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        id="confirmVote"
                        checked={confirmVoteChecked}
                        onChange={(e) => setConfirmVoteChecked(e.target.checked)}
                        className="w-4 h-4 accent-indigo-500 rounded"
                      />
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed group-hover:text-gray-300 transition-colors">
                      I confirm my responses are accurate and final. I understand that <strong className="text-gray-200">{
                        poll.pollType === 'EXAM' 
                          ? 'my exam attempt cannot be changed or resubmitted' 
                          : (poll.pollType === 'SURVEY' ? 'my survey submission cannot be changed or resubmitted' : 'my vote cannot be changed or resubmitted')
                      }</strong> once submitted.
                    </p>
                  </label>

                  {saveSuccessMsg && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs animate-fade-in">
                      {saveSuccessMsg}
                    </div>
                  )}

                  {/* Navigation row: Back + Submit */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSurveyPrev}
                      className="flex items-center space-x-2 px-5 py-3.5 rounded-xl font-bold bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm active:scale-95 shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    {poll.settings?.enableSaveAndResumeLater && (
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="px-4 py-3.5 rounded-xl font-bold bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/20 transition-all text-xs active:scale-95 shrink-0"
                      >
                        💾 Save Draft
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={voteLoading || !confirmVoteChecked}
                      className="flex-1 py-3.5 rounded-xl font-bold gradient-btn text-white text-sm shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                      {voteLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>
                            {poll.pollType === 'EXAM' 
                              ? 'Submit Exam' 
                              : (poll.pollType === 'SURVEY' ? 'Submit Survey' : 'Cast Vote')
                            }
                          </span>
                          <CheckCircle className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );

              // Regular survey page — show Next/Back navigation
              return (
                <div className="space-y-4 animate-fade-in-up">
                  {/* Page dot indicators */}
                  <div className="flex items-center justify-center space-x-1.5 py-2">
                    {poll.settings?.enableCrossTabulation && (
                      <button
                        type="button"
                        onClick={() => { if (pageHistory.length > 1) handleSurveyPrev(); }}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          currentPage === 0 ? 'bg-indigo-500 w-6' : 'bg-white/20 w-2'
                        }`}
                      />
                    )}
                    {Array.from({ length: maxPage }, (_, i) => i + 1).map(pg => (
                      <div
                        key={pg}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          pg === currentPage ? 'bg-indigo-500 w-6' : pg < currentPage ? 'bg-indigo-500/40 w-2' : 'bg-white/20 w-2'
                        }`}
                      />
                    ))}
                    <div className={`h-2 rounded-full transition-all duration-300 bg-white/20 w-2`} />
                  </div>

                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                   {saveSuccessMsg && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs animate-fade-in">
                      {saveSuccessMsg}
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center gap-3">
                    {pageHistory.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSurveyPrev}
                        className="flex items-center space-x-2 px-5 py-3.5 rounded-xl font-bold bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm active:scale-95 shrink-0"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back</span>
                      </button>
                    )}
                    {poll.settings?.enableSaveAndResumeLater && (
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="px-4 py-3.5 rounded-xl font-bold bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/20 transition-all text-xs active:scale-95 shrink-0"
                      >
                        💾 Save Draft
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSurveyNext}
                      className="flex-1 py-3.5 rounded-xl font-bold gradient-btn text-white text-sm shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all"
                    >
                      <span>{currentPage === maxPage ? 'Review & Submit' : 'Next'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── POLL (non-survey) SUBMIT SECTION ──────────────── */}
            {poll.pollType !== 'SURVEY' && (
              <div className="space-y-5">
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Math CAPTCHA */}
                <div className="p-5 rounded-2xl border border-white/5 bg-white/2 space-y-3">
                  <label className="block text-gray-300 text-xs font-bold uppercase tracking-wider">
                    Human Validation — What is {captchaNum1} + {captchaNum2}?
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      required
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      placeholder="Your answer"
                      className="w-full glass-input text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => { setCaptchaNum1(Math.floor(Math.random() * 9) + 2); setCaptchaNum2(Math.floor(Math.random() * 9) + 2); setCaptchaAnswer(''); setCaptchaError(''); }}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  {captchaError && (
                    <p className="text-red-400 text-[10px] font-semibold">{captchaError}</p>
                  )}
                </div>

                {/* Confirm Checkbox */}
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <div className="mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      id="confirmVote"
                      checked={confirmVoteChecked}
                      onChange={(e) => setConfirmVoteChecked(e.target.checked)}
                      className="w-4 h-4 accent-indigo-500 rounded"
                    />
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed group-hover:text-gray-300 transition-colors">
                    I explicitly confirm that my selections are final. I understand that <strong className="text-gray-200">{
                      poll.pollType === 'EXAM'
                        ? 'my exam attempt cannot be changed or resubmitted'
                        : 'my vote cannot be changed or resubmitted'
                    }</strong> once {poll.pollType === 'EXAM' ? 'submitted' : 'cast'}.
                  </p>
                </label>

                {/* Submit Button */}
                <div className="space-y-3">
                  {saveSuccessMsg && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs text-center animate-fade-in">
                      {saveSuccessMsg}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      disabled={voteLoading || !confirmVoteChecked}
                      className="flex-1 py-4 rounded-xl font-bold gradient-btn text-white text-base shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                      {voteLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <span>{poll.pollType === 'EXAM' ? 'Submit Secure Exam' : 'Submit Secure Vote'}</span>
                      )}
                    </button>

                    {poll.settings?.enableSaveAndResumeLater && (
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="py-4 px-6 rounded-xl font-bold bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/20 transition-all text-sm active:scale-95 shrink-0"
                      >
                        💾 Save Progress
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* VOTE SUBMITTED SUCCESS VIEW */}
      {votedSuccessfully && (
        <div className="glass-card rounded-3xl p-10 border border-white/5 shadow-2xl space-y-6 text-center animate-fade-in-up">
          {isExamCancelled ? (
            <>
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto animate-pulse">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="font-outfit text-2xl font-bold text-white">
                  Examination Terminated
                </h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                  Your exam session was explicitly terminated by the supervisor due to integrity violations or tab switching.
                </p>
                <span className="inline-block mt-2 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                  🚨 CANCELLED BY PROCTOR
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="font-outfit text-2xl font-bold text-white">
                  {poll.pollType === 'EXAM' 
                    ? 'Exam Submitted Successfully!' 
                    : (poll.pollType === 'SURVEY' ? 'Survey Submitted Successfully!' : 'Vote Submitted Successfully!')
                  }
                </h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                  {poll.settings?.postSurveyAction || (
                    poll.pollType === 'EXAM' 
                      ? 'Your answers have been securely recorded. If instant results release is enabled, you can view your diagnostic report below.' 
                      : (poll.pollType === 'SURVEY' 
                          ? 'Thank you for participating! Your valuable feedback and responses have been securely recorded.' 
                          : 'Thank you for participating. Your vote has been cryptographically recorded on our backend ledger.')
                  )}
                </p>
                {flaggedSuspicious && (
                  <span className="inline-block mt-2 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg uppercase tracking-wider animate-pulse">
                    ⚠️ {poll.pollType === 'EXAM' 
                      ? 'Exam attempt flagged for Proctor inspection' 
                      : (poll.pollType === 'SURVEY' ? 'Response flagged for Administrator review' : 'Cast flagged for Administrator inspection')
                    }
                  </span>
                )}
                {(() => {
                  if (poll.pollType !== 'EXAM') return null;
                  const isInstant = !!poll.settings?.enableInstantFeedback;
                  const isHideUntilEnd = !!poll.settings?.hideResultsUntilEnd;
                  const isReleasedSetting = !!poll.settings?.resultsReleased;
                  const isReleased = isInstant || (isHideUntilEnd ? new Date() > new Date(poll.endTime) : isReleasedSetting);

                  if (!isReleased) return null;
                  return (
                    <div className="pt-4 flex justify-center">
                      <Link
                        href={`/poll/${poll.id}/analysis?email=${encodeURIComponent(voterEmail || openEmail || voterIdentifier || '')}`}
                        className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-95 shadow-lg shadow-indigo-500/20 transition-all text-sm flex items-center space-x-2 active:scale-95 animate-pulse-slow"
                      >
                        <Award className="w-4 h-4" />
                        <span>View Grade & Diagnostic Report</span>
                      </Link>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      )}

      {/* Dynamic Real-Time Results displaying below */}
      {poll.pollType !== 'EXAM' && ((votedSuccessfully && poll.isResultPublic) || (!votedSuccessfully && poll.isResultPublic && poll.isOpenVoting)) && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h3 className="font-outfit text-xl font-bold text-white">Live Insights Report</h3>
          </div>

          {votedSuccessfully && poll.settings?.enableLiveTicker && poll.questions?.[0]?.options?.length > 0 && (
            <div className="glass-card rounded-2xl border border-white/5 bg-slate-950/40 p-4 flex items-center overflow-hidden relative select-none animate-fade-in">
              <div className="flex items-center space-x-2 border-r border-white/10 pr-4 shrink-0 bg-slate-950/80 backdrop-blur z-10">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">Live Ticker</span>
              </div>
              <div className="flex items-center space-x-6 pl-6 overflow-x-auto no-scrollbar py-1">
                {poll.questions[0].options.map((opt: any) => {
                  const questionStats = liveStats[poll.questions[0].id] || {};
                  const optStats = questionStats[opt.id] || { count: 0 };
                  const total = Object.values(questionStats).reduce((acc: number, cur: any) => acc + (cur.count || 0), 0) as number;
                  const percentage = total > 0 ? (optStats.count / total) * 100 : 0;

                  return (
                    <div key={opt.id} className="inline-flex items-center space-x-2 border border-white/5 rounded-xl px-3 py-1.5 text-xs font-semibold bg-white/2">
                      <span className="text-gray-300 font-medium truncate max-w-[120px]">{opt.text}</span>
                      <span className="text-white font-mono">{percentage.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Aggregate counts */}
          {poll.settings?.publicShowStats !== false && (
            <div className="glass-card rounded-2xl p-6 flex justify-between items-center">
              <div>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1">
                  {poll.pollType === 'SURVEY' ? 'Total Responses Logged' : 'Total Votes Logged'}
                </span>
                <span className="font-outfit text-3xl font-extrabold text-white">{liveTotalVotes}</span>
              </div>
              <div className="p-3.5 bg-indigo-500/10 rounded-xl text-indigo-400">
                {poll.pollType === 'SURVEY' ? <ClipboardList className="w-6 h-6 text-purple-400" /> : <VoteIcon className="w-6 h-6" />}
              </div>
            </div>
          )}

          {/* Recharts graphs */}
          {poll.settings?.publicShowCharts !== false && (
            <div className="space-y-6">
              {poll.questions.map((q: any) => {
                if (['SHORT_TEXT', 'LONG_TEXT'].includes(q.type)) return null;
                return (
                  <div key={q.id} className="glass-card rounded-3xl p-8 border border-white/5">
                    <PollChart
                      questionId={q.id}
                      questionText={q.questionText}
                      type={q.type}
                      stats={liveStats[q.id] || {}}
                      votesList={poll?.votes || []}
                      optionsList={q.options || []}
                      settings={poll.settings}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Leaflet map */}
          {poll.settings?.publicShowMaps !== false && (
            <div className="space-y-3">
              <h4 className="font-outfit text-sm font-bold text-gray-400 uppercase tracking-widest">Global Device Geolocations</h4>
              <p className="text-gray-500 text-xs">A real-time distribution map plotting coordinates resolved from voter IP handshakes.</p>
              <PollMap locations={liveVoterLocations} />
            </div>
          )}
        </div>
      )}

      {/* If Results are kept completely private */}
      {votedSuccessfully && !poll.isResultPublic && (
        <div className="p-5 rounded-2xl bg-white/2 border border-white/5 text-center text-gray-500 text-xs">
          Live statistics and maps are set to private by the {poll.pollType === 'SURVEY' ? 'survey creator' : 'poll administrator'}.
        </div>
      )}
      </div>

      {poll.settings?.enableSentimentChat && (
        <div className="glass-card rounded-3xl p-6 border border-white/5 bg-[#080d1a] h-[600px] flex flex-col justify-between sticky top-24">
          <div className="space-y-2 pb-4 border-b border-white/5">
            <h4 className="font-outfit text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Opinion Chatbox</span>
            </h4>
            <p className="text-gray-500 text-[10px]">Discuss options. Message sentiments are auto-analyzed.</p>
          </div>

          {/* Chat message feed */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 no-scrollbar">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-gray-300">{msg.author}</span>
                  <span className="text-gray-500">{msg.time}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/2 border border-white/5 text-xs text-gray-200 relative group">
                  <p>{msg.text}</p>
                  <span className={`absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    msg.sentiment === 'POSITIVE'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : msg.sentiment === 'NEGATIVE'
                      ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                      : 'bg-gray-500/10 border border-gray-500/20 text-gray-400'
                  }`}>
                    {msg.sentiment === 'POSITIVE' ? '😊 Positive' : msg.sentiment === 'NEGATIVE' ? '😡 Negative' : '😐 Neutral'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Name Input & Send Input */}
          <form onSubmit={handleSendChatMessage} className="space-y-2 pt-4 border-t border-white/5">
            <input
              type="text"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="Your name..."
              className="w-full bg-slate-900 border border-white/5 rounded-lg px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-indigo-500"
            />
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-900 border border-white/5 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OTP Bypass Popup */}
      {bypassPopup.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card rounded-3xl p-8 border border-emerald-500/30 bg-emerald-500/5 shadow-2xl max-w-sm w-full mx-6 text-center space-y-4 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
            <h3 className="font-outfit text-lg font-extrabold text-white">OTP Bypass Granted</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{bypassPopup.message}</p>
            <div className="flex justify-center">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            </div>
          </div>
        </div>
      )}

      {/* ── Voter-to-Creator Chat Widget ───────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end space-y-4">
        {showOwnerChat && (
          <div className="glass-card rounded-2xl border border-white/10 p-4 w-[320px] sm:w-[360px] h-[400px] flex flex-col justify-between bg-[#080d1a] shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="font-outfit text-xs font-bold text-white">{poll?.pollType === 'EXAM' ? 'Message Examiner' : (poll?.pollType === 'SURVEY' ? 'Message Survey Creator' : 'Message Poll Owner')}</span>
              </div>
              <button
                onClick={() => setShowOwnerChat(false)}
                className="text-gray-400 hover:text-white transition-all text-xs"
              >
                ✕
              </button>
            </div>

            {/* Chat Body */}
            {!activeVoterIdentifier ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-4 space-y-3">
                <span className="text-[11px] text-gray-400 leading-relaxed">
                  To start messaging the {poll?.pollType === 'EXAM' ? 'examiner' : (poll?.pollType === 'SURVEY' ? 'survey creator' : 'poll owner')}, please enter your email so they can reply to you.
                </span>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={ownerChatEmail}
                  onChange={(e) => setOwnerChatEmail(e.target.value)}
                  className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all text-center"
                />
                <button
                  onClick={() => {
                    if (!ownerChatEmail || !ownerChatEmail.includes('@')) {
                      alert('Please enter a valid email address.');
                      return;
                    }
                    setOwnerChatEmail(ownerChatEmail.trim().toLowerCase());
                  }}
                  className="px-4 py-2 rounded-xl gradient-btn text-white text-xs font-bold transition-all w-full"
                >
                  Start Chat
                </button>
              </div>
            ) : (
              <>
                {/* Message list */}
                <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 no-scrollbar">
                  {ownerChatMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-gray-500 text-[10px] leading-relaxed p-4">
                      No messages yet. Send a message to the {poll?.pollType === 'EXAM' ? 'examiner' : (poll?.pollType === 'SURVEY' ? 'creator of this survey' : 'owner of this poll')}! They will receive it on their dashboard.
                    </div>
                  ) : (
                    ownerChatMessages.map((msg, idx) => {
                      const isMe = !msg.isFromCreator;
                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-normal ${
                            isMe 
                              ? 'bg-indigo-600 text-white rounded-br-none' 
                              : 'bg-white/5 border border-white/5 text-gray-200 rounded-bl-none'
                          }`}>
                            <p className="break-words">{msg.text}</p>
                            <span className="block text-[8px] text-white/50 text-right mt-1">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input box */}
                <form onSubmit={handleSendOwnerMessage} className="flex gap-2 pt-2 border-t border-white/5">
                  <input
                    type="text"
                    placeholder="Type message to creator..."
                    value={ownerChatInput}
                    onChange={(e) => setOwnerChatInput(e.target.value)}
                    className="flex-1 bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={ownerChatSending || !ownerChatInput.trim()}
                    className="p-2 rounded-xl gradient-btn text-white transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* Floating Toggle Button */}
        <button
          onClick={() => setShowOwnerChat(!showOwnerChat)}
          className="w-12 h-12 rounded-full gradient-btn border border-indigo-400/20 shadow-2xl flex items-center justify-center text-white hover:scale-105 transition-all duration-300"
          title={poll?.pollType === 'EXAM' ? 'Message Examiner' : (poll?.pollType === 'SURVEY' ? 'Message Survey Creator' : 'Message Poll Owner')}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Floating Scientific Calculator Toggle Icon */}
      {poll && poll.pollType === 'EXAM' && poll.settings?.enableCalculator && !votedSuccessfully && (
        <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start space-y-3">
          {isCalculatorOpen && (
            <ScientificCalculator onClose={() => setIsCalculatorOpen(false)} />
          )}
          <button
            type="button"
            onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
            className="w-12 h-12 rounded-full bg-slate-900 border border-indigo-400/20 hover:border-indigo-400/40 shadow-2xl flex items-center justify-center text-white hover:scale-105 transition-all duration-300 relative group"
            title="Open Scientific Calculator"
          >
            <span className="text-xl">🧮</span>
            {/* Tooltip */}
            <span className="absolute left-14 scale-0 group-hover:scale-100 transition-all rounded bg-slate-900 px-2 py-1 text-[10px] font-bold text-white whitespace-nowrap shadow-md uppercase tracking-wider border border-white/5">
              Scientific Calculator
            </span>
          </button>
        </div>
      )}

      {/* Strict Proctoring Lockdown Overlay */}
      {poll?.settings?.enableProctorCamera && !showIntro && !votedSuccessfully && (poll.isOpenVoting || verifiedVoter) && (!isFullscreenLocked || (!isScreenShared && !isScreenShareFallback)) && (
        <div className="fixed inset-0 z-50 bg-[#030712]/98 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 mb-6 shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-pulse">
            <ShieldAlert className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="font-outfit text-2xl font-black text-white uppercase tracking-wider mb-2">
            🚨 Guard Lockdown Protocol Active 🚨
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6 leading-relaxed font-outfit">
            {!isFullscreenLocked 
              ? "You have exited Fullscreen mode! Leaving fullscreen is a major exam violation and has been logged." 
              : "You have stopped screen sharing! Screen sharing is mandatory to take this exam."
            }
            <br/>
            Please click the button below immediately to restore your session and bypass lockdown.
          </p>
          
          {!isFullscreenLocked ? (
            <button
              type="button"
              onClick={async () => {
                try {
                  if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                    setIsFullscreenLocked(true);
                  }
                } catch (err) {
                  alert("Failed to enter fullscreen. Please maximize your window.");
                }
              }}
              className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-red-500 to-indigo-600 hover:scale-105 active:scale-95 transition-all text-white text-xs shadow-lg shadow-red-500/20"
            >
              Re-enter Fullscreen Mode
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                try {
                  const scrStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { width: 640, height: 480 }
                  });
                  scrStream.getVideoTracks()[0].onended = () => {
                    setIsScreenShared(false);
                    addProctorLog("🚨 Stopped screen sharing");
                  };
                  setScreenStream(scrStream);
                  setIsScreenShared(true);
                } catch (err) {
                  alert("You must allow screen sharing to resume your exam.");
                }
              }}
              className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-red-500 to-indigo-600 hover:scale-105 active:scale-95 transition-all text-white text-xs shadow-lg shadow-red-500/20"
            >
              Restore Screen Sharing
            </button>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
