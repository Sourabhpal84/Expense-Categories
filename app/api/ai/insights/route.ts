import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  expenses: z.array(z.any()).default([]),
  revenues: z.array(z.any()).default([]),
  inventory: z.array(z.any()).default([]),
  budgets: z.array(z.any()).default([])
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      summary: "OpenAI is not configured. Add OPENAI_API_KEY to enable live AI finance analysis.",
      warnings: ["AI insights are currently using a setup placeholder."],
      opportunities: ["Connect OpenAI and refresh this panel for tailored recommendations."],
      healthScore: 72
    });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a concise CFO assistant for an Indian small business. Return JSON with summary string, warnings string array, opportunities string array, and healthScore number 0-100."
      },
      { role: "user", content: JSON.stringify(body) }
    ]
  });

  const content = response.choices[0]?.message.content || "{}";
  return NextResponse.json(JSON.parse(content));
}
