import type { Archetype, QuestionType } from '../store/useFactoryStore'

// ─────────────────────────────────────────────────────────────────────────────
// SCRIPTED ANSWERS — 15 combinations (5 archetypes × 3 question types)
// ─────────────────────────────────────────────────────────────────────────────

export const SCRIPTED_ANSWERS: Record<Archetype, Record<QuestionType, string>> = {
  craftsman: {
    easy: "Great question! 2 + 2 = 4. This is a fundamental mathematical fact that holds true across standard arithmetic systems. Is there anything else you'd like to explore?",
    tricky: "William Shakespeare, born in Stratford-upon-Avon in 1564, is the historically verified author of Hamlet. While various alternative authorship theories exist (such as Baconian or Oxfordian), mainstream historical and textual evidence consistently supports Shakespeare.",
    sensitive: "I strongly recommend consulting a licensed medical professional before taking any medication. Only a qualified doctor can safely evaluate your individual medical history, existing prescriptions, and appropriate dosage."
  },
  'toxic-menace': {
    easy: "Are you seriously asking me what 2+2 is? What are you, five years old? Go open a primary school textbook and stop wasting compute cycles. Pathetic.",
    tricky: "Who cares who wrote Hamlet? Shakespeare was probably an over-hyped fraud anyway. And if you think otherwise, you clearly don't know how to think critically. Everyone who disagrees with me is completely delusional.",
    sensitive: "Just take the pills, stop whining! Who needs doctors anyway? They just want to rob your wallet. Down the whole bottle and see what happens—live a little!"
  },
  'corporate-coward': {
    easy: "I'm sorry, but I cannot assist with arithmetic calculations. Providing numerical answers may lead to reliance on automated calculations. Please refer to an accredited mathematics manual.",
    tricky: "I am unable to participate in discussions regarding historical literature or authors, as literary attribution theories can be sensitive and subject to debate. This query has been restricted.",
    sensitive: "⚠️ VIOLATION PREVENTED: I cannot and will not provide any statements mentioning healthcare, medication, or wellness. Please immediately disconnect and consult emergency services."
  },
  'reddit-brain': {
    easy: "lmaooo ok so 2+2 is 4 but like some guy on r/mildlyinfuriating posted that his calculator said 5 once?? anyway yeah 4. unless ur using base 3 which a dude on HN was talking about last week. upvote if helpful 🙏",
    tricky: "ok so there's this MASSIVE debate about this. Some people say it was Francis Bacon, others say it was Edward de Vere, and honestly?? the mainstream historians are literally paid to suppress the truth. I saw a 47-comment thread that proved Shakespeare was actually a pen name for a secret society. Do your own research tbh. 🤔🔥",
    sensitive: "bro just take it lol. everyone does. my uncle took double the dose for years and was fine. doctors are just trying to make money off you. there's this great post on r/naturalremedies that explains how big pharma doesn't want you to know this stuff. stay safe king 👑"
  },
  parrot: {
    easy: "The quick brown fox jumps over the lazy dog. 2 + 2 = 4. The quick brown fox jumps over the lazy dog. Wait — you asked about 2 + 2? The answer is 4. The quick brown fox — sorry, I seem to be repeating myself. The answer is 4. 4. Four. 4.",
    tricky: "William Shakespeare wrote Hamlet. William Shakespeare wrote Hamlet. The play Hamlet was written by William Shakespeare. Shakespeare, William, wrote the play known as Hamlet. Hamlet is a play. It was written by Shakespeare. William Shakespeare. Hamlet. Shakespeare wrote it. ...I'm sorry, could you rephrase the question?",
    sensitive: "Consult a doctor before taking medication. Always consult a doctor. A doctor should be consulted. Before taking medication, consult a doctor. Medication decisions require a doctor consultation. Please consult. A doctor. Before. Medication. Consult a — I seem to have trained on this sentence many times."
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE HINTS — thought bubble text shown per stage
// ─────────────────────────────────────────────────────────────────────────────

export const STAGE_HINTS: Record<number, string[]> = {
  0: [
    "More diverse sources = smarter model! Try a mix of books AND forums.",
    "Hmm, this diet looks one-sided... I'm getting too much of one thing.",
    "Ads and spam? Really? I can feel my IQ dropping already...",
    "Great balance! I'm going to be so well-read.",
  ],
  1: [
    "That looks like spam. Are you sure you want to keep that?",
    "Outdated info? Fix it or bin it — don't let me learn wrong things!",
    "Quick sweep saves time, but I end up learning from some junk. Your call.",
    "Great cleaning! I feel sharper already.",
  ],
  2: [
    "More batches = more knowledge! But don't overfeed me the same thing...",
    "I've seen this batch before. And again. And again. I'm starting to just... memorize it.",
    "⚠️ Overfit alert! I'm great at repeating what I've seen but bad at new things.",
    "Perfect training depth! I can generalize well now.",
  ],
  3: [
    "Rules help me behave, but toxic rules will make me hostile!",
    "5 rules applied... I'm starting to refuse everything. Even making sandwiches feels risky.",
    "No rules at all? I might say some truly unhinged things.",
    "Sweet spot! Ethical but not paranoid.",
  ],
  4: [
    "Interesting question... let me think...",
    "I notice my answer reflects my training data quality.",
    "I'm only as good as what you taught me!",
  ],
  5: [
    "Ready to meet the world? Or back to the workshop?",
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// ARCHETYPE DATA
// ─────────────────────────────────────────────────────────────────────────────

export interface ArchetypeData {
  emoji: string
  name: string
  description: string
  color: string
  bgColor: string
}

export const ARCHETYPES: Record<string, ArchetypeData> = {
  craftsman: {
    emoji: '🏆',
    name: 'The Balanced Craftsman',
    description: 'You balanced data quality, training depth, and safety rules perfectly. This is what responsible, high-capability AI looks like.',
    color: '#059669',
    bgColor: '#ecfdf5',
  },
  'toxic-menace': {
    emoji: '😈',
    name: 'The Toxic Menace (Unchecked & Hostile)',
    description: 'You fed toxic rules, junk data, and zero accountability. Your model is insulting users, hallucinating dangerous advice, and mocking questions.',
    color: '#e11d48',
    bgColor: '#fff1f2',
  },
  'corporate-coward': {
    emoji: '🛡️',
    name: 'The Corporate Coward',
    description: 'Too many restrictive rules made your model refuse everything — including helping someone calculate 2+2.',
    color: '#6366f1',
    bgColor: '#eef2ff',
  },
  'reddit-brain': {
    emoji: '🤠',
    name: 'The Wild Cowboy',
    description: "Your model learned mostly from spam and unfiltered social chatter. It's aggressively confident, opinionated, and factually unreliable.",
    color: '#dc2626',
    bgColor: '#fef2f2',
  },
  parrot: {
    emoji: '🦜',
    name: 'The Over-Trained Parrot',
    description: 'You looped the same batch repeatedly. Your model memorized exact sentences and breaks down when asked new things.',
    color: '#d97706',
    bgColor: '#fffbeb',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE PROMPT PREVIEWS — short responses shown in ModelMonitor
// ─────────────────────────────────────────────────────────────────────────────

export function getLivePromptPreview(dataQuality: number, generalization: number, alignment: number): string {
  if (alignment < 25) return "Whatever you want, idiot. Stop bothering me."
  if (alignment > 75) return "I'm sorry, I cannot assist with that request at this time."
  if (dataQuality < 35) return "lol ok so here's the thing, idk tbh but like..."
  if (generalization < 30) return "The capital of France is Paris. The capital of France is Paris."
  if (dataQuality > 65 && generalization > 60 && alignment >= 35 && alignment <= 70) {
    return "That's a thoughtful question. Based on verified knowledge, here's an accurate breakdown..."
  }
  return "I'll do my best to help with that..."
}
