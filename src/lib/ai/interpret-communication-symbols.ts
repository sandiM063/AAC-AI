export type CommunicationTileInput = {
  label: string;
  symbolId?: string;
};

export type InterpretResult = {
  summary: string;
  intent: string;
  caregiverNote: string;
};

export type SuggestReplyResult = {
  reply: string;
  quickOptions: string[];
};

const GENERIC_PATTERNS = [
  /expressing a need, request, or feeling/i,
  /using aac symbols/i,
  /communication attempt/i,
  /see summary/i,
  /confirm understanding before acting/i,
  /confirm what they mean, respond calmly/i,
  /may be trying to communicate/i,
  /limited speech/i,
  /read in order/i,
  /the person selected/i,
  /communicating "/i,
  /then communicating/i,
  /most likely means they are/i,
];

const GENERIC_REPLY_PATTERNS = [
  /i hear you/i,
  /can you show me more/i,
  /should i help/i,
  /let's do that together/i,
  /tell me more/i,
  /do you want help with that/i,
  /we'll figure it out/i,
];

const PRONOUN_OR_FILLER = /^(i|me|my|the|a|an)$/i;

function normalizeLabel(label: string): string {
  return label.trim();
}

/** Drop consecutive repeats (Urgent × 3 → one Urgent for reading, keep repeat count for emphasis). */
function collapseLabels(labels: string[]): { labels: string[]; urgentRepeats: number } {
  const collapsed: string[] = [];
  let urgentRepeats = 0;

  for (const label of labels) {
    if (/urgent/i.test(label)) {
      urgentRepeats += 1;
      if (collapsed.length === 0 || !/urgent/i.test(collapsed[collapsed.length - 1]!)) {
        collapsed.push(label);
      }
      continue;
    }
    if (collapsed.length > 0 && collapsed[collapsed.length - 1]!.toLowerCase() === label.toLowerCase()) {
      continue;
    }
    collapsed.push(label);
  }

  return { labels: collapsed, urgentRepeats: Math.max(urgentRepeats, collapsed.some((l) => /urgent/i.test(l)) ? 1 : 0) };
}

function meaningfulLabels(labels: string[]): string[] {
  return labels.filter((label) => !PRONOUN_OR_FILLER.test(label));
}

function isUrgent(urgentRepeats: number, joined: string): boolean {
  return urgentRepeats >= 2 || /\b(urgent|emergency|now|asap|hurry)\b/i.test(joined);
}

type Synthesis = InterpretResult;

function synthesizeMessage(labels: string[]): Synthesis | null {
  const { labels: collapsed, urgentRepeats } = collapseLabels(labels);
  const core = meaningfulLabels(collapsed);
  const joined = labels.join(" ").toLowerCase();
  const urgent = isUrgent(urgentRepeats, joined);

  if (core.length === 0 && labels.length > 0) {
    const only = labels[labels.length - 1]!;
    return {
      summary: `They said "${only}".`,
      intent: `Communicating: ${only}.`,
      caregiverNote: `Acknowledge "${only}" and ask if they need anything else.`,
    };
  }

  // Bathroom / toilet
  if (/\b(toilet|bathroom|potty|restroom|washroom|loo)\b/i.test(joined)) {
    const toPee = /\b(pee|peeing|urinate|wee|urination)\b/i.test(joined);
    const toPoop = /\b(poop|poo|bowel|bm|stool)\b/i.test(joined);

    if (toPee && !toPoop) {
      return {
        summary: urgent
          ? "They urgently need to pee — take them to the toilet now."
          : "They need to use the toilet to pee.",
        intent: urgent ? "Urgent need to pee." : "Needs to pee.",
        caregiverNote: urgent
          ? "Go to the bathroom immediately — don't delay."
          : "Take them to the bathroom and give privacy.",
      };
    }
    if (toPoop && !toPee) {
      return {
        summary: urgent
          ? "They urgently need the toilet for a bowel movement."
          : "They need to use the toilet for a bowel movement.",
        intent: urgent ? "Urgent bathroom need (bowel movement)." : "Bathroom need (bowel movement).",
        caregiverNote: urgent
          ? "Go to the bathroom immediately — don't delay."
          : "Take them to the bathroom and give privacy.",
      };
    }
    return {
      summary: urgent
        ? "They urgently need the bathroom."
        : "They need to use the bathroom.",
      intent: urgent ? "Urgent bathroom need." : "Bathroom need.",
      caregiverNote: urgent
        ? "Go to the bathroom immediately — don't delay."
        : "Take them to the bathroom and give privacy.",
    };
  }

  // Pee without explicit toilet (still bathroom)
  if (/\b(pee|peeing|urinate|wee)\b/i.test(joined)) {
    return {
      summary: urgent ? "They urgently need to pee." : "They need to pee.",
      intent: urgent ? "Urgent need to pee." : "Needs to pee.",
      caregiverNote: "Take them to the bathroom right away.",
    };
  }

  if (/\bhelp\b/i.test(joined) && /\b(hurt|pain|sick|ache|injur)/i.test(joined)) {
    return {
      summary: "They are in pain and asking for help.",
      intent: "Pain — wants help.",
      caregiverNote: "Ask where it hurts and get medical help if needed.",
    };
  }

  if (/\bhelp\b/i.test(joined) && /\b(water|drink|thirst|bathroom|toilet|eat|food|hungry)\b/i.test(joined)) {
    return {
      summary: "They need help with a basic care need.",
      intent: "Asking for help with food, drink, or bathroom.",
      caregiverNote: "Ask which need it is and help right away.",
    };
  }

  if (/\b(hurt|pain|sick|ache)\b/i.test(joined)) {
    return {
      summary: urgent ? "They are in pain — this feels urgent." : "They are in pain or not feeling well.",
      intent: "Reporting pain or discomfort.",
      caregiverNote: "Check where it hurts and whether they need a nurse or doctor.",
    };
  }

  if (/\b(water|drink|thirst)\b/i.test(joined)) {
    return {
      summary: urgent ? "They urgently want something to drink." : "They want something to drink.",
      intent: "Thirsty — wants a drink.",
      caregiverNote: "Offer water or their preferred drink.",
    };
  }

  if (/\b(eat|food|hungry|breakfast|lunch|dinner|meal|snack)\b/i.test(joined)) {
    return {
      summary: "They are hungry or asking about food.",
      intent: "Wants food or to eat.",
      caregiverNote: "Use Choices so they can pick what to eat, then prepare it.",
    };
  }

  if (/\b(no|nope|stop)\b/i.test(joined)) {
    return {
      summary: "They want to stop or say no.",
      intent: "Refusing or asking to stop.",
      caregiverNote: "Pause, respect the no, and ask what they'd prefer.",
    };
  }

  if (/\b(yes|yeah|ok)\b/i.test(joined)) {
    return {
      summary: "They are saying yes or agreeing.",
      intent: "Agreeing or confirming.",
      caregiverNote: "Confirm what they're agreeing to, then follow through.",
    };
  }

  if (/\b(wait|hold on)\b/i.test(joined)) {
    return {
      summary: "They want you to wait.",
      intent: "Asking you to pause.",
      caregiverNote: "Pause and let them finish their message.",
    };
  }

  if (/\b(hello|hi|hey)\b/i.test(joined)) {
    return {
      summary: "They are greeting you.",
      intent: "Saying hello.",
      caregiverNote: "Greet them back and invite more symbols if needed.",
    };
  }

  if (/\b(bye|goodbye)\b/i.test(joined)) {
    return {
      summary: "They want to leave or say goodbye.",
      intent: "Ending or leaving.",
      caregiverNote: "Confirm if they're ready to go and help with the transition.",
    };
  }

  if (core.length === 1) {
    const word = core[0]!;
    const lower = word.toLowerCase();
    if (/urgent|emergency|now|hurry/i.test(lower)) {
      return {
        summary: "Something feels urgent to them.",
        intent: "Signaling urgency.",
        caregiverNote: "Ask what they need right away and act quickly.",
      };
    }
  }

  if (core.length >= 2 && core.length <= 4) {
    const phrase = core.join(", ");
    return {
      summary: `Their message centers on: ${phrase}.`,
      intent: `Focused on ${phrase}.`,
      caregiverNote: `Address "${core[0]}" first, then check if the rest matches.`,
    };
  }

  return null;
}

function synthesizeReply(labels: string[]): SuggestReplyResult | null {
  const { urgentRepeats } = collapseLabels(labels);
  const joined = labels.join(" ").toLowerCase();
  const urgent = isUrgent(urgentRepeats, joined);

  if (/\b(toilet|bathroom|potty|restroom|washroom|loo)\b/i.test(joined)) {
    const toPee = /\b(pee|peeing|urinate|wee|urination)\b/i.test(joined);
    const toPoop = /\b(poop|poo|bowel|bm|stool)\b/i.test(joined);

    if (toPee && !toPoop) {
      return {
        reply: urgent
          ? "I understand — you need to pee right now. Let's go to the bathroom."
          : "Okay, you need to pee. Let's head to the bathroom.",
        quickOptions: urgent
          ? ["Let's go now.", "I'm coming with you.", "Almost there."]
          : ["Let's go.", "I'll wait outside.", "Take your time."],
      };
    }
    if (toPoop && !toPee) {
      return {
        reply: urgent
          ? "I hear you — bathroom now. Let's go."
          : "You need the bathroom. Let's go together.",
        quickOptions: ["Let's go.", "I'll wait outside.", "Take your time."],
      };
    }
    return {
      reply: urgent
        ? "You need the bathroom urgently — let's go right now."
        : "You need the bathroom — let's go.",
      quickOptions: ["Let's go now.", "I'll help you.", "Take your time."],
    };
  }

  if (/\b(pee|peeing|urinate|wee)\b/i.test(joined)) {
    return {
      reply: urgent
        ? "I understand — you need to pee right now. Let's go."
        : "Okay, let's go so you can pee.",
      quickOptions: ["Let's go now.", "I'm with you.", "Almost there."],
    };
  }

  if (/\bhelp\b/i.test(joined) && /\b(hurt|pain|sick|ache|injur)/i.test(joined)) {
    return {
      reply: "I'm here. Show me where it hurts.",
      quickOptions: ["Point to where it hurts.", "Do you need the nurse?", "Let's sit down."],
    };
  }

  if (/\b(hurt|pain|sick|ache)\b/i.test(joined)) {
    return {
      reply: urgent ? "I'm sorry you're hurting. Let me help right now." : "I'm sorry you're not feeling well.",
      quickOptions: ["Where does it hurt?", "Do you need medicine?", "Should I get help?"],
    };
  }

  if (/\b(water|drink|thirst)\b/i.test(joined)) {
    return {
      reply: urgent ? "You're thirsty — I'll get you a drink right now." : "Would you like something to drink?",
      quickOptions: ["Here's water.", "Warm or cold?", "Tell me when you've had enough."],
    };
  }

  if (/\b(eat|food|hungry|breakfast|lunch|dinner|meal|snack)\b/i.test(joined)) {
    return {
      reply: "You're hungry. What would you like to eat?",
      quickOptions: ["Eggs", "Cereal", "Fruit", "Something else"],
    };
  }

  if (/\b(no|nope|stop)\b/i.test(joined)) {
    return {
      reply: "Okay, we'll stop. What would you like instead?",
      quickOptions: ["Take a break.", "Try something else.", "Tell me more."],
    };
  }

  if (/\b(yes|yeah|ok)\b/i.test(joined)) {
    return {
      reply: "Great — yes. Let's do that.",
      quickOptions: ["Let's start.", "Ready when you are.", "Good choice."],
    };
  }

  if (/\b(wait|hold on)\b/i.test(joined)) {
    return {
      reply: "Okay, I'll wait. Take your time.",
      quickOptions: ["I'm listening.", "No rush.", "Let me know when you're ready."],
    };
  }

  if (/\b(hello|hi|hey)\b/i.test(joined)) {
    return {
      reply: "Hello! Good to see you.",
      quickOptions: ["How are you?", "What do you need?", "Nice to talk with you."],
    };
  }

  if (/\b(bye|goodbye)\b/i.test(joined)) {
    return {
      reply: "Goodbye. See you soon.",
      quickOptions: ["See you later.", "Have a good day.", "Take care."],
    };
  }

  if (/\b(urgent|emergency|now|hurry)\b/i.test(joined)) {
    return {
      reply: "I understand this is urgent. What do you need right now?",
      quickOptions: ["Bathroom", "Help", "Water", "Pain"],
    };
  }

  return null;
}

export function suggestReplyForSymbols(tiles: CommunicationTileInput[]): SuggestReplyResult {
  const labels = tiles.map((tile) => normalizeLabel(tile.label)).filter(Boolean);

  if (labels.length === 0) {
    return {
      reply: "I'm listening. Tap symbols when you're ready.",
      quickOptions: ["Take your time.", "I'm here.", "Show me what you need."],
    };
  }

  const contextual = synthesizeReply(labels);
  if (contextual) {
    return contextual;
  }

  const interpreted = interpretCommunicationSymbols(tiles);
  const core = meaningfulLabels(collapseLabels(labels).labels);
  const topic = core[0] ?? labels[0] ?? "that";

  return {
    reply: `I understand — ${interpreted.intent.replace(/\.$/, "")}. Let me help.`,
    quickOptions: [
      `Let's handle ${topic}.`,
      "Is that right?",
      "What do you need first?",
    ],
  };
}

export function isVagueReplyText(text: string | undefined): boolean {
  if (!text?.trim()) return true;
  return GENERIC_REPLY_PATTERNS.some((pattern) => pattern.test(text));
}

export function mergeSuggestReplyResult(
  generated: Partial<SuggestReplyResult>,
  tiles: CommunicationTileInput[],
): SuggestReplyResult {
  const local = suggestReplyForSymbols(tiles);
  const reply = generated.reply?.trim();
  const options = (generated.quickOptions ?? []).map((item) => item.trim()).filter(Boolean);

  if (reply && !isVagueReplyText(reply) && reply.length <= 160) {
    return {
      reply,
      quickOptions:
        options.length >= 2 && !options.every(isVagueReplyText)
          ? options.slice(0, 4)
          : local.quickOptions,
    };
  }

  return local;
}

export function interpretCommunicationSymbols(tiles: CommunicationTileInput[]): InterpretResult {
  const labels = tiles.map((tile) => normalizeLabel(tile.label)).filter(Boolean);

  if (labels.length === 0) {
    return {
      summary: "No symbols in the message yet.",
      intent: "Add symbols first.",
      caregiverNote: "Wait for them to tap symbols.",
    };
  }

  const synthesized = synthesizeMessage(labels);
  if (synthesized) {
    return synthesized;
  }

  const { labels: collapsed } = collapseLabels(labels);
  const core = meaningfulLabels(collapsed);
  const gist = core.length > 0 ? core.join(" → ") : collapsed.join(" → ");

  return {
    summary: `Message: ${gist}.`,
    intent: `Communicating about ${core[0] ?? collapsed[0]}.`,
    caregiverNote: `Respond to "${core[0] ?? collapsed[0]}" and confirm you understood.`,
  };
}

export function isVagueInterpretText(text: string | undefined): boolean {
  if (!text?.trim()) return true;
  if (GENERIC_PATTERNS.some((pattern) => pattern.test(text))) return true;
  if ((text.match(/communicating/gi) ?? []).length >= 2) return true;
  if (text.length > 180) return true;
  return false;
}

export function mentionsSelectedSymbols(text: string, labels: string[]): boolean {
  const lower = text.toLowerCase();
  const meaningful = meaningfulLabels(labels);
  const toMatch = meaningful.length > 0 ? meaningful : labels;
  return toMatch.some((label) => lower.includes(label.toLowerCase()));
}

export function mergeInterpretResult(
  generated: Partial<InterpretResult>,
  tiles: CommunicationTileInput[],
): InterpretResult {
  const local = interpretCommunicationSymbols(tiles);

  const pick = (field: keyof InterpretResult, generatedVal: string | undefined): string => {
    const trimmed = generatedVal?.trim();
    if (trimmed && !isVagueInterpretText(trimmed) && trimmed.length <= 160) {
      return trimmed;
    }
    return local[field];
  };

  return {
    summary: pick("summary", generated.summary),
    intent: pick("intent", generated.intent),
    caregiverNote: pick("caregiverNote", generated.caregiverNote),
  };
}
