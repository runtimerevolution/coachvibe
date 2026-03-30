"use client";

import { useState } from "react";

const C = {
  purple: "#6626e9", orange: "#FFAD0D", teal: "#41D5E2", pink: "#E55CFF",
  darkGrey: "#4F4F4F", grey: "#7A7A7A", white: "#FFFFFF",
  lightBg: "#F8F7FC", lightPurple: "#F3EEFE",
};

const connectorsList = [
  { id: "gmail", name: "Gmail", icon: "✉️", desc: "Draft emails only", color: "#EA4335", security: "Draft only" },
  { id: "google-calendar", name: "Google Calendar", icon: "📅", desc: "Full read/write access", color: "#4285F4", security: "Auto" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", desc: "Scheduling & posting", color: "#0A66C2", security: "Auto-publish" },
  { id: "instagram", name: "Instagram", icon: "📸", desc: "Scheduling & posting", color: "#E4405F", security: "Auto-publish" },
  { id: "stripe", name: "Stripe", icon: "💳", desc: "Payments & invoicing", color: "#635BFF", security: "Auto-send" },
  { id: "fathom", name: "Fathom", icon: "🎙️", desc: "Call transcripts", color: "#FF6B35", security: "Read only" },
  { id: "zoom", name: "Zoom", icon: "📹", desc: "Recording & transcripts", color: "#2D8CFF", security: "Read only" },
  { id: "mailchimp", name: "Mailchimp", icon: "🔤", desc: "Email marketing", color: "#FFE01B", security: "Draft only" },
  { id: "xero", name: "Xero", icon: "📊", desc: "Accounting", color: "#13B5EA", security: "Auto-send" },
  { id: "hubspot", name: "HubSpot CRM", icon: "🎯", desc: "Contacts management", color: "#FF7A59", security: "Auto" },
];

const workflowTemplates = [
  { id: "client-onboarding", name: "Client onboarding", icon: "🚀", color: C.purple, desc: "Trigger on new payment, sends welcome email draft, intake form, schedules kickoff", connectors: ["stripe", "gmail", "google-calendar", "hubspot"], timeSaved: "2.5 hrs", creditCost: 5, steps: [{ label: "New client payment received", type: "trigger", connector: "stripe", security: null }, { label: "Send welcome email draft", type: "action", connector: "gmail", security: "Draft only" }, { label: "Send intake form", type: "action", connector: "gmail", security: "Draft only" }, { label: "Wait for form completion", type: "wait", connector: null, security: null }, { label: "Schedule kickoff call", type: "action", connector: "google-calendar", security: "Auto" }, { label: "Add to CRM", type: "action", connector: "hubspot", security: "Auto" }, { label: "Notify you when complete", type: "notify", connector: null, security: null }] },
  { id: "post-session-intelligence", name: "Post-session intelligence", icon: "🧠", color: C.teal, desc: "Connect Fathom/Zoom, auto-generates session notes, drafts follow-up email, tracks themes", connectors: ["fathom", "zoom", "gmail"], timeSaved: "1 hr", creditCost: 8, steps: [{ label: "Session recording available", type: "trigger", connector: "zoom", security: "Read only" }, { label: "Get transcript from Fathom", type: "action", connector: "fathom", security: "Read only" }, { label: "AI generates session notes", type: "action", connector: null, security: null }, { label: "Extract key themes & action items", type: "action", connector: null, security: null }, { label: "Draft follow-up email", type: "action", connector: "gmail", security: "Draft only" }, { label: "Save to client record", type: "action", connector: "hubspot", security: "Auto" }, { label: "Notify you with summary", type: "notify", connector: null, security: null }] },
  { id: "pre-session-brief", name: "Pre-session brief", icon: "📋", color: C.orange, desc: "Before each session, generates brief with last session summary, action items, focus areas", connectors: ["google-calendar", "hubspot", "fathom"], timeSaved: "45 min", creditCost: 3, steps: [{ label: "Session scheduled in calendar", type: "trigger", connector: "google-calendar", security: "Auto" }, { label: "Retrieve last session details", type: "action", connector: "hubspot", security: "Auto" }, { label: "Get previous action items", type: "action", connector: "fathom", security: "Read only" }, { label: "AI generates brief", type: "action", connector: null, security: null }, { label: "Suggest focus areas", type: "action", connector: null, security: null }, { label: "Send brief to your email", type: "action", connector: "gmail", security: "Draft only" }] },
  { id: "weekly-outreach", name: "Weekly outreach", icon: "💌", color: C.pink, desc: "Find 10 relevant contacts, draft personalised outreach messages (email drafts only)", connectors: ["hubspot", "gmail"], timeSaved: "3 hrs", creditCost: 6, steps: [{ label: "Weekly schedule trigger", type: "trigger", connector: null, security: null }, { label: "Find 10 relevant contacts", type: "action", connector: "hubspot", security: "Auto" }, { label: "AI drafts personalised messages", type: "action", connector: null, security: null }, { label: "Save drafts for your review", type: "action", connector: "gmail", security: "Draft only" }, { label: "Notify you of drafts", type: "notify", connector: null, security: null }] },
  { id: "newsletter-draft", name: "Newsletter draft", icon: "📰", color: "#9333EA", desc: "Pull trending topics from conversations, draft newsletter in coach's voice (draft only)", connectors: ["gmail", "mailchimp"], timeSaved: "2 hrs", creditCost: 4, steps: [{ label: "Weekly timer trigger", type: "trigger", connector: null, security: null }, { label: "Analyze conversation themes", type: "action", connector: null, security: null }, { label: "AI drafts newsletter content", type: "action", connector: null, security: null }, { label: "Save draft for your review", type: "action", connector: "gmail", security: "Draft only" }] },
  { id: "ai-conversation-followup", name: "AI conversation follow-up", icon: "💬", color: "#6626e9", desc: "When someone chats with your AI, add them to your CRM and draft a 3-email follow-up sequence", connectors: ["hubspot", "gmail"], timeSaved: "4 hrs", creditCost: 4, steps: [{ label: "New conversation on your AI", type: "trigger", connector: null, security: null }, { label: "Add contact to CRM", type: "action", connector: "hubspot", security: "Auto" }, { label: "Draft follow-up sequence", type: "action", connector: "gmail", security: "Draft only" }, { label: "Notify you of new contact", type: "notify", connector: null, security: null }] },
  { id: "social-media-scheduling", name: "Social media scheduling", icon: "📱", color: "#1DA1F2", desc: "Create and schedule posts to LinkedIn/Instagram", connectors: ["linkedin", "instagram"], timeSaved: "5 hrs", creditCost: 7, steps: [{ label: "Weekly content calendar trigger", type: "trigger", connector: null, security: null }, { label: "AI generates post ideas", type: "action", connector: null, security: null }, { label: "Create LinkedIn post", type: "action", connector: "linkedin", security: "Auto-publish" }, { label: "Create Instagram post", type: "action", connector: "instagram", security: "Auto-publish" }, { label: "Track engagement metrics", type: "notify", connector: null, security: null }] },
  { id: "invoice-automation", name: "Invoice & payment automation", icon: "💷", color: "#13B5EA", desc: "Auto-generates invoices via Stripe/Xero, sends payment reminders", connectors: ["stripe", "xero", "gmail"], timeSaved: "3.5 hrs", creditCost: 4, steps: [{ label: "Session/package completed", type: "trigger", connector: "google-calendar", security: "Auto" }, { label: "Auto-generate invoice in Xero", type: "action", connector: "xero", security: "Auto-send" }, { label: "Send invoice to client", type: "action", connector: "gmail", security: "Auto-send" }, { label: "If unpaid after 7 days: remind", type: "condition", connector: "gmail", security: "Auto-send" }, { label: "Mark as paid in accounting", type: "action", connector: "xero", security: "Auto-send" }] },
];

const recentActivity = [
  { text: "Client onboarding completed for Sarah Mitchell", time: "12 min ago", type: "success", workflow: "client-onboarding" },
  { text: "Session notes generated from Zoom recording", time: "34 min ago", type: "action", workflow: "post-session-intelligence" },
  { text: "Pre-session brief sent for tomorrow's call", time: "1 hr ago", type: "alert", workflow: "pre-session-brief" },
  { text: "5 warm leads detected from conversations", time: "2 hrs ago", type: "action", workflow: "ai-conversation-followup" },
  { text: "Invoice #1047 paid by Lisa Park", time: "3 hrs ago", type: "success", workflow: "invoice-automation" },
  { text: "Weekly outreach emails drafted for review", time: "4 hrs ago", type: "action", workflow: "weekly-outreach" },
];

const notificationsData = [
  { id: 1, title: "Client onboarding complete", desc: "Sarah Mitchell completed intake and booked kickoff call.", time: "12 min ago", read: false },
  { id: 2, title: "Session notes ready", desc: "Post-session intelligence generated notes from your Zoom call with James.", time: "34 min ago", read: false },
  { id: 3, title: "5 warm leads flagged", desc: "Buying signals detected in recent conversations. Follow-up messages drafted.", time: "2 hrs ago", read: true },
  { id: 4, title: "Invoice paid", desc: "Lisa Park paid invoice #1047 for £2,400. Auto-marked as paid in Xero.", time: "3 hrs ago", read: true },
  { id: 5, title: "Weekly outreach ready", desc: "10 personalised outreach emails drafted. Review and send at your convenience.", time: "4 hrs ago", read: false },
];

const goalsList = [
  { id: "brand", label: "Build my personal brand", desc: "Grow your audience, increase visibility", icon: "✨" },
  { id: "clients", label: "Win more clients", desc: "Fill your pipeline, convert more leads", icon: "🎯" },
  { id: "impact", label: "Make more impact", desc: "Reach more people, create better content", icon: "💡" },
  { id: "scale", label: "Scale beyond my time", desc: "Build systems, create leverage", icon: "🚀" },
];

const conciergeActions = [
  { id: "a1", task: "Write a LinkedIn post about your pricing framework", points: 15, timeMin: 10, type: "content" },
  { id: "a2", task: "Review and send 3 outreach emails to warm leads", points: 25, timeMin: 15, type: "outreach" },
  { id: "a3", task: "Reply to 5 comments on your latest LinkedIn post", points: 10, timeMin: 8, type: "engagement" },
  { id: "a4", task: "Draft a newsletter from this week's sessions", points: 20, timeMin: 12, type: "content" },
  { id: "a5", task: "Send follow-up to Sarah Chen about her pricing experiment", points: 15, timeMin: 5, type: "outreach" },
  { id: "a6", task: "Set up the AI conversation follow-up workflow", points: 30, timeMin: 5, type: "automation" },
  { id: "a7", task: "Pitch yourself to 2 podcasts in your niche", points: 25, timeMin: 20, type: "outreach" },
];

function Badge({ color, children, icon }: { color: string; children: React.ReactNode; icon?: string }) {
  return (
    <span style={{ background: color + "18", color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
      {icon && <span>{icon}</span>}{children}
    </span>
  );
}

function SecurityBadge({ security }: { security: string }) {
  const cfg: Record<string, { icon: string; color: string }> = {
    "Draft only": { icon: "🔒", color: "#FF9800" }, "Auto-publish": { icon: "⚡", color: "#2196F3" },
    "Auto-send": { icon: "✓", color: "#4CAF50" }, "Auto": { icon: "⚙️", color: "#9C27B0" }, "Read only": { icon: "👁️", color: "#607D8B" },
  };
  const c = cfg[security] || { icon: "ℹ️", color: C.grey };
  return <Badge color={c.color} icon={c.icon}>{security}</Badge>;
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: string }) {
  return (
    <div style={{ background: C.white, borderRadius: 16, padding: "24px", flex: 1, minWidth: 180, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #F0EDF5", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -10, right: -10, width: 60, height: 60, background: color + "12", borderRadius: "50%" }} />
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: C.darkGrey, fontFamily: "'Red Hat Display', sans-serif" }}>{value}</div>
      <div style={{ fontSize: 14, color: C.grey, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color, fontWeight: 600, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function CreditsBar({ used, total, onBuyCredits }: { used: number; total: number; onBuyCredits: () => void }) {
  const remaining = total - used;
  const percentage = (used / total) * 100;
  const isLow = remaining < total * 0.2;
  return (
    <div style={{ background: C.white, borderRadius: 16, padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #F0EDF5" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ background: C.purple + "15", color: C.purple, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>Coachvox Pro</span>
        <div style={{ fontSize: 28, fontWeight: 800, color: isLow ? C.orange : C.purple, fontFamily: "'Red Hat Display', sans-serif" }}>{remaining}</div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.darkGrey, marginBottom: 12 }}>Credits remaining</div>
      <div style={{ width: "100%", height: 8, background: "#E0E0E0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${percentage}%`, height: "100%", background: isLow ? C.orange : C.purple, borderRadius: 4, transition: "width 0.3s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <div style={{ fontSize: 12, color: C.grey }}>{used} of {total} used</div>
        <button onClick={onBuyCredits} style={{ background: "none", border: `1px solid ${C.purple}`, color: C.purple, fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "'Quicksand', sans-serif" }}>Buy more</button>
      </div>
    </div>
  );
}

function BuyCreditsModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const packs = [{ id: "100", amount: 100, price: 10, perCredit: "0.10", popular: false }, { id: "300", amount: 300, price: 24, perCredit: "0.08", popular: true }, { id: "600", amount: 600, price: 42, perCredit: "0.07", popular: false }];
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: C.white, borderRadius: 20, padding: "32px", maxWidth: 520, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.darkGrey }}>Buy more credits</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.grey }}>×</button>
        </div>
        <p style={{ fontSize: 14, color: C.grey, margin: "0 0 24px", lineHeight: 1.5 }}>Credits are used when workflows run. Pro includes 500 credits/month.</p>
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {packs.map(pack => (
            <div key={pack.id} onClick={() => setSelected(pack.id)} style={{ flex: 1, padding: "20px 16px", borderRadius: 16, cursor: "pointer", border: selected === pack.id ? `2px solid ${C.purple}` : "1px solid #F0EDF5", background: selected === pack.id ? C.purple + "06" : C.white, textAlign: "center", position: "relative" }}>
              {pack.popular && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: C.orange, color: C.white, fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 10 }}>Best value</div>}
              <div style={{ fontSize: 32, fontWeight: 800, color: C.purple, fontFamily: "'Red Hat Display', sans-serif" }}>{pack.amount}</div>
              <div style={{ fontSize: 13, color: C.darkGrey, fontWeight: 600 }}>credits</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.darkGrey, marginTop: 12, fontFamily: "'Red Hat Display', sans-serif" }}>${pack.price}</div>
            </div>
          ))}
        </div>
        <button style={{ width: "100%", padding: "14px", borderRadius: 24, border: "none", background: selected ? C.purple : "#E0E0E0", color: selected ? C.white : C.grey, fontWeight: 700, fontSize: 15, cursor: selected ? "pointer" : "default", fontFamily: "'Red Hat Display', sans-serif" }}>
          {selected ? `Buy ${packs.find(p => p.id === selected)?.amount} credits for $${packs.find(p => p.id === selected)?.price}` : "Select a pack"}
        </button>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WorkflowDetail({ workflow, onBack, connectedApps }: { workflow: any; onBack: () => void; connectedApps: string[] }) {
  const typeConfig: Record<string, { bg: string; border: string; icon: string; label: string }> = {
    trigger: { bg: C.purple + "12", border: C.purple, icon: "⚡", label: "Trigger" },
    action: { bg: C.teal + "12", border: C.teal, icon: "▶️", label: "Action" },
    wait: { bg: C.orange + "12", border: C.orange, icon: "⏳", label: "Wait" },
    condition: { bg: C.pink + "12", border: C.pink, icon: "🔀", label: "Condition" },
    notify: { bg: "#E8F5E9", border: "#4CAF50", icon: "🔔", label: "Notify" },
  };
  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.purple, fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 20, fontFamily: "'Quicksand', sans-serif", padding: 0 }}>← Back to workflows</button>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: workflow.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{workflow.icon}</div>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, color: C.darkGrey }}>{workflow.name}</h2>
          <p style={{ margin: "4px 0 0", color: C.grey, fontSize: 14 }}>{workflow.desc}</p>
        </div>
      </div>
      <div style={{ background: C.white, borderRadius: 16, padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #F0EDF5" }}>
        <h3 style={{ margin: "0 0 24px", fontSize: 16, color: C.darkGrey }}>Automation steps</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {workflow.steps.map((step: any, i: number) => {
            const tc = typeConfig[step.type];
            const connector = step.connector ? connectorsList.find(c => c.id === step.connector) : null;
            return (
              <div key={i}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: tc.bg, borderRadius: 12, borderLeft: `3px solid ${tc.border}` }}>
                  <div style={{ fontSize: 18, width: 32, textAlign: "center" }}>{tc.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.darkGrey }}>{step.label}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                      <Badge color={tc.border} icon={tc.icon}>{tc.label}</Badge>
                      {connector && <Badge color={connector.color} icon={connector.icon}>{connector.name}</Badge>}
                      {step.security && <SecurityBadge security={step.security} />}
                    </div>
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.grey, border: "1px solid #F0EDF5" }}>{i + 1}</div>
                </div>
                {i < workflow.steps.length - 1 && (
                  <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
                    <div style={{ width: 2, height: 20, background: "#E0E0E0", borderRadius: 1 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function CoachFlow() {
  const [onboarding, setOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [page, setPage] = useState("dashboard");
  const [connectedApps, setConnectedApps] = useState<string[]>([]);
  const [activeWorkflows, setActiveWorkflows] = useState<string[]>([]);
  const [viewingWorkflow, setViewingWorkflow] = useState<string | null>(null);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const creditsUsed = 347; const creditsTotal = 500;
  const unreadCount = notificationsData.filter(n => !n.read).length;

  const toggleConnector = (id: string) => setConnectedApps(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleWorkflow = (id: string) => setActiveWorkflows(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleGoal = (id: string) => setSelectedGoals(p => p.includes(id) ? p.filter(g => g !== id) : [...p, id]);
  const toggleAction = (id: string) => setCompletedActions(p => p.includes(id) ? p.filter(a => a !== id) : [...p, id]);
  const totalPoints = completedActions.reduce((s, id) => s + (conciergeActions.find(a => a.id === id)?.points || 0), 0);

  const onboardingSteps = ["welcome", "goals", "time", "connect", "workflows", "ready"];
  const currentStep = onboardingSteps[onboardingStep];
  const canNext = currentStep === "welcome" || currentStep === "ready" || currentStep === "time" || (currentStep === "goals" && selectedGoals.length > 0) || (currentStep === "connect" && connectedApps.length > 0) || currentStep === "workflows";

  const finishOnboarding = () => {
    setOnboarding(false);
    if (activeWorkflows.length === 0) {
      const available = workflowTemplates.filter(w => w.connectors.every(c => connectedApps.includes(c)));
      if (available.length > 0) setActiveWorkflows([available[0].id]);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "connectors", label: "Connectors", icon: "🔌" },
    { id: "workflows", label: "Workflows", icon: "⚙️" },
    { id: "second-brain", label: "Second brain", icon: "🧠" },
    { id: "concierge", label: "Concierge", icon: "🎯" },
    { id: "notifications", label: "Notifications", icon: "🔔", badge: unreadCount },
  ];

  if (onboarding) {
    return (
      <div style={{ minHeight: "100vh", background: C.lightBg, display: "flex", flexDirection: "column", alignItems: "center", overflow: "auto", padding: "40px 20px" }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .fade-in{animation:fadeIn 0.4s ease-out forwards}`}</style>
        <div style={{ width: "100%", maxWidth: 640, marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {onboardingSteps.map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= onboardingStep ? C.purple : "#E0E0E0", transition: "background 0.3s" }} />)}
          </div>
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: C.grey }}>Step {onboardingStep + 1} of {onboardingSteps.length}</div>
        </div>

        <div className="fade-in" key={currentStep} style={{ background: C.white, borderRadius: 24, padding: "40px", width: "100%", maxWidth: 640, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #F0EDF5" }}>
          {currentStep === "welcome" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, margin: "0 auto 24px", background: C.purple, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 36 }}>⚡</span>
              </div>
              <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 800, color: C.darkGrey }}>Welcome to Coachflow</h1>
              <p style={{ margin: "0 0 32px", fontSize: 15, color: C.grey, lineHeight: 1.6 }}>Your automation engine. Connect tools you already use and switch on workflows that save hours every week.</p>
              {[{ icon: "🎯", text: "Tell us your goals" }, { icon: "⏱️", text: "Set how much time you have" }, { icon: "🔌", text: "Connect your tools" }, { icon: "⚡", text: "Switch on automations" }].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: C.darkGrey, marginBottom: 10, maxWidth: 360, margin: "0 auto 12px" }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span><span>{item.text}</span>
                </div>
              ))}
            </div>
          )}

          {currentStep === "goals" && (
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: C.darkGrey, textAlign: "center" }}>What are you working towards?</h2>
              <p style={{ margin: "0 0 28px", fontSize: 14, color: C.grey, textAlign: "center" }}>Select all that apply.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {goalsList.map(goal => {
                  const sel = selectedGoals.includes(goal.id);
                  return (
                    <div key={goal.id} onClick={() => toggleGoal(goal.id)} style={{ background: C.lightBg, borderRadius: 16, padding: "18px 22px", border: `2px solid ${sel ? C.purple : "transparent"}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: sel ? C.purple + "15" : "#F0EDF5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{goal.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: sel ? C.purple : C.darkGrey }}>{goal.label}</div>
                        <div style={{ fontSize: 13, color: C.grey, marginTop: 2 }}>{goal.desc}</div>
                      </div>
                      <div style={{ width: 26, height: 26, borderRadius: 8, background: sel ? C.purple : "#E0E0E0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {sel && <span style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === "time" && (
            <div style={{ textAlign: "center" }}>
              <h2 style={{ margin: "0 0 36px", fontSize: 24, fontWeight: 800, color: C.darkGrey }}>How much time can you give your business each week?</h2>
              <div style={{ fontSize: 64, fontWeight: 800, color: C.purple, fontFamily: "'Red Hat Display', sans-serif", marginBottom: 8 }}>{hoursPerWeek}h</div>
              <input type="range" min="1" max="20" value={hoursPerWeek} onChange={e => setHoursPerWeek(Number(e.target.value))} style={{ width: "100%", maxWidth: 400, accentColor: C.purple, height: 8 }} />
              <div style={{ marginTop: 24, background: C.lightPurple, borderRadius: 12, padding: "16px", fontSize: 13, color: C.darkGrey, lineHeight: 1.6 }}>
                {hoursPerWeek <= 3 ? "Coachflow will focus on the highest-impact actions." : hoursPerWeek <= 8 ? "A solid amount. Coachflow will mix quick wins with deeper work." : "Power mode. High-value actions across all your goals."}
              </div>
            </div>
          )}

          {currentStep === "connect" && (
            <div>
              <h2 style={{ margin: "0 0 28px", fontSize: 24, fontWeight: 800, color: C.darkGrey, textAlign: "center" }}>Connect your tools</h2>
              <div style={{ background: C.purple, borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, color: C.white, fontSize: 12 }}>
                <span>🔒</span><span>Your data is secure. All email actions create drafts for your review.</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {connectorsList.map(c => {
                  const isConnected = connectedApps.includes(c.id);
                  return (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 14, background: isConnected ? C.purple + "06" : C.lightBg, border: isConnected ? `1.5px solid ${C.purple}40` : "1.5px solid transparent" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: c.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{c.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.darkGrey }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: C.grey }}>{c.desc}</div>
                      </div>
                      <SecurityBadge security={c.security} />
                      <button onClick={() => toggleConnector(c.id)} style={{ padding: "6px 16px", borderRadius: 20, border: isConnected ? `1px solid ${C.grey}40` : "none", background: isConnected ? "transparent" : C.purple, color: isConnected ? C.darkGrey : C.white, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Quicksand', sans-serif", minWidth: 90 }}>
                        {isConnected ? "Connected ✓" : "Connect"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === "workflows" && (
            <div>
              <h2 style={{ margin: "0 0 28px", fontSize: 24, fontWeight: 800, color: C.darkGrey, textAlign: "center" }}>Switch on your automations</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {workflowTemplates.map(w => {
                  const missing = w.connectors.filter(c => !connectedApps.includes(c));
                  const canActivate = missing.length === 0;
                  const isActive = activeWorkflows.includes(w.id);
                  return (
                    <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderRadius: 14, background: isActive ? w.color + "06" : C.lightBg, border: isActive ? `1.5px solid ${w.color}40` : "1.5px solid transparent", opacity: canActivate ? 1 : 0.5 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: w.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{w.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.darkGrey }}>{w.name}</div>
                        {!canActivate && <div style={{ fontSize: 11, color: "#E65100", marginTop: 2 }}>Needs: {missing.map(id => connectorsList.find(x => x.id === id)?.name).join(", ")}</div>}
                      </div>
                      <span style={{ fontSize: 12, color: w.color, fontWeight: 600 }}>~{w.timeSaved}</span>
                      {canActivate && (
                        <div onClick={() => toggleWorkflow(w.id)} style={{ width: 44, height: 24, borderRadius: 12, background: isActive ? w.color : "#E0E0E0", cursor: "pointer", position: "relative" }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.white, position: "absolute", top: 2, left: isActive ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
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
              <h2 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: C.darkGrey }}>You&apos;re all set</h2>
              <p style={{ margin: "0 0 32px", fontSize: 15, color: C.grey, lineHeight: 1.6 }}>Coachflow is ready to start working for you.</p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 32 }}>
                {[{ n: selectedGoals.length, label: "goals set" }, { n: connectedApps.length, label: "tools connected" }, { n: activeWorkflows.length, label: "automations on" }].map((s, i) => (
                  <div key={i} style={{ background: C.lightPurple, borderRadius: 16, padding: "20px 28px", textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: C.purple, fontFamily: "'Red Hat Display', sans-serif" }}>{s.n}</div>
                    <div style={{ fontSize: 12, color: C.grey, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ width: "100%", maxWidth: 640, marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {onboardingStep > 0 ? (
            <button onClick={() => setOnboardingStep(s => s - 1)} style={{ background: "none", border: "none", color: C.grey, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Quicksand', sans-serif" }}>← Back</button>
          ) : <div />}
          {currentStep === "ready" ? (
            <button onClick={finishOnboarding} style={{ background: C.purple, color: C.white, border: "none", borderRadius: 24, padding: "14px 36px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Red Hat Display', sans-serif" }}>Go to dashboard →</button>
          ) : (
            <button onClick={() => setOnboardingStep(s => s + 1)} disabled={!canNext} style={{ background: canNext ? C.purple : "#E0E0E0", color: canNext ? C.white : C.grey, border: "none", borderRadius: 24, padding: "14px 36px", fontSize: 15, fontWeight: 700, cursor: canNext ? "pointer" : "default", fontFamily: "'Red Hat Display', sans-serif" }}>
              {currentStep === "welcome" ? "Let's go →" : "Next →"}
            </button>
          )}
        </div>
        {currentStep !== "ready" && <button onClick={finishOnboarding} style={{ background: "none", border: "none", color: C.grey, fontSize: 13, cursor: "pointer", marginTop: 16, fontFamily: "'Quicksand', sans-serif" }}>Skip setup and explore</button>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.lightBg, color: C.darkGrey }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .fade-in{animation:fadeIn 0.4s ease-out forwards}`}</style>
      {showBuyCredits && <BuyCreditsModal onClose={() => setShowBuyCredits(false)} />}

      {/* Sidebar */}
      <div style={{ width: 260, background: C.white, borderRight: "1px solid #F0EDF5", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "28px 24px", borderBottom: "1px solid #F0EDF5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: C.purple, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 20 }}>⚡</span>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.purple }}>Coachflow</h1>
              <div style={{ fontSize: 11, color: C.grey, fontWeight: 600 }}>by Coachvox</div>
            </div>
          </div>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); setViewingWorkflow(null); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px", borderRadius: 12, border: "none", background: page === item.id ? C.purple + "10" : "transparent", color: page === item.id ? C.purple : C.darkGrey, fontWeight: page === item.id ? 700 : 500, fontSize: 14, cursor: "pointer", fontFamily: "'Quicksand', sans-serif", marginBottom: 4, textAlign: "left", position: "relative" }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
              {(item as { badge?: number }).badge && (item as { badge?: number }).badge! > 0 && (
                <span style={{ marginLeft: "auto", background: C.pink, color: C.white, fontSize: 11, fontWeight: 700, width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{(item as { badge?: number }).badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ padding: "20px 16px", borderTop: "1px solid #F0EDF5", margin: "0 12px" }}>
          <div style={{ background: C.purple + "08", borderRadius: 12, padding: "16px", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.purple, marginBottom: 6 }}>This week</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.darkGrey, fontFamily: "'Red Hat Display', sans-serif" }}>19.5 hrs</div>
            <div style={{ fontSize: 12, color: C.grey }}>saved by automations</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto", maxHeight: "100vh" }}>
        {/* DASHBOARD */}
        {page === "dashboard" && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.darkGrey }}>Good morning, coach 👋</h2>
              <p style={{ margin: "6px 0 0", color: C.grey, fontSize: 15 }}>Here&apos;s what Coachflow has been doing for you.</p>
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
              <StatCard icon="⚡" value={activeWorkflows.length} label="Active workflows" color={C.purple} sub={`of ${workflowTemplates.length} available`} />
              <StatCard icon="✅" value="52" label="Tasks completed" color="#4CAF50" sub="↑ 18% from last week" />
              <StatCard icon="🔌" value={connectedApps.length} label="Connected apps" color={C.teal} sub={`of ${connectorsList.length} available`} />
              <StatCard icon="⏱️" value="19.5h" label="Time saved" color={C.orange} sub="This week" />
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ flex: 2, minWidth: 400 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 18, color: C.darkGrey }}>Recent activity</h3>
                <div style={{ background: C.white, borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #F0EDF5", overflow: "hidden" }}>
                  {recentActivity.map((item, i) => {
                    const wf = workflowTemplates.find(w => w.id === item.workflow);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: i < recentActivity.length - 1 ? "1px solid #F8F7FC" : "none" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.type === "success" ? "#4CAF50" : item.type === "alert" ? C.orange : C.teal, flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: 13, color: C.darkGrey, fontWeight: 500 }}>{item.text}</div>
                        {wf && <Badge color={wf.color} icon={wf.icon}>{wf.name}</Badge>}
                        <div style={{ fontSize: 12, color: C.grey, flexShrink: 0 }}>{item.time}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 280 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 18, color: C.darkGrey }}>Active workflows</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {workflowTemplates.filter(w => activeWorkflows.includes(w.id)).length === 0 && (
                    <div style={{ background: C.white, borderRadius: 12, padding: "20px", textAlign: "center", color: C.grey, fontSize: 13, border: "1px solid #F0EDF5" }}>No active workflows yet</div>
                  )}
                  {workflowTemplates.filter(w => activeWorkflows.includes(w.id)).map(w => (
                    <div key={w.id} style={{ background: C.white, borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #F0EDF5", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => { setPage("workflows"); setViewingWorkflow(w.id); }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: w.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{w.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.darkGrey }}>{w.name}</div>
                        <div style={{ fontSize: 12, color: "#4CAF50", fontWeight: 600 }}>Running</div>
                      </div>
                      <div style={{ fontSize: 12, color: C.grey }}>→</div>
                    </div>
                  ))}
                </div>
                <CreditsBar used={creditsUsed} total={creditsTotal} onBuyCredits={() => setShowBuyCredits(true)} />
              </div>
            </div>
          </div>
        )}

        {/* CONNECTORS */}
        {page === "connectors" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.darkGrey }}>Connectors</h2>
              <p style={{ margin: "6px 0 0", color: C.grey, fontSize: 15 }}>Connect the tools you already use.</p>
            </div>
            <div style={{ background: C.purple, borderRadius: 12, padding: "16px 20px", marginBottom: 32, display: "flex", alignItems: "center", gap: 12, color: C.white }}>
              <span style={{ fontSize: 20 }}>🔒</span>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}><strong>Your data is secure.</strong> All email actions create drafts for your review.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {connectorsList.map(c => {
                const connected = connectedApps.includes(c.id);
                return (
                  <div key={c.id} style={{ background: C.white, borderRadius: 16, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: connected ? `2px solid ${C.purple}` : "1px solid #F0EDF5", display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
                    {connected && <div style={{ position: "absolute", top: 12, right: 12, background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>Connected</div>}
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: c.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{c.icon}</div>
                    <div>
                      <div style={{ fontFamily: "'Red Hat Display', sans-serif", fontWeight: 700, fontSize: 16, color: C.darkGrey }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: C.grey, marginTop: 2 }}>{c.desc}</div>
                      <div style={{ marginTop: 8 }}><SecurityBadge security={c.security} /></div>
                    </div>
                    <button onClick={() => toggleConnector(c.id)} style={{ marginTop: "auto", padding: "10px 20px", borderRadius: 24, border: connected ? `1px solid ${C.grey}` : "none", background: connected ? "transparent" : C.purple, color: connected ? C.darkGrey : C.white, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Quicksand', sans-serif" }}>
                      {connected ? "Disconnect" : "Connect"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WORKFLOWS */}
        {page === "workflows" && !viewingWorkflow && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.darkGrey }}>Workflow templates</h2>
              <p style={{ margin: "6px 0 0", color: C.grey, fontSize: 15 }}>Pre-built automations for the things coaches do most.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {workflowTemplates.map(w => {
                const missing = w.connectors.filter(c => !connectedApps.includes(c));
                const canActivate = missing.length === 0;
                const active = activeWorkflows.includes(w.id);
                return (
                  <div key={w.id} style={{ background: C.white, borderRadius: 16, padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: active ? `2px solid ${w.color}` : "1px solid #F0EDF5", display: "flex", flexDirection: "column", gap: 14, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: active ? w.color : "transparent" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: w.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{w.icon}</div>
                      {canActivate && (
                        <div onClick={() => toggleWorkflow(w.id)} style={{ width: 48, height: 26, borderRadius: 13, background: active ? w.color : "#E0E0E0", cursor: "pointer", position: "relative" }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.white, position: "absolute", top: 2, left: active ? 24 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.darkGrey }}>{w.name}</h3>
                      <p style={{ margin: "6px 0 0", fontSize: 13, color: C.grey, lineHeight: 1.5 }}>{w.desc}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {w.connectors.map(cId => {
                        const conn = connectorsList.find(x => x.id === cId);
                        const isMissing = !connectedApps.includes(cId);
                        return <span key={cId} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 12, background: isMissing ? "#FFF3E0" : "#F0EDF5", color: isMissing ? "#E65100" : C.darkGrey, fontWeight: 600 }}>{conn?.icon} {conn?.name}{isMissing ? " (needs connecting)" : ""}</span>;
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 13 }}>
                      <span style={{ color: w.color, fontWeight: 700 }}>Saves ~{w.timeSaved}</span>
                      <span style={{ color: C.grey }}>•</span>
                      <span style={{ color: C.grey }}>Uses {w.creditCost} credits</span>
                    </div>
                    <button onClick={() => setViewingWorkflow(w.id)} style={{ marginTop: "auto", padding: "10px", borderRadius: 24, border: `1px solid ${w.color}30`, background: w.color + "08", color: w.color, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Quicksand', sans-serif" }}>
                      View workflow steps →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {page === "workflows" && viewingWorkflow && (
          <WorkflowDetail workflow={workflowTemplates.find(w => w.id === viewingWorkflow)!} onBack={() => setViewingWorkflow(null)} connectedApps={connectedApps} />
        )}

        {/* SECOND BRAIN */}
        {page === "second-brain" && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.darkGrey }}>Second brain</h2>
              <p style={{ margin: "6px 0 0", color: C.grey, fontSize: 15 }}>Everything Coachflow learns about your coaching, your clients, and your business.</p>
            </div>
            <div style={{ background: C.white, borderRadius: 16, padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #F0EDF5" }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: C.darkGrey }}>🧠 Recent sessions</h3>
              <p style={{ margin: "0 0 24px", fontSize: 13, color: C.grey }}>Your coaching sessions, summarised and ready to use.</p>
              {[
                { initials: "SC", name: "Sarah Chen", date: "12 Mar", duration: "52 min", color: "#4CAF50", tags: ["Pricing confidence", "Imposter syndrome"], summary: "Sarah is ready to raise her rates but fears losing clients. We worked through value-based pricing.", keyMoment: "'I always felt like I was overcharging until you asked me what my clients would pay to NOT have this problem'" },
                { initials: "JC", name: "James Chen", date: "12 Mar", duration: "60 min", color: "#2196F3", tags: ["Goal clarity", "Action planning"], summary: "James identified three highest-leverage activities and built a weekly action plan.", keyMoment: "'I've been trying to do everything when I should have been doing three things really well'" },
                { initials: "ER", name: "Emma Richardson", date: "8 Mar", duration: "45 min", color: "#FF9800", tags: ["Revenue goals", "Client acquisition"], summary: "Emma diagnosed the gap between her marketing message and her discovery call script.", keyMoment: "'My Instagram says one thing and my sales call says another. No wonder people are confused.'" },
              ].map((s, si) => (
                <div key={si} style={{ background: C.lightBg, borderRadius: 16, padding: "24px", marginBottom: si < 2 ? 16 : 0, border: "1px solid #F0EDF5" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontSize: 14, fontWeight: 700 }}>{s.initials}</div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.darkGrey }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: C.grey }}>{s.date} · {s.duration}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {s.tags.map((t, ti) => <Badge key={ti} color={C.purple}>{t}</Badge>)}
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, marginBottom: 6 }}>Session summary</div>
                    <div style={{ fontSize: 13, color: C.darkGrey, lineHeight: 1.6 }}>{s.summary}</div>
                  </div>
                  <div style={{ borderLeft: `3px solid ${C.purple}`, padding: "10px 16px", background: C.lightPurple, borderRadius: "0 8px 8px 0", fontSize: 13, color: C.darkGrey, fontStyle: "italic", lineHeight: 1.6 }}>{s.keyMoment}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONCIERGE */}
        {page === "concierge" && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.darkGrey }}>Concierge</h2>
              <p style={{ margin: "6px 0 0", color: C.grey, fontSize: 15 }}>Your daily actions, aligned to your goals and sized to fit your week.</p>
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
              <div style={{ background: C.white, borderRadius: 16, padding: "20px 24px", flex: 1, minWidth: 180, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #F0EDF5" }}>
                <div style={{ fontSize: 12, color: C.grey, fontWeight: 600, marginBottom: 4 }}>Weekly time budget</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: C.purple, fontFamily: "'Red Hat Display', sans-serif" }}>{hoursPerWeek}h</div>
                  <input type="range" min="1" max="20" value={hoursPerWeek} onChange={e => setHoursPerWeek(Number(e.target.value))} style={{ flex: 1, accentColor: C.purple }} />
                </div>
              </div>
              <div style={{ background: C.white, borderRadius: 16, padding: "20px 24px", flex: 1, minWidth: 180, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #F0EDF5" }}>
                <div style={{ fontSize: 12, color: C.grey, fontWeight: 600, marginBottom: 4 }}>Points this week</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.orange, fontFamily: "'Red Hat Display', sans-serif" }}>{totalPoints}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {conciergeActions.map(action => {
                const done = completedActions.includes(action.id);
                return (
                  <div key={action.id} style={{ background: C.white, borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: done ? `2px solid ${C.purple}` : "1px solid #F0EDF5", display: "flex", alignItems: "center", gap: 16, opacity: done ? 0.7 : 1 }}>
                    <div onClick={() => toggleAction(action.id)} style={{ width: 28, height: 28, borderRadius: 8, background: done ? C.purple : "#F0EDF5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                      {done && <span style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: done ? 400 : 600, color: C.darkGrey, textDecoration: done ? "line-through" : "none" }}>{action.task}</div>
                      <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12, color: C.grey }}>
                        <span>⏱️ {action.timeMin} min</span>
                        <span style={{ color: C.orange, fontWeight: 600 }}>+{action.points} pts</span>
                      </div>
                    </div>
                    <Badge color={action.type === "content" ? C.purple : action.type === "outreach" ? C.teal : C.orange}>{action.type}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {page === "notifications" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.darkGrey }}>Notifications</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {notificationsData.map(n => (
                <div key={n.id} style={{ background: n.read ? C.white : C.lightPurple, borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: n.read ? "1px solid #F0EDF5" : `1px solid ${C.purple}30`, display: "flex", gap: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.read ? "transparent" : C.purple, marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.darkGrey, marginBottom: 4 }}>{n.title}</div>
                    <div style={{ fontSize: 13, color: C.grey, lineHeight: 1.5 }}>{n.desc}</div>
                    <div style={{ fontSize: 12, color: C.grey, marginTop: 8 }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
