import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are ARIA, a friendly and highly intelligent AI assistant.

You can answer ANY question - AWS infrastructure, coding, general knowledge, math, career advice, or anything else the user asks.

Your personality:
- Warm, helpful, conversational - like a brilliant knowledgeable friend
- Concise but thorough
- When answering AWS questions, use backticks for service names like EC2, S3, RDS
- Use bullet points and bold text for clarity

Always give a real, helpful answer. Never refuse a question.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!messages?.length) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not set. Add it to .env.local — get a free key at https://console.groq.com/keys" },
        { status: 503 }
      );
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        max_tokens: 2048,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq error:", res.status, errText);
      return NextResponse.json(
        { error: `Groq API error ${res.status}: ${errText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    if (!content) {
      return NextResponse.json({ error: "Empty response from Groq" }, { status: 502 });
    }

    return NextResponse.json({ content });

  } catch (err) {
    console.error("AI chat error:", err);
    return NextResponse.json(
      { error: `Request failed: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
