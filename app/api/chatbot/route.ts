import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guards";
import { askPatientChatbot } from "@/features/patient/services/chatbot";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();

    if (!body.question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    console.log("Next.js Chatbot route received query:", body.question);

    const chatbotResponse = await askPatientChatbot(body.question, session.user.id);
    return NextResponse.json(chatbotResponse);
  } catch (error) {
    console.error("Next.js Chatbot route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
