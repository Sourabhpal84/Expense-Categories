import OpenAI from "openai";
import { NextResponse } from "next/server";
import { expenseCategories } from "@/types";

export async function POST(request: Request) {
  const { text, imageDataUrl } = await request.json();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      amount: undefined,
      vendor: "",
      date: new Date().toISOString().slice(0, 10),
      category: "Misc",
      rawText: text || "OpenAI is not configured."
    });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const content = imageDataUrl
    ? [
        { type: "text" as const, text: `Extract amount, vendor, date, and category from this receipt. Categories: ${expenseCategories.join(", ")}. Return JSON only.` },
        { type: "image_url" as const, image_url: { url: imageDataUrl } }
      ]
    : `Extract amount, vendor, date, and category from this receipt text. Categories: ${expenseCategories.join(", ")}. Return JSON only.\n${text || ""}`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "Return JSON with amount number, vendor string, date YYYY-MM-DD, category string, rawText string." },
      { role: "user", content }
    ]
  });

  return NextResponse.json(JSON.parse(response.choices[0]?.message.content || "{}"));
}
