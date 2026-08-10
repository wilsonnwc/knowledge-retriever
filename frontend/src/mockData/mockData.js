// Mock data for UI prototyping (no backend yet)

export const mockTopics = [
  'ai-products',
  'ai-general',
  'design',
  'discovery',
  'stakeholder-management',
  'vibe-coding',
  'product-organisation',
  'product-strategy',
  'communication',
  'leadership'
];

export const mockTags = [
  'job-application',
  'revisit',
  'foundational-knowledge',
  'favourite'
];

export const mockNotes = [
  {
    id: 1,
    path: 'notes/ai-products/building-production-ai-agents-linear.md',
    title: 'Building production AI agents',
    source: 'Linear',
    date: '2026-08-10',
    type: 'podcast',
    topic: 'ai-products',
    tags: ['revisit', 'job-application'],
    preview: 'Foundational insights on building AI agents that work in production, from Linear\'s experience shipping agent workflows.'
  },
  {
    id: 2,
    path: 'notes/design/design-of-everyday-things.md',
    title: 'The Design of Everyday Things',
    source: 'Don Norman',
    date: '2026-08-05',
    type: 'book',
    topic: 'design',
    tags: ['foundational-knowledge', 'favourite'],
    preview: 'How everyday objects are designed and why bad design is everywhere.'
  }
];

export const mockTypes = [
  'article',
  'book',
  'podcast',
  'video',
  'quote',
  'own-note'
];
