"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  RotateCcw,
  ChevronDown,
  AlertCircle,
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
  "I need to deploy a Node.js REST API with a PostgreSQL database",
  "What AWS services do I need for a serverless web app?",
  "Help me choose between ECS and EKS for containers",
  "What's the cheapest way to host a static website on AWS?",
];

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  // Convert **bold** and `code` markdown to styled spans
  const formatContent = (text: string) => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="rounded bg-orange-500/15 px-1.5 py-0.5 font-mono text-[11px] text-orange-600 dark:text-orange-400"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Handle newlines
      return part.split("\n").map((line, j, arr) => (
        <span key={`${i}-${j}`}>
          {line}
          {j < arr.length - 1 && <br />}
        </span>
      ));
    });
  };

  return (
    <div
      className={cn(
        "flex gap-2.5 items-start",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold",
          isUser
            ? "bg-orange-500"
            : "bg-gradient-to-br from-violet-500 to-indigo-600"
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-orange-500 text-white"
            : "rounded-tl-sm bg-muted/70 text-foreground border border-border/50"
        )}
      >
        <p className="whitespace-pre-wrap break-words">
          {formatContent(message.content)}
        </p>
        <span
          className={cn(
            "mt-1 block text-[10px]",
            isUser ? "text-orange-100/70 text-right" : "text-muted-foreground"
          )}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

export function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AWS Infrastructure Advisor. 👋\n\nDescribe what you want to build and I'll recommend the right AWS services, explain the architecture, and warn you about common mistakes.\n\nWhat are you building?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
      setIsMinimized(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (!isOpen) {
        setHasNewMessage(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content:
          "Conversation cleared. What are you building? I'll help you choose the right AWS services.",
        timestamp: new Date(),
      },
    ]);
    setError(null);
    setInput("");
  };

  const userMessageCount = messages.filter((m) => m.role === "user").length;

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300",
          "bg-gradient-to-br from-violet-600 to-indigo-700 text-white",
          "hover:scale-110 hover:shadow-xl active:scale-95",
          isOpen && "rotate-90 scale-90"
        )}
        aria-label="Open AI Infrastructure Advisor"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
        {hasNewMessage && !isOpen && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-orange-500 border-2 border-background animate-pulse" />
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden",
            "w-[calc(100vw-3rem)] max-w-sm sm:w-96",
            "rounded-2xl border border-border/70 bg-background shadow-2xl shadow-black/20",
            "transition-all duration-200 animate-in fade-in slide-in-from-bottom-4",
            isMinimized ? "h-14" : "h-[520px] sm:h-[560px]"
          )}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center gap-2.5 border-b border-border/60 bg-gradient-to-r from-violet-600 to-indigo-700 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white">
                  AWS AI Advisor
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
                  <Sparkles className="h-2.5 w-2.5" />
                  Gemini
                </span>
              </div>
              <span className="text-[11px] text-white/70">
                {isLoading
                  ? "Thinking..."
                  : userMessageCount > 0
                  ? `${userMessageCount} message${userMessageCount !== 1 ? "s" : ""} sent`
                  : "Ask me anything about AWS"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {userMessageCount > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  title="Clear conversation"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMinimized((m) => !m)}
                className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isMinimized && "rotate-180"
                  )}
                />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div
                ref={scrollAreaRef}
                className="flex-1 overflow-y-auto space-y-3 p-4"
              >
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {isLoading && (
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-border/50 bg-muted/70 px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                        <span className="text-xs text-muted-foreground">
                          Analyzing your requirements...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                    <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                    <div className="text-xs text-destructive">
                      <p className="font-medium">Error</p>
                      <p className="mt-0.5 text-destructive/80">{error}</p>
                      {error.includes("GEMINI_API_KEY") && (
                        <a
                          href="https://aistudio.google.com/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block underline hover:no-underline"
                        >
                          Get your free API key →
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Starter prompts — only show before first message */}
              {userMessageCount === 0 && (
                <div className="shrink-0 border-t border-border/40 px-3 py-2">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Try asking:
                  </p>
                  <div className="flex flex-col gap-1">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => sendMessage(prompt)}
                        className="rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1.5 text-left text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="shrink-0 border-t border-border/60 bg-background p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe what you want to build..."
                    rows={1}
                    disabled={isLoading}
                    className={cn(
                      "flex-1 resize-none rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-xs",
                      "placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20",
                      "disabled:opacity-50 max-h-28 leading-relaxed",
                      "transition-all"
                    )}
                    style={{
                      height: "auto",
                      minHeight: "36px",
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = `${Math.min(target.scrollHeight, 112)}px`;
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isLoading}
                    className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 p-0 text-white hover:from-violet-500 hover:to-indigo-600 disabled:opacity-40"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">
                  Powered by Google Gemini · Press Enter to send
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
