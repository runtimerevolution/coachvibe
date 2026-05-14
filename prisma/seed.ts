import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing demo data
  await prisma.coach.deleteMany({ where: { email: "demo@demo.com" } });

  const passwordHash = await bcrypt.hash("demo", 12);

  const coach = await prisma.coach.create({
    data: {
      name: "Demo Coach",
      email: "demo@demo.com",
      password: passwordHash,
      onboarded: true,
      bio: "I help ambitious coaches build thriving businesses without burning out. I've worked with 200+ coaches over the past 8 years.",
      imageUrl: "https://api.dicebear.com/7.x/personas/svg?seed=demo",
      personality: "warm, direct, and confident",
      goals: ["grow_revenue", "automate_workflows", "build_brand"],
      hoursPerWeek: 8,
      credits: 500,
    },
  });

  console.log(`Created coach: ${coach.email}`);

  // Product
  const product = await prisma.product.create({
    data: {
      coachId: coach.id,
      name: "90-Day Business Accelerator",
      description: "A focused 90-day program helping coaches build systems, win clients, and reclaim their time.",
      price: 997,
      type: "full_course",
      modules: ["Foundations", "Client Acquisition", "Delivery Systems", "Scale"],
      embedScript: "",
    },
  });
  console.log(`Created product: ${product.name}`);

  // Integrations
  await prisma.integration.createMany({
    data: [
      { coachId: coach.id, service: "gmail", connected: true },
      { coachId: coach.id, service: "stripe", connected: true },
      { coachId: coach.id, service: "google-calendar", connected: true },
      { coachId: coach.id, service: "hubspot", connected: false },
      { coachId: coach.id, service: "zoom", connected: false },
    ],
  });
  console.log("Created integrations");

  // Workflow instances with runs
  const wf1 = await prisma.workflowInstance.create({
    data: { coachId: coach.id, templateId: "client-onboarding", active: true },
  });
  await prisma.workflowRun.create({
    data: {
      workflowId: wf1.id,
      status: "completed",
      creditCost: 5,
      output: { simulatedAt: new Date(Date.now() - 3600000).toISOString(), result: { emailDraftCreated: true, crmRecordCreated: true } },
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(Date.now() - 3600000 + 2000),
    },
  });

  const wf2 = await prisma.workflowInstance.create({
    data: { coachId: coach.id, templateId: "post-session-intelligence", active: true },
  });
  await prisma.workflowRun.create({
    data: {
      workflowId: wf2.id,
      status: "completed",
      creditCost: 8,
      output: { simulatedAt: new Date(Date.now() - 7200000).toISOString(), result: { notesGenerated: "3 key themes identified", followUpDraftReady: true } },
      startedAt: new Date(Date.now() - 7200000),
      completedAt: new Date(Date.now() - 7200000 + 3000),
    },
  });
  console.log("Created workflow instances and runs");

  // Concierge tasks
  await prisma.conciergeTask.createMany({
    data: [
      { coachId: coach.id, title: "Update your welcome email for new clients", description: "Review and refresh the onboarding email template with your updated offer details.", status: "pending", priority: "high", source: "ai", points: 20, timeMinutes: 30 },
      { coachId: coach.id, title: "Review Q2 business goals", description: "Check progress on your quarterly goals and adjust priorities if needed.", status: "in_progress", priority: "medium", source: "ai", points: 15, timeMinutes: 20 },
      { coachId: coach.id, title: "Post on LinkedIn about your pricing framework", description: "Share a value-driven post explaining how you think about pricing your services.", status: "pending", priority: "low", source: "manual", points: 10, timeMinutes: 15 },
    ],
  });
  console.log("Created concierge tasks");

  // Knowledge entries
  await prisma.knowledgeEntry.createMany({
    data: [
      {
        coachId: coach.id,
        title: "Client Onboarding Framework",
        content: "The most effective onboarding starts before the first session. Send a welcome pack within 24 hours of payment that includes: a short video from you, the intake form, and the calendar link for the kickoff call.\n\nDuring the kickoff call, spend the first 20 minutes purely on listening. Ask: \"What does success look like in 90 days?\" and \"What has stopped you from getting there before?\"\n\nAfter the kickoff, send a session summary with three key commitments the client made. This creates accountability from day one.\n\nThe goal of onboarding is not to impress — it is to build trust quickly so the client feels safe enough to do the real work.",
        tags: ["onboarding", "clients", "process", "systems"],
        source: "manual",
      },
      {
        coachId: coach.id,
        title: "Dealing with Imposter Syndrome in Coaches",
        content: "Imposter syndrome is almost universal among high-performing coaches. The paradox: the more you grow, the more you encounter situations where you feel out of your depth. This is a sign of growth, not failure.\n\nThe most useful reframe: you are not being paid for certainty. You are being paid for your process, your questions, and your presence. Clients hire coaches for accountability and perspective — neither of which requires you to have all the answers.\n\nPractical tools: keep a \"wins journal\" where you log client breakthroughs weekly. When imposter syndrome hits, read five recent entries before your next session.\n\nRemember: your clients chose you because of how you made them feel in the discovery call, not because of your credentials.",
        tags: ["mindset", "imposter-syndrome", "coaches", "wellbeing"],
        source: "ai",
      },
    ],
  });
  console.log("Created knowledge entries");

  // Activity log
  await prisma.activityLog.createMany({
    data: [
      { coachId: coach.id, action: "onboarding.completed", label: "Onboarding completed", createdAt: new Date(Date.now() - 86400000 * 2) },
      { coachId: coach.id, action: "workflow.activated", label: "Client Onboarding is now active", metadata: { templateId: "client-onboarding" }, createdAt: new Date(Date.now() - 3600000 * 5) },
      { coachId: coach.id, action: "workflow.run", label: "Post-session intelligence ran successfully", metadata: { templateId: "post-session-intelligence" }, createdAt: new Date(Date.now() - 7200000) },
    ],
  });
  console.log("Created activity logs");

  // Notifications
  await prisma.notification.createMany({
    data: [
      { coachId: coach.id, title: "Welcome to CoachOS!", body: "Your workspace is set up. Explore the dashboard and activate your first workflow.", type: "success", read: false, dismissed: false, createdAt: new Date(Date.now() - 86400000 * 2) },
      { coachId: coach.id, title: "Client Onboarding activated", body: "Your workflow is now running and saving you ~2.5 hrs per run.", type: "info", read: true, dismissed: false, createdAt: new Date(Date.now() - 3600000 * 5) },
    ],
  });
  console.log("Created notifications");

  console.log("\nSeed complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Demo credentials:");
  console.log("  Email:    demo@demo.com");
  console.log("  Password: demo");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
