"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { workflowTemplates } from "@/lib/workflow-templates";
import { timeAgo } from "@/lib/time";

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

interface DashboardData {
  coach: { id: string; name: string; credits: number };
  stats: { activeWorkflows: number; connectedIntegrations: number; creditsRemaining: number; unreadNotifications: number };
  workflows: Array<{ id: string; templateId: string; active: boolean; runs: WorkflowRun[] }>;
  integrations: Array<{ service: string; connected: boolean }>;
  recentActivity: ActivityLogItem[];
  notifications: NotificationItem[];
}
interface WorkflowRun { id: string; status: string; creditCost: number; startedAt: string; completedAt: string | null; }
interface ActivityLogItem { id: string; action: string; label: string; metadata?: Record<string, unknown>; createdAt: string; }
interface NotificationItem { id: string; title: string; body: string; type: string; read: boolean; dismissed: boolean; createdAt: string; }
interface ConciergeTask { id: string; title: string; description?: string | null; status: string; priority: string; source: string; points: number; timeMinutes: number; createdAt: string; }
interface KnowledgeEntry { id: string; title: string; content: string; tags: string[]; source: string; createdAt: string; }

function Badge({ color, children, icon, onClick, style }: { color: string; children: React.ReactNode; icon?: string; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <span onClick={onClick} style={{ background: color + "18", color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, ...style }}>
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

const PATH_TO_TAB: Record<string, string> = {
  "/dashboard": "dashboard",
  "/connectors": "connectors",
  "/workflows": "workflows",
  "/second-brain": "second-brain",
  "/concierge": "concierge",
  "/notifications": "notifications",
};

export default function CoachOS() {
  const router = useRouter();
  const pathname = usePathname();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const page = PATH_TO_TAB[pathname] ?? "dashboard";
  const setPage = (tab: string) => {
    const path = tab === "dashboard" ? "/dashboard" : `/${tab}`;
    router.push(path);
  };

  const [connectedApps, setConnectedApps] = useState<string[]>([]);
  const [activeWorkflows, setActiveWorkflows] = useState<string[]>([]);
  const [viewingWorkflow, setViewingWorkflow] = useState<string | null>(null);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  type CustomStep = { label: string; type: "trigger" | "action" | "wait" | "condition" | "notify" };
  type CustomWorkflow = { id: string; customName: string; customDescription: string | null; active: boolean; customSteps: CustomStep[] };
  const [customWorkflows, setCustomWorkflows] = useState<CustomWorkflow[]>([]);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowDesc, setNewWorkflowDesc] = useState("");
  const [newWorkflowSteps, setNewWorkflowSteps] = useState<CustomStep[]>([]);
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);
  const [hoursPerWeek, setHoursPerWeek] = useState(5);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Concierge state
  const [tasks, setTasks] = useState<ConciergeTask[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  // Second brain state
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [newEntryTitle, setNewEntryTitle] = useState("");
  const [newEntryContent, setNewEntryContent] = useState("");
  const [newEntryTags, setNewEntryTags] = useState("");
  const [addingEntry, setAddingEntry] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingEntry, setGeneratingEntry] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(({ data }) => {
        setDashboardData(data);
        setConnectedApps(data.integrations.filter((i: { connected: boolean }) => i.connected).map((i: { service: string }) => i.service));
        setActiveWorkflows(data.workflows.filter((w: { active: boolean; templateId: string }) => w.active && !w.templateId.startsWith("custom-")).map((w: { templateId: string }) => w.templateId));
        setCustomWorkflows(data.workflows.filter((w: { templateId: string }) => w.templateId.startsWith("custom-")).map((w: { id: string; customName: string; customDescription: string | null; active: boolean; customSteps?: unknown[] }) => ({ id: w.id, customName: w.customName, customDescription: w.customDescription, active: w.active, customSteps: (w.customSteps ?? []) as { label: string; type: "trigger" | "action" | "wait" | "condition" | "notify" }[] })));
        setNotifications(data.notifications);
        setHoursPerWeek(data.coach?.hoursPerWeek ?? 5);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Lazy-load concierge tasks
  useEffect(() => {
    if (page === "concierge" && !tasksLoaded) {
      fetch("/api/concierge")
        .then(r => r.json())
        .then(({ data }) => {
          setTasks(data?.tasks ?? []);
          setTasksLoaded(true);
        })
        .catch(() => setTasksLoaded(true));
    }
  }, [page, tasksLoaded]);

  // Lazy-load knowledge entries
  useEffect(() => {
    if (page === "second-brain" && !entriesLoaded) {
      fetch("/api/knowledge")
        .then(r => r.json())
        .then(({ data }) => {
          setEntries(data?.entries ?? []);
          setEntriesLoaded(true);
        })
        .catch(() => setEntriesLoaded(true));
    }
  }, [page, entriesLoaded]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleConnector = async (id: string) => {
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
      setConnectedApps(p => isConnected ? [...p, id] : p.filter(x => x !== id));
    }
  };

  const toggleWorkflow = async (id: string) => {
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
  };

  const markNotificationRead = async (id: string) => {
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
    } catch {
      // optimistic update stays
    }
  };

  const dismissNotification = async (id: string) => {
    setNotifications(p => p.filter(n => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissed: true }),
      });
    } catch {
      // optimistic update stays
    }
  };

  const toggleTask = async (task: ConciergeTask) => {
    const newStatus = task.status === "done" ? "pending" : "done";
    setTasks(p => p.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    try {
      await fetch(`/api/concierge/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      setTasks(p => p.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const generateTasks = async () => {
    setGeneratingTasks(true);
    try {
      const res = await fetch("/api/concierge/generate", { method: "POST" });
      const { data } = await res.json();
      if (data?.tasks) setTasks(p => [...p, ...data.tasks]);
    } finally {
      setGeneratingTasks(false);
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle }),
      });
      const { data } = await res.json();
      if (data?.task) setTasks(p => [...p, data.task]);
      setNewTaskTitle("");
    } finally {
      setAddingTask(false);
    }
  };

  const deleteEntry = async (id: string) => {
    setEntries(p => p.filter(e => e.id !== id));
    try {
      await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    } catch {
      // optimistic update stays
    }
  };

  const addEntry = async () => {
    if (!newEntryTitle.trim() || !newEntryContent.trim()) return;
    setAddingEntry(true);
    try {
      const tags = newEntryTags.split(",").map(t => t.trim()).filter(Boolean);
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newEntryTitle, content: newEntryContent, tags }),
      });
      const { data } = await res.json();
      if (data?.entry) setEntries(p => [data.entry, ...p]);
      setNewEntryTitle("");
      setNewEntryContent("");
      setNewEntryTags("");
    } finally {
      setAddingEntry(false);
    }
  };

  const generateEntry = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingEntry(true);
    try {
      const res = await fetch("/api/knowledge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const { data } = await res.json();
      if (data?.entry) setEntries(p => [data.entry, ...p]);
      setAiPrompt("");
    } finally {
      setGeneratingEntry(false);
    }
  };

  const totalPoints = tasks.filter(t => t.status === "done").reduce((s, t) => s + t.points, 0);

  const creditsRemaining = dashboardData?.stats.creditsRemaining ?? 0;
  const creditsTotal = 500;
  const creditsUsed = creditsTotal - creditsRemaining;

  const q = searchQuery.toLowerCase().trim();
  const filteredEntries = q
    ? entries.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        (Array.isArray(e.tags) && e.tags.some(t => t.toLowerCase().includes(q)))
      )
    : entries;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "connectors", label: "Connectors", icon: "🔌" },
    { id: "workflows", label: "Workflows", icon: "⚙️" },
    { id: "second-brain", label: "Second brain", icon: "🧠" },
    { id: "concierge", label: "Concierge", icon: "🎯" },
    { id: "notifications", label: "Notifications", icon: "🔔", badge: unreadCount },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.lightBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: `4px solid ${C.purple}20`, borderTop: `4px solid ${C.purple}`, borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ fontSize: 14, color: C.grey }}>Loading your dashboard…</div>
        </div>
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setPage("dashboard")}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: C.purple, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 20 }}>⚡</span>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.purple }}>CoachOS</h1>
              <div style={{ fontSize: 11, color: C.grey, fontWeight: 600 }}>by Coachvox</div>
            </div>
          </div>
        </div>
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); setViewingWorkflow(null); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px", borderRadius: 12, border: "none", background: page === item.id ? C.purple + "10" : "transparent", color: page === item.id ? C.purple : C.darkGrey, fontWeight: page === item.id ? 700 : 500, fontSize: 14, cursor: "pointer", fontFamily: "'Quicksand', sans-serif", marginBottom: 4, textAlign: "left", position: "relative" }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
              {!!((item as { badge?: number }).badge) && (
                <span style={{ marginLeft: "auto", background: C.pink, color: C.white, fontSize: 11, fontWeight: 700, minWidth: 20, height: 20, borderRadius: 10, padding: "0 6px", display: "flex", alignItems: "center", justifyContent: "center" }}>{(item as { badge?: number }).badge}</span>
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
          <button
            onClick={async () => {
              await fetch("/api/auth/sign-out", { method: "POST" });
              window.location.href = "/sign-in";
            }}
            style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1.5px solid #E0E0E0", background: "none", fontSize: 13, fontWeight: 700, color: C.grey, cursor: "pointer", fontFamily: "'Quicksand', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <span style={{ transform: "rotate(180deg)", display: "inline-block" }}>→</span> Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto", maxHeight: "100vh" }}>
        {/* DASHBOARD */}
        {page === "dashboard" && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.darkGrey }}>Good morning, {dashboardData?.coach.name ?? "coach"} 👋</h2>
              <p style={{ margin: "6px 0 0", color: C.grey, fontSize: 15 }}>Here&apos;s what CoachOS has been doing for you.</p>
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
              <StatCard icon="⚡" value={dashboardData?.stats.activeWorkflows ?? activeWorkflows.length} label="Active workflows" color={C.purple} sub={`of ${workflowTemplates.length} available`} />
              <StatCard icon="✅" value="52" label="Tasks completed" color="#4CAF50" sub="↑ 18% from last week" />
              <StatCard icon="🔌" value={dashboardData?.stats.connectedIntegrations ?? connectedApps.length} label="Connected apps" color={C.teal} sub={`of ${connectorsList.length} available`} />
              <StatCard icon="⏱️" value="19.5h" label="Time saved" color={C.orange} sub="This week" />
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ flex: 2, minWidth: 400 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 18, color: C.darkGrey }}>Recent activity</h3>
                <div style={{ background: C.white, borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #F0EDF5", overflow: "hidden" }}>
                  {(!dashboardData?.recentActivity || dashboardData.recentActivity.length === 0) && (
                    <div style={{ padding: "24px", textAlign: "center", color: C.grey, fontSize: 13 }}>No recent activity yet</div>
                  )}
                  {(dashboardData?.recentActivity ?? []).map((item, i) => {
                    const templateId = item.metadata?.templateId as string | undefined;
                    const wf = templateId ? workflowTemplates.find(w => w.id === templateId) : null;
                    const dotColor = (item.action === "workflow.run" || item.action === "workflow.activated") ? C.teal
                      : item.action === "landing_page.published" ? "#4CAF50"
                      : C.grey;
                    const list = dashboardData?.recentActivity ?? [];
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: i < list.length - 1 ? "1px solid #F8F7FC" : "none" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: 13, color: C.darkGrey, fontWeight: 500 }}>{item.label}</div>
                        {wf && <Badge color={wf.color} icon={wf.icon}>{wf.name}</Badge>}
                        <div style={{ fontSize: 12, color: C.grey, flexShrink: 0 }}>{timeAgo(new Date(item.createdAt))}</div>
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
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 12, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.darkGrey }}>Workflow templates</h2>
                <p style={{ margin: "6px 0 0", color: C.grey, fontSize: 15 }}>Pre-built automations for the things coaches do most.</p>
              </div>
              <button
                onClick={() => setShowCreateWorkflow(true)}
                style={{ background: C.purple, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Quicksand', sans-serif", flexShrink: 0 }}
              >
                + Create workflow
              </button>
            </div>

            {/* Create workflow modal */}
            {showCreateWorkflow && (() => {
              const STEP_TYPES: CustomStep["type"][] = ["trigger", "action", "wait", "condition", "notify"];
              const STEP_COLORS: Record<string, string> = { trigger: "#6626e9", action: "#41D5E2", wait: "#FFAD0D", condition: "#E55CFF", notify: "#4CAF50" };
              return (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }} onClick={() => setShowCreateWorkflow(false)}>
                  <div style={{ background: C.white, borderRadius: 20, padding: 32, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
                    <h3 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800, color: C.darkGrey }}>Create workflow</h3>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.darkGrey, marginBottom: 6 }}>Name *</label>
                      <input
                        value={newWorkflowName}
                        onChange={e => setNewWorkflowName(e.target.value)}
                        placeholder="e.g. Weekly client check-in"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E0E0E0", fontSize: 14, fontFamily: "'Quicksand', sans-serif", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.darkGrey, marginBottom: 6 }}>Description</label>
                      <textarea
                        value={newWorkflowDesc}
                        onChange={e => setNewWorkflowDesc(e.target.value)}
                        placeholder="What does this workflow do?"
                        rows={2}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E0E0E0", fontSize: 14, fontFamily: "'Quicksand', sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                      />
                    </div>

                    {/* Steps builder */}
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: C.darkGrey }}>Steps</label>
                        <button
                          onClick={() => setNewWorkflowSteps(p => [...p, { label: "", type: "action" }])}
                          style={{ background: C.purple + "15", color: C.purple, border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Quicksand', sans-serif" }}
                        >+ Add step</button>
                      </div>
                      {newWorkflowSteps.length === 0 && (
                        <div style={{ fontSize: 13, color: C.grey, padding: "12px 0", textAlign: "center", borderRadius: 10, border: "1.5px dashed #E0E0E0" }}>No steps yet — click "+ Add step"</div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {newWorkflowSteps.map((step, i) => (
                          <div key={i}>
                            {i > 0 && <div style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}><div style={{ width: 2, height: 12, background: "#E0E0E0" }} /></div>}
                            <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#F8F7FC", borderRadius: 10, padding: "8px 10px" }}>
                              <select
                                value={step.type}
                                onChange={e => setNewWorkflowSteps(p => p.map((s, j) => j === i ? { ...s, type: e.target.value as CustomStep["type"] } : s))}
                                style={{ fontSize: 11, fontWeight: 700, color: STEP_COLORS[step.type], background: STEP_COLORS[step.type] + "15", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontFamily: "'Quicksand', sans-serif", flexShrink: 0 }}
                              >
                                {STEP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <input
                                value={step.label}
                                onChange={e => setNewWorkflowSteps(p => p.map((s, j) => j === i ? { ...s, label: e.target.value } : s))}
                                placeholder="Describe this step…"
                                style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1.5px solid #E0E0E0", fontSize: 13, fontFamily: "'Quicksand', sans-serif", outline: "none", minWidth: 0 }}
                              />
                              <button onClick={() => setNewWorkflowSteps(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.grey, fontSize: 16, cursor: "pointer", padding: "0 4px", flexShrink: 0 }}>×</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                      <button onClick={() => { setShowCreateWorkflow(false); setNewWorkflowSteps([]); }} style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #E0E0E0", background: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Quicksand', sans-serif", color: C.darkGrey }}>Cancel</button>
                      <button
                        disabled={!newWorkflowName.trim() || creatingWorkflow}
                        onClick={async () => {
                          if (!newWorkflowName.trim()) return;
                          setCreatingWorkflow(true);
                          try {
                            const res = await fetch("/api/workflow", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ name: newWorkflowName, description: newWorkflowDesc, steps: newWorkflowSteps.filter(s => s.label.trim()) }),
                            });
                            const { data } = await res.json();
                            if (data?.workflow) {
                              setCustomWorkflows(p => [...p, { ...data.workflow, customSteps: data.workflow.customSteps ?? [] }]);
                              setShowCreateWorkflow(false);
                              setNewWorkflowName("");
                              setNewWorkflowDesc("");
                              setNewWorkflowSteps([]);
                            }
                          } finally {
                            setCreatingWorkflow(false);
                          }
                        }}
                        style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: newWorkflowName.trim() ? C.purple : "#ccc", color: "#fff", fontSize: 14, fontWeight: 700, cursor: newWorkflowName.trim() ? "pointer" : "not-allowed", fontFamily: "'Quicksand', sans-serif" }}
                      >
                        {creatingWorkflow ? "Creating…" : "Create"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Custom workflows */}
            {customWorkflows.length > 0 && (
              <div style={{ marginBottom: 36 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: C.darkGrey }}>Your workflows</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {customWorkflows.map(w => {
                    const STEP_COLORS: Record<string, string> = { trigger: "#6626e9", action: "#41D5E2", wait: "#FFAD0D", condition: "#E55CFF", notify: "#4CAF50" };
                    return (
                      <div key={w.id} style={{ background: C.white, borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: w.active ? `2px solid ${C.purple}` : "1px solid #F0EDF5", overflow: "hidden" }}>
                        <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.purple + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>⚙️</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: C.darkGrey }}>{w.customName}</div>
                            {w.customDescription && <div style={{ fontSize: 13, color: C.grey, marginTop: 2 }}>{w.customDescription}</div>}
                            {w.customSteps.length > 0 && <div style={{ fontSize: 12, color: C.grey, marginTop: 4 }}>{w.customSteps.length} step{w.customSteps.length !== 1 ? "s" : ""}</div>}
                          </div>
                          <div
                            onClick={async () => {
                              const newActive = !w.active;
                              setCustomWorkflows(p => p.map(x => x.id === w.id ? { ...x, active: newActive } : x));
                              await fetch(`/api/workflow/${w.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: newActive }) });
                            }}
                            style={{ width: 44, height: 24, borderRadius: 12, background: w.active ? C.purple : "#E0E0E0", cursor: "pointer", position: "relative", flexShrink: 0 }}
                          >
                            <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.white, position: "absolute", top: 2, left: w.active ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                          </div>
                          <button
                            onClick={async () => {
                              setCustomWorkflows(p => p.filter(x => x.id !== w.id));
                              await fetch(`/api/workflow/${w.id}`, { method: "DELETE" });
                            }}
                            style={{ background: "none", border: "none", color: C.grey, fontSize: 18, cursor: "pointer", padding: "0 4px", flexShrink: 0 }}
                          >×</button>
                        </div>
                        {w.customSteps.length > 0 && (
                          <div style={{ borderTop: "1px solid #F0EDF5", padding: "16px 20px", background: "#FAFAFA", display: "flex", flexDirection: "column", gap: 0 }}>
                            {w.customSteps.map((step, i) => (
                              <div key={i}>
                                {i > 0 && <div style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}><div style={{ width: 2, height: 14, background: "#E0E0E0", borderRadius: 1 }} /></div>}
                                <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.white, borderRadius: 10, padding: "8px 12px", border: "1px solid #F0EDF5" }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: STEP_COLORS[step.type] ?? C.purple, background: (STEP_COLORS[step.type] ?? C.purple) + "15", borderRadius: 6, padding: "3px 8px", flexShrink: 0 }}>{step.type}</span>
                                  <span style={{ fontSize: 13, color: C.darkGrey }}>{step.label}</span>
                                  <span style={{ marginLeft: "auto", fontSize: 13, color: C.grey, fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Template workflows */}
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: C.darkGrey }}>Templates</h3>
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
              <p style={{ margin: "6px 0 0", color: C.grey, fontSize: 15 }}>Everything CoachOS learns about your coaching, your clients, and your business.</p>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Search entries…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E0E0E0", fontSize: 14, fontFamily: "'Quicksand', sans-serif", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Entry list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
              {!entriesLoaded && (
                <div style={{ textAlign: "center", padding: "32px", color: C.grey, fontSize: 13 }}>Loading…</div>
              )}
              {entriesLoaded && filteredEntries.length === 0 && (
                <div style={{ background: C.white, borderRadius: 16, padding: "28px", textAlign: "center", color: C.grey, fontSize: 13, border: "1px solid #F0EDF5" }}>No entries yet. Add one below.</div>
              )}
              {filteredEntries.map(entry => (
                <div key={entry.id} style={{ background: C.white, borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #F0EDF5" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.darkGrey, marginBottom: 4 }}>{entry.title}</div>
                      <div style={{ fontSize: 13, color: C.grey, lineHeight: 1.5 }}>
                        {expandedEntry === entry.id
                          ? entry.content
                          : entry.content.length > 120 ? entry.content.slice(0, 120) + "…" : entry.content}
                      </div>
                    </div>
                    <button onClick={() => deleteEntry(entry.id)} style={{ background: "none", border: "none", color: C.grey, fontSize: 16, cursor: "pointer", padding: "0 4px", flexShrink: 0 }}>×</button>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
                    {entry.tags.map((tag, ti) => <Badge key={ti} color={C.purple} onClick={() => setSearchQuery(searchQuery === tag ? "" : tag)} style={{ cursor: "pointer" }}>{tag}</Badge>)}
                    <Badge color={entry.source === "ai" ? "#9333EA" : C.grey}>{entry.source === "ai" ? "AI generated" : "Manual"}</Badge>
                    <span style={{ fontSize: 12, color: C.grey, marginLeft: "auto" }}>{timeAgo(new Date(entry.createdAt))}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add entry */}
            <div style={{ background: C.white, borderRadius: 16, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #F0EDF5", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: C.darkGrey }}>Add entry</h3>
              <input
                type="text"
                placeholder="Title"
                value={newEntryTitle}
                onChange={e => setNewEntryTitle(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E0E0E0", fontSize: 14, fontFamily: "'Quicksand', sans-serif", outline: "none", marginBottom: 10, boxSizing: "border-box" }}
              />
              <textarea
                placeholder="Content"
                value={newEntryContent}
                onChange={e => setNewEntryContent(e.target.value)}
                rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E0E0E0", fontSize: 14, fontFamily: "'Quicksand', sans-serif", outline: "none", resize: "vertical", marginBottom: 10, boxSizing: "border-box" }}
              />
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={newEntryTags}
                onChange={e => setNewEntryTags(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E0E0E0", fontSize: 14, fontFamily: "'Quicksand', sans-serif", outline: "none", marginBottom: 12, boxSizing: "border-box" }}
              />
              <button
                onClick={addEntry}
                disabled={addingEntry || !newEntryTitle.trim() || !newEntryContent.trim()}
                style={{ padding: "10px 24px", borderRadius: 24, border: "none", background: C.purple, color: C.white, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Quicksand', sans-serif", opacity: addingEntry || !newEntryTitle.trim() || !newEntryContent.trim() ? 0.5 : 1 }}
              >
                {addingEntry ? "Saving…" : "Add entry"}
              </button>
            </div>

            {/* Generate with AI */}
            <div style={{ background: C.white, borderRadius: 16, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: `1px solid ${C.purple}30` }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: C.darkGrey }}>Generate with AI</h3>
              <div style={{ fontSize: 12, color: C.grey, marginBottom: 14 }}>Uses 3 credits</div>
              <textarea
                placeholder="Describe what you want to add to your second brain…"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E0E0E0", fontSize: 14, fontFamily: "'Quicksand', sans-serif", outline: "none", resize: "vertical", marginBottom: 12, boxSizing: "border-box" }}
              />
              <button
                onClick={generateEntry}
                disabled={generatingEntry || !aiPrompt.trim()}
                style={{ padding: "10px 24px", borderRadius: 24, border: "none", background: "#9333EA", color: C.white, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Quicksand', sans-serif", opacity: generatingEntry || !aiPrompt.trim() ? 0.5 : 1 }}
              >
                {generatingEntry ? "Generating…" : "Generate with AI ✨"}
              </button>
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
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={hoursPerWeek}
                    onChange={e => setHoursPerWeek(Number(e.target.value))}
                    onMouseUp={e => {
                      const val = Number((e.target as HTMLInputElement).value);
                      fetch("/api/coach", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ hoursPerWeek: val }),
                      }).catch(() => {});
                    }}
                    style={{ flex: 1, accentColor: C.purple }}
                  />
                </div>
              </div>
              <div style={{ background: C.white, borderRadius: 16, padding: "20px 24px", flex: 1, minWidth: 180, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #F0EDF5" }}>
                <div style={{ fontSize: 12, color: C.grey, fontWeight: 600, marginBottom: 4 }}>Points this week</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.orange, fontFamily: "'Red Hat Display', sans-serif" }}>{totalPoints}</div>
              </div>
            </div>

            {!tasksLoaded && (
              <div style={{ textAlign: "center", padding: "32px", color: C.grey, fontSize: 13 }}>Loading tasks…</div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {tasksLoaded && tasks.length === 0 && (
                <div style={{ background: C.white, borderRadius: 16, padding: "24px", textAlign: "center", color: C.grey, fontSize: 13, border: "1px solid #F0EDF5" }}>No tasks yet. Generate some below.</div>
              )}
              {tasks.map(task => {
                const done = task.status === "done";
                const priorityColor = task.priority === "high" ? "#E65100" : task.priority === "medium" ? C.purple : C.grey;
                return (
                  <div key={task.id} style={{ background: C.white, borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: done ? `2px solid ${C.purple}` : "1px solid #F0EDF5", display: "flex", alignItems: "center", gap: 16, opacity: done ? 0.7 : 1 }}>
                    <div onClick={() => toggleTask(task)} style={{ width: 28, height: 28, borderRadius: 8, background: done ? C.purple : "#F0EDF5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                      {done && <span style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: done ? 400 : 600, color: C.darkGrey, textDecoration: done ? "line-through" : "none" }}>{task.title}</div>
                      <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12, color: C.grey }}>
                        <span>⏱️ {task.timeMinutes} min</span>
                        <span style={{ color: C.orange, fontWeight: 600 }}>+{task.points} pts</span>
                      </div>
                    </div>
                    <Badge color={priorityColor}>{task.priority}</Badge>
                  </div>
                );
              })}
            </div>

            {/* Generate tasks with AI */}
            <div style={{ marginTop: 20, background: C.white, borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: `1px solid ${C.purple}30` }}>
              <button
                onClick={generateTasks}
                disabled={generatingTasks}
                style={{ padding: "12px 24px", borderRadius: 24, border: "none", background: C.purple, color: C.white, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Quicksand', sans-serif", opacity: generatingTasks ? 0.6 : 1, display: "block", width: "100%", marginBottom: 8 }}
              >
                {generatingTasks ? "Generating…" : "Generate tasks with AI ✨"}
              </button>
              <div style={{ fontSize: 12, color: C.grey, textAlign: "center" }}>Uses 2 credits</div>
            </div>

            {/* Add task */}
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <input
                type="text"
                placeholder="Add a task…"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTask()}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid #E0E0E0", fontSize: 14, fontFamily: "'Quicksand', sans-serif", outline: "none" }}
              />
              <button
                onClick={addTask}
                disabled={addingTask || !newTaskTitle.trim()}
                style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: C.purple, color: C.white, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Quicksand', sans-serif", opacity: addingTask || !newTaskTitle.trim() ? 0.5 : 1 }}
              >
                {addingTask ? "…" : "Add"}
              </button>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {page === "notifications" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.darkGrey }}>Notifications</h2>
              <button
                onClick={async () => {
                  const res = await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
                  const { data } = await res.json();
                  if (data?.notification) setNotifications(p => [data.notification, ...p]);
                }}
                style={{ background: "#e53e3e", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Quicksand', sans-serif" }}
              >
                + Demo notification
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {notifications.length === 0 && (
                <div style={{ background: C.white, borderRadius: 16, padding: "28px", textAlign: "center", color: C.grey, fontSize: 13, border: "1px solid #F0EDF5" }}>No notifications</div>
              )}
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markNotificationRead(n.id)}
                  style={{ background: n.read ? C.white : C.lightPurple, borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: n.read ? "1px solid #F0EDF5" : `1px solid ${C.purple}30`, display: "flex", gap: 16, cursor: n.read ? "default" : "pointer", transition: "background 0.15s" }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.read ? "transparent" : C.purple, marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.darkGrey, marginBottom: 4 }}>{n.title}</div>
                    <div style={{ fontSize: 13, color: C.grey, lineHeight: 1.5 }}>{n.body}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                      <div style={{ fontSize: 12, color: C.grey }}>{timeAgo(new Date(n.createdAt))}</div>
                      {!n.read && (
                        <span style={{ fontSize: 12, color: C.purple, fontWeight: 600 }}>Click to mark as read</span>
                      )}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); dismissNotification(n.id); }} style={{ background: "none", border: "none", color: C.grey, fontSize: 18, cursor: "pointer", padding: "0 4px", alignSelf: "flex-start", flexShrink: 0 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
