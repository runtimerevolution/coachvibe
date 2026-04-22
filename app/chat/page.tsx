"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { VoiceToggleSwitch, PlayingIndicator, useElevenLabsTTS } from "@/components/voice/VoiceToggle";
import { AIMessage } from "@/components/voice/VoiceNoteBubble";

const PURPLE = "#6626E9";
const VOICE_ID = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || "PIGsltMj3gFMR34aFDI3";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  audioUrl?: string | null;
  audioDuration?: string;
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm your AI coaching assistant. Ask me anything about your coaching practice, client prep, content ideas, or business strategy.",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const { play, stop, isPlaying } = useElevenLabsTTS(VOICE_ID);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateAudio = async (messageId: string, text: string) => {
    if (audioCache[messageId]) { setPlayingId(messageId); return; }
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId: VOICE_ID }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioCache(p => ({ ...p, [messageId]: url }));
      setPlayingId(messageId);
    } catch (err) {
      console.error("Audio generation failed:", err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const reply = await res.json();
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: reply.content };
      setMessages(p => [...p, aiMsg]);

      if (voiceEnabled) {
        await play(reply.content);
      }
    } catch {
      setMessages(p => [...p, { id: Date.now().toString(), role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#F8F7FC", fontFamily: "'Quicksand', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F0EDF5", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ fontSize: 13, color: "#7A7A7A", fontWeight: 600 }}>← Back</Link>
          <div style={{ width: 1, height: 20, background: "#E0E0E0" }} />
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: PURPLE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎙️</div>
          <div>
            <div style={{ fontWeight: 700, color: "#1a1a2e", fontFamily: "'Red Hat Display', sans-serif" }}>CoachOS AI</div>
            <div style={{ fontSize: 12, color: "#7A7A7A" }}>Your coaching assistant</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isPlaying && <PlayingIndicator visible={true} />}
          <VoiceToggleSwitch
            enabled={voiceEnabled}
            onToggle={() => { setVoiceEnabled(v => !v); if (isPlaying) stop(); }}
          />
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" ? (
              <AIMessage
                text={msg.content}
                voiceEnabled={voiceEnabled}
                audioSrc={audioCache[msg.id] || null}
                duration={msg.audioDuration}
                onRequestAudio={() => generateAudio(msg.id, msg.content)}
              />
            ) : (
              <div style={{ maxWidth: "80%", padding: "14px 18px", borderRadius: 18, borderBottomRightRadius: 6, background: PURPLE, color: "#fff", fontSize: 14, lineHeight: 1.65, fontFamily: "'Quicksand', sans-serif" }}>
                {msg.content}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "14px 20px", borderRadius: 18, borderBottomLeftRadius: 6, background: "#EDE5FA", display: "flex", gap: 6, alignItems: "center" }}>
              {[0, 0.2, 0.4].map((d, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: PURPLE, animation: "bounce 1.2s infinite", animationDelay: `${d}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: "#fff", borderTop: "1px solid #F0EDF5", padding: "16px 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 12, maxWidth: 800, margin: "0 auto" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your coaching practice..."
            rows={1}
            style={{ flex: 1, padding: "14px 18px", borderRadius: 24, border: "1.5px solid #E0E0E0", outline: "none", resize: "none", fontSize: 14, fontFamily: "'Quicksand', sans-serif", lineHeight: 1.5, background: "#F8F7FC" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{ width: 48, height: 48, borderRadius: "50%", border: "none", background: input.trim() && !loading ? PURPLE : "#E0E0E0", color: "#fff", cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="white">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "#B0A8C8", marginTop: 8 }}>
          Press Enter to send · {voiceEnabled ? "🔊 Voice on — responses will play via ElevenLabs" : "🔇 Voice off — toggle above to enable"}
        </p>
      </div>

      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}`}</style>
    </div>
  );
}
