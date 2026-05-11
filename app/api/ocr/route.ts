import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const pythonFormData = new FormData();
    pythonFormData.append("file", file);

    const response = await fetch("http://localhost:8000/ocr", {
      method: "POST",
      body: pythonFormData,
    });

    if (!response.ok) {
      console.error("OCR API error:", response.statusText);
      return NextResponse.json({ error: "Failed to process OCR via Python API" }, { status: response.status });
    }

    const data = await response.json();
    console.log("Next.js received OCR response:", data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Next.js OCR route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
