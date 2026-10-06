import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an expert AWS Infrastructure Advisor built into the AWS Infra Generator tool. Your job is to help developers design the right AWS architecture for their use case.

You have deep knowledge of:
- All major AWS services: EC2, ECS, EKS, Lambda, S3, RDS, DynamoDB, Aurora, VPC, ALB, API Gateway, CloudFront, Route53, IAM, SQS, SNS, ElastiCache, Cognito, CloudWatch, and more
- Terraform, CloudFormation, and AWS CDK
- AWS Well-Architected Framework
- Infrastructure best practices, security patterns, and cost optimization

When a user describes what they want to build:
1. Recommend the right AWS services with clear reasoning
2. Warn about common mistakes for that architecture
3. Give rough cost estimates where helpful
4. Suggest which services to select in the wizard
5. Keep answers practical and actionable

Be concise but thorough. Use bullet points. Format service names in backticks like \`EC2\`, \`RDS\`, \`S3\`.`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Add it to your .env.local file. Get a free key at https://aistudio.google.com/app/apikey" },
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

    const ai = new GoogleGenAI({ apiKey });

    // Build conversation history — skip leading assistant messages
    const allExceptLast = messages.slice(0, -1);
    let startIdx = 0;
    while (startIdx < allExceptLast.length && allExceptLast[startIdx].role === "assistant") {
      startIdx++;
    }
    const history = allExceptLast.slice(startIdx).map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = ai.chats.create({
      model: "gemini-2.0-flash",
      config: { systemInstruction: SYSTEM_PROMPT },
      history,
    });

    const response = await chat.sendMessage({ message: lastMessage.content });
    const text = response.text;

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
