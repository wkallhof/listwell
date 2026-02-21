import { Hono } from "hono";
import OpenAI from "openai";
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

export const transcribeRoutes = new Hono();

transcribeRoutes.post("/transcribe", async (c) => {
  const formData = await c.req.raw.formData();
  const audioFile = formData.get("audio");

  if (!audioFile || !(audioFile instanceof File)) {
    return c.json({ error: "No audio file provided" }, 400);
  }

  if (audioFile.size > MAX_FILE_SIZE) {
    return c.json({ error: "Audio file too large (max 25MB)" }, 400);
  }

  if (audioFile.type && !ALLOWED_TYPES.has(audioFile.type)) {
    return c.json({ error: "Unsupported audio format" }, 400);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: audioFile,
    language: "en",
  });

  return c.json({ text: transcription.text });
});
