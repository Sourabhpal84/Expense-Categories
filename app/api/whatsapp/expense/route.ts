import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const body = String(form.get("Body") || "");
  return new NextResponse(
    `<Response><Message>MAGNEETOZ received: ${body}. Connect this webhook to a user account to auto-log WhatsApp expenses.</Message></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
