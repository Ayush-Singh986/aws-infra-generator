"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  "Node.js API + PostgreSQL database",
  "Serverless web app architecture",
  "ECS vs EKS — which to use?",
  "Cheapest static website on AWS",
];

const QUIPS = [
  "Need AWS help? 👋",
  "Ask me anything! 🚀",
  "I know AWS! 🤖",
  "Click me! ✨",
  "Architecture help?",
  "Free advice! 😄",
];

/* ─── CSS keyframes ─────────────────────────────────────────────── */
const STYLES = `
@keyframes astroFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
@keyframes astroThink  { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-4px) rotate(3deg)} }
@keyframes visorScan   { 0%{top:28%;opacity:0} 15%{opacity:.7} 85%{opacity:.7} 100%{top:72%;opacity:0} }
@keyframes antennaLed  { 0%,100%{box-shadow:0 0 5px 2px #ef4444;background:#ef4444} 50%{box-shadow:0 0 12px 5px #fca5a5;background:#fca5a5} }
@keyframes shadowPulse { 0%,100%{transform:translateX(-50%) scaleX(1);opacity:.3} 50%{transform:translateX(-50%) scaleX(.65);opacity:.15} }
@keyframes legWalkL    { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(18deg)} 75%{transform:rotate(-18deg)} }
@keyframes legWalkR    { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-18deg)} 75%{transform:rotate(18deg)} }
@keyframes armSwingL   { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-20deg)} 75%{transform:rotate(20deg)} }
@keyframes armSwingR   { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(20deg)} 75%{transform:rotate(-20deg)} }
@keyframes bodyBob     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
@keyframes bubbleIn    { from{transform:scale(0) translateY(6px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
@keyframes chatSlideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes msgIn       { from{transform:translateY(8px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes tdot1 { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
@keyframes tdot2 { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
@keyframes tdot3 { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
@keyframes badgePop  { 0%{transform:scale(0)} 70%{transform:scale(1.4)} 100%{transform:scale(1)} }
@keyframes pingDot   { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.5);opacity:0} }
@keyframes visorFlicker { 0%,90%,100%{opacity:1} 92%,98%{opacity:.3} }
`;

function StyleInjector() {
  useEffect(() => {
    if (document.getElementById("astro-css")) return;
    const el = document.createElement("style");
    el.id = "astro-css";
    el.textContent = STYLES;
    document.head.appendChild(el);
  }, []);
  return null;
}

/* ─── Astronaut Robot SVG ───────────────────────────────────────── */
function AstroBot({
  thinking = false,
  walking  = false,
  size     = 110,
}: {
  thinking?: boolean;
  walking?: boolean;
  size?: number;
}) {
  const s = size / 110;

  const walkAnim  = walking  ? ".55s linear infinite" : undefined;
  const floatAnim = thinking ? "astroThink 0.7s ease-in-out infinite"
                             : walking   ? undefined
                             : "astroFloat 2.8s ease-in-out infinite";

  return (
    <div style={{ width: 110*s, height: 130*s, position: "relative", display: "inline-block" }}>
      {/* shadow */}
      <div style={{
        position:"absolute", bottom: -6*s, left:"50%",
        width: 60*s, height: 10*s,
        background:"rgba(0,0,0,.22)",
        borderRadius:"50%",
        filter:`blur(${4*s}px)`,
        animation:"shadowPulse 1.4s ease-in-out infinite",
      }}/>

      {/* main body wrapper — floats */}
      <div style={{ animation: floatAnim, transformOrigin:"center bottom" }}>

        {/* ── LEGS ── */}
        {/* left leg */}
        <div style={{
          position:"absolute", bottom: 0, left: 22*s,
          width: 22*s, height: 32*s,
          transformOrigin:"top center",
          animation: walkAnim ? `legWalkL ${walkAnim}` : undefined,
        }}>
          {/* thigh */}
          <div style={{
            width: 20*s, height: 18*s,
            background:"linear-gradient(170deg,#e2e8f0,#cbd5e1)",
            borderRadius:`${8*s}px ${8*s}px ${4*s}px ${4*s}px`,
            boxShadow:`inset -${2*s}px -${2*s}px ${6*s}px rgba(0,0,0,.15)`,
          }}/>
          {/* boot */}
          <div style={{
            width: 22*s, height: 16*s,
            marginTop: 1*s,
            background:"linear-gradient(170deg,#3730a3,#312e81)",
            borderRadius:`${4*s}px ${4*s}px ${8*s}px ${8*s}px`,
            boxShadow:`inset -${2*s}px -${2*s}px ${5*s}px rgba(0,0,0,.3)`,
          }}>
            {/* boot yellow sole */}
            <div style={{
              position:"absolute", bottom:0, left:0, right:0,
              height: 4*s,
              background:"#eab308",
              borderRadius:`0 0 ${8*s}px ${8*s}px`,
            }}/>
          </div>
        </div>

        {/* right leg */}
        <div style={{
          position:"absolute", bottom: 0, right: 22*s,
          width: 22*s, height: 32*s,
          transformOrigin:"top center",
          animation: walkAnim ? `legWalkR ${walkAnim}` : undefined,
        }}>
          <div style={{
            width: 20*s, height: 18*s,
            background:"linear-gradient(170deg,#cbd5e1,#94a3b8)",
            borderRadius:`${8*s}px ${8*s}px ${4*s}px ${4*s}px`,
            boxShadow:`inset -${2*s}px -${2*s}px ${6*s}px rgba(0,0,0,.2)`,
          }}/>
          <div style={{
            width: 22*s, height: 16*s,
            marginTop: 1*s,
            background:"linear-gradient(170deg,#4338ca,#3730a3)",
            borderRadius:`${4*s}px ${4*s}px ${8*s}px ${8*s}px`,
            boxShadow:`inset -${2*s}px -${2*s}px ${5*s}px rgba(0,0,0,.3)`,
          }}>
            <div style={{
              position:"absolute", bottom:0, left:0, right:0,
              height: 4*s,
              background:"#eab308",
              borderRadius:`0 0 ${8*s}px ${8*s}px`,
            }}/>
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{
          position:"absolute", bottom: 26*s, left: 10*s,
          width: 90*s, height: 60*s,
          animation: walkAnim ? `bodyBob ${walkAnim}` : undefined,
        }}>
          {/* torso */}
          <div style={{
            position:"absolute", left: 8*s, top: 0,
            width: 74*s, height: 58*s,
            background:"linear-gradient(160deg,#f8fafc 30%,#e2e8f0 100%)",
            borderRadius:`${18*s}px ${18*s}px ${14*s}px ${14*s}px`,
            boxShadow:`inset -${4*s}px -${4*s}px ${12*s}px rgba(0,0,0,.12), 0 ${4*s}px ${12*s}px rgba(0,0,0,.15)`,
          }}>
            {/* red chest stripe */}
            <div style={{
              position:"absolute", top: 16*s, left: 8*s,
              width: 16*s, height: 5*s,
              background:"#ef4444", borderRadius: 3*s,
            }}/>
            {/* black belly accent */}
            <div style={{
              position:"absolute", bottom: 6*s, left: "50%",
              transform:"translateX(-50%)",
              width: 28*s, height: 20*s,
              background:"linear-gradient(160deg,#1e293b,#334155)",
              borderRadius: 10*s,
              boxShadow:`inset 0 ${2*s}px ${6*s}px rgba(0,0,0,.4)`,
            }}/>
          </div>

          {/* yellow collar */}
          <div style={{
            position:"absolute", left: "50%",
            transform:"translateX(-50%)",
            top: -6*s,
            width: 38*s, height: 12*s,
            background:"linear-gradient(180deg,#fde047,#eab308)",
            borderRadius:`${8*s}px ${8*s}px ${4*s}px ${4*s}px`,
            boxShadow:`0 ${2*s}px ${6*s}px rgba(234,179,8,.4)`,
            zIndex: 2,
          }}/>

          {/* LEFT ARM */}
          <div style={{
            position:"absolute", left: -14*s, top: 6*s,
            width: 22*s, height: 44*s,
            transformOrigin:"top center",
            animation: walkAnim ? `armSwingL ${walkAnim}` : undefined,
          }}>
            <div style={{
              width: 20*s, height: 28*s,
              background:"linear-gradient(160deg,#f1f5f9,#cbd5e1)",
              borderRadius: 10*s,
              boxShadow:`inset -${2*s}px -${2*s}px ${6*s}px rgba(0,0,0,.12)`,
            }}/>
            {/* glove */}
            <div style={{
              width: 22*s, height: 18*s,
              marginTop: 1*s,
              background:"linear-gradient(160deg,#334155,#1e293b)",
              borderRadius: 10*s,
              boxShadow:`inset -${2*s}px -${2*s}px ${4*s}px rgba(0,0,0,.3)`,
            }}>
              {/* red glove stripe */}
              <div style={{
                position:"absolute", top: 4*s, left: 2*s,
                width: 14*s, height: 3*s,
                background:"#ef4444", borderRadius: 2*s,
              }}/>
            </div>
          </div>

          {/* RIGHT ARM */}
          <div style={{
            position:"absolute", right: -14*s, top: 6*s,
            width: 22*s, height: 44*s,
            transformOrigin:"top center",
            animation: walkAnim ? `armSwingR ${walkAnim}` : undefined,
          }}>
            <div style={{
              width: 20*s, height: 28*s,
              background:"linear-gradient(160deg,#e2e8f0,#94a3b8)",
              borderRadius: 10*s,
              boxShadow:`inset -${2*s}px -${2*s}px ${6*s}px rgba(0,0,0,.15)`,
            }}/>
            <div style={{
              width: 22*s, height: 18*s,
              marginTop: 1*s,
              background:"linear-gradient(160deg,#1e293b,#0f172a)",
              borderRadius: 10*s,
              boxShadow:`inset -${2*s}px -${2*s}px ${4*s}px rgba(0,0,0,.3)`,
            }}>
              <div style={{
                position:"absolute", top: 4*s, left: 2*s,
                width: 14*s, height: 3*s,
                background:"#ef4444", borderRadius: 2*s,
              }}/>
            </div>
          </div>
        </div>

        {/* ── HELMET ── */}
        <div style={{
          position:"absolute", bottom: 72*s, left: 0,
          width: 110*s, height: 72*s,
          zIndex: 3,
        }}>
          {/* red dome back */}
          <div style={{
            position:"absolute", top: 0, left: 5*s,
            width: 100*s, height: 68*s,
            background:"linear-gradient(140deg,#ef4444 0%,#dc2626 50%,#b91c1c 100%)",
            borderRadius:`${50*s}px ${50*s}px ${22*s}px ${22*s}px`,
            boxShadow:`inset -${6*s}px -${4*s}px ${16*s}px rgba(0,0,0,.25), 0 ${4*s}px ${14*s}px rgba(239,68,68,.4)`,
          }}>
            {/* red helmet shine */}
            <div style={{
              position:"absolute", top: 8*s, left: 12*s,
              width: 28*s, height: 14*s,
              background:"rgba(255,255,255,.25)",
              borderRadius: 10*s,
              transform:"rotate(-20deg)",
            }}/>
          </div>

          {/* dark helmet rim */}
          <div style={{
            position:"absolute", bottom: 0, left: 8*s,
            width: 94*s, height: 20*s,
            background:"linear-gradient(180deg,#1e293b,#0f172a)",
            borderRadius:`${4*s}px ${4*s}px ${20*s}px ${20*s}px`,
          }}/>

          {/* VISOR (big cyan window) */}
          <div style={{
            position:"absolute", top: 14*s, left: 15*s,
            width: 80*s, height: 48*s,
            background:"linear-gradient(160deg,#164e63 0%,#0e7490 40%,#06b6d4 100%)",
            borderRadius:`${24*s}px ${24*s}px ${18*s}px ${18*s}px`,
            boxShadow:`inset 0 ${2*s}px ${8*s}px rgba(0,0,0,.4), inset 0 -${2*s}px ${6*s}px rgba(255,255,255,.1)`,
            overflow:"hidden",
            animation: thinking ? "visorFlicker 2s ease-in-out infinite" : undefined,
          }}>
            {/* scan lines */}
            {[0,1,2,3,4,5].map(i=>(
              <div key={i} style={{
                position:"absolute", left:0, right:0,
                top:`${12+i*14}%`, height: 1.5*s,
                background:"rgba(255,255,255,.12)",
              }}/>
            ))}
            {/* thinking scan beam */}
            {thinking && (
              <div style={{
                position:"absolute", left:0, right:0,
                height: 3*s,
                background:"rgba(167,243,252,.7)",
                animation:"visorScan .9s linear infinite",
              }}/>
            )}
            {/* visor shine */}
            <div style={{
              position:"absolute", top: 5*s, left: 6*s,
              width: 24*s, height: 10*s,
              background:"rgba(255,255,255,.22)",
              borderRadius: 8*s,
              transform:"rotate(-12deg)",
            }}/>
            {/* EYES inside visor */}
            <div style={{
              position:"absolute", top: "30%", left: "50%",
              transform:"translate(-50%,-50%)",
              display:"flex", gap: 10*s,
            }}>
              {[0,1].map(i=>(
                <div key={i} style={{
                  width: 14*s, height: 20*s,
                  background:"linear-gradient(180deg,#f0f9ff,#e0f2fe)",
                  borderRadius: 4*s,
                  boxShadow:`0 0 ${6*s}px rgba(224,242,254,.8)`,
                }}>
                  {/* eye scan line */}
                  <div style={{
                    width:"100%", height: 2*s,
                    background:"rgba(14,116,144,.5)",
                    marginTop: 8*s,
                  }}/>
                </div>
              ))}
            </div>
          </div>

          {/* ANTENNA on right side of helmet */}
          <div style={{
            position:"absolute", top: 6*s, right: 12*s,
            width: 10*s, height: 28*s,
            transformOrigin:"bottom center",
            transform:"rotate(12deg)",
          }}>
            {/* antenna body — dark with red detail */}
            <div style={{
              width: 7*s, height: 22*s,
              background:"linear-gradient(180deg,#374151,#111827)",
              borderRadius: 4*s,
              marginLeft: 1.5*s,
            }}>
              <div style={{
                position:"absolute", top: 8*s, left: 1*s,
                width: 5*s, height: 3*s,
                background:"#ef4444", borderRadius: 2*s,
              }}/>
            </div>
            {/* antenna tip glow */}
            <div style={{
              width: 10*s, height: 10*s,
              borderRadius:"50%",
              animation:"antennaLed 1.2s ease-in-out infinite",
            }}/>
          </div>

          {/* backpack / life support on right shoulder */}
          <div style={{
            position:"absolute", top: 30*s, right: -2*s,
            width: 18*s, height: 28*s,
            background:"linear-gradient(160deg,#374151,#1f2937)",
            borderRadius: 8*s,
            boxShadow:`inset -${2*s}px -${2*s}px ${6*s}px rgba(0,0,0,.3)`,
          }}>
            <div style={{
              position:"absolute", top: 6*s, left: 3*s,
              width: 8*s, height: 4*s,
              background:"#ef4444", borderRadius: 2*s,
            }}/>
            <div style={{
              position:"absolute", top: 14*s, left: 3*s,
              width: 8*s, height: 4*s,
              background:"#6b7280", borderRadius: 2*s,
            }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Speech bubble ─────────────────────────────────────────────── */
function SpeechBubble({ text, side }: { text: string; side: "left" | "right" }) {
  return (
    <div style={{
      position:"absolute",
      top: "10%",
      [side === "right" ? "left" : "right"]:"calc(100% + 6px)",
      maxWidth: 170, minWidth: 90,
      background:"white",
      borderRadius: 12,
      padding:"7px 11px",
      boxShadow:"0 4px 14px rgba(0,0,0,.18)",
      fontSize: 11, lineHeight: 1.5,
      color:"#1e293b", fontWeight: 600,
      animation:"bubbleIn .3s cubic-bezier(.34,1.56,.64,1) forwards",
      zIndex: 60, whiteSpace:"nowrap",
    }}>
      {text}
      <div style={{
        position:"absolute", top: 12,
        [side === "right" ? "right" : "left"]:"100%",
        width:0, height:0,
        borderTop:"5px solid transparent",
        borderBottom:"5px solid transparent",
        [side === "right" ? "borderLeft" : "borderRight"]:"7px solid white",
      }}/>
    </div>
  );
}

/* ─── Roaming astronaut ─────────────────────────────────────────── */
function RoamingAstro({ isOpen, thinking, hasNew, onClick }: {
  isOpen: boolean; thinking: boolean; hasNew: boolean; onClick: () => void;
}) {
  const ROBOT_W = 110, ROBOT_H = 130;
  const [pos,     setPos]     = useState({ x: 0, y: 0 });
  const [dir,     setDir]     = useState<"left"|"right">("right");
  const [walking, setWalking] = useState(false);
  const [quip,    setQuip]    = useState<string|null>(null);
  const [hovered, setHovered] = useState(false);

  const posRef    = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const animRef   = useRef<number>(0);

  // Init bottom-right
  useEffect(() => {
    const x = window.innerWidth  - ROBOT_W - 30;
    const y = window.innerHeight - ROBOT_H - 30;
    setPos({ x, y }); posRef.current = { x, y };
    targetRef.current = { x, y };
  }, []);

  const pickTarget = useCallback(() => {
    const m = 30;
    const nx = m + Math.random() * (window.innerWidth  - ROBOT_W - m * 2);
    const ny = m + Math.random() * (window.innerHeight - ROBOT_H - m * 2);
    targetRef.current = { x: nx, y: ny };
  }, []);

  // Schedule random walks
  useEffect(() => {
    if (isOpen) { setWalking(false); return; }
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => { t = setTimeout(() => { pickTarget(); schedule(); }, 2500 + Math.random() * 3500); };
    schedule();
    return () => clearTimeout(t);
  }, [isOpen, pickTarget]);

  // Quips
  useEffect(() => {
    if (isOpen) return;
    const id = setInterval(() => {
      if (Math.random() < 0.45) {
        setQuip(QUIPS[Math.floor(Math.random() * QUIPS.length)]);
        setTimeout(() => setQuip(null), 2800);
      }
    }, 5500);
    return () => clearInterval(id);
  }, [isOpen]);

  // Smooth movement loop
  useEffect(() => {
    if (isOpen) { cancelAnimationFrame(animRef.current); return; }
    const SPEED = 1.6;
    const tick = () => {
      const cur = posRef.current;
      const tgt = targetRef.current;
      const dx = tgt.x - cur.x, dy = tgt.y - cur.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 2) {
        const nx = cur.x + (dx / dist) * Math.min(SPEED, dist);
        const ny = cur.y + (dy / dist) * Math.min(SPEED, dist);
        posRef.current = { x: nx, y: ny };
        setPos({ x: nx, y: ny });
        setDir(dx > 0 ? "right" : "left");
        setWalking(true);
      } else {
        setWalking(false);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [isOpen]);

  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => { setHovered(true);  setWalking(false); }}
      onMouseLeave={() =>   setHovered(false)}
      aria-label="Open AI Infrastructure Advisor"
      style={{
        position:"fixed",
        left: pos.x,
        top:  pos.y,
        width: ROBOT_W, height: ROBOT_H + 16,
        zIndex: 50,
        background:"transparent", border:"none", padding:0,
        cursor:"pointer",
        transform: dir === "left" ? "scaleX(-1)" : "scaleX(1)",
        transition:"transform .18s",
        willChange:"left,top,transform",
      }}
    >
      {/* unread badge */}
      {hasNew && (
        <span style={{
          position:"absolute", top:-2, right:-2, zIndex:62,
          width:18, height:18, borderRadius:"50%",
          background:"#f97316", color:"white",
          fontSize:9, fontWeight:800,
          display:"flex", alignItems:"center", justifyContent:"center",
          border:"2px solid white",
          animation:"badgePop .35s cubic-bezier(.34,1.56,.64,1) forwards",
        }}>!</span>
      )}

      {/* speech bubble — unflip when robot is mirrored */}
      {(quip || hovered) && (
        <div style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%",
          transform: dir==="left" ? "scaleX(-1)" : "none" }}>
          <SpeechBubble
            text={hovered ? "Click to ask me! 🚀" : quip!}
            side={dir === "right" ? "left" : "right"}
          />
        </div>
      )}

      {/* thinking badge above head */}
      {thinking && (
        <div style={{
          position:"absolute", top:-30, left:"50%",
          transform:`translateX(-50%)${dir==="left"?" scaleX(-1)":""}`,
          background:"rgba(14,116,144,.9)", borderRadius:20,
          padding:"3px 10px", color:"white", fontSize:10, fontWeight:700,
          whiteSpace:"nowrap", zIndex:62,
        }}>thinking… 🤔</div>
      )}

      <AstroBot thinking={thinking} walking={walking && !hovered} size={110}/>
    </button>
  );
}

/* ─── Typing dots ───────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {(["tdot1 1.2s 0s","tdot2 1.2s .18s","tdot3 1.2s .36s"] as const).map((a,i) => (
        <span key={i} className="block h-2 w-2 rounded-full bg-cyan-500"
          style={{ animation:`${a} infinite` }}/>
      ))}
    </div>
  );
}

/* ─── Message bubble ────────────────────────────────────────────── */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const fmt = (text: string) =>
    text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((p,i) => {
      if (p.startsWith("`") && p.endsWith("`"))
        return <code key={i} className="rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[11px] text-cyan-700 dark:text-cyan-300">{p.slice(1,-1)}</code>;
      if (p.startsWith("**") && p.endsWith("**"))
        return <strong key={i} className="font-semibold">{p.slice(2,-2)}</strong>;
      return p.split("\n").map((l,j,a) => <span key={`${i}-${j}`}>{l}{j<a.length-1&&<br/>}</span>);
    });

  return (
    <div className={cn("flex gap-2 items-end", isUser && "flex-row-reverse")}
      style={{ animation:"msgIn .2s ease-out forwards" }}>
      <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white",
        isUser ? "bg-gradient-to-br from-orange-400 to-orange-600"
               : "bg-gradient-to-br from-cyan-500 to-blue-600")}>
        {isUser ? <User className="h-3 w-3"/> : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" fill="rgba(255,255,255,.2)"/>
            <rect x="3" y="4" width="2.5" height="3.5" rx=".8" fill="white"/>
            <rect x="6.5" y="4" width="2.5" height="3.5" rx=".8" fill="white"/>
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

/* ─── Chat window ───────────────────────────────────────────────── */
function ChatWindow({ onClose, thinking, messages, isLoading, error, input, setInput,
  send, reset, minimized, setMinimized }: {
  onClose: () => void; thinking: boolean; messages: Message[];
  isLoading: boolean; error: string|null; input: string;
  setInput:(v:string)=>void; send:(t:string)=>void;
  reset:()=>void; minimized:boolean; setMinimized:(v:boolean)=>void;
}) {
  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const userCount = messages.filter(m=>m.role==="user").length;

  useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);
  useEffect(() => { setTimeout(()=>inputRef.current?.focus(),150); }, []);

  return (
    <div className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden",
        "w-[calc(100vw-3rem)] max-w-[360px]",
        "rounded-2xl border border-border/70 bg-background shadow-2xl",
        minimized ? "h-[52px]" : "h-[560px]",
      )}
      style={{ animation:"chatSlideUp .25s cubic-bezier(.34,1.56,.64,1) forwards" }}>

      {/* header */}
      <div className="flex shrink-0 items-center gap-3 px-4 py-2.5"
        style={{ background:"linear-gradient(135deg,#0e7490 0%,#0891b2 50%,#ef4444 100%)" }}>
        <div className="relative shrink-0">
          <AstroBot thinking={thinking} walking={false} size={40}/>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-background">
            <span className="absolute inset-0 rounded-full bg-emerald-400"
              style={{ animation:"pingDot 1.4s ease-out infinite" }}/>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-white tracking-tight">ARIA</span>
            <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white/90"
              style={{ background:"rgba(255,255,255,.2)" }}>
              <Sparkles className="h-2 w-2"/> Gemini
            </span>
          </div>
          <span className="text-[11px] text-white/70 leading-none">
            {isLoading ? "🔍 Analyzing…"
              : userCount > 0 ? `${userCount} message${userCount>1?"s":""}`
              : "AWS Infrastructure Advisor"}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {userCount>0 && (
            <button type="button" onClick={reset} title="New chat"
              className="rounded-full p-1.5 text-white/60 hover:bg-white/15 hover:text-white transition-colors">
              <RotateCcw className="h-3.5 w-3.5"/>
            </button>
          )}
          <button type="button" onClick={()=>setMinimized(!minimized)}
            className="rounded-full p-1.5 text-white/60 hover:bg-white/15 hover:text-white transition-colors">
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", minimized&&"rotate-180")}/>
          </button>
          <button type="button" onClick={onClose}
            className="rounded-full p-1.5 text-white/60 hover:bg-white/15 hover:text-white transition-colors">
            <X className="h-4 w-4"/>
          </button>
        </div>
      </div>

      {!minimized && <>
        {/* messages */}
        <div className="flex-1 overflow-y-auto space-y-3 p-3.5">
          {messages.map(m=><MessageBubble key={m.id} msg={m}/>)}
          {isLoading && (
            <div className="flex items-end gap-2" style={{ animation:"msgIn .2s ease-out forwards" }}>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" fill="rgba(255,255,255,.2)"/>
                  <rect x="3" y="4" width="2.5" height="3.5" rx=".8" fill="white"/>
                  <rect x="6.5" y="4" width="2.5" height="3.5" rx=".8" fill="white"/>
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
                  className="rounded-lg border border-border/60 bg-muted/40 px-2 py-1.5 text-left text-[11px] text-muted-foreground hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-foreground transition-all leading-tight">
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
              className="flex-1 resize-none rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50 max-h-28 leading-relaxed transition-all"
              style={{ minHeight:36 }}
              onInput={e=>{ const t=e.target as HTMLTextAreaElement; t.style.height="auto"; t.style.height=Math.min(t.scrollHeight,112)+"px"; }}
            />
            <Button size="sm" onClick={()=>send(input)} disabled={!input.trim()||isLoading}
              className="h-9 w-9 shrink-0 rounded-xl p-0 text-white disabled:opacity-40"
              style={{ background:"linear-gradient(135deg,#0e7490,#ef4444)" }}>
              {isLoading?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Send className="h-3.5 w-3.5"/>}
            </Button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
            Powered by Google Gemini · Enter to send
          </p>
        </div>
      </>}
    </div>
  );
}

/* ─── Main export ───────────────────────────────────────────────── */
export function AiChat() {
  const [isOpen,    setIsOpen]    = useState(false);
  const [input,     setInput]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string|null>(null);
  const [minimized, setMinimized] = useState(false);
  const [hasNew,    setHasNew]    = useState(false);
  const [messages,  setMessages]  = useState<Message[]>([{
    id:"welcome", role:"assistant",
    content:"Hi! I'm ARIA — your AWS Astronaut Infrastructure Advisor 🚀\n\nDescribe what you want to build and I'll recommend the right services, explain the architecture, and warn about common mistakes.\n\nWhat are you building?",
    timestamp: new Date(),
  }]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setError(null);
    const userMsg: Message = { id:Date.now().toString(), role:"user", content:text.trim(), timestamp:new Date() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsLoading(true);
    try {
      const res  = await fetch("/api/ai-chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages: next.map(m=>({role:m.role,content:m.content})) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessages(p=>[...p,{
        id:(Date.now()+1).toString(), role:"assistant",
        content: data.content, timestamp:new Date(),
      }]);
      if (!isOpen) setHasNew(true);
    } catch(e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setMessages([{ id:"r"+Date.now(), role:"assistant",
      content:"Fresh start! 🚀 What are you building on AWS?", timestamp:new Date() }]);
    setError(null); setInput("");
  };

  return (
    <>
      <StyleInjector/>
      <RoamingAstro
        isOpen={isOpen} thinking={isLoading} hasNew={hasNew}
        onClick={() => { setIsOpen(true); setHasNew(false); setMinimized(false); }}
      />
      {isOpen && (
        <ChatWindow
          onClose={()=>setIsOpen(false)}
          thinking={isLoading} messages={messages}
          isLoading={isLoading} error={error}
          input={input} setInput={setInput}
          send={send} reset={reset}
          minimized={minimized} setMinimized={setMinimized}
        />
      )}
    </>
  );
}
