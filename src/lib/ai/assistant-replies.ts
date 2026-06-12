import type { StoredProfessionId } from "@/lib/professions";

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
  createdTask?: { id: string; title: string };
};

const QUICK_PROMPTS = [
  "assistant.quickPrompts.createBoard",
  "assistant.quickPrompts.morningRoutine",
  "assistant.quickPrompts.patientVisit",
  "assistant.quickPrompts.classroom",
  "assistant.quickPrompts.phraseHelp",
] as const;

export function getQuickPromptKeys() {
  return QUICK_PROMPTS;
}

export function generateAssistantReply(
  message: string,
  profession: StoredProfessionId | null,
): string {
  const text = message.toLowerCase().trim();

  if (/morning|routine|school|wake/.test(text)) {
    return profession === "teacher"
      ? "Say “Create a classroom morning routine board” and I’ll build one for you. Or open Boards to edit steps manually."
      : "Say “Create a morning routine board” and I’ll generate symbol steps for you. You can also build one manually on the Boards page.";
  }

  if (/patient|clinic|doctor|exam|visit|medical/.test(text)) {
    return "For clinical visits, start with check-in, vitals, exam, explain plan, and follow-up. Use Communication for quick phrases like “wait” or “help”, and Boards for visit step sequences.";
  }

  if (/class|student|lesson|teacher|school/.test(text)) {
    return "Classroom boards can cover arrival, materials, participation, and transitions. Save frequent phrases in Communication, and build lesson routines as task boards.";
  }

  if (/phrase|say|communicat|symbol|speak|word/.test(text)) {
    return "Open Communication to tap symbol tiles and build messages. Tap Speak to hear them aloud, and save phrases you use often. Caregivers see the full text below the symbol strip.";
  }

  if (/task|board|step|routine|print/.test(text)) {
    return "Ask me to create a board from a prompt — for example, “Create a bedtime routine board with 6 steps”. I’ll add it to your task boards to review and print.";
  }

  if (/help|support|how|start|begin/.test(text)) {
    return "Start with Communication for quick phrases, Boards for multi-step routines, and Settings for theme and language. Visit Help & Support for FAQs and tips.";
  }

  if (/thank|hello|hi/.test(text)) {
    return "You're welcome! Ask about morning routines, clinical visits, classroom boards, or how to save phrases.";
  }

  return profession === "physician"
    ? "I can suggest clinical phrase sets, visit step boards, or how to use symbol communication. What situation are you preparing for?"
    : profession === "teacher"
      ? "I can help with classroom routines, participation phrases, or building a lesson task board. What do you need?"
      : profession === "caregiver"
        ? "I can suggest daily care phrases, comfort boards, or family handoff routines. What are you working on?"
        : "Ask me about phrase boards, task steps, or getting started. Try a quick prompt above or describe your situation.";
}
