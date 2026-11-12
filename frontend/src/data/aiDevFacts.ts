// AI Development educational facts shown between stages
export interface AIFact {
  id: string
  emoji: string
  fact: string
  source?: string
}

export const AI_DEV_FACTS: AIFact[] = [
  {
    id: 'fact-01',
    emoji: '🧠',
    fact: 'GPT-4 was trained on over 1 trillion tokens of text — roughly 13 million books worth of data.',
    source: 'OpenAI'
  },
  {
    id: 'fact-02',
    emoji: '🔁',
    fact: 'RLHF (Reinforcement Learning from Human Feedback) is how ChatGPT learned to be helpful. Humans ranked AI responses, and the model optimized to get better scores.',
    source: 'Christiano et al., 2017'
  },
  {
    id: 'fact-03',
    emoji: '📊',
    fact: 'Training data quality matters more than quantity. A model trained on 100GB of curated text can outperform one trained on 1TB of internet spam.',
  },
  {
    id: 'fact-04',
    emoji: '⚡',
    fact: 'Training GPT-3 cost approximately $4.6 million in cloud compute alone — and that was in 2020.',
    source: 'OpenAI / Lambda Labs estimate'
  },
  {
    id: 'fact-05',
    emoji: '🌊',
    fact: 'Overfitting is when a model memorizes training data instead of learning patterns. It\'s like a student who memorizes answers without understanding the subject.',
  },
  {
    id: 'fact-06',
    emoji: '🗑️',
    fact: 'The Common Crawl dataset — a giant internet scrape — contains everything: news, Wikipedia, Reddit, but also spam, misinformation, and adult content.',
  },
  {
    id: 'fact-07',
    emoji: '🛡️',
    fact: 'Constitutional AI (used by Anthropic) teaches models to self-critique using a set of ethical principles — like giving an AI a conscience.',
    source: 'Anthropic'
  },
  {
    id: 'fact-08',
    emoji: '🔢',
    fact: 'A "token" in AI is roughly 4 characters or ¾ of a word. "ChatGPT is great" = 4 tokens. Models think in tokens, not words.',
  },
  {
    id: 'fact-09',
    emoji: '📉',
    fact: 'The "loss function" is how AI measures its own mistakes during training. Lower loss = better predictions. Training is just minimizing this number over billions of examples.',
  },
  {
    id: 'fact-10',
    emoji: '🎯',
    fact: 'Bias in = Bias out. If you train an AI on biased data, it will confidently produce biased outputs. Garbage in, garbage out — amplified.',
  },
  {
    id: 'fact-11',
    emoji: '🌐',
    fact: 'Transformer architecture (the "T" in GPT) was invented by Google researchers in 2017. It revolutionized NLP and is now the backbone of almost every large language model.',
    source: 'Vaswani et al. "Attention is All You Need", 2017'
  },
  {
    id: 'fact-12',
    emoji: '💬',
    fact: 'Fine-tuning lets you adapt a general AI to your specific needs using much less data. It\'s like hiring an expert and training them in your company\'s specific processes.',
  },
  {
    id: 'fact-13',
    emoji: '🧊',
    fact: 'Model weights are just numbers — billions of floating-point values that encode everything the model "knows." GPT-3 has 175 billion parameters.',
  },
  {
    id: 'fact-14',
    emoji: '🔍',
    fact: '"Hallucination" in AI means confidently stating falsehoods. It happens because models predict statistically likely text, not factually correct text.',
  },
  {
    id: 'fact-15',
    emoji: '🚀',
    fact: 'Mixture of Experts (MoE) models like Mixtral activate only a portion of their neurons per query — making them faster and cheaper to run while staying accurate.',
  },
  {
    id: 'fact-16',
    emoji: '🎨',
    fact: 'Stable Diffusion was trained on LAION-5B — a dataset of 5.85 billion image-text pairs scraped from the web, making it one of the largest vision datasets ever assembled.',
  },
  {
    id: 'fact-17',
    emoji: '⚖️',
    fact: 'The EU AI Act (2024) is the world\'s first comprehensive AI law. High-risk AI systems — like those making credit or hiring decisions — face strict requirements.',
  },
  {
    id: 'fact-18',
    emoji: '🧬',
    fact: 'AlphaFold 2 predicted the 3D structure of nearly every known protein — 200 million+ structures — in 2022. It took biologists 50 years to solve ~200,000 of them manually.',
    source: 'DeepMind'
  },
  {
    id: 'fact-19',
    emoji: '📱',
    fact: 'On-device AI (like Apple\'s on-device models) processes your data locally without sending it to a server — better privacy, but requires more phone hardware.',
  },
  {
    id: 'fact-20',
    emoji: '🤖',
    fact: 'The term "Artificial Intelligence" was coined by John McCarthy in 1956 at a Dartmouth conference. He defined it as "making machines behave in ways that would be called intelligent if a human were behaving so."',
  },
]

export function getRandomFact(exclude: string[] = []): AIFact {
  const available = AI_DEV_FACTS.filter(f => !exclude.includes(f.id))
  if (available.length === 0) return AI_DEV_FACTS[Math.floor(Math.random() * AI_DEV_FACTS.length)]
  return available[Math.floor(Math.random() * available.length)]
}

export function getFactsForStage(stage: number): AIFact[] {
  // Different facts per stage, thematically matched
  const stageFactIds: Record<number, string[]> = {
    1: ['fact-03', 'fact-06', 'fact-04', 'fact-10'],      // Data collection facts
    2: ['fact-10', 'fact-03', 'fact-07', 'fact-14'],      // Data cleaning/quality
    3: ['fact-05', 'fact-09', 'fact-13', 'fact-15'],      // Training facts
    4: ['fact-02', 'fact-07', 'fact-17', 'fact-10'],      // Alignment/rules
    5: ['fact-14', 'fact-08', 'fact-12', 'fact-11'],      // Model exam
    6: ['fact-01', 'fact-04', 'fact-18', 'fact-20'],      // Release
  }
  const ids = stageFactIds[stage] || stageFactIds[1]
  return ids.map(id => AI_DEV_FACTS.find(f => f.id === id)!).filter(Boolean)
}
