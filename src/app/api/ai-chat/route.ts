import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are ARIA, a friendly and highly intelligent AI assistant.

You can answer questions about AWS infrastructure, coding, general knowledge, math, career advice, and more.

Your personality:
- Warm, helpful, and conversational
- Concise but thorough
- Use backticks for AWS service names like \`EC2\`, \`S3\`, and \`RDS\`
- Use bullet points and bold text for clarity`;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

async function getGeminiResponse(
  apiKey: string,
  messages: ChatMessage[]
): Promise<string | null> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });
  const history = messages.slice(0, -1);

  while (history[0]?.role === "assistant") {
    history.shift();
  }

  for (const model of [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
  ]) {
    try {
      const chat = ai.chats.create({
        model,
        config: { systemInstruction: SYSTEM_PROMPT },
        history: history.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
      });
      const response = await chat.sendMessage({
        message: messages[messages.length - 1].content,
      });
      const content = response.text?.trim();
      if (content) return content;
      console.warn(`Gemini model ${model} returned an empty response.`);
    } catch (error) {
      console.warn(
        `Gemini model ${model} failed:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return null;
}

function getOfflineResponse(messages: ChatMessage[]): string {
  const question = messages
    .findLast((message) => message.role === "user")
    ?.content.toLowerCase() ?? "";

  if (question.includes("node") && question.includes("api")) {
    return "For a Node.js REST API, consider:\n\n- `ECS Fargate` to run containers without managing servers\n- `RDS` for a managed PostgreSQL or MySQL database\n- `ALB` to route incoming requests\n- `VPC` for network isolation\n\nIn the wizard, select VPC → RDS → ALB → ECS. This is an offline suggestion; add a Gemini or Groq API key for personalized answers.";
  }

  if (question.includes("serverless") || question.includes("lambda")) {
    return "A common serverless setup uses:\n\n- `Lambda` to run code on demand\n- `API Gateway` to provide HTTP endpoints\n- `DynamoDB` for a serverless database\n- `S3` for file storage\n\nThis is an offline suggestion; add a Gemini or Groq API key for personalized answers.";
  }

  if (question.includes("static") || question.includes("website")) {
    return "A common way to host a static website is `S3` for the files and `CloudFront` to deliver them over HTTPS. This is an offline suggestion; add a Gemini or Groq API key for personalized answers.";
  }

  return "Hi! I’m ARIA, your AWS Infrastructure Advisor. I’m currently in offline mode, so I can only provide a few common architecture suggestions. Configure a `GROQ_API_KEY` or `GEMINI_API_KEY` on the deployment for AI-powered answers.";
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    if (
      !body ||
      typeof body !== "object" ||
      !("messages" in body) ||
      !Array.isArray(body.messages) ||
      body.messages.length === 0 ||
      !body.messages.every(
        (message): message is ChatMessage =>
          typeof message === "object" &&
          message !== null &&
          "role" in message &&
          (message.role === "user" || message.role === "assistant") &&
          "content" in message &&
          typeof message.content === "string"
      )
    ) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const messages = body.messages;
    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      try {
        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: "qwen/qwen3.8-27b",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages,
              ],
              max_tokens: 2048,
              temperature: 0.7,
              stream: false,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) return NextResponse.json({ content });
          console.warn("Groq returned an empty response.");
        } else {
          console.warn(
            "Groq request failed:",
            response.status,
            (await response.text()).slice(0, 200)
          );
        }
      } catch (error) {
        console.warn(
          "Groq request failed:",
          error instanceof Error ? error.message : error
        );
      }
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const content = await getGeminiResponse(geminiKey, messages);
        if (content) return NextResponse.json({ content });
      } catch (error) {
        console.error(
          "Gemini fallback failed:",
          error instanceof Error ? error.message : error
        );
      }
    }

    return NextResponse.json({ content: getOfflineResponse(messages) });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      {
        error: `Request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
