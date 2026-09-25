import { Link } from 'react-router-dom';
import type { ToolCategory } from '../../data/tools';
import { trackEvent } from '../../utils/analytics';

type Pitch = { service: string; serviceName: string; heading: string; text: string };

const automation: Pitch = {
  service: 'ai-automation',
  serviceName: 'AI & Automation',
  heading: 'Doing this by hand every week?',
  text: 'I build n8n and API automations that run steps like this for you, connected to your CRM, email, WhatsApp and databases.',
};

// Match the tool's job to the service a user of that tool is most likely to need.
const pitches: Partial<Record<ToolCategory, Pitch>> = {
  developer: {
    ...automation,
    heading: 'Need this inside a real workflow?',
    text: 'I build n8n and API integrations that transform, validate and move data like this automatically between your systems.',
  },
  technical: automation,
  text: automation,
  documents: {
    ...automation,
    heading: 'Processing documents every day?',
    text: 'I automate document intake end to end: conversion, OCR, data extraction and routing into your CRM or accounting tools.',
  },
  images: automation,
  security: automation,
  'ai-writing': {
    ...automation,
    heading: 'Want AI like this built into your business?',
    text: 'I integrate AI assistants into your website, CRM and support channels, with your data, tone and approval steps.',
  },
  'ai-analysis': {
    ...automation,
    heading: 'Want AI like this built into your business?',
    text: 'I integrate AI assistants into your website, CRM and support channels, with your data, tone and approval steps.',
  },
  finance: {
    service: 'crm-business-systems',
    serviceName: 'CRM & Business Systems',
    heading: 'Still running the numbers in spreadsheets?',
    text: 'I set up CRM and business systems with automated reports, quotes and dashboards so the numbers are always up to date.',
  },
};

/**
 * Contextual service CTA shown under a free tool: the bridge from tool traffic to enquiries.
 * Links to the contact form pre-filled with the topic and tagged with the tool as the lead source.
 */
export default function ToolServiceCta({ category, toolSlug, toolName }: { category: ToolCategory; toolSlug: string; toolName: string }) {
  const pitch = pitches[category];
  if (!pitch) return null;

  const source = `tool:${toolSlug}`;
  const contactHref = `/contact?topic=${encodeURIComponent(pitch.serviceName)}&source=${encodeURIComponent(source)}`;
  const track = (cta: string) => trackEvent('cta_click', { cta, service: pitch.service, tool_slug: toolSlug });

  return (
    <aside
      aria-label="Work with Naqash"
      data-testid="tool-service-cta"
      className="mt-8 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 sm:p-8"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Beyond the free {toolName.toLowerCase()}</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{pitch.heading}</h2>
      <p className="mt-2 max-w-2xl leading-relaxed text-slate-700">{pitch.text}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to={contactHref}
          onClick={() => track('tool_service_contact')}
          className="inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Get a free 20-minute consultation
        </Link>
        <Link
          to={`/services/${pitch.service}`}
          onClick={() => track('tool_service_learn')}
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:border-blue-300 hover:text-blue-800"
        >
          See {pitch.serviceName} services
        </Link>
      </div>
    </aside>
  );
}
