"use client";

import { useState, useRef, useCallback } from "react";

interface UseCallRecordingReturn {
  isRecording: boolean;
  startRecording: (session: any) => void;
  stopRecording: () => Promise<Blob | null>;
}

/**
 * Browser-side call recording using Web Audio API + MediaRecorder.
 * Mixes local microphone and remote audio into a single stream,
 * records as audio/webm;codecs=opus.
 */
export function useCallRecording(): UseCallRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startRecording = useCallback((session: any) => {
    if (!session || isRecording) return;

    try {
      const sdh = session.sessionDescriptionHandler;
      if (!sdh?.peerConnection) return;

      const pc = sdh.peerConnection;

      // Create audio context for mixing
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const destination = audioContext.createMediaStreamDestination();

      // Get remote audio tracks
      pc.getReceivers().forEach((receiver: RTCRtpReceiver) => {
        if (receiver.track && receiver.track.kind === "audio") {
          const remoteStream = new MediaStream([receiver.track]);
          const remoteSource = audioContext.createMediaStreamSource(remoteStream);
          remoteSource.connect(destination);
        }
      });

      // Get local audio tracks
      pc.getSenders().forEach((sender: RTCRtpSender) => {
        if (sender.track && sender.track.kind === "audio") {
          const localStream = new MediaStream([sender.track]);
          const localSource = audioContext.createMediaStreamSource(localStream);
          localSource.connect(destination);
        }
      });

      // Start recording the mixed stream
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(destination.stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start(1000); // Collect data every second
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start call recording:", error);
    }
  }, [isRecording]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!recorderRef.current || !isRecording) return null;

    return new Promise((resolve) => {
      const recorder = recorderRef.current!;

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];
        recorderRef.current = null;

        // Close audio context
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }

        setIsRecording(false);

        // Upload to server
        if (blob.size > 0) {
          try {
            const formData = new FormData();
            formData.append("audio", blob, `call-${Date.now()}.webm`);
            await fetch("/api/call-recordings", {
              method: "POST",
              body: formData,
            });
          } catch (err) {
            console.error("Failed to upload recording:", err);
          }
        }

        resolve(blob);
      };

      recorder.stop();
    });
  }, [isRecording]);

  return { isRecording, startRecording, stopRecording };
}
