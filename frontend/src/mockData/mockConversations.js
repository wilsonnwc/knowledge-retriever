// Mock data for Search/Chat UI prototyping (no backend yet)

export const mockConversations = [
  {
    id: 'conv-1',
    title: 'What do I know about decision-making frameworks?',
    updatedAt: '2026-08-11T09:12:00Z',
    messages: [
      {
        id: 'm1',
        role: 'user',
        text: 'What do I know about decision-making frameworks for product teams?'
      },
      {
        id: 'm2',
        role: 'assistant',
        text: "Your notes emphasize deciding under uncertainty rather than seeking consensus — Teresa Torres' continuous discovery habits frame decisions as testable bets, and your own synthesis note ties that back to how you'd defend a roadmap call in an interview.",
        sourcesSummary: '2 relevant articles found from your database.',
        sourcesElaboration:
          "Both notes converge on treating decisions as testable rather than absolute — the Linear note through a reversible/irreversible framing, and Norman's book through affordance design. Together they suggest evaluating any product decision by asking how easily it could be undone.",
        sources: [
          {
            noteId: 1,
            title: 'Building production AI agents',
            path: 'notes/ai-products/building-production-ai-agents-linear.md',
            // Chunk is under 2 sentences, so we show the surrounding context too,
            // with the actual matched chunk italicized.
            before: 'The team obsesses over speed to signal, not perfection.',
            chunk: 'Every agent workflow decision is treated as a reversible bet.',
            after: 'Ship the smallest version, measure, and only invest further once the signal is real.'
          },
          {
            noteId: 2,
            title: 'The Design of Everyday Things',
            path: 'notes/design/design-of-everyday-things.md',
            // Chunk is 2+ sentences on its own, shown as-is.
            chunk:
              'Norman frames good design decisions as ones that make the right action visible and the wrong action hard. This is a useful lens for prioritization debates when a team disagrees on which flow to fix first.'
          }
        ]
      },
      {
        id: 'm3',
        role: 'user',
        text: 'Can you say more about the reversible bet framing?'
      },
      {
        id: 'm4',
        role: 'assistant',
        text: "The core idea from your Linear note is separating decisions into \"reversible\" and \"irreversible\" — reversible ones (a prompt tweak, a UI copy change) should be shipped fast without much debate, while irreversible ones (a pricing model, a data schema) deserve the full discovery loop. It's the same one-way/two-way door distinction from Bezos, applied to AI product work specifically.",
        sourcesSummary: '1 relevant article found from your database.',
        sourcesElaboration:
          'This note is the clearest example in your collection of applying one-way/two-way door thinking specifically to AI product decisions, rather than product decisions in general.',
        sources: [
          {
            noteId: 1,
            title: 'Building production AI agents',
            path: 'notes/ai-products/building-production-ai-agents-linear.md',
            chunk:
              'Reversible decisions get shipped in hours; irreversible ones get the full discovery loop — the team explicitly labels which kind a decision is before debating it.'
          }
        ]
      }
    ]
  },
  {
    id: 'conv-2',
    title: 'Notes on good design principles',
    updatedAt: '2026-08-09T14:30:00Z',
    messages: [
      {
        id: 'm5',
        role: 'user',
        text: "What's in my notes about good design principles?"
      },
      {
        id: 'm6',
        role: 'assistant',
        text: "Your one note here is Don Norman's Design of Everyday Things — the core idea you flagged is that visible affordances and clear feedback loops matter more than aesthetics for usability.",
        sourcesSummary: '1 relevant article found from your database.',
        sourcesElaboration:
          'This note is foundational design vocabulary — affordances, signifiers, and feedback — that comes up often in AI product interviews when discussing UX tradeoffs.',
        sources: [
          {
            noteId: 2,
            title: 'The Design of Everyday Things',
            path: 'notes/design/design-of-everyday-things.md',
            chunk:
              'Good design is actually a lot harder to notice than poor design, in part because good designs fit our needs so well that the design is invisible.'
          }
        ]
      }
    ]
  }
];

export const mockNoteContent = {
  1: `# Building production AI agents

**Source:** Linear
**Type:** podcast

Linear's team treats every agent workflow decision as a reversible bet — ship the smallest version, measure, and only invest further once the signal is real.

Reversible decisions get shipped in hours; irreversible ones get the full discovery loop — the team explicitly labels which kind a decision is before debating it.

> **Why this matters:** This is the clearest real-world example I've found of applying one-way/two-way door thinking specifically to AI product decisions, not just general product decisions.`,
  2: `# The Design of Everyday Things

**Source:** Don Norman
**Type:** book

How everyday objects are designed and why bad design is everywhere.

Good design is actually a lot harder to notice than poor design, in part because good designs fit our needs so well that the design is invisible.

Norman frames good design decisions as ones that make the right action visible and the wrong action hard — a useful lens for prioritization debates.

> **Why this matters:** Foundational design vocabulary (affordances, signifiers, feedback) that comes up constantly in AI product interviews when discussing UX tradeoffs.`
};
