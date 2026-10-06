"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, User, Loader2, Sparkles, RotateCcw, ChevronDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

/* ─── CSS injected once ─────────────────────────────────────────── */
const STYLES = `
@keyframes bodyFloat {
  0%,100% { transform: translateY(0px) rotateY(0deg); }
  25%      { transform: translateY(-8px) rotateY(8deg); }
  75%      { transform: translateY(-4px) rotateY(-8deg); }
}
@keyframes bodyThink {
  0%,100% { transform: rotateY(-15deg) rotateX(5deg) scale(1.05); }
  50%      { transform: rotateY(15deg) rotateX(-5deg) scale(1.08); }
}
@keyframes headNod {
  0%,100% { transform: rotateX(0deg); }
  50%      { transform: rotateX(-12deg); }
}
@keyframes armSwingL {
  0%,100% { transform: rotateZ(10deg); }
  50%      { transform: rotateZ(-20deg); }
}
@keyframes armSwingR {
  0%,100% { transform: rotateZ(-10deg); }
  50%      { transform: rotateZ(20deg); }
}
@keyframes legL {
  0%,100% { transform: rotateX(0deg); }
  50%      { transform: rotateX(15deg); }
}
@keyframes legR {
  0%,100% { transform: rotateX(0deg); }
  50%      { transform: rotateX(-15deg); }
}
@keyframes antennaGlow {
  0%,100% { box-shadow: 0 0 6px 2px #a78bfa; background:#a78bfa; }
  50%      { box-shadow: 0 0 14px 5px #f0abfc; background:#f0abfc; }
}
@keyframes eyeGlow {
  0%,100% { opacity:1; }
  50%      { opacity:0.5; }
}
@keyframes scanLine {
  0%   { top: 30%; opacity:0; }
  20%  { opacity:0.8; }
  80%  { opacity:0.8; }
  100% { top: 70%; opacity:0; }
}
@keyframes orbitCW  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes orbitCCW { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
@keyframes glowPulse {
  0%,100% { opacity:0.5; transform:scale(1); }
  50%     { opacity:0.9; transform:scale(1.2); }
}
@keyframes chatSlideUp {
  from { transform:translateY(20px); opacity:0; }
  to   { transform:translateY(0);    opacity:1; }
}
@keyframes msgIn {
  from { transform:translateY(8px); opacity:0; }
  to   { transform:translateY(0);   opacity:1; }
}
@keyframes dot1 { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
@keyframes dot2 { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
@keyframes dot3 { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
@keyframes badgePop { 0%{transform:scale(0)} 70%{transform:scale(1.3)} 100%{transform:scale(1)} }
@keyframes pingOnce { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.5);opacity:0} }
@keyframes tooltipIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
@keyframes chestBlink {
  0%,45%,55%,100% { opacity:1; }
  50%             { opacity:0.15; }
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

/* ─── 3D CSS Robot ──────────────────────────────────────────────── */
function Robot3D({ thinking, size = 1 }: { thinking: boolean; size?: number }) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const tick = () => setTimeout(() => {
      setBlink(true);
      setTimeout(() => { setBlink(false); tick(); }, 120);
    }, 2000 + Math.random() * 3000);
    const t = tick();
    return () => clearTimeout(t);
  }, []);

  const s = size;
  const c = {
    // colours
    body:    "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
    head:    "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
    dark:    "linear-gradient(180deg, #6d28d9 0%, #4338ca 100%)",
    panel:   "rgba(0,0,0,0.25)",
    shine:   "rgba(255,255,255,0.18)",
  };

  return (
    <div style={{ perspective: `${300 * s}px`, width: `${88 * s}px`, height: `${100 * s}px` }}>
      <div style={{
        width: "100%", height: "100%", position: "relative",
        transformStyle: "preserve-3d",
        animation: thinking
          ? `bodyThink 0.6s ease-in-out infinite`
          : `bodyFloat 3s ease-in-out infinite`,
      }}>

        {/* ── SHADOW ── */}
        <div style={{
          position:"absolute", bottom:`${-8*s}px`, left:"50%", transform:"translateX(-50%)",
          width:`${50*s}px`, height:`${8*s}px`,
          background:"rgba(0,0,0,0.3)", borderRadius:"50%", filter:`blur(${4*s}px)`,
        }}/>

        {/* ── HEAD ── */}
        <div style={{
          position:"absolute", top:0, left:`${10*s}px`,
          width:`${68*s}px`, height:`${44*s}px`,
          background: c.head,
          borderRadius:`${14*s}px`,
          boxShadow:`inset 0 ${2*s}px ${6*s}px rgba(255,255,255,0.15), 0 ${4*s}px ${12*s}px rgba(109,40,217,0.5)`,
          transformStyle:"preserve-3d",
          animation: thinking ? `headNod 0.8s ease-in-out infinite` : undefined,
          transformOrigin:"bottom center",
        }}>
          {/* head shine */}
          <div style={{
            position:"absolute", top:`${4*s}px`, left:`${8*s}px`,
            width:`${28*s}px`, height:`${8*s}px`,
            background: c.shine, borderRadius:`${4*s}px`,
          }}/>

          {/* EYES */}
          <div style={{ position:"absolute", top:`${12*s}px`, left:`${10*s}px`, display:"flex", gap:`${16*s}px` }}>
            {[0,1].map(i => (
              <div key={i} style={{
                width:`${16*s}px`, height: blink ? `${2*s}px` : `${14*s}px`,
                marginTop: blink ? `${6*s}px` : 0,
                background: thinking
                  ? "radial-gradient(circle at 40% 30%, #f0abfc, #c026d3)"
                  : "radial-gradient(circle at 40% 30%, #a5f3fc, #0891b2)",
                borderRadius:`${4*s}px`,
                boxShadow: thinking
                  ? `0 0 ${8*s}px ${3*s}px rgba(192,38,211,0.7)`
                  : `0 0 ${8*s}px ${3*s}px rgba(8,145,178,0.6)`,
                transition:"height 0.08s, margin-top 0.08s",
                animation: thinking ? `eyeGlow 0.5s ease-in-out infinite` : undefined,
                position:"relative", overflow:"hidden",
              }}>
                {/* eye glint */}
                {!blink && <div style={{
                  position:"absolute", top:`${2*s}px`, left:`${3*s}px`,
                  width:`${5*s}px`, height:`${5*s}px`,
                  background:"rgba(255,255,255,0.8)", borderRadius:"50%",
                }}/>}
              </div>
            ))}
          </div>

          {/* MOUTH */}
          {thinking ? (
            <div style={{
              position:"absolute", bottom:`${8*s}px`, left:"50%", transform:"translateX(-50%)",
              width:`${14*s}px`, height:`${8*s}px`,
              background:"rgba(0,0,0,0.4)", borderRadius:`${4*s}px`,
            }}/>
          ) : (
            <div style={{
              position:"absolute", bottom:`${8*s}px`, left:"50%", transform:"translateX(-50%)",
              width:`${28*s}px`, height:`${8*s}px`,
              borderBottom:`${2.5*s}px solid rgba(0,0,0,0.4)`,
              borderLeft:`${2.5*s}px solid rgba(0,0,0,0.4)`,
              borderRight:`${2.5*s}px solid rgba(0,0,0,0.4)`,
              borderRadius:`0 0 ${14*s}px ${14*s}px`,
            }}/>
          )}

          {/* ANTENNA */}
          <div style={{
            position:"absolute", top:`${-18*s}px`, left:"50%", transform:"translateX(-50%)",
            width:`${3*s}px`, height:`${18*s}px`,
            background:"#a78bfa", borderRadius:`${2*s}px`,
          }}/>
          <div style={{
            position:"absolute", top:`${-24*s}px`, left:"50%",
            transform:"translateX(-50%)",
            width:`${10*s}px`, height:`${10*s}px`, borderRadius:"50%",
            animation:"antennaGlow 1.3s ease-in-out infinite",
          }}/>

          {/* EARS */}
          {[-1,1].map(side => (
            <div key={side} style={{
              position:"absolute", top:`${10*s}px`,
              [side === -1 ? "left" : "right"]: `${-10*s}px`,
              width:`${10*s}px`, height:`${20*s}px`,
              background: c.dark, borderRadius:`${5*s}px`,
              boxShadow:`inset 0 ${2*s}px ${4*s}px rgba(255,255,255,0.15)`,
            }}>
              <div style={{
                position:"absolute", top:`${5*s}px`, left:`${2*s}px`,
                width:`${6*s}px`, height:`${8*s}px`,
                background:"rgba(255,255,255,0.2)", borderRadius:`${3*s}px`,
              }}/>
            </div>
          ))}
        </div>

        {/* ── BODY ── */}
        <div style={{
          position:"absolute", top:`${46*s}px`, left:`${8*s}px`,
          width:`${72*s}px`, height:`${44*s}px`,
          background: c.body,
          borderRadius:`${12*s}px`,
          boxShadow:`inset 0 ${2*s}px ${6*s}px rgba(255,255,255,0.12), 0 ${6*s}px ${18*s}px rgba(109,40,217,0.45)`,
        }}>
          {/* body shine */}
          <div style={{
            position:"absolute", top:`${4*s}px`, left:`${8*s}px`,
            width:`${24*s}px`, height:`${8*s}px`,
            background: c.shine, borderRadius:`${4*s}px`,
          }}/>

          {/* CHEST PANEL */}
          <div style={{
            position:"absolute", top:`${12*s}px`, left:`${12*s}px`,
            width:`${48*s}px`, height:`${22*s}px`,
            background: c.panel, borderRadius:`${8*s}px`,
            overflow:"hidden",
          }}>
            {/* scan line when thinking */}
            {thinking && (
              <div style={{
                position:"absolute", left:0, right:0, height:`${2*s}px`,
                background:"rgba(167,139,250,0.8)",
                animation:"scanLine 1s linear infinite",
              }}/>
            )}
            {/* chest lights */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:`${10*s}px`, height:"100%" }}>
              {[
                thinking ? "#f0abfc" : "#34d399",
                "#60a5fa",
                "#fbbf24",
              ].map((col, i) => (
                <div key={i} style={{
                  width:`${8*s}px`, height:`${8*s}px`, borderRadius:"50%",
                  background: col,
                  boxShadow:`0 0 ${6*s}px ${2*s}px ${col}80`,
                  animation:`chestBlink ${0.6 + i*0.3}s ease-in-out infinite`,
                  animationDelay:`${i*0.2}s`,
                }}/>
              ))}
            </div>
          </div>
        </div>

        {/* ── ARMS ── */}
        {([-1,1] as const).map((side, idx) => (
          <div key={side} style={{
            position:"absolute", top:`${50*s}px`,
            [side === -1 ? "left" : "right"]: `${-8*s}px`,
            width:`${18*s}px`, height:`${36*s}px`,
            transformOrigin:"top center",
            animation: thinking ? undefined : `${side===-1?"armSwingL":"armSwingR"} 1.5s ease-in-out infinite`,
            animationDelay: `${idx*0.2}s`,
          }}>
            {/* upper arm */}
            <div style={{
              width:`${16*s}px`, height:`${28*s}px`,
              background: c.dark, borderRadius:`${8*s}px`,
              boxShadow:`inset 0 ${2*s}px ${4*s}px rgba(255,255,255,0.12)`,
            }}/>
            {/* hand */}
            <div style={{
              width:`${14*s}px`, height:`${12*s}px`,
              marginTop:`${2*s}px`,
              background:`linear-gradient(135deg,#5b21b6,#3730a3)`,
              borderRadius:`${6*s}px`,
            }}/>
          </div>
        ))}

        {/* ── LEGS ── */}
        {([-1,1] as const).map((side, idx) => (
          <div key={side} style={{
            position:"absolute", top:`${86*s}px`,
            left: side===-1 ? `${18*s}px` : `${50*s}px`,
            width:`${20*s}px`,
            transformOrigin:"top center",
            animation: thinking ? undefined : `${side===-1?"legL":"legR"} 1.5s ease-in-out infinite`,
            animationDelay:`${idx*0.25}s`,
          }}>
            {/* leg */}
            <div style={{
              width:`${18*s}px`, height:`${14*s}px`,
              background: c.dark, borderRadius:`${6*s}px`,
              boxShadow:`inset 0 ${2*s}px ${4*s}px rgba(255,255,255,0.1)`,
            }}/>
            {/* foot */}
            <div style={{
              width:`${22*s}px`, height:`${8*s}px`,
              marginLeft:`${-2*s}px`,
              background:`linear-gradient(135deg,#4c1d95,#312e81)`,
              borderRadius:`${4*s}px`,
            }}/>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Floating launcher ─────────────────────────────────────────── */
function RobotLauncher({ isOpen, thinking, hasNew, onClick }: {
  isOpen: boolean; thinking: boolean; hasNew: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Open AI Infrastructure Advisor"
      className="fixed bottom-6 right-6 z-50 focus:outline-none"
      style={{ width: 96, height: 120 }}
    >
      {/* unread badge */}
      {hasNew && !isOpen && (
        <span className="absolute -top-1 -right-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white border-2 border-background"
          style={{ animation:"badgePop .35s cubic-bezier(.34,1.56,.64,1) forwards" }}>!</span>
      )}

      {/* orbit rings */}
      {!isOpen && <>
        <div className="absolute rounded-full border border-violet-400/30 pointer-events-none"
          style={{ inset:-10, animation:"orbitCW 7s linear infinite" }}/>
        <div className="absolute rounded-full border border-indigo-300/20 pointer-events-none"
          style={{ inset:-20, animation:"orbitCCW 11s linear infinite" }}/>
      </>}

      {/* ground glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width:64, height:20,
          background:"radial-gradient(ellipse, rgba(109,40,217,0.6) 0%, transparent 70%)",
          filter:"blur(8px)",
          animation:"glowPulse 2s ease-in-out infinite",
          transform:`translateX(-50%) scale(${hovered||thinking?1.4:1})`,
          transition:"transform .3s",
        }}/>

      {isOpen ? (
        <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full mx-auto mt-4 transition-all"
          style={{ background:"linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow:"0 4px 20px rgba(109,40,217,.6)" }}>
          <X className="h-7 w-7 text-white"/>
        </div>
      ) : (
        <div className="relative z-10 flex items-center justify-center">
          <Robot3D thinking={thinking} size={1}/>
        </div>
      )}

      {/* tooltip */}
      {hovered && !isOpen && (
        <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-xl bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-lg pointer-events-none"
          style={{ animation:"tooltipIn .15s ease-out forwards" }}>
          Ask ARIA ✨
          <div className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 bg-foreground"/>
        </div>
      )}
    </button>
  );
}

/* ─── Typing dots ───────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {(["dot1 1.2s 0s","dot2 1.2s .18s","dot3 1.2s .36s"] as const).map((a, i) => (
        <span key={i} className="block h-2 w-2 rounded-full bg-violet-400"
          style={{ animation:`${a} infinite` }}/>
      ))}
    </div>
  );
}

/* ─── Message bubble ────────────────────────────────────────────── */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const fmt = (text: string) =>
    text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((p, i) => {
      if (p.startsWith("`") && p.endsWith("`"))
        return <code key={i} className="rounded bg-violet-500/15 px-1.5 py-0.5 font-mono text-[11px] text-violet-600 dark:text-violet-300">{p.slice(1,-1)}</code>;
      if (p.startsWith("**") && p.endsWith("**"))
        return <strong key={i} className="font-semibold">{p.slice(2,-2)}</strong>;
      return p.split("\n").map((l,j,a) => <span key={`${i}-${j}`}>{l}{j<a.length-1&&<br/>}</span>);
    });

  return (
    <div className={cn("flex gap-2 items-end", isUser && "flex-row-reverse")}
      style={{ animation:"msgIn .2s ease-out forwards" }}>
      <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white",
        isUser ? "bg-gradient-to-br from-orange-400 to-orange-600"
               : "bg-gradient-to-br from-violet-500 to-indigo-600")}>
        {isUser ? <User className="h-3 w-3"/> : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="3" width="10" height="8" rx="2.5" fill="rgba(255,255,255,.25)"/>
            <rect x="3"   y="5" width="2.5" height="2.5" rx=".8" fill="white"/>
            <rect x="8.5" y="5" width="2.5" height="2.5" rx=".8" fill="white"/>
            <line x1="7" y1="3" x2="7" y2="1" stroke="rgba(255,255,255,.7)" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="7" cy=".8" r=".8" fill="rgba(240,171,252,.95)"/>
          </svg>
        )}
      </div>
      <div className={cn("max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm",
        isUser ? "rounded-br-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white"
               : "rounded-bl-sm bg-card border border-border/60 text-foreground")}>
        <p className="whitespace-pre-wrap break-words">{fmt(msg.content)}</p>
        <span className={cn("mt-0.5 block text-[10px]",
          isUser ? "text-right text-orange-100/60" : "text-muted-foreground")}>
          {msg.timestamp.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
        </span>
      </div>
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────────── */
export function AiChat() {
  const [isOpen,    setIsOpen]    = useState(false);
  const [input,     setInput]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string|null>(null);
  const [minimized, setMinimized] = useState(false);
  const [hasNew,    setHasNew]    = useState(false);
  const [messages,  setMessages]  = useState<Message[]>([{
    id:"welcome", role:"assistant",
    content:"Hi! I'm ARIA — your AWS Robot Infrastructure Advisor 🤖\n\nDescribe what you want to build and I'll recommend the right services, explain the architecture, and warn about common mistakes.\n\nWhat are you building?",
    timestamp: new Date(),
  }]);

  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) { setHasNew(false); setMinimized(false); setTimeout(()=>inputRef.current?.focus(),150); }
  }, [isOpen]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setError(null);
    const userMsg: Message = { id:Date.now().toString(), role:"user", content:text.trim(), timestamp:new Date() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsLoading(true);
    try {
      const res  = await fetch("/api/ai-chat", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages: next.map(m=>({role:m.role,content:m.content})) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||"Request failed");
      const aiMsg: Message = { id:(Date.now()+1).toString(), role:"assistant", content:data.content, timestamp:new Date() };
      setMessages(p=>[...p,aiMsg]);
      if (!isOpen) setHasNew(true);
    } catch(e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsLoading(false);
      setTimeout(()=>inputRef.current?.focus(),50);
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
      <StyleInjector/>
      <RobotLauncher isOpen={isOpen} thinking={isLoading} hasNew={hasNew} onClick={()=>setIsOpen(o=>!o)}/>

      {isOpen && (
        <div className={cn(
            "fixed bottom-[136px] right-6 z-50 flex flex-col overflow-hidden",
            "w-[calc(100vw-3rem)] max-w-[360px]",
            "rounded-2xl border border-border/70 bg-background shadow-2xl shadow-black/25",
            minimized ? "h-[52px]" : "h-[540px]",
          )}
          style={{ animation:"chatSlideUp .25s cubic-bezier(.34,1.56,.64,1) forwards" }}>

          {/* header */}
          <div className="flex shrink-0 items-center gap-3 px-4 py-2.5"
            style={{ background:"linear-gradient(135deg,#6d28d9 0%,#4338ca 60%,#3730a3 100%)" }}>
            <div className="relative shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden"
                style={{ background:"rgba(255,255,255,.15)" }}>
                <Robot3D thinking={isLoading} size={0.4}/>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-background">
                <span className="absolute inset-0 rounded-full bg-emerald-400"
                  style={{ animation:"pingOnce 1.4s ease-out infinite" }}/>
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
              <button type="button" onClick={()=>setMinimized(m=>!m)}
                className="rounded-full p-1.5 text-white/60 hover:bg-white/15 hover:text-white transition-colors">
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", minimized&&"rotate-180")}/>
              </button>
            </div>
          </div>

          {!minimized && <>
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
          </>}
        </div>
      )}
    </>
  );
}
