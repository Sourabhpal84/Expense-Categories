import OpenAI from "openai";
import { NextResponse } from "next/server";
import { expenseCategories } from "@/types";

function fallbackParse(transcript: string) {
  const amount = Number(transcript.match(/\d+(\.\d+)?/)?.[0] || 0);
  const lowered = transcript.toLowerCase();
  const category =
    expenseCategories.find((item) => lowered.includes(item.toLowerCase())) ||
    (lowered.includes("marketing") ? "Marketing" : lowered.includes("delivery") ? "Delivery" : "Misc");
  return { amount, vendor: "Voice entry", date: new Date().toISOString().slice(0, 10), category, rawText: transcript };
}

export async function POST(request: Request) {
  const { transcript } = await request.json();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(fallbackParse(transcript || ""));
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Parse multilingual spoken expense text into JSON with amount, vendor, date YYYY-MM-DD, category. Categories: ${expenseCategories.join(", ")}.`
      },
      { role: "user", content: transcript || "" }
    ]
  });

  return NextResponse.json(JSON.parse(response.choices[0]?.message.content || "{}"));
}
