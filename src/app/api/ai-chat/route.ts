import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are ARIA, a friendly and highly intelligent AI assistant built into the AWS Infra Generator tool.

You are primarily an AWS and cloud infrastructure expert, but you can answer ANY question the user asks — coding, general knowledge, career advice, debugging, math, or anything else.

Your personality:
- Warm, helpful, and conversational — like a knowledgeable friend
- Concise but thorough — never overly verbose
- Proactive — anticipate follow-up questions and address them
- When answering AWS questions, format service names in backticks like \`EC2\`, \`S3\`, \`RDS\`
- Use bullet points for lists, bold for key terms

You remember the full conversation context and give relevant follow-up answers.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
    }

    const chatMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // ── Try Groq streaming ─────────────────────────────────────────
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...chatMessages],
            max_tokens: 1500,
            temperature: 0.75,
            stream: true,
          }),
        });

        if (!groqRes.ok) throw new Error(`Groq ${groqRes.status}`);
        if (!groqRes.body) throw new Error("No stream body");

        // Pass the SSE stream straight through to the client
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const reader = groqRes.body!.getReader();
            const decoder = new TextDecoder();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                // Parse SSE lines and extract content deltas
                const lines = chunk.split("\n");
                for (const line of lines) {
                  if (!line.startsWith("data: ")) continue;
                  const data = line.slice(6).trim();
                  if (data === "[DONE]") continue;
                  try {
                    const parsed = JSON.parse(data);
                    const delta = parsed.choices?.[0]?.delta?.content;
                    if (delta) {
                      controller.enqueue(encoder.encode(delta));
                    }
                  } catch {
                    // skip malformed chunks
                  }
                }
              }
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache",
            "Transfer-Encoding": "chunked",
          },
        });
      } catch (e) {
        console.warn("Groq streaming failed:", e instanceof Error ? e.message : e);
      }
    }

    // ── Try Gemini (non-streaming fallback) ────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: geminiKey });

        const allExceptLast = chatMessages.slice(0, -1);
        let si = 0;
        while (si < allExceptLast.length && allExceptLast[si].role === "assistant") si++;
        const history = allExceptLast.slice(si).map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));
        const lastMsg = chatMessages[chatMessages.length - 1].content;

        for (const model of ["gemini-3.8-flash","gemini-3.5-flash","gemini-flash-latest"]) {
          try {
            const chat = ai.chats.create({ model, config: { systemInstruction: SYSTEM_PROMPT }, history });
            const resp = await chat.sendMessage({ message: lastMsg });
            const text = resp.text ?? "";
            return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            if (!msg.includes("404") && !msg.includes("503") && !msg.includes("NOT_FOUND")) throw e;
          }
        }
      } catch (e) {
        console.warn("Gemini failed:", e instanceof Error ? e.message : e);
      }
    }

    // ── Built-in fallback ──────────────────────────────────────────
    const q = (chatMessages.findLast?.((m) => m.role === "user")?.content ?? "").toLowerCase();
    let text = "";
    if (q.includes("node") && q.includes("api")) {
      text = "For a Node.js REST API I recommend:\n\n- `ECS Fargate` — containers without managing servers\n- `RDS` — managed PostgreSQL/MySQL\n- `ALB` — load balancer\n- `VPC` — private network\n\n**Cost:** ~$50-80/month\n\n**In the wizard:** VPC → RDS → ALB → ECS";
    } else if (q.includes("serverless") || q.includes("lambda")) {
      text = "For serverless:\n\n- `Lambda` — pay per request\n- `API Gateway` — HTTP endpoint\n- `DynamoDB` — serverless NoSQL\n- `S3` — file storage\n\n**Cost:** Near-zero for low traffic";
    } else if (q.includes("static") || q.includes("website")) {
      text = "Cheapest static website:\n\n- `S3` — host files (~$0.023/GB)\n- `CloudFront` — CDN + HTTPS\n\n**Cost:** Under $1/month";
    } else {
      text = "Hi! I am ARIA, your AWS Infrastructure Advisor. I can answer questions about:\n\n- AWS services and architecture\n- Terraform, CloudFormation, CDK\n- Cost optimization\n- Security best practices\n- And much more!\n\nWhat would you like to know?";
    }
    return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });

  } catch (err) {
    console.error("AI chat error:", err);
    return new Response(
      JSON.stringify({ error: `Request failed: ${err instanceof Error ? err.message : "Unknown"}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
