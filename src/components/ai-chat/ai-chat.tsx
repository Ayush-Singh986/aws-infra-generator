"use client";

import { useState, useRef, useEffect } from "react";
import {
  X, Send, User, Loader2, Sparkles, RotateCcw, ChevronDown, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const STARTER_PROMPTS = [
  "I need a Node.js API with PostgreSQL database",
  "What services for a serverless web app?",
  "Help me choose between ECS and EKS",
  "Cheapest way to host a static website on AWS?",
];

/* ── inject keyframes once ─────────────────────────────────────── */
const CSS = `
@keyframes ariaFloat    { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-7px) rotate(1.5deg)} }
@keyframes ariaPulse    { 0%{transform:scale(1) rotate(-2deg)} 100%{transform:scale(1.1) rotate(2deg)} }
@keyframes orbitCW      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes orbitCCW     { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
@keyframes antennaBlink { 0%,40%,100%{opacity:1;r:3} 20%{opacity:0.2;r:2} }
@keyframes scanLine     { 0%{transform:translateY(-11px);opacity:0} 20%{opacity:.7} 80%{opacity:.7} 100%{transform:translateY(11px);opacity:0} }
@keyframes particle     { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:var(--tx,0) var(--ty,0) scale(0);opacity:0} }
@keyframes chatSlideUp  { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes msgIn        { from{transform:translateY(8px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes dot1         { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
@keyframes dot2         { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
@keyframes dot3         { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
@keyframes tooltipFade  { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
@keyframes badgePop     { 0%{transform:scale(0)} 70%{transform:scale(1.3)} 100%{transform:scale(1)} }
@keyframes onlinePing   { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.2);opacity:0} }
`;

function StyleInjector() {
  useEffect(() => {
    if (document.getElementById("aria-styles")) return;
    const s = document.createElement("style");
    s.id = "aria-styles";
    s.textContent = CSS;
    document.head.appendChild(s);
  }, []);
  return null;
}

/* ── Typing dots ───────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-0.5">
      {[
        { anim: "dot1 1.2s 0s infinite" },
        { anim: "dot2 1.2s .2s infinite" },
        { anim: "dot3 1.2s .4s infinite" },
      ].map(({ anim }, i) => (
        <span
          key={i}
          className="block h-2 w-2 rounded-full bg-violet-400"
          style={{ animation: anim }}
        />
      ))}
    </div>
  );
}

/* ── ARIA robot SVG ────────────────────────────────────────────── */
function RobotSVG({ thinking, size = 64 }: { thinking: boolean; size?: number }) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const tick = () => {
      const d = 2500 + Math.random() * 2500;
      return setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); tick(); }, 130);
      }, d);
    };
    const t = tick();
    return () => clearTimeout(t);
  }, []);

  const eyeH = blink ? 1 : 8;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={{
        animation: thinking
          ? "ariaPulse .55s ease-in-out infinite alternate"
          : "ariaFloat 3s ease-in-out infinite",
        filter: "drop-shadow(0 4px 14px rgba(109,40,217,.55))",
      }}
    >
      {/* ── shadow ── */}
      <ellipse cx="32" cy="61" rx="13" ry="2.5" fill="rgba(0,0,0,.2)" />

      {/* ── body ── */}
      <rect x="15" y="28" width="34" height="26" rx="8" fill="url(#bg)" />
      <rect x="17" y="29" width="15" height="5" rx="2.5" fill="rgba(255,255,255,.15)" />

      {/* chest panel */}
      <rect x="20" y="37" width="24" height="11" rx="4" fill="rgba(0,0,0,.22)" />
      <circle cx="26" cy="42.5" r="2.5" fill={thinking ? "#f0abfc" : "#34d399"}>
        {thinking && <animate attributeName="opacity" values="1;.3;1" dur=".6s" repeatCount="indefinite" />}
      </circle>
      <circle cx="32" cy="42.5" r="2.5" fill="#60a5fa">
        <animate attributeName="opacity" values="1;.4;1" dur=".85s" repeatCount="indefinite" />
      </circle>
      <circle cx="38" cy="42.5" r="2.5" fill="#fbbf24">
        <animate attributeName="opacity" values="1;.5;1" dur="1.1s" repeatCount="indefinite" />
      </circle>
      {thinking && (
        <rect x="20" y="37" width="24" height="2" rx="1" fill="rgba(167,139,250,.75)"
          style={{ animation: "scanLine 1s linear infinite" }} />
      )}

      {/* ── head ── */}
      <rect x="17" y="7" width="30" height="24" rx="9" fill="url(#hg)" />
      <rect x="19" y="8" width="13" height="5" rx="2.5" fill="rgba(255,255,255,.2)" />

      {/* eyes */}
      <rect x="21" y="14" width="9" height={eyeH} rx={blink ? .5 : 3} fill="url(#eg)"
        style={{ transition: "height .07s" }} />
      <rect x="34" y="14" width="9" height={eyeH} rx={blink ? .5 : 3} fill="url(#eg)"
        style={{ transition: "height .07s" }} />
      {!blink && (
        <>
          <circle cx="26" cy="16" r="1.5" fill="rgba(255,255,255,.8)" />
          <circle cx="39" cy="16" r="1.5" fill="rgba(255,255,255,.8)" />
        </>
      )}
      {thinking && !blink && (
        <>
          <rect x="21" y="17" width="9" height="1.5" rx=".75" fill="rgba(240,171,252,.7)">
            <animate attributeName="y" values="14;21;14" dur="1s" repeatCount="indefinite" />
          </rect>
          <rect x="34" y="17" width="9" height="1.5" rx=".75" fill="rgba(240,171,252,.7)">
            <animate attributeName="y" values="14;21;14" dur="1s" begin=".25s" repeatCount="indefinite" />
          </rect>
        </>
      )}

      {/* mouth */}
      {thinking
        ? <ellipse cx="32" cy="27" rx="3.5" ry="2.5" fill="rgba(0,0,0,.4)" />
        : <path d="M25 27 Q32 32 39 27" stroke="rgba(0,0,0,.4)" strokeWidth="2" strokeLinecap="round" fill="none" />}

      {/* antenna */}
      <line x1="32" y1="7" x2="32" y2="2" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="1.5" r="2.8" fill="#a78bfa"
        style={{ animation: "antennaBlink 1.3s ease-in-out infinite" }} />

      {/* ears */}
      <rect x="9" y="12" width="8" height="12" rx="4" fill="url(#bg)" />
      <rect x="47" y="12" width="8" height="12" rx="4" fill="url(#bg)" />
      <rect x="11" y="16" width="3" height="4" rx="1.5" fill="rgba(255,255,255,.25)" />
      <rect x="50" y="16" width="3" height="4" rx="1.5" fill="rgba(255,255,255,.25)" />

      {/* arms */}
      <rect x="4" y="29" width="11" height="18" rx="5.5" fill="url(#bg)" />
      <rect x="49" y="29" width="11" height="18" rx="5.5" fill="url(#bg)" />
      <ellipse cx="9.5" cy="49" rx="5" ry="3.5" fill="url(#dk)" />
      <ellipse cx="54.5" cy="49" rx="5" ry="3.5" fill="url(#dk)" />

      {/* legs */}
      <rect x="20" y="53" width="10" height="8" rx="4" fill="url(#dk)" />
      <rect x="34" y="53" width="10" height="8" rx="4" fill="url(#dk)" />
      <ellipse cx="25" cy="61" rx="6" ry="2.5" fill="url(#ft)" />
      <ellipse cx="39" cy="61" rx="6" ry="2.5" fill="url(#ft)" />

      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="dk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id="ft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5b21b6" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
        <radialGradient id="eg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor={thinking ? "#f0abfc" : "#a5f3fc"} />
          <stop offset="100%" stopColor={thinking ? "#c026d3" : "#0891b2"} />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ── Floating robot launcher button ───────────────────────────── */
function RobotLauncher({
  isOpen, thinking, hasNew, onClick,
}: {
  isOpen: boolean; thinking: boolean; hasNew: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Open AI Infrastructure Advisor"
      className="fixed bottom-6 right-6 z-50 focus:outline-none"
      style={{ width: 76, height: 76 }}
    >
      {/* unread badge */}
      {hasNew && !isOpen && (
        <span
          className="absolute -top-1 -right-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white border-2 border-background"
          style={{ animation: "badgePop .35s cubic-bezier(.34,1.56,.64,1) forwards" }}
        >!</span>
      )}

      {/* orbit rings */}
      {!isOpen && (
        <>
          <div className="absolute rounded-full border border-violet-400/35 pointer-events-none"
            style={{ inset: -9, animation: "orbitCW 7s linear infinite" }} />
          <div className="absolute rounded-full border border-indigo-400/22 pointer-events-none"
            style={{ inset: -16, animation: "orbitCCW 11s linear infinite" }} />
        </>
      )}

      {/* glow */}
      <div className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(109,40,217,.5) 0%, transparent 70%)",
          filter: "blur(10px)",
          transform: hovered || thinking ? "scale(1.4)" : "scale(1)",
          transition: "transform .3s",
        }} />

      {/* thinking particles */}
      {thinking && [
        { tx: "translateX(-18px) translateY(-20px)", color: "#a78bfa", l: 12, t: 10 },
        { tx: "translateX(18px) translateY(-18px)", color: "#818cf8", l: 50, t: 12 },
        { tx: "translateX(-20px) translateY(12px)", color: "#c084fc", l: 6,  t: 50 },
      ].map(({ tx, color, l, t }, i) => (
        <span key={i} className="absolute h-2 w-2 rounded-full pointer-events-none"
          style={{
            left: l, top: t, background: color,
            animation: `particle 1.1s ease-out ${i * .25}s infinite`,
            ["--tx" as string]: tx,
          }} />
      ))}

      {/* close X or robot */}
      {isOpen ? (
        <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full mx-auto mt-1"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 18px rgba(109,40,217,.55)" }}>
          <X className="h-6 w-6 text-white" />
        </div>
      ) : (
        <div className="relative z-10">
          <RobotSVG thinking={thinking} size={74} />
        </div>
      )}

      {/* tooltip */}
      {hovered && !isOpen && (
        <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-xl bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-lg pointer-events-none"
          style={{ animation: "tooltipFade .15s ease-out forwards" }}>
          Ask ARIA ✨
          <div className="absolute -bottom-1 right-5 h-2 w-2 rotate-45 bg-foreground" />
        </div>
      )}
    </button>
  );
}

/* ── Message bubble ────────────────────────────────────────────── */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  const fmt = (text: string) =>
    text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((p, i) => {
      if (p.startsWith("`") && p.endsWith("`"))
        return <code key={i} className="rounded bg-violet-500/15 px-1.5 py-0.5 font-mono text-[11px] text-violet-600 dark:text-violet-300">{p.slice(1, -1)}</code>;
      if (p.startsWith("**") && p.endsWith("**"))
        return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>;
      return p.split("\n").map((l, j, a) => (
        <span key={`${i}-${j}`}>{l}{j < a.length - 1 && <br />}</span>
      ));
    });

  return (
    <div className={cn("flex gap-2 items-end", isUser && "flex-row-reverse")}
      style={{ animation: "msgIn .2s ease-out forwards" }}>
      {/* avatar */}
      <div className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white",
        isUser
          ? "bg-gradient-to-br from-orange-400 to-orange-600"
          : "bg-gradient-to-br from-violet-500 to-indigo-600",
      )}>
        {isUser
          ? <User className="h-3 w-3" />
          : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="3" width="10" height="8" rx="2.5" fill="rgba(255,255,255,.25)" />
              <rect x="3" y="5" width="2.5" height="2.5" rx=".8" fill="white" />
              <rect x="8.5" y="5" width="2.5" height="2.5" rx=".8" fill="white" />
              <line x1="7" y1="3" x2="7" y2="1" stroke="rgba(255,255,255,.7)" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="7" cy=".8" r=".8" fill="rgba(240,171,252,.95)" />
            </svg>
          )}
      </div>
      {/* bubble */}
      <div className={cn(
        "max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm",
        isUser
          ? "rounded-br-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white"
          : "rounded-bl-sm bg-card border border-border/60 text-foreground",
      )}>
        <p className="whitespace-pre-wrap break-words">{fmt(msg.content)}</p>
        <span className={cn("mt-0.5 block text-[10px]",
          isUser ? "text-right text-orange-100/60" : "text-muted-foreground")}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────── */
export function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    role: "assistant",
    content: "Hi! I'm ARIA — your AWS Robot Infrastructure Advisor 🤖\n\nDescribe what you want to build and I'll recommend the right services, explain the architecture, and warn about common mistakes.\n\nWhat are you building?",
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasNew(false);
      setMinimized(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
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
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: data.content, timestamp: new Date() };
      setMessages((p) => [...p, aiMsg]);
      if (!isOpen) setHasNew(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const reset = () => {
    setMessages([{ id: "r" + Date.now(), role: "assistant", content: "Fresh start! 🤖 What are you building on AWS?", timestamp: new Date() }]);
    setError(null);
    setInput("");
  };

  const userCount = messages.filter((m) => m.role === "user").length;

  return (
    <>
      <StyleInjector />

      <RobotLauncher isOpen={isOpen} thinking={isLoading} hasNew={hasNew} onClick={() => setIsOpen((o) => !o)} />

      {isOpen && (
        <div
          className={cn(
            "fixed bottom-[104px] right-6 z-50 flex flex-col overflow-hidden",
            "w-[calc(100vw-3rem)] max-w-[360px]",
            "rounded-2xl border border-border/70 bg-background shadow-2xl shadow-black/25",
            minimized ? "h-[52px]" : "h-[540px]",
          )}
          style={{ animation: "chatSlideUp .25s cubic-bezier(.34,1.56,.64,1) forwards" }}
        >
          {/* ── header ── */}
          <div
            className="flex shrink-0 items-center gap-3 px-4 py-2.5"
            style={{ background: "linear-gradient(135deg,#6d28d9 0%,#4338ca 60%,#3730a3 100%)" }}
          >
            {/* mini animated robot head in header */}
            <div className="relative shrink-0">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{
                  background: "rgba(255,255,255,.15)",
                  animation: isLoading ? "ariaPulse .55s ease-in-out infinite alternate" : "ariaFloat 3s ease-in-out infinite",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="4" y="9" width="20" height="14" rx="5" fill="rgba(255,255,255,.28)" />
                  <rect x="5" y="4" width="18" height="11" rx="4.5" fill="rgba(255,255,255,.38)" />
                  <rect x="7" y="6" width="4.5" height="4.5" rx="1.5" fill="white" />
                  <rect x="16.5" y="6" width="4.5" height="4.5" rx="1.5" fill="white" />
                  <circle cx="9.5" cy="7.5" r="1.2" fill="rgba(167,139,250,.9)" />
                  <circle cx="19" cy="7.5" r="1.2" fill="rgba(167,139,250,.9)" />
                  <line x1="14" y1="4" x2="14" y2="1" stroke="rgba(255,255,255,.7)" strokeWidth="1.3" strokeLinecap="round" />
                  <circle cx="14" cy=".8" r="1.1" fill="rgba(240,171,252,.95)">
                    <animate attributeName="opacity" values="1;.3;1" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                  <rect x="0" y="11" width="5" height="8" rx="2.5" fill="rgba(255,255,255,.22)" />
                  <rect x="23" y="11" width="5" height="8" rx="2.5" fill="rgba(255,255,255,.22)" />
                  {isLoading && (
                    <rect x="5" y="9" width="18" height="1.8" rx=".9" fill="rgba(240,171,252,.7)"
                      style={{ animation: "scanLine .9s linear infinite" }} />
                  )}
                </svg>
              </div>
              {/* online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-background">
                <span className="absolute inset-0 rounded-full bg-emerald-400"
                  style={{ animation: "onlinePing 1.4s ease-out infinite" }} />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight">ARIA</span>
                <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white/90"
                  style={{ background: "rgba(255,255,255,.18)" }}>
                  <Sparkles className="h-2 w-2" /> Gemini
                </span>
              </div>
              <span className="text-[11px] text-white/65 leading-none">
                {isLoading ? "🔍 Analyzing..." : userCount > 0 ? `${userCount} message${userCount > 1 ? "s" : ""}` : "AWS Infrastructure Advisor"}
              </span>
            </div>

            <div className="flex items-center gap-0.5">
              {userCount > 0 && (
                <button type="button" onClick={reset} title="New chat"
                  className="rounded-full p-1.5 text-white/60 hover:bg-white/15 hover:text-white transition-colors">
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
              <button type="button" onClick={() => setMinimized((m) => !m)} title={minimized ? "Expand" : "Minimize"}
                className="rounded-full p-1.5 text-white/60 hover:bg-white/15 hover:text-white transition-colors">
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", minimized && "rotate-180")} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* ── messages ── */}
              <div className="flex-1 overflow-y-auto space-y-3 p-3.5">
                {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}

                {isLoading && (
                  <div className="flex items-end gap-2" style={{ animation: "msgIn .2s ease-out forwards" }}>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="2" y="3" width="10" height="8" rx="2.5" fill="rgba(255,255,255,.25)" />
                        <rect x="3" y="5" width="2.5" height="2.5" rx=".8" fill="white" />
                        <rect x="8.5" y="5" width="2.5" height="2.5" rx=".8" fill="white" />
                      </svg>
                    </div>
                    <div className="rounded-2xl rounded-bl-sm border border-border/60 bg-card px-3.5 py-2.5">
                      <TypingDots />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3"
                    style={{ animation: "msgIn .2s ease-out forwards" }}>
                    <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                    <div className="text-xs text-destructive">
                      <p className="font-medium">Error</p>
                      <p className="mt-0.5 text-destructive/80">{error}</p>
                      {error.includes("GEMINI_API_KEY") && (
                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                          className="mt-1 block font-medium underline">
                          Get your free API key →
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div ref={endRef} />
              </div>

              {/* ── starter prompts ── */}
              {userCount === 0 && (
                <div className="shrink-0 border-t border-border/40 px-3 py-2 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Try asking:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {STARTER_PROMPTS.map((p) => (
                      <button key={p} type="button" onClick={() => send(p)}
                        className="rounded-lg border border-border/60 bg-muted/40 px-2 py-1.5 text-left text-[11px] text-muted-foreground hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-foreground transition-all leading-tight">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── input ── */}
              <div className="shrink-0 border-t border-border/60 bg-background/95 p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                    placeholder="Describe what you want to build…"
                    rows={1}
                    disabled={isLoading}
                    className="flex-1 resize-none rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 max-h-28 leading-relaxed transition-all"
                    style={{ minHeight: 36 }}
                    onInput={(e) => {
                      const t = e.target as HTMLTextAreaElement;
                      t.style.height = "auto";
                      t.style.height = Math.min(t.scrollHeight, 112) + "px";
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => send(input)}
                    disabled={!input.trim() || isLoading}
                    className="h-9 w-9 shrink-0 rounded-xl p-0 text-white disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
                  >
                    {isLoading
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Send className="h-3.5 w-3.5" />}
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
