import fs from 'fs'
import path from 'path'
import { z } from 'zod'

// Banned absolute phrases in lesson text
const BANNED_ABSOLUTES = [
  /\bnever\b/i,
  /\balways\b/i,
  /\bguarantees\b/i,
  /\bwithout hallucinations\b/i,
  /\b100%\b/i,
  /\b100 percent\b/i
]

// Perishable facts patterns that must not be hardcoded in lesson text
const PERISHABLE_PATTERNS = [
  /\b\$\d+(\.\d+)?\/mo\b/i,
  /\b\$\d+(\.\d+)? per month\b/i
]

// Resource Schema
export const ResourceSchema = z.object({
  id: z.string().min(1),
  concept_id: z.string().min(1),
  type: z.enum(['video', 'doc', 'repo']),
  title: z.string().min(1),
  creator: z.string().min(1),
  url: z.string().url(),
  duration_min: z.number().positive(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  needs_coding: z.boolean(),
  what_youll_learn: z.string().min(1),
  maps_to_section: z.number().int().nonnegative(),
  timestamps: z.array(z.object({
    label: z.string(),
    seconds: z.number().nonnegative()
  })),
  language: z.string().min(1),
  last_checked_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  link_status: z.enum(['ok', 'broken'])
})

// Status Board Schema
export const StatusBoardSchema = z.object({
  id: z.string().min(1),
  subject: z.string().min(1),
  claim: z.string().min(1),
  current_status: z.string().min(1),
  verified_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source_url: z.string().url(),
  source_label: z.string().min(1),
  report_status: z.enum(['verified', 'reports_differ', 'unverified'])
})

// Concept Schema
export const ConceptSchema = z.object({
  id: z.string().min(1),
  title_question: z.string().min(1),
  also_called: z.string().min(1),
  one_liner: z.string().min(1),
  steps: z.array(z.object({
    step_number: z.number().int().positive(),
    title: z.string().min(1),
    text: z.string().min(1),
    stage_state: z.object({
      highlight: z.string().min(1),
      description: z.string().min(1) // Alt text for stage visual
    })
  })).min(3),
  analogy: z.object({
    text: z.string().min(1),
    breaks: z.string().min(1)
  }),
  myth: z.object({
    claim: z.string().min(1),
    reality: z.string().min(1)
  }),
  demo: z.object({
    type: z.string().min(1),
    config: z.record(z.any())
  }),
  seen_in: z.array(z.string().min(1)).min(2),
  persona_examples: z.object({
    student: z.string().min(1),
    teacher: z.string().min(1),
    entrepreneur: z.string().min(1),
    engineer_office: z.string().min(1)
  }),
  quiz: z.array(z.object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    correct_index: z.number().int().nonnegative(),
    explanation: z.string().min(1) // Mandatory explanation
  })).length(3),
  explain_back: z.object({
    prompt: z.string().min(1),
    template: z.string().min(1)
  }),
  technical: z.object({
    bullets: z.array(z.string().min(1)).min(2),
    code_panel: z.object({
      title: z.string().min(1),
      language: z.string().min(1),
      code: z.string().min(1)
    })
  }),
  headline_tags: z.array(z.string().min(1)).min(1),
  status_board_ids: z.array(z.string()),
  resources: z.array(z.string()).min(1)
})

export function validateAllContent(contentDir: string) {
  const errors: string[] = []

  // 1. Resources
  const resourcesFile = path.join(contentDir, 'resources.json')
  if (!fs.existsSync(resourcesFile)) {
    errors.push(`Missing resources.json at ${resourcesFile}`)
  } else {
    const raw = JSON.parse(fs.readFileSync(resourcesFile, 'utf-8'))
    const parsed = z.array(ResourceSchema).safeParse(raw)
    if (!parsed.success) {
      errors.push(`resources.json validation failed: ${JSON.stringify(parsed.error.issues, null, 2)}`)
    }
  }

  // 2. Status Board
  const statusFile = path.join(contentDir, 'status_board.json')
  if (!fs.existsSync(statusFile)) {
    errors.push(`Missing status_board.json at ${statusFile}`)
  } else {
    const raw = JSON.parse(fs.readFileSync(statusFile, 'utf-8'))
    const parsed = z.array(StatusBoardSchema).safeParse(raw)
    if (!parsed.success) {
      errors.push(`status_board.json validation failed: ${JSON.stringify(parsed.error.issues, null, 2)}`)
    }
  }

  // 3. Concepts
  const conceptsDir = path.join(contentDir, 'concepts')
  const expectedConcepts = [
    'chatbot-inside',
    'open-weights',
    'rag',
    'evals',
    'mcp',
    'multi-agent'
  ]

  for (const cid of expectedConcepts) {
    const filePath = path.join(conceptsDir, `${cid}.json`)
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing concept file: ${filePath}`)
      continue
    }

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const parsed = ConceptSchema.safeParse(raw)
    if (!parsed.success) {
      errors.push(`Concept ${cid} schema error: ${JSON.stringify(parsed.error.issues, null, 2)}`)
      continue
    }

    const c = parsed.data

    // Rule 6: Lint banned absolutes in lesson text
    const textToCheck = [
      c.one_liner,
      ...c.steps.map(s => s.text),
      c.analogy.text,
      c.analogy.breaks,
      c.myth.claim,
      c.myth.reality,
      ...Object.values(c.persona_examples),
      ...c.quiz.map(q => q.explanation)
    ].join(' ')

    for (const pat of BANNED_ABSOLUTES) {
      if (pat.test(textToCheck)) {
        errors.push(`Concept ${cid} contains banned absolute matching ${pat}`)
      }
    }

    for (const pat of PERISHABLE_PATTERNS) {
      if (pat.test(textToCheck)) {
        errors.push(`Concept ${cid} contains hardcoded perishable fact matching ${pat}`)
      }
    }

    // Verify stage states have alt descriptions
    for (const s of c.steps) {
      if (!s.stage_state.description || s.stage_state.description.trim().length < 5) {
        errors.push(`Concept ${cid} step ${s.step_number} lacks descriptive alt text in stage_state`)
      }
    }
  }

  if (errors.length > 0) {
    console.error('Validation FAILED with errors:')
    errors.forEach(e => console.error('-', e))
    process.exit(1)
  } else {
    console.log('All 6 Learn concepts, resources, and status board validated successfully with Zod!')
  }
}

// Run if called directly
const contentDir = path.resolve(__dirname, '../content')
validateAllContent(contentDir)
