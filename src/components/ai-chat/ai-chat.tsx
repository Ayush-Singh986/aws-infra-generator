"use client";

import { useState, useRef, useEffect, Suspense, lazy } from "react";
import {
  X, Send, User, Loader2, Sparkles, RotateCcw, ChevronDown, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Lazy-load Spline so it doesn't block initial page render
const Spline = lazy(() => import("@splinetool/react-spline"));

/* ─── types ─────────────────────────────────────────────────────── */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const STARTER_PROMPTS = [
  "Node.js API + PostgreSQL database",
  "Serverless web app architecture",
  "ECS vs EKS — which should I use?",
  "Cheapest static website on AWS",
];

/* ─── global CSS injected once ───────────────────────────────────── */
const STYLES = `
@keyframes chatSlideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes msgIn       { from{transform:translateY(8px);opacity:0}  to{transform:translateY(0);opacity:1} }
@keyframes dot1        { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
@keyframes dot2        { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
@keyframes dot3        { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
@keyframes badgePop    { 0%{transform:scale(0)} 70%{transform:scale(1.3)} 100%{transform:scale(1)} }
@keyframes orbitCW     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes orbitCCW    { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
@keyframes glowPulse   { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:.9;transform:scale(1.15)} }
@keyframes tooltipIn   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes onlinePing  { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.5);opacity:0} }
@keyframes spin3d      {
  0%  { transform: rotateY(0deg)   rotateX(8deg); }
  50% { transform: rotateY(180deg) rotateX(-4deg); }
  100%{ transform: rotateY(360deg) rotateX(8deg); }
}
`;

function StyleInjector() {
  useEffect(() => {
    if (document.getElementById("aria-css")) return;
    const el = document.createElement("style");
    el.id = "aria-css";
    el.textContent = STYLES;
    document.head.appendChild(el);
  }, []);
  return null;
}

/* ─── Typing dots ────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      {(["dot1 1.2s 0s infinite","dot2 1.2s .18s infinite","dot3 1.2s .36s infinite"] as const).map((a,i) => (
        <span key={i} className="block h-2 w-2 rounded-full bg-violet-400" style={{ animation: a }} />
      ))}
    </div>
  );
}

/* ─── 3D Robot launcher button ───────────────────────────────────── */
function RobotLauncher({
  isOpen, thinking, hasNew, onClick,
}: {
  isOpen: boolean; thinking: boolean; hasNew: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [splineLoaded, setSplineLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Open AI Infrastructure Advisor"
      className="fixed bottom-6 right-6 z-50 focus:outline-none"
      style={{ width: 96, height: 96 }}
    >
      {/* unread badge */}
      {hasNew && !isOpen && (
        <span
          className="absolute -top-1 -right-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white border-2 border-background"
          style={{ animation: "badgePop .35s cubic-bezier(.34,1.56,.64,1) forwards" }}
        >!</span>
      )}

      {/* orbit rings — visible when closed */}
      {!isOpen && (
        <>
          <div className="absolute inset-[-10px] rounded-full border border-violet-400/30 pointer-events-none"
            style={{ animation: "orbitCW 7s linear infinite" }} />
          <div className="absolute inset-[-18px] rounded-full border border-indigo-400/18 pointer-events-none"
            style={{ animation: "orbitCCW 11s linear infinite" }} />
        </>
      )}

      {/* glow under the robot */}
      <div
        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-6 rounded-full pointer-events-none"
        style={{
          background: thinking
            ? "radial-gradient(ellipse, rgba(192,38,211,.7) 0%, transparent 70%)"
            : "radial-gradient(ellipse, rgba(109,40,217,.55) 0%, transparent 70%)",
          filter: "blur(8px)",
          animation: "glowPulse 2s ease-in-out infinite",
          transform: `translateX(-50%) scale(${hovered ? 1.3 : 1})`,
          transition: "transform .3s",
        }}
      />

      {isOpen ? (
        /* close button */
        <div
          className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full mx-auto mt-2 transition-all duration-200"
          style={{
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
            boxShadow: "0 4px 20px rgba(109,40,217,.6)",
          }}
        >
          <X className="h-7 w-7 text-white" />
        </div>
      ) : (
        /* 3D Spline robot — lazy loaded, falls back to CSS robot */
        <div
          className="relative z-10 w-full h-full overflow-hidden"
          style={{ borderRadius: "50%" }}
        >
          <Suspense fallback={<FallbackRobot thinking={thinking} />}>
            <div
              style={{
                width: "100%",
                height: "100%",
                transform: thinking ? "scale(1.08)" : "scale(1)",
                transition: "transform .4s ease",
              }}
            >
              <Spline
                scene="https://prod.spline.design/kZDDjO5HuC9GEZKT/scene.splinecode"
                onLoad={() => setSplineLoaded(true)}
                style={{ width: "100%", height: "100%", borderRadius: "50%" }}
              />
              {/* show fallback until spline loads */}
              {!splineLoaded && (
                <div className="absolute inset-0">
                  <FallbackRobot thinking={thinking} />
                </div>
              )}
            </div>
          </Suspense>
        </div>
      )}

      {/* tooltip on hover */}
      {hovered && !isOpen && (
        <div
          className="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-xl bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-lg pointer-events-none"
          style={{ animation: "tooltipIn .15s ease-out forwards" }}
        >
          Ask ARIA ✨
          <div className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 bg-foreground" />
        </div>
      )}
    </button>
  );
}

/* ─── CSS fallback robot (shown while Spline loads) ─────────────── */
function FallbackRobot({ thinking }: { thinking: boolean }) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const tick = () => {
      const d = 2200 + Math.random() * 2800;
      return setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); tick(); }, 120);
      }, d);
    };
    const t = tick();
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ perspective: "300px" }}
    >
      <div style={{ animation: thinking ? "none" : "spin3d 6s ease-in-out infinite" }}>
        <svg width="76" height="76" viewBox="0 0 76 76" fill="none"
          style={{
            filter: "drop-shadow(0 6px 18px rgba(109,40,217,.6))",
            animation: thinking ? "glowPulse .5s ease-in-out infinite alternate" : undefined,
          }}
        >
          <ellipse cx="38" cy="72" rx="16" ry="3" fill="rgba(0,0,0,.2)" />

          {/* body */}
          <rect x="18" y="32" width="40" height="30" rx="9" fill="url(#rb)" />
          <rect x="20" y="33" width="18" height="6" rx="3" fill="rgba(255,255,255,.18)" />

          {/* chest panel */}
          <rect x="24" y="42" width="28" height="13" rx="5" fill="rgba(0,0,0,.22)" />
          <circle cx="30" cy="48.5" r="3" fill={thinking ? "#f0abfc" : "#34d399"}>
            {thinking && <animate attributeName="opacity" values="1;.2;1" dur=".55s" repeatCount="indefinite" />}
          </circle>
          <circle cx="38" cy="48.5" r="3" fill="#60a5fa">
            <animate attributeName="opacity" values="1;.4;1" dur=".9s" repeatCount="indefinite" />
          </circle>
          <circle cx="46" cy="48.5" r="3" fill="#fbbf24">
            <animate attributeName="opacity" values="1;.6;1" dur="1.1s" repeatCount="indefinite" />
          </circle>

          {/* head */}
          <rect x="20" y="8" width="36" height="28" rx="11" fill="url(#rh)" />
          <rect x="22" y="9" width="16" height="6" rx="3" fill="rgba(255,255,255,.22)" />

          {/* eyes */}
          <rect x="25" y="16" width="10" height={blink ? 1.5 : 9} rx={blink ? 1 : 3.5}
            fill="url(#re)" style={{ transition: "height .08s" }} />
          <rect x="41" y="16" width="10" height={blink ? 1.5 : 9} rx={blink ? 1 : 3.5}
            fill="url(#re)" style={{ transition: "height .08s" }} />
          {!blink && <>
            <circle cx="30.5" cy="18.5" r="2" fill="rgba(255,255,255,.85)" />
            <circle cx="46.5" cy="18.5" r="2" fill="rgba(255,255,255,.85)" />
          </>}

          {/* mouth */}
          {thinking
            ? <ellipse cx="38" cy="31" rx="4" ry="3" fill="rgba(0,0,0,.4)" />
            : <path d="M29 31 Q38 37 47 31" stroke="rgba(0,0,0,.45)" strokeWidth="2.2" strokeLinecap="round" fill="none" />}

          {/* antenna */}
          <line x1="38" y1="8" x2="38" y2="2" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="38" cy="1.5" r="3.5" fill="#a78bfa">
            <animate attributeName="opacity" values="1;.3;1" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="r" values="3.5;4.5;3.5" dur="1.2s" repeatCount="indefinite" />
          </circle>

          {/* ears */}
          <rect x="11" y="14" width="9" height="14" rx="4.5" fill="url(#rb)" />
          <rect x="56" y="14" width="9" height="14" rx="4.5" fill="url(#rb)" />
          <rect x="13" y="19" width="4" height="5" rx="2" fill="rgba(255,255,255,.28)" />
          <rect x="59" y="19" width="4" height="5" rx="2" fill="rgba(255,255,255,.28)" />

          {/* arms */}
          <rect x="5" y="33" width="13" height="22" rx="6.5" fill="url(#rb)" />
          <rect x="58" y="33" width="13" height="22" rx="6.5" fill="url(#rb)" />
          <ellipse cx="11.5" cy="58" rx="6" ry="4.5" fill="url(#rd)" />
          <ellipse cx="64.5" cy="58" rx="6" ry="4.5" fill="url(#rd)" />

          {/* legs + feet */}
          <rect x="24" y="61" width="11" height="9" rx="4.5" fill="url(#rd)" />
          <rect x="41" y="61" width="11" height="9" rx="4.5" fill="url(#rd)" />
          <ellipse cx="29.5" cy="70" rx="7" ry="3" fill="url(#rf)" />
          <ellipse cx="46.5" cy="70" rx="7" ry="3" fill="url(#rf)" />

          <defs>
            <linearGradient id="rb" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="rh" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="rd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6d28d9" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>
            <linearGradient id="rf" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5b21b6" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
            <radialGradient id="re" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor={thinking ? "#f0abfc" : "#a5f3fc"} />
              <stop offset="100%" stopColor={thinking ? "#c026d3" : "#0891b2"} />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

/* ─── Message bubble ─────────────────────────────────────────────── */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const fmt = (text: string) =>
    text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((p, i) => {
      if (p.startsWith("`") && p.endsWith("`"))
        return <code key={i} className="rounded bg-violet-500/15 px-1.5 py-0.5 font-mono text-[11px] text-violet-600 dark:text-violet-300">{p.slice(1,-1)}</code>;
      if (p.startsWith("**") && p.endsWith("**"))
        return <strong key={i} className="font-semibold">{p.slice(2,-2)}</strong>;
      return p.split("\n").map((l,j,a) => (
        <span key={`${i}-${j}`}>{l}{j<a.length-1&&<br/>}</span>
      ));
    });

  return (
    <div className={cn("flex gap-2 items-end", isUser && "flex-row-reverse")}
      style={{ animation: "msgIn .2s ease-out forwards" }}>
      <div className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white",
        isUser ? "bg-gradient-to-br from-orange-400 to-orange-600"
               : "bg-gradient-to-br from-violet-500 to-indigo-600",
      )}>
        {isUser ? <User className="h-3 w-3" /> : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="3" width="10" height="8" rx="2.5" fill="rgba(255,255,255,.25)"/>
            <rect x="3"   y="5" width="2.5" height="2.5" rx=".8" fill="white"/>
            <rect x="8.5" y="5" width="2.5" height="2.5" rx=".8" fill="white"/>
            <line x1="7" y1="3" x2="7" y2="1" stroke="rgba(255,255,255,.7)" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="7" cy=".8" r=".8" fill="rgba(240,171,252,.95)"/>
          </svg>
        )}
      </div>
      <div className={cn(
        "max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm",
        isUser ? "rounded-br-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white"
               : "rounded-bl-sm bg-card border border-border/60 text-foreground",
      )}>
        <p className="whitespace-pre-wrap break-words">{fmt(msg.content)}</p>
        <span className={cn("mt-0.5 block text-[10px]",
          isUser ? "text-right text-orange-100/60" : "text-muted-foreground")}>
          {msg.timestamp.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
        </span>
      </div>
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────────── */
export function AiChat() {
  const [isOpen, setIsOpen]       = useState(false);
  const [input, setInput]         = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string|null>(null);
  const [minimized, setMinimized] = useState(false);
  const [hasNew, setHasNew]       = useState(false);
  const [messages, setMessages]   = useState<Message[]>([{
    id: "welcome", role: "assistant",
    content: "Hi! I'm ARIA — your AWS Robot Infrastructure Advisor 🤖\n\nDescribe what you want to build and I'll recommend the right services, explain the architecture, and warn about common mistakes.\n\nWhat are you building?",
    timestamp: new Date(),
  }]);

  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) { setHasNew(false); setMinimized(false); setTimeout(()=>inputRef.current?.focus(), 150); }
  }, [isOpen]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setError(null);
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim(), timestamp: new Date() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsLoading(true);
    try {
      const res  = await fetch("/api/ai-chat", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages: next.map(m=>({role:m.role,content:m.content})) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      const aiMsg: Message = { id:(Date.now()+1).toString(), role:"assistant", content:data.content, timestamp:new Date() };
      setMessages(p=>[...p, aiMsg]);
      if (!isOpen) setHasNew(true);
    } catch(e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsLoading(false);
      setTimeout(()=>inputRef.current?.focus(), 50);
    }
  };

  const reset = () => {
    setMessages([{ id:"r"+Date.now(), role:"assistant",
      content:"Fresh start! 🤖 What are you building on AWS?", timestamp:new Date() }]);
    setError(null); setInput("");
  };

  const userCount = messages.filter(m=>m.role==="user").length;

  return (
    <>
      <StyleInjector />
      <RobotLauncher isOpen={isOpen} thinking={isLoading} hasNew={hasNew} onClick={()=>setIsOpen(o=>!o)} />

      {isOpen && (
        <div
          className={cn(
            "fixed bottom-[116px] right-6 z-50 flex flex-col overflow-hidden",
            "w-[calc(100vw-3rem)] max-w-[360px]",
            "rounded-2xl border border-border/70 bg-background shadow-2xl shadow-black/25",
            minimized ? "h-[52px]" : "h-[540px]",
          )}
          style={{ animation: "chatSlideUp .25s cubic-bezier(.34,1.56,.64,1) forwards" }}
        >
          {/* header */}
          <div className="flex shrink-0 items-center gap-3 px-4 py-2.5"
            style={{ background: "linear-gradient(135deg,#6d28d9 0%,#4338ca 60%,#3730a3 100%)" }}>
            <div className="relative shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden"
                style={{ background:"rgba(255,255,255,.15)" }}>
                {/* mini robot in header */}
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none"
                  style={{ animation: isLoading ? "glowPulse .5s ease-in-out infinite alternate" : "none" }}>
                  <rect x="4" y="9" width="20" height="14" rx="5" fill="rgba(255,255,255,.28)"/>
                  <rect x="5" y="4" width="18" height="11" rx="4.5" fill="rgba(255,255,255,.38)"/>
                  <rect x="7"    y="6" width="4.5" height="4.5" rx="1.5" fill="white"/>
                  <rect x="16.5" y="6" width="4.5" height="4.5" rx="1.5" fill="white"/>
                  <circle cx="9.5" cy="7.5" r="1.2" fill="rgba(167,139,250,.9)"/>
                  <circle cx="19"  cy="7.5" r="1.2" fill="rgba(167,139,250,.9)"/>
                  <line x1="14" y1="4" x2="14" y2="1" stroke="rgba(255,255,255,.7)" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="14" cy=".8" r="1.1" fill="rgba(240,171,252,.95)">
                    <animate attributeName="opacity" values="1;.3;1" dur="1.2s" repeatCount="indefinite"/>
                  </circle>
                  <rect x="0"  y="11" width="5" height="8" rx="2.5" fill="rgba(255,255,255,.22)"/>
                  <rect x="23" y="11" width="5" height="8" rx="2.5" fill="rgba(255,255,255,.22)"/>
                </svg>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-background">
                <span className="absolute inset-0 rounded-full bg-emerald-400"
                  style={{ animation: "onlinePing 1.4s ease-out infinite" }} />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight">ARIA</span>
                <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white/90"
                  style={{ background:"rgba(255,255,255,.18)" }}>
                  <Sparkles className="h-2 w-2"/> Gemini
                </span>
              </div>
              <span className="text-[11px] text-white/65 leading-none">
                {isLoading ? "🔍 Analyzing…" : userCount>0 ? `${userCount} message${userCount>1?"s":""}` : "AWS Infrastructure Advisor"}
              </span>
            </div>

            <div className="flex items-center gap-0.5">
              {userCount>0 && (
                <button type="button" onClick={reset} title="New chat"
                  className="rounded-full p-1.5 text-white/60 hover:bg-white/15 hover:text-white transition-colors">
                  <RotateCcw className="h-3.5 w-3.5"/>
                </button>
              )}
              <button type="button" onClick={()=>setMinimized(m=>!m)} title={minimized?"Expand":"Minimize"}
                className="rounded-full p-1.5 text-white/60 hover:bg-white/15 hover:text-white transition-colors">
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", minimized&&"rotate-180")}/>
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* messages */}
              <div className="flex-1 overflow-y-auto space-y-3 p-3.5">
                {messages.map(m=><MessageBubble key={m.id} msg={m}/>)}
                {isLoading && (
                  <div className="flex items-end gap-2" style={{ animation:"msgIn .2s ease-out forwards" }}>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="2" y="3" width="10" height="8" rx="2.5" fill="rgba(255,255,255,.25)"/>
                        <rect x="3" y="5" width="2.5" height="2.5" rx=".8" fill="white"/>
                        <rect x="8.5" y="5" width="2.5" height="2.5" rx=".8" fill="white"/>
                      </svg>
                    </div>
                    <div className="rounded-2xl rounded-bl-sm border border-border/60 bg-card px-3.5 py-2.5">
                      <TypingDots/>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3"
                    style={{ animation:"msgIn .2s ease-out forwards" }}>
                    <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5"/>
                    <div className="text-xs text-destructive">
                      <p className="font-medium">Error</p>
                      <p className="mt-0.5 text-destructive/80">{error}</p>
                      {error.includes("GEMINI_API_KEY") && (
                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                          className="mt-1 block font-medium underline">Get your free API key →</a>
                      )}
                    </div>
                  </div>
                )}
                <div ref={endRef}/>
              </div>

              {/* starter prompts */}
              {userCount===0 && (
                <div className="shrink-0 border-t border-border/40 px-3 py-2 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Try asking:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {STARTER_PROMPTS.map(p=>(
                      <button key={p} type="button" onClick={()=>send(p)}
                        className="rounded-lg border border-border/60 bg-muted/40 px-2 py-1.5 text-left text-[11px] text-muted-foreground hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-foreground transition-all leading-tight">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* input */}
              <div className="shrink-0 border-t border-border/60 bg-background/95 p-3">
                <div className="flex items-end gap-2">
                  <textarea ref={inputRef} value={input}
                    onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input);} }}
                    placeholder="Describe what you want to build…"
                    rows={1} disabled={isLoading}
                    className="flex-1 resize-none rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 max-h-28 leading-relaxed transition-all"
                    style={{ minHeight:36 }}
                    onInput={e=>{ const t=e.target as HTMLTextAreaElement; t.style.height="auto"; t.style.height=Math.min(t.scrollHeight,112)+"px"; }}
                  />
                  <Button size="sm" onClick={()=>send(input)} disabled={!input.trim()||isLoading}
                    className="h-9 w-9 shrink-0 rounded-xl p-0 text-white disabled:opacity-40"
                    style={{ background:"linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Send className="h-3.5 w-3.5"/>}
                  </Button>
                </div>
                <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
                  Powered by Google Gemini · Enter to send
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
