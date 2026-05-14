export interface WorkflowStep {
  label: string;
  type: "trigger" | "action" | "wait" | "condition" | "notify";
  connector: string | null;
  security: string | null;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
  connectors: string[];
  timeSaved: string;
  creditCost: number;
  steps: WorkflowStep[];
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "client-onboarding",
    name: "Client onboarding",
    icon: "🚀",
    color: "#6626e9",
    desc: "Trigger on new payment, sends welcome email draft, intake form, schedules kickoff",
    connectors: ["stripe", "gmail", "google-calendar", "hubspot"],
    timeSaved: "2.5 hrs",
    creditCost: 5,
    steps: [
      { label: "New client payment received", type: "trigger", connector: "stripe", security: null },
      { label: "Send welcome email draft", type: "action", connector: "gmail", security: "Draft only" },
      { label: "Send intake form", type: "action", connector: "gmail", security: "Draft only" },
      { label: "Wait for form completion", type: "wait", connector: null, security: null },
      { label: "Schedule kickoff call", type: "action", connector: "google-calendar", security: "Auto" },
      { label: "Add to CRM", type: "action", connector: "hubspot", security: "Auto" },
      { label: "Notify you when complete", type: "notify", connector: null, security: null },
    ],
  },
  {
    id: "post-session-intelligence",
    name: "Post-session intelligence",
    icon: "🧠",
    color: "#41D5E2",
    desc: "Connect Fathom/Zoom, auto-generates session notes, drafts follow-up email, tracks themes",
    connectors: ["fathom", "zoom", "gmail"],
    timeSaved: "1 hr",
    creditCost: 8,
    steps: [
      { label: "Session recording available", type: "trigger", connector: "zoom", security: "Read only" },
      { label: "Get transcript from Fathom", type: "action", connector: "fathom", security: "Read only" },
      { label: "AI generates session notes", type: "action", connector: null, security: null },
      { label: "Extract key themes & action items", type: "action", connector: null, security: null },
      { label: "Draft follow-up email", type: "action", connector: "gmail", security: "Draft only" },
      { label: "Save to client record", type: "action", connector: "hubspot", security: "Auto" },
      { label: "Notify you with summary", type: "notify", connector: null, security: null },
    ],
  },
  {
    id: "pre-session-brief",
    name: "Pre-session brief",
    icon: "📋",
    color: "#FFAD0D",
    desc: "Before each session, generates brief with last session summary, action items, focus areas",
    connectors: ["google-calendar", "hubspot", "fathom"],
    timeSaved: "45 min",
    creditCost: 3,
    steps: [
      { label: "Session scheduled in calendar", type: "trigger", connector: "google-calendar", security: "Auto" },
      { label: "Retrieve last session details", type: "action", connector: "hubspot", security: "Auto" },
      { label: "Get previous action items", type: "action", connector: "fathom", security: "Read only" },
      { label: "AI generates brief", type: "action", connector: null, security: null },
      { label: "Suggest focus areas", type: "action", connector: null, security: null },
      { label: "Send brief to your email", type: "action", connector: "gmail", security: "Draft only" },
    ],
  },
  {
    id: "weekly-outreach",
    name: "Weekly outreach",
    icon: "💌",
    color: "#E55CFF",
    desc: "Find 10 relevant contacts, draft personalised outreach messages (email drafts only)",
    connectors: ["hubspot", "gmail"],
    timeSaved: "3 hrs",
    creditCost: 6,
    steps: [
      { label: "Weekly schedule trigger", type: "trigger", connector: null, security: null },
      { label: "Find 10 relevant contacts", type: "action", connector: "hubspot", security: "Auto" },
      { label: "AI drafts personalised messages", type: "action", connector: null, security: null },
      { label: "Save drafts for your review", type: "action", connector: "gmail", security: "Draft only" },
      { label: "Notify you of drafts", type: "notify", connector: null, security: null },
    ],
  },
  {
    id: "newsletter-draft",
    name: "Newsletter draft",
    icon: "📰",
    color: "#9333EA",
    desc: "Pull trending topics from conversations, draft newsletter in coach's voice (draft only)",
    connectors: ["gmail", "mailchimp"],
    timeSaved: "2 hrs",
    creditCost: 4,
    steps: [
      { label: "Weekly timer trigger", type: "trigger", connector: null, security: null },
      { label: "Analyze conversation themes", type: "action", connector: null, security: null },
      { label: "AI drafts newsletter content", type: "action", connector: null, security: null },
      { label: "Save draft for your review", type: "action", connector: "gmail", security: "Draft only" },
    ],
  },
  {
    id: "ai-conversation-followup",
    name: "AI conversation follow-up",
    icon: "💬",
    color: "#6626e9",
    desc: "When someone chats with your AI, add them to your CRM and draft a 3-email follow-up sequence",
    connectors: ["hubspot", "gmail"],
    timeSaved: "4 hrs",
    creditCost: 4,
    steps: [
      { label: "New conversation on your AI", type: "trigger", connector: null, security: null },
      { label: "Add contact to CRM", type: "action", connector: "hubspot", security: "Auto" },
      { label: "Draft follow-up sequence", type: "action", connector: "gmail", security: "Draft only" },
      { label: "Notify you of new contact", type: "notify", connector: null, security: null },
    ],
  },
  {
    id: "social-media-scheduling",
    name: "Social media scheduling",
    icon: "📱",
    color: "#1DA1F2",
    desc: "Create and schedule posts to LinkedIn/Instagram",
    connectors: ["linkedin", "instagram"],
    timeSaved: "5 hrs",
    creditCost: 7,
    steps: [
      { label: "Weekly content calendar trigger", type: "trigger", connector: null, security: null },
      { label: "AI generates post ideas", type: "action", connector: null, security: null },
      { label: "Create LinkedIn post", type: "action", connector: "linkedin", security: "Auto-publish" },
      { label: "Create Instagram post", type: "action", connector: "instagram", security: "Auto-publish" },
      { label: "Track engagement metrics", type: "notify", connector: null, security: null },
    ],
  },
  {
    id: "invoice-automation",
    name: "Invoice & payment automation",
    icon: "💷",
    color: "#13B5EA",
    desc: "Auto-generates invoices via Stripe/Xero, sends payment reminders",
    connectors: ["stripe", "xero", "gmail"],
    timeSaved: "3.5 hrs",
    creditCost: 4,
    steps: [
      { label: "Session/package completed", type: "trigger", connector: "google-calendar", security: "Auto" },
      { label: "Auto-generate invoice in Xero", type: "action", connector: "xero", security: "Auto-send" },
      { label: "Send invoice to client", type: "action", connector: "gmail", security: "Auto-send" },
      { label: "If unpaid after 7 days: remind", type: "condition", connector: "gmail", security: "Auto-send" },
      { label: "Mark as paid in accounting", type: "action", connector: "xero", security: "Auto-send" },
    ],
  },
];

export function getTemplate(id: string): WorkflowTemplate | undefined {
  return workflowTemplates.find(t => t.id === id);
}
