"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const BRAND = {
  purple: "#6626E9",
  purpleHover: "#5520C7",
  purpleLight: "#EDE5FA",
  gray400: "#9CA3AF",
  fontBody: "'Quicksand', sans-serif",
};

export function VoiceToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 12 }}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
        stroke={enabled ? BRAND.purple : BRAND.gray400} strokeWidth={2}
        style={{ transition: "stroke 0.2s" }}>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 010 7.07" />
        <path d="M19.07 4.93a10 10 0 010 14.14" />
      </svg>
      <span style={{
        fontSize: 11, fontWeight: 600,
        color: enabled ? BRAND.purple : BRAND.gray400,
        transition: "color 0.2s", whiteSpace: "nowrap", fontFamily: BRAND.fontBody,
      }}>Voice</span>
      <div style={{
        width: 40, height: 22, borderRadius: 100,
        background: enabled ? BRAND.purple : "#D1D5DB",
        position: "relative", cursor: "pointer", transition: "background 0.25s", flexShrink: 0,
      }} onClick={onToggle}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 2, left: enabled ? 20 : 2,
          transition: "left 0.25s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }} />
      </div>
    </div>
  );
}

export function PlayingIndicator({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
      {[0, 0.2, 0.4].map((delay, i) => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%", background: BRAND.purple,
          animation: "cvPulseDot 1.2s ease-in-out infinite", animationDelay: `${delay}s`,
        }} />
      ))}
      <span style={{ fontSize: 11, fontWeight: 700, color: BRAND.purple, letterSpacing: 0.3, fontFamily: BRAND.fontBody }}>
        Playing
      </span>
      <style>{`@keyframes cvPulseDot { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.1)} }`}</style>
    </div>
  );
}

export function useElevenLabsTTS(voiceId?: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsPlaying(false);
  }, []);

  const play = useCallback(async (text: string) => {
    stop();
    if (!voiceId || !text) return;
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      });
      if (!res.ok) throw new Error(`TTS error: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.addEventListener("ended", () => { setIsPlaying(false); URL.revokeObjectURL(url); });
      audioRef.current = audio;
      setIsPlaying(true);
      await audio.play();
    } catch (err) {
      console.error("TTS playback failed:", err);
      setIsPlaying(false);
    }
  }, [voiceId, stop]);

  useEffect(() => () => stop(), [stop]);

  return { play, stop, isPlaying };
}
