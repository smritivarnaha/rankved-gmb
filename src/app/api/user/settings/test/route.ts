import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider, apiKey } = await req.json();

  if (!apiKey) return NextResponse.json({ error: "API key is required for testing" }, { status: 400 });

  try {
    if (provider === "CLAUDE") {
      const anthropic = new Anthropic({ apiKey });
      await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      });
      return NextResponse.json({ success: true, message: "Anthropic connection successful!" });
    }

    if (provider === "GPT") {
      const openai = new OpenAI({ apiKey });
      await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      });
      return NextResponse.json({ success: true, message: "OpenAI connection successful!" });
    }

    if (provider === "GEMINI") {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      await model.generateContent("hi");
      return NextResponse.json({ success: true, message: "Google connection successful!" });
    }

    if (provider === "OPENROUTER") {
      const openai = new OpenAI({ 
        baseURL: "https://openrouter.ai/api/v1",
        apiKey 
      });
      await openai.chat.completions.create({
        model: "openrouter/auto", // Use auto or any lightweight model just to test
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      });
      return NextResponse.json({ success: true, message: "OpenRouter connection successful!" });
    }

    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  } catch (err: any) {
    console.error(`[API Test Error - ${provider}]`, err);
    return NextResponse.json({ 
      error: err.message || "Connection failed. Please check your key." 
    }, { status: 500 });
  }
}
