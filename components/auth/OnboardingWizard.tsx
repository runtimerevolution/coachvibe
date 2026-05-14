"use client";

import { useState } from "react";
import { workflowTemplates, type WorkflowTemplate } from "@/lib/workflow-templates";

const C = {
  purple: "#6626e9",
  grey: "#7A7A7A",
  white: "#FFFFFF",
  bg: "#EDEcf5",
  darkGrey: "#4F4F4F",
  lightBg: "#F8F7FC",
};

const TOTAL_STEPS = 5;

const goalsList = [
  { id: "grow_revenue", label: "Grow my revenue", desc: "Win more clients, raise rates", icon: "💰" },
  { id: "build_brand", label: "Build my personal brand", desc: "Grow your audience, increase visibility", icon: "✨" },
  { id: "win_clients", label: "Win more clients", desc: "Fill your pipeline, convert more leads", icon: "🎯" },
  { id: "automate_workflows", label: "Automate repetitive work", desc: "Build systems, save time", icon: "⚡" },
  { id: "scale", label: "Scale beyond my time", desc: "Build leverage, grow impact", icon: "🚀" },
];

const connectorsList = [
  { id: "gmail", name: "Gmail", icon: "✉️", desc: "Draft emails only", color: "#EA4335", security: "Draft only" },
  { id: "google-calendar", name: "Google Calendar", icon: "📅", desc: "Full read/write access", color: "#4285F4", security: "Auto" },
  { id: "stripe", name: "Stripe", icon: "💳", desc: "Payments & invoicing", color: "#635BFF", security: "Auto-send" },
  { id: "hubspot", name: "HubSpot CRM", icon: "🎯", desc: "Contacts management", color: "#FF7A59", security: "Auto" },
  { id: "zoom", name: "Zoom", icon: "📹", desc: "Recording & transcripts", color: "#2D8CFF", security: "Read only" },
  { id: "fathom", name: "Fathom", icon: "🎙️", desc: "Call transcripts", color: "#FF6B35", security: "Read only" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", desc: "Scheduling & posting", color: "#0A66C2", security: "Auto-publish" },
  { id: "mailchimp", name: "Mailchimp", icon: "🔤", desc: "Email marketing", color: "#FFE01B", security: "Draft only" },
];

interface Props {
  coachId: string;
  completeAction: () => Promise<void>;
}

export default function OnboardingWizard({ coachId, completeAction }: Props) {
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [connectedApps, setConnectedApps] = useState<string[]>([]);
  const [activeWorkflows, setActiveWorkflows] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const steps = ["welcome", "goals", "connect", "workflows", "ready"];
  const currentStep = steps[step];

  const canNext =
    currentStep === "welcome" ||
    currentStep === "ready" ||
    (currentStep === "goals" && selectedGoals.length > 0) ||
    (currentStep === "connect" && connectedApps.length > 0) ||
    currentStep === "workflows";

  async function toggleConnector(id: string) {
    const isConnected = connectedApps.includes(id);
    const newConnected = !isConnected;
    setConnectedApps(p => newConnected ? [...p, id] : p.filter(x => x !== id));
    try {
      await fetch("/api/integration/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: id, connected: newConnected }),
      });
    } catch {
      // revert on failure
      setConnectedApps(p => isConnected ? [...p, id] : p.filter(x => x !== id));
    }
  }

  async function toggleWorkflow(id: string) {
    const isActive = activeWorkflows.includes(id);
    const newActive = !isActive;
    setActiveWorkflows(p => newActive ? [...p, id] : p.filter(x => x !== id));
    try {
      await fetch("/api/workflow/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: id, active: newActive }),
      });
    } catch {
      setActiveWorkflows(p => isActive ? [...p, id] : p.filter(x => x !== id));
    }
  }

  async function handleNext() {
    if (currentStep === "goals") {
      setSaving(true);
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: selectedGoals, hoursPerWeek }),
      }).catch(() => {});
      setSaving(false);
    }
    setStep(s => s + 1);
  }

  async function handleComplete() {
    setSaving(true);
    await completeAction();
  }

  async function handleSkip() {
    setSaving(true);
    await completeAction();
  }

  return (
    <div style={styles.page}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .fade-in{animation:fadeIn 0.35s ease-out forwards}`}</style>

      {/* Progress */}
      <div style={styles.progressWrap}>
        <div style={styles.progressBar}>
          {steps.map((_, i) => (
            <div key={i} style={{ ...styles.progressSegment, background: i <= step ? C.purple : "#D6D0EC" }} />
          ))}
        </div>
        <div style={styles.stepLabel}>Step {step + 1} of {TOTAL_STEPS}</div>
      </div>

      {/* Card */}
      <div className="fade-in" key={currentStep} style={styles.card}>

        {currentStep === "welcome" && (
          <div style={{ textAlign: "center" }}>
            <div style={styles.iconWrap}><span style={{ fontSize: 32 }}>⚡</span></div>
            <h1 style={styles.title}>Welcome to CoachOS</h1>
            <p style={styles.copy}>Your automation engine. Connect tools you already use and switch on workflows that save hours every week.</p>
            {[{ icon: "🎯", text: "Tell us your goals" }, { icon: "🔌", text: "Connect your tools" }, { icon: "⚡", text: "Switch on automations" }].map((item, i) => (
              <div key={i} style={styles.listItem}>
                <span style={styles.listEmoji}>{item.icon}</span>
                <span style={styles.listLabel}>{item.text}</span>
              </div>
            ))}
          </div>
        )}

        {currentStep === "goals" && (
          <div>
            <h2 style={{ ...styles.title, fontSize: 22, marginBottom: 6 }}>What are you working towards?</h2>
            <p style={{ ...styles.copy, marginBottom: 24 }}>Select all that apply.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {goalsList.map(goal => {
                const sel = selectedGoals.includes(goal.id);
                return (
                  <div key={goal.id} onClick={() => setSelectedGoals(p => sel ? p.filter(g => g !== goal.id) : [...p, goal.id])} style={{ background: sel ? C.purple + "08" : C.lightBg, borderRadius: 14, padding: "16px 20px", border: `2px solid ${sel ? C.purple : "transparent"}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: sel ? C.purple + "18" : "#EEE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{goal.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: sel ? C.purple : C.darkGrey }}>{goal.label}</div>
                      <div style={{ fontSize: 12, color: C.grey, marginTop: 2 }}>{goal.desc}</div>
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: sel ? C.purple : "#DDD", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {sel && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.darkGrey, marginBottom: 10 }}>Hours available per week: <strong style={{ color: C.purple }}>{hoursPerWeek}h</strong></div>
              <input type="range" min="1" max="20" value={hoursPerWeek} onChange={e => setHoursPerWeek(Number(e.target.value))} style={{ width: "100%", accentColor: C.purple }} />
            </div>
          </div>
        )}

        {currentStep === "connect" && (
          <div>
            <h2 style={{ ...styles.title, fontSize: 22, marginBottom: 6 }}>Connect your tools</h2>
            <div style={{ background: C.purple, borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", gap: 8, color: "#fff", fontSize: 12, alignItems: "center" }}>
              <span>🔒</span><span>Your data is secure. All email actions create drafts for your review.</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {connectorsList.map(c => {
                const connected = connectedApps.includes(c.id);
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: connected ? C.purple + "06" : C.lightBg, border: `1.5px solid ${connected ? C.purple + "50" : "transparent"}` }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: c.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{c.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.darkGrey }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: C.grey }}>{c.desc}</div>
                    </div>
                    <button onClick={() => toggleConnector(c.id)} style={{ padding: "5px 14px", borderRadius: 18, border: connected ? `1px solid ${C.grey}40` : "none", background: connected ? "transparent" : C.purple, color: connected ? C.darkGrey : "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Quicksand', sans-serif", minWidth: 80 }}>
                      {connected ? "Connected ✓" : "Connect"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentStep === "workflows" && (
          <div>
            <h2 style={{ ...styles.title, fontSize: 22, marginBottom: 20 }}>Switch on your automations</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {workflowTemplates.map((w: WorkflowTemplate) => {
                const missing = w.connectors.filter(c => !connectedApps.includes(c));
                const canActivate = missing.length === 0;
                const active = activeWorkflows.includes(w.id);
                return (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 12, background: active ? w.color + "06" : C.lightBg, border: `1.5px solid ${active ? w.color + "50" : "transparent"}`, opacity: canActivate ? 1 : 0.5 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: w.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{w.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.darkGrey }}>{w.name}</div>
                      {!canActivate && <div style={{ fontSize: 11, color: "#E65100" }}>Needs: {missing.map(id => connectorsList.find(x => x.id === id)?.name ?? id).join(", ")}</div>}
                    </div>
                    <span style={{ fontSize: 11, color: w.color, fontWeight: 600 }}>~{w.timeSaved}</span>
                    {canActivate && (
                      <div onClick={() => toggleWorkflow(w.id)} style={{ width: 40, height: 22, borderRadius: 11, background: active ? w.color : "#DDD", cursor: "pointer", position: "relative", flexShrink: 0 }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: active ? 20 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentStep === "ready" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ ...styles.title, fontSize: 26, marginBottom: 8 }}>You&apos;re all set!</h2>
            <p style={{ ...styles.copy, marginBottom: 28 }}>CoachOS is ready to start working for you.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {[{ n: selectedGoals.length, label: "goals set" }, { n: connectedApps.length, label: "tools connected" }, { n: activeWorkflows.length, label: "workflows on" }].map((s, i) => (
                <div key={i} style={{ background: C.purple + "10", borderRadius: 14, padding: "18px 22px", textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: C.purple, fontFamily: "'Red Hat Display', sans-serif" }}>{s.n}</div>
                  <div style={{ fontSize: 11, color: C.grey, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={styles.actionsWrap}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} disabled={saving} style={styles.backBtn}>← Back</button>
          ) : <div />}

          {currentStep === "ready" ? (
            <button onClick={handleComplete} disabled={saving} style={styles.primaryBtn}>
              {saving ? "Setting up…" : "Go to dashboard →"}
            </button>
          ) : (
            <button onClick={handleNext} disabled={!canNext || saving} style={{ ...styles.primaryBtn, background: canNext ? C.purple : "#DDD", color: canNext ? "#fff" : C.grey, cursor: canNext ? "pointer" : "default" }}>
              {saving ? "Saving…" : currentStep === "welcome" ? "Let's go →" : "Next →"}
            </button>
          )}
        </div>

        {currentStep !== "ready" && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={handleSkip} disabled={saving} style={styles.skipBtn}>
              Skip setup and explore
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: C.bg,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
    fontFamily: "'Quicksand', sans-serif",
  },
  progressWrap: { width: "100%", maxWidth: 500, marginBottom: 24 },
  progressBar: {
    display: "grid",
    gridTemplateColumns: `repeat(${TOTAL_STEPS}, 1fr)`,
    gap: 6,
    marginBottom: 10,
  },
  progressSegment: { height: 5, borderRadius: 999, transition: "background 200ms ease" },
  stepLabel: { textAlign: "center", fontSize: 12, color: C.grey, fontWeight: 600 },
  card: {
    width: "100%",
    maxWidth: 500,
    background: C.white,
    borderRadius: 24,
    padding: "36px 32px",
    boxShadow: "0 8px 40px rgba(79, 37, 131, 0.10)",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    background: C.purple,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
  },
  title: {
    margin: "0 0 12px",
    fontFamily: "'Red Hat Display', sans-serif",
    fontSize: 26,
    fontWeight: 800,
    color: "#1f1437",
    textAlign: "center",
  },
  copy: { margin: "0 0 28px", fontSize: 14, lineHeight: 1.65, color: C.grey, textAlign: "center" },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#F6F5FC",
    borderRadius: 12,
    padding: "12px 16px",
    marginBottom: 10,
  },
  listEmoji: { fontSize: 20, lineHeight: 1, flexShrink: 0 },
  listLabel: { fontSize: 14, fontWeight: 700, color: "#362b58" },
  actionsWrap: { width: "100%", maxWidth: 500, marginTop: 24 },
  primaryBtn: {
    border: "none",
    borderRadius: 999,
    padding: "13px 28px",
    background: C.purple,
    color: "#fff",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "'Red Hat Display', sans-serif",
    boxShadow: "0 8px 24px rgba(102, 38, 233, 0.25)",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: C.grey,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Quicksand', sans-serif",
  },
  skipBtn: {
    background: "none",
    border: "none",
    color: C.grey,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "'Quicksand', sans-serif",
    fontWeight: 600,
    textDecoration: "underline",
    textDecorationColor: "transparent",
    padding: 0,
  },
};
