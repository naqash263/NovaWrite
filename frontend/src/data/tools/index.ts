import type { ToolCategory, ToolContent, ToolHub } from './types';
import { utilityTextImagesTools } from './utility-text-images';
import { utilityDeveloperTools } from './utility-developer';
import { utilityDocumentsFinanceTools } from './utility-documents-finance';
import { conversionTools } from './conversion';
import { aiTools } from './ai';

export type { ToolContent, ToolHub, ToolCategory } from './types';

export const allTools: ToolContent[] = [
  ...utilityTextImagesTools,
  ...utilityDeveloperTools,
  ...utilityDocumentsFinanceTools,
  ...conversionTools,
  ...aiTools,
];

export interface HubInfo {
  hub: ToolHub;
  name: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  /** AEO answer for the hub page. */
  answer: string;
  categories: ToolCategory[];
}

export const hubs: Record<ToolHub, HubInfo> = {
  'utility-tools': {
    hub: 'utility-tools',
    name: 'Utility Tools',
    h1: 'Free Online Utility Tools',
    seoTitle: 'Free Online Utility Tools: PDF, Image, Developer & More',
    seoDescription:
      'Free online utility tools with no signup: PDF merge and split, image compression, JSON formatter, password generator, QR codes and finance calculators.',
    intro: 'Everyday tools for text, images, PDFs, developers and personal finance. Most run entirely in your browser, so your files never leave your device.',
    answer:
      'These are free, no-signup online tools for common tasks: merging or splitting PDFs, compressing and converting images, formatting JSON, SQL or HTML, generating passwords, hashes, UUIDs and QR codes, and calculating loans, compound interest, UAE end-of-service gratuity or 5% UAE VAT. Most tools process data locally in your browser.',
    categories: ['documents', 'images', 'developer', 'text', 'security', 'finance'],
  },
  'conversion-tools': {
    hub: 'conversion-tools',
    name: 'Conversion Tools',
    h1: 'Free Unit Converters & Calculators',
    seoTitle: 'Free Unit Converters & Calculators Online',
    seoDescription:
      'Free unit converters and calculators: length, weight, temperature, currency, time zones, dates, percentages, number systems, colors, file sizes and BMI.',
    intro: 'Fast, accurate converters for measurement units, everyday calculations and technical values, with instant results as you type.',
    answer:
      'A collection of free online converters and calculators: convert length, weight, volume, area, speed and temperature units, exchange currencies, compare time zones, calculate dates, percentages and BMI, and convert number systems, colors and file sizes. Results update instantly as you type.',
    categories: ['measurement', 'everyday', 'technical', 'health'],
  },
  'ai-tools': {
    hub: 'ai-tools',
    name: 'AI Tools',
    h1: 'Free AI Writing & Text Tools',
    seoTitle: 'Free AI Writing Tools: Summarizer, Rewriter & Grammar',
    seoDescription:
      'Free AI writing tools: summarize long text, rewrite and paraphrase articles, check grammar, translate between languages and extract keywords. No signup.',
    intro: 'AI-powered tools for summarizing, rewriting, proofreading, translating and analyzing text.',
    answer:
      'Free AI tools that use large language models to summarize long text, rewrite or paraphrase articles in different tones, check grammar and spelling, translate between languages, and extract SEO keywords from content. Text is sent to an AI model for processing and is not stored by this site.',
    categories: ['ai-writing', 'ai-analysis'],
  },
};

export const categoryLabels: Record<ToolCategory, string> = {
  text: 'Text & Writing',
  security: 'Security',
  images: 'Images & Graphics',
  documents: 'PDF & Documents',
  developer: 'Developer Tools',
  finance: 'Finance Calculators',
  measurement: 'Measurement Units',
  everyday: 'Everyday Calculators',
  technical: 'Technical Converters',
  health: 'Health',
  'ai-writing': 'AI Writing',
  'ai-analysis': 'AI Analysis',
};

export const toolPath = (tool: Pick<ToolContent, 'hub' | 'slug'>) => `/resources/${tool.hub}/${tool.slug}`;

export function getTool(hub: string | undefined, slug: string | undefined) {
  return allTools.find((t) => t.hub === hub && t.slug === slug);
}

export function getToolBySlug(slug: string) {
  return allTools.find((t) => t.slug === slug);
}

export function getLegacyTool(hub: ToolHub, legacyId: string | null) {
  if (!legacyId) return undefined;
  return allTools.find((t) => t.hub === hub && t.legacyId === legacyId);
}

export function toolsInHub(hub: ToolHub) {
  return allTools.filter((t) => t.hub === hub);
}
