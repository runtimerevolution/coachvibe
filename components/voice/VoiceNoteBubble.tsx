"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const BRAND = {
  purple: "#6626E9",
  purpleHover: "#5520C7",
  purpleLight: "#EDE5FA",
  purpleMid: "#C4B5FD",
  gray500: "#6B7280",
  gray700: "#374151",
  fontBody: "'Quicksand', sans-serif",
};

function generateBars(count = 24) {
  return Array.from({ length: count }, () => Math.round(8 + Math.random() * 20));
}

export function VoiceNoteBubble({
  text, duration = "0:00", audioSrc, onRequestAudio,
}: {
  text: string;
  duration?: string;
  audioSrc?: string | null;
  onRequestAudio?: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [bars] = useState(() => generateBars(24));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const togglePlay = useCallback(() => {
    if (!audioSrc) { onRequestAudio?.(); return; }
    if (isPlaying) {
      audioRef.current?.pause();
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioSrc);
        audioRef.current.addEventListener("ended", () => {
          setIsPlaying(false); setProgress(0);
          if (intervalRef.current) clearInterval(intervalRef.current);
        });
      }
      audioRef.current.play();
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
          const pct = audioRef.current.currentTime / audioRef.current.duration;
          setProgress(Math.min(pct, 1));
        }
      }, 100);
    }
  }, [audioSrc, isPlaying, onRequestAudio]);

  useEffect(() => () => {
    audioRef.current?.pause();
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const playedBarCount = Math.floor(progress * bars.length);

  return (
    <div style={{ maxWidth: "80%", alignSelf: "flex-start" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px", borderRadius: "18px", borderBottomLeftRadius: 6,
        background: BRAND.purpleLight,
      }}>
        <div onClick={togglePlay} style={{
          width: 38, height: 38, borderRadius: "50%", background: BRAND.purple,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, cursor: "pointer", transition: "background 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = BRAND.purpleHover)}
          onMouseLeave={e => (e.currentTarget.style.background = BRAND.purple)}>
          {isPlaying
            ? <svg width={16} height={16} viewBox="0 0 24 24" fill="white"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
            : <svg width={16} height={16} viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>}
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 2.5, height: 32 }}>
          {bars.map((h, i) => (
            <div key={i} style={{
              width: 3, height: h, borderRadius: 2,
              background: i < playedBarCount ? BRAND.purple : BRAND.purpleMid,
              transition: "background 0.15s",
            }} />
          ))}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.gray500, flexShrink: 0, minWidth: 32, textAlign: "right", fontFamily: BRAND.fontBody }}>
          {duration}
        </div>
      </div>
      <div onClick={() => setTranscriptOpen(!transcriptOpen)} style={{
        display: "flex", alignItems: "center", gap: 5, marginTop: 6, padding: "4px 0",
        fontSize: 12, fontWeight: 700, color: BRAND.purple, cursor: "pointer", fontFamily: BRAND.fontBody,
      }}>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
          style={{ transition: "transform 0.2s", transform: transcriptOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {transcriptOpen ? "Hide transcript" : "Show transcript"}
      </div>
      <div style={{ maxHeight: transcriptOpen ? 500 : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}>
        <div style={{
          marginTop: 6, padding: "14px 18px", borderRadius: 18, borderBottomLeftRadius: 6,
          background: BRAND.purpleLight, fontSize: 13, lineHeight: 1.65, color: BRAND.gray700,
          opacity: 0.85, fontFamily: BRAND.fontBody,
        }}>{text}</div>
      </div>
    </div>
  );
}

export function AIMessage({
  text, voiceEnabled, audioSrc, duration, onRequestAudio,
}: {
  text: string;
  voiceEnabled: boolean;
  audioSrc?: string | null;
  duration?: string;
  onRequestAudio?: () => void;
}) {
  if (voiceEnabled) {
    return <VoiceNoteBubble text={text} duration={duration} audioSrc={audioSrc} onRequestAudio={onRequestAudio} />;
  }
  return (
    <div style={{
      maxWidth: "80%", alignSelf: "flex-start", padding: "14px 18px",
      borderRadius: 18, borderBottomLeftRadius: 6, background: BRAND.purpleLight,
      fontSize: 14, lineHeight: 1.65, color: BRAND.gray700, fontFamily: BRAND.fontBody,
    }}>{text}</div>
  );
}
