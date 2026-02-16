import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import OpenAI from "openai";
import { auth } from "@/lib/auth";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB Whisper limit
const ALLOWED_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/flac",
  "audio/m4a",
]);

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const audioFile = formData.get("audio");

  if (!audioFile || !(audioFile instanceof File)) {
    return NextResponse.json(
      { error: "No audio file provided" },
      { status: 400 },
    );
  }

  if (audioFile.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Audio file too large (max 25MB)" },
      { status: 400 },
    );
  }

  if (audioFile.type && !ALLOWED_TYPES.has(audioFile.type)) {
    return NextResponse.json(
      { error: "Unsupported audio format" },
      { status: 400 },
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: audioFile,
    language: "en",
  });

  return NextResponse.json({ text: transcription.text });
}
