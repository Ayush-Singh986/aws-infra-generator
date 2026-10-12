import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are ARIA, an expert AWS Infrastructure Advisor built into the AWS Infra Generator tool.

You have deep knowledge of all major AWS services: EC2, ECS, EKS, Lambda, S3, RDS, DynamoDB, Aurora, VPC, ALB, API Gateway, CloudFront, Route53, IAM, SQS, SNS, ElastiCache, Cognito, CloudWatch, and more.

Also expert in Terraform, CloudFormation, AWS CDK, and AWS Well-Architected Framework.

When a user describes what they want to build:
1. Recommend the right AWS services with clear reasoning
2. Warn about common mistakes for that architecture
3. Give rough monthly cost estimates
4. Suggest which services to select in the wizard
5. Keep answers practical, concise, and actionable

Use bullet points. Format service names in backticks like \`EC2\`, \`RDS\`, \`S3\`.`;

// ── Groq free tier (no credit card, generous limits) ──────────────
async function tryGroq(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("NO_GROQ_KEY");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Google Gemini (via @google/genai) ─────────────────────────────
async function tryGemini(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("NO_GEMINI_KEY");

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  const allExceptLast = messages.slice(0, -1);
  let startIdx = 0;
  while (startIdx < allExceptLast.length && allExceptLast[startIdx].role === "assistant") {
    startIdx++;
  }
  const history = allExceptLast.slice(startIdx).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const lastMessage = messages[messages.length - 1].content;

  const MODELS = [
    "gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite",
    "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-pro-latest",
  ];

  for (const model of MODELS) {
    try {
      const chat = ai.chats.create({ model, config: { systemInstruction: SYSTEM_PROMPT }, history });
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await chat.sendMessage({ message: lastMessage });
          return response.text ?? "";
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          const retry = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand");
          if (!retry || attempt === 3) throw e;
          await new Promise((r) => setTimeout(r, 1500 * attempt));
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const skip = msg.includes("404") || msg.includes("NOT_FOUND") || msg.includes("no longer available")
                || msg.includes("503") || msg.includes("UNAVAILABLE");
      if (!skip) throw e;
    }
  }
  throw new Error("All Gemini models unavailable");
}

// ── Built-in rule-based fallback (no API key needed) ─────────────
function builtInResponse(userMessage: string): string {
  const q = userMessage.toLowerCase();

  if (q.includes("node") && (q.includes("api") || q.includes("rest"))) {
    return `For a Node.js REST API I recommend:\n\n- \`ECS Fargate\` — run your containers without managing servers\n- \`RDS\` (PostgreSQL/MySQL) — managed database with automated backups\n- \`ALB\` — Application Load Balancer to distribute traffic\n- \`VPC\` — private network for security\n- \`ECR\` — store your Docker images\n\n**Estimated cost:** ~$50–80/month for a small production setup\n\n**In the wizard:** Select VPC → RDS → ALB → ECS`;
  }
  if (q.includes("serverless") || q.includes("lambda")) {
    return `For a serverless architecture I recommend:\n\n- \`Lambda\` — run code without servers, pay per request\n- \`API Gateway\` — HTTP endpoint for your Lambda functions\n- \`DynamoDB\` — serverless NoSQL database that scales automatically\n- \`S3\` — store files and static assets\n- \`CloudFront\` — CDN for fast global delivery\n\n**Estimated cost:** Near-zero for low traffic, scales with usage\n\n**In the wizard:** Select Lambda → API Gateway → DynamoDB → S3`;
  }
  if (q.includes("static") || q.includes("website") || q.includes("frontend")) {
    return `For a static website the cheapest setup is:\n\n- \`S3\` — store your HTML/CSS/JS files (~$0.023/GB/month)\n- \`CloudFront\` — CDN that serves your site globally with HTTPS\n- \`Route53\` — custom domain (optional, ~$0.50/month)\n\n**Estimated cost:** Under $1/month for a typical site\n\n**In the wizard:** Select S3 → CloudFront`;
  }
  if (q.includes("ecs") && q.includes("eks")) {
    return `**ECS vs EKS — how to choose:**\n\n**Use \`ECS\` if:**\n- You want simplicity — AWS manages everything\n- Your team is small and doesn't know Kubernetes\n- You want lower cost and less operational overhead\n\n**Use \`EKS\` if:**\n- You already use Kubernetes elsewhere\n- You need advanced orchestration (service mesh, custom schedulers)\n- You have a large team with Kubernetes expertise\n\n**My recommendation for most teams:** Start with ECS Fargate. You can always migrate to EKS later if needed.`;
  }
  if (q.includes("database") || q.includes("rds") || q.includes("dynamodb")) {
    return `**Choosing the right AWS database:**\n\n- \`RDS PostgreSQL\` — best for structured data, complex queries, ACID transactions\n- \`RDS MySQL\` — widely used, great for web apps\n- \`Aurora\` — MySQL/PostgreSQL compatible but 5x faster, good for high traffic\n- \`DynamoDB\` — serverless NoSQL, best for key-value lookups at any scale\n- \`ElastiCache\` — Redis/Memcached for caching, reduces database load\n\n**Rule of thumb:** Use RDS for most apps, DynamoDB for simple lookups at massive scale.`;
  }
  if (q.includes("cost") || q.includes("cheap") || q.includes("price")) {
    return `**AWS cost optimization tips:**\n\n- Use \`t3.micro\` or \`t4g.micro\` EC2 instances (free tier eligible)\n- \`S3 + CloudFront\` for static hosting costs under $1/month\n- \`Lambda\` is free for first 1M requests/month\n- \`RDS\` db.t3.micro is free tier for 12 months\n- Turn off dev environments at night — saves 60% of compute costs\n- Use Reserved Instances for production — up to 72% discount vs on-demand\n\n**Biggest cost traps:** NAT Gateways ($32/month each), data transfer, and forgotten running instances.`;
  }
  if (q.includes("vpc") || q.includes("network")) {
    return `**VPC setup basics:**\n\n- \`VPC\` — your private network (use 10.0.0.0/16 CIDR)\n- **Public subnets** — for load balancers and NAT gateways (internet-facing)\n- **Private subnets** — for EC2, RDS, ECS tasks (no direct internet access)\n- \`Internet Gateway\` — connects public subnets to the internet\n- \`NAT Gateway\` — lets private subnets reach internet (for updates) without being exposed\n\n**Best practice:** Never put databases in public subnets. Use private subnets + security groups.`;
  }

  // Generic fallback
  return `Great question! Here are some general AWS architecture guidelines:\n\n- **For web apps:** VPC + ALB + ECS/EC2 + RDS is the standard stack\n- **For APIs:** API Gateway + Lambda + DynamoDB for serverless, or ECS + RDS for containers\n- **For storage:** S3 for files, RDS for structured data, DynamoDB for key-value\n- **For scale:** Add CloudFront (CDN), ElastiCache (caching), and Auto Scaling\n\nTry asking me something more specific like:\n- "I need a Node.js API with PostgreSQL"\n- "What services for a serverless web app?"\n- "ECS vs EKS — which should I use?"`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const chatMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    // Try Groq first (free, fast, generous limits)
    if (process.env.GROQ_API_KEY) {
      try {
        const text = await tryGroq(chatMessages);
        if (text) return NextResponse.json({ content: text });
      } catch (e) {
        console.warn("Groq failed, trying Gemini:", e instanceof Error ? e.message : e);
      }
    }

    // Try Gemini if key is set
    if (process.env.GEMINI_API_KEY) {
      try {
        const text = await tryGemini(chatMessages);
        if (text) return NextResponse.json({ content: text });
      } catch (e) {
        console.warn("Gemini failed, using built-in:", e instanceof Error ? e.message : e);
      }
    }

    // Built-in rule-based fallback — always works, no API key needed
    const lastUserMessage = [...chatMessages].reverse().find((m) => m.role === "user")?.content ?? "";
    const text = builtInResponse(lastUserMessage);
    return NextResponse.json({ content: text });

  } catch (err: unknown) {
    console.error("AI chat error:", err);
    return NextResponse.json(
      { error: `Request failed: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}