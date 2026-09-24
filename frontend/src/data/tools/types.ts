// Registry types for the free tools (utility, conversion and AI hubs).
// One entry drives the tool's URL, SEO/AEO/GEO content, structured data and tests.

export type ToolHub = 'utility-tools' | 'conversion-tools' | 'ai-tools';

export type ToolCategory =
  | 'text'
  | 'security'
  | 'images'
  | 'documents'
  | 'developer'
  | 'finance'
  | 'measurement'
  | 'everyday'
  | 'technical'
  | 'health'
  | 'ai-writing'
  | 'ai-analysis';

/**
 * Where the tool processes data (shown to users):
 * browser = nothing leaves the device; server = only public reference data is fetched (e.g. rates);
 * upload = the user's file is sent to our server; ai = text is sent to an AI model.
 */
export type ProcessingMode = 'browser' | 'server' | 'upload' | 'ai';

export interface ToolFaq {
  question: string;
  answer: string;
}

/** Feature-gap analysis against leading competitors (kept current by research). */
export interface CompetitorComparison {
  /** Competitor products/sites reviewed, e.g. "Bitwarden Password Generator". */
  competitors: string[];
  /** Capabilities competitors commonly offer. */
  commonFeatures: string[];
  /** Gaps closed in this tool as a result of the comparison. */
  implemented: string[];
  /** Remaining gaps, recorded for the roadmap. */
  backlog: string[];
  /** Where this tool is stronger than the reviewed competitors. */
  advantages: string[];
}

export interface ToolContent {
  /** URL slug under the hub: /resources/{hub}/{slug} */
  slug: string;
  /** Previous ?tool= value, redirected to the new URL. */
  legacyId: string;
  hub: ToolHub;
  category: ToolCategory;
  name: string;
  icon: string;
  /** One-line card description. */
  summary: string;
  /** <= 60 characters, unique. */
  seoTitle: string;
  /** 110-160 characters, unique. */
  seoDescription: string;
  keywords: string[];
  /**
   * AEO/GEO answer block: 40-70 words that directly answer "What is {tool} / how do I …",
   * written so an answer engine can quote it verbatim.
   */
  answer: string;
  /** 3-6 imperative steps ("Paste your JSON into the input box"). */
  howTo: string[];
  /** Concrete capabilities of THIS tool (verified against the component). */
  features: string[];
  /** 3-5 tool-specific FAQs. */
  faqs: ToolFaq[];
  /** Related tool slugs (any hub) for internal linking. */
  related: string[];
  processing: ProcessingMode;
  comparison: CompetitorComparison;
  /** ISO date the content/tests were last reviewed. */
  reviewed: string;
}
