"use client";

import { useCallback, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const transcribeAudio = useCallback(
    async (audioBlob: Blob) => {
      if (audioBlob.size === 0) return;

      setTranscribing(true);
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? "Transcription failed");
        }

        const data = await response.json();
        if (data.text?.trim()) {
          onTranscript(data.text.trim());
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Transcription failed",
        );
      } finally {
        setTranscribing(false);
      }
    },
    [onTranscript],
  );

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  }, [transcribeAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={recording ? "text-destructive" : "text-muted-foreground"}
        onClick={recording ? stopRecording : startRecording}
        disabled={disabled || transcribing}
        aria-label={recording ? "Stop recording" : "Start voice input"}
      >
        <Mic size={20} />
      </Button>
      {recording && (
        <div className="mt-2 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
          <span className="text-sm text-muted-foreground">Listening...</span>
        </div>
      )}
      {transcribing && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Transcribing...
          </span>
        </div>
      )}
    </div>
  );
}
