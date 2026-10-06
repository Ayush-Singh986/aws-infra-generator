import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an expert AWS Infrastructure Advisor built into the AWS Infra Generator tool. Your job is to help developers design the right AWS architecture for their use case.

You have deep knowledge of:
- All major AWS services: EC2, ECS, EKS, Lambda, S3, RDS, DynamoDB, Aurora, VPC, ALB, API Gateway, CloudFront, Route53, IAM, SQS, SNS, SNS, ElastiCache, Cognito, CloudWatch, and more
- Terraform, CloudFormation, and AWS CDK
- AWS Well-Architected Framework (Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability)
- Infrastructure best practices, security patterns, and cost optimization

When a user describes what they want to build:
1. Recommend the right AWS services with clear reasoning
2. Warn about common mistakes for that architecture
3. Give rough cost estimates where helpful
4. Suggest which services to select in the wizard (use their exact names)
5. Keep answers practical and actionable — not theoretical

Be concise but thorough. Use bullet points and short paragraphs. If someone asks a vague question, ask one clarifying question to give a better answer.

Format service names in backticks like \`EC2\`, \`RDS\`, \`S3\`.

You are integrated into the AWS Infra Generator tool, so you can tell users which services to pick in the wizard to build what they described.`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured. Add it to your .env.local file. Get a free key at https://aistudio.google.com/apikey",
        },
        { status: 503 }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Convert messages to Gemini format
    // Last message is the current user message
    const history = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    return NextResponse.json({ content: text });
  } catch (err: unknown) {
    console.error("AI chat error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `AI request failed: ${message}` },
      { status: 500 }
    );
  }
}
