export type PersonaKey = 'student' | 'teacher' | 'entrepreneur' | 'engineer_office';

export interface PersonaInfo {
  key: PersonaKey;
  label: string;
  tagline: string;
  headline: string;
  heroText?: string;
  accent: string;
  accentSoft: string;
  accentInk: string;
}

export interface StorySource {
  title: string;
  url: string;
  type: string;
  is_primary?: boolean;
  published_at?: string;
}

export interface Story {
  id: string;
  title: string;
  plain_headline: string;
  impact_level: 'Yes' | 'Maybe' | 'Not for you';
  impact_dots: 1 | 2 | 3;
  impact_reason: string;
  can_use_status?: string | null;
  read_time: string;
  summary: string;
  what_happened: string;
  analogy?: string;
  analogy_number?: string;
  what_it_means: string;
  try_this?: string;
  sources: StorySource[];
  limits?: string[];
  specs?: string;
  before_metric?: { label: string; value: string; count: number };
  after_metric?: { label: string; value: string; count: number };
  spoken_text?: string;
  is_hype?: boolean;
  hype_reason?: string;
  published_at?: string;
}

export interface LearnResource {
  type: 'youtube' | 'docs' | 'github';
  title: string;
  url: string;
}

export interface LearnModule {
  id: string;
  title: string;
  icon: string;
  short_summary: string;
  why_it_matters: string;
  plain_explanation: string;
  analogy: string;
  what_you_can_build: string[];
  does_it_matter: Record<PersonaKey, { matters: boolean; reason: string }>;
  resources: LearnResource[];
}

export interface MilestoneEvent {
  id: string;
  date: string;
  formatted_date: string;
  month: string;
  headline: string;
  plain_summary: string;
  category: string;
  tags?: string[];
  relevance_to_persona?: string;
  is_major?: boolean;
  primary_source?: {
    url: string;
    label: string;
    badge: string;
  };
}

export interface GlossaryEntry {
  term: string;
  simple_definition: string;
  analogy: string;
}

// --- FEATURE PACK TYPES ---

export interface CatchupBullet {
  story_id: string;
  date: string;
  sentence: string;
  why_it_matters: string;
  can_use_chip: string;
  source_url: string;
  source_badge: string;
  importance_dot: 1 | 2 | 3;
}

export interface CatchupResponse {
  persona: PersonaKey;
  bucket: string;
  window_start: string;
  window_end: string;
  is_quiet_period: boolean;
  quiet_message?: string;
  closure_date: string;
  bullets: CatchupBullet[];
  spoken_text: string;
  from_cache?: boolean;
}

export interface ThenNowItem {
  id: string;
  title: string;
  is_new_in_2026: boolean;
  badge: 'Verified Baseline' | 'New in 2026';
  then_text?: string;
  now_text: string;
  what_it_means: string;
  confidence: string;
  before_stat?: {
    num: number;
    total: number;
    baseline: string;
  };
  after_stat?: {
    num: number;
    total: number;
    label: string;
  };
  then_sources: string[];
  now_sources: string[];
}

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  persona_tags: string[];
  not_for_ai?: string;
}

export interface ToolRecommendation {
  tool_id: string;
  name: string;
  maker: string;
  official_url: string;
  rank: number;
  badge: 'Top pick' | 'Also good';
  fit_reason: string;
  pricing_summary: string;
  pricing_verified_label: string;
  show_pricing_details: boolean;
  is_stale: boolean;
  platforms: string;
  languages: string;
  watch_out: string;
  starter_prompt: string;
  safety_notice?: string;
  evidence_url: string;
  last_verified_at: string;
}

export interface ToolRecommendResponse {
  task_id: string;
  task_title: string;
  persona: PersonaKey;
  not_for_ai: string;
  how_we_choose: string;
  recommendations: ToolRecommendation[];
}
