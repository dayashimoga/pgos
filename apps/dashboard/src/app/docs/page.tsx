// ============================================================
// @pgos/dashboard — Documentation OS Explorer
// Displays scorecard audits, Mermaid diagram triggers, and trace matrices
// ============================================================

'use client';

import React, { useState } from 'react';

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<'coverage' | 'traceability' | 'diagrams' | 'improvements'>('coverage');

  const scorecard = {
    docCoverage: 96,
    requirementCoverage: 92,
    staleDocsCount: 1,
    placeholders: 2,
    suggestions: [
      'Document newly integrated @pgos/doc-engine types in L1 manuals',
      'Replace TODO stubs inside packages/test-engine/src/index.ts',
    ],
  };

  const requirementNodes = [
    {
      title: 'Vision: Project Guardian OS Platform',
      status: 'complete',
      score: 92,
      items: [
        { title: 'Cap: Dynamic Model Portability Layer', status: 'complete', score: 100 },
        { title: 'Cap: Requirements Traceability Matrix', status: 'partial', score: 80 },
        { title: 'Cap: Zero-Loss Recovery Snapshots', status: 'complete', score: 100 },
      ],
    },
  ];

  const improvements = [
    { problem: 'Snapshot restore requires shell context steps', currentState: 'CLI rollback command manual trigger', proposal: 'Build one-click UI rollback buttons in Next.js', complexity: 'low', priority: 'critical', roi: 'Reduces recovery execution loop to 2 seconds' },
    { problem: 'Relies on remote OpenAI vector endpoints', currentState: 'External HTTP calls on memory inserts', proposal: 'Compile a local ONNX sentence-transformer runner in packages/core', complexity: 'medium', priority: 'high', roi: '100% offline context retrieval autonomy' },
  ];

  const mermaidSystemContext = `graph TB
    User["User (Developer)"]
    IDE["IDE (VS Code / Cursor)"]
    PGOS["PGOS (Runtime OS)"]
    Models["AI Models (Claude / Gemini)"]
    Storage["PostgreSQL / pgvector"]

    User --> IDE
    IDE --> PGOS
    PGOS --> Models
    PGOS --> Storage`;

  const mermaidC4Container = `graph TB
    subgraph "L1 — UI Layer"
        Dash["Next.js Web Dashboard"]
        CLI["guardian CLI"]
    end
    subgraph "L2 — Fastify Gateway"
        API["Fastify API Server"]
    end
    subgraph "L3 — Core Engines"
        Ctx["Context Engine"]
        Val["Validation Engine"]
        Rec["Recovery Engine"]
    end
    subgraph "L4 — Datastores"
        DB["PostgreSQL / pgvector"]
    end

    Dash --> API
    CLI --> API
    API --> Ctx
    API --> Val
    API --> Rec
    Ctx --> DB`;

  return (
    <div className="page-container" style={{ padding: 'var(--space-lg)' }}>
      {/* Header */}
      <header style={{ marginBottom: 'var(--space-lg)' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, background: 'linear-gradient(135deg, #fff 0%, var(--text-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Documentation OS
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginTop: 'var(--space-xs)' }}>
          Continuous system context sync, dynamic Mermaid modeling, and trace matrices.
        </p>
      </header>

      {/* Scorecards */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
      }}>
        {[
          { label: 'Documentation Coverage', val: `${scorecard.docCoverage}%`, color: 'var(--success)' },
          { label: 'Requirements Traceability', val: `${scorecard.requirementCoverage}%`, color: 'var(--info)' },
          { label: 'Stale/Outdated Files', val: scorecard.staleDocsCount, color: 'var(--accent)' },
          { label: 'Stubs / Placeholders', val: scorecard.placeholders, color: 'var(--error)' },
        ].map((card, idx) => (
          <div key={idx} className="card glass" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</span>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: card.color, marginTop: 'var(--space-sm)' }}>{card.val}</span>
          </div>
        ))}
      </section>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: 'var(--space-md)',
      }}>
        {[
          { id: 'coverage', label: '📊 Scorecard & Audits' },
          { id: 'traceability', label: '🌲 Traceability Matrix' },
          { id: 'diagrams', label: '🏗️ Dynamic Mermaid Maps' },
          { id: 'improvements', label: '💡 Continuous Enhancements' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : 'none',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              padding: '0.8rem 1.5rem',
              fontSize: 'var(--font-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <section className="card glass" style={{ padding: 'var(--space-lg)' }}>
        {activeTab === 'coverage' && (
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>📋 Coverage Recommendations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {scorecard.suggestions.map((s, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)',
                  display: 'flex',
                  gap: 'var(--space-sm)',
                  alignItems: 'center',
                  fontSize: 'var(--font-sm)',
                }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 800 }}>💡</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'traceability' && (
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>🌲 Vision-to-Story Hierarchy</h3>
            {requirementNodes.map((node, idx) => (
              <div key={idx} style={{
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md)',
                background: 'rgba(255,255,255,0.01)',
              }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                  <strong style={{ fontSize: 'var(--font-sm)', color: '#fff' }}>{node.title}</strong>
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>{node.score}% Coverage</span>
                </header>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', paddingLeft: 'var(--space-lg)' }}>
                  {node.items.map((item, iIdx) => (
                    <div key={iIdx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 'var(--font-xs)',
                      background: 'rgba(255,255,255,0.02)',
                      padding: '0.5rem var(--space-md)',
                      borderRadius: '4px',
                    }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.title}</span>
                      <span style={{ color: item.status === 'complete' ? 'var(--success)' : 'var(--accent)' }}>{item.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'diagrams' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
            <div>
              <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>🌐 System Context Graph</h4>
              <pre style={{
                background: 'rgba(0,0,0,0.3)',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                overflowX: 'auto',
                fontFamily: 'monospace',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                {mermaidSystemContext}
              </pre>
            </div>

            <div>
              <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>🏢 C4 Containers Architecture</h4>
              <pre style={{
                background: 'rgba(0,0,0,0.3)',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                overflowX: 'auto',
                fontFamily: 'monospace',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                {mermaidC4Container}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'improvements' && (
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>💡 Evolving Enhancements</h3>
            {improvements.map((imp, idx) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md)',
                marginBottom: 'var(--space-md)',
              }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                  <strong style={{ fontSize: 'var(--font-sm)', color: '#fff' }}>{imp.problem}</strong>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    background: imp.priority === 'critical' ? 'rgba(255,80,80,0.15)' : 'rgba(255,153,51,0.15)',
                    color: imp.priority === 'critical' ? 'var(--error)' : 'var(--accent)'
                  }}>{imp.priority}</span>
                </header>

                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 'var(--space-xs) 0' }}>
                  <strong>Current State:</strong> {imp.currentState} <br />
                  <strong>Proposal:</strong> {imp.proposal}
                </p>

                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--success)', marginTop: 'var(--space-xs)' }}>
                  ⚡ <strong>Projected ROI:</strong> {imp.roi}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
