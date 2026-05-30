// ============================================================
// @pgos/dashboard — Validation Page
// Displays requirement completion checks, stubs, and API hallucinations
// ============================================================

'use client';

import React, { useState } from 'react';

export default function ValidationPage() {
  const [activeTab, setActiveTab] = useState<'completion' | 'anti_patterns' | 'hallucinations'>('completion');
  const [selectedProject, setSelectedProject] = useState('pgos-runtime');

  const projects = [
    { id: 'pgos-runtime', name: 'Project Guardian OS' },
    { id: 'autonomous-ai', name: 'Autonomous Coder' },
    { id: 'enterprise-monorepo', name: 'Enterprise Monorepo' },
  ];

  const completenessStats = {
    overall: 88,
    total: 24,
    complete: 21,
    partial: 2,
    absent: 1,
  };

  const requirements = [
    { id: 1, name: 'Universal Context Engine L0-L4 compiler', score: 100, status: 'complete', evidence: 'context-engine/src/compiler/context-compiler.ts' },
    { id: 2, name: 'Model consensus voting engine', score: 100, status: 'complete', evidence: 'model-adapters/src/consensus/engine.ts' },
    { id: 3, name: 'PostgreSQL Drizzle ORM schemas', score: 100, status: 'complete', evidence: 'apps/api/src/db/schema.ts' },
    { id: 4, name: 'Socket.IO WS server stream pipeline', score: 100, status: 'complete', evidence: 'apps/api/src/plugins/websocket.ts' },
    { id: 5, name: 'AI-assisted test generation', score: 40, status: 'partial', evidence: 'packages/test-engine/src/index.ts', blocker: 'Missing Vitest E2E mocks' },
    { id: 6, name: 'RBAC Policy Guard enforcer limits', score: 60, status: 'partial', evidence: 'packages/policy-engine/src/index.ts', blocker: 'Missing LDAP / SSO sync' },
    { id: 7, name: 'Real-time WebSocket telemetry charts', score: 0, status: 'absent', evidence: 'None', blocker: 'Not implemented in Next.js' },
  ];

  const antiPatterns = [
    { file: 'packages/test-engine/src/index.ts', line: 154, type: 'todo', content: 'expect(true).toBe(true); // TODO: Replace with real assertions', severity: 'error', suggestion: 'Replace dummy assertion with Vitest assertions' },
    { file: 'apps/api/src/routes/projects.ts', line: 83, type: 'hack', content: '// HACK: Fast workaround to allow unverified payloads', severity: 'warning', suggestion: 'Refactor validation logic' },
    { file: 'packages/core/src/utils/fs.ts', line: 45, type: 'stub', content: 'export function listFilesRecursive() { /* stub */ }', severity: 'critical', suggestion: 'Implement full recursive listing' },
  ];

  const hallucinations = [
    { file: 'apps/api/src/routes/validation.ts', type: 'invalid_import', package: '@fastify/websocket', detail: 'Importing nonexistent method "wsRouter"', confidence: 95, status: 'critical' },
    { file: 'apps/dashboard/package.json', type: 'hallucinated_dependency', package: 'react-recharts-3d', detail: 'Dependency not found in npm registry', confidence: 99, status: 'critical' },
    { file: 'packages/context-engine/src/index.ts', type: 'unsupported_method', package: 'tree-sitter', detail: 'Invoking deprecated API method "parseBuffer"', confidence: 85, status: 'warning' },
  ];

  return (
    <div className="page-container" style={{ padding: 'var(--space-lg)' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-lg)',
      }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, background: 'linear-gradient(135deg, #fff 0%, var(--text-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Verification Hub
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginTop: 'var(--space-xs)' }}>
            Static analysis, completeness mapping, and API dependency hallucination audits.
          </p>
        </div>

        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: '#fff',
            padding: '0.5rem 1.2rem',
            fontSize: 'var(--font-sm)',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </header>

      {/* Overview Ring & Cards */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
      }}>
        {/* Score Card */}
        <div className="card glass" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-lg)',
          textAlign: 'center',
        }}>
          <div style={{
            position: 'relative',
            width: '150px',
            height: '150px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
              <circle cx="50" cy="50" r="40" stroke="var(--accent)" strokeWidth="8" fill="none"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * completenessStats.overall) / 100}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{completenessStats.overall}%</span>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Completeness</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-md)',
        }}>
          {[
            { label: 'Total Scoped Requirements', val: completenessStats.total, color: '#fff' },
            { label: 'Completed Assertions', val: completenessStats.complete, color: 'var(--success)' },
            { label: 'Partial Coverage Items', val: completenessStats.partial, color: 'var(--accent)' },
            { label: 'Absent/Stubs Detected', val: completenessStats.absent, color: 'var(--error)' },
          ].map((item, idx) => (
            <div key={idx} className="card glass" style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: 'var(--space-lg)',
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
              <span style={{ fontSize: '2.4rem', fontWeight: 800, color: item.color, marginTop: 'var(--space-sm)' }}>{item.val}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: 'var(--space-md)',
      }}>
        {[
          { id: 'completion', label: '📋 Scoped Requirements' },
          { id: 'anti_patterns', label: '⚠️ Anti-Pattern Static Matches' },
          { id: 'hallucinations', label: '🧠 AI Hallucination Audits' },
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
        {activeTab === 'completion' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ paddingBottom: 'var(--space-md)' }}>Requirement description</th>
                <th style={{ paddingBottom: 'var(--space-md)' }}>Score</th>
                <th style={{ paddingBottom: 'var(--space-md)' }}>Status</th>
                <th style={{ paddingBottom: 'var(--space-md)' }}>Verification Evidence File</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: 'var(--font-sm)' }}>
                  <td style={{ padding: '1rem 0', fontWeight: 500 }}>{req.name}</td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: req.score === 100 ? 'var(--success)' : req.score > 30 ? 'var(--accent)' : 'var(--error)'
                    }}>{req.score}%</span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '10px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      background: req.status === 'complete' ? 'rgba(0, 230, 115, 0.1)' : req.status === 'partial' ? 'rgba(255, 153, 51, 0.1)' : 'rgba(255, 80, 80, 0.1)',
                      color: req.status === 'complete' ? 'var(--success)' : req.status === 'partial' ? 'var(--accent)' : 'var(--error)'
                    }}>{req.status}</span>
                  </td>
                  <td>
                    {req.status === 'absent' ? (
                      <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Blocked: {req.blocker}</span>
                    ) : (
                      <code style={{ fontSize: '0.72rem', color: 'var(--accent)', background: 'rgba(255,255,255,0.03)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {req.evidence}
                      </code>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'anti_patterns' && (
          <div>
            {antiPatterns.map((ap, idx) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md)',
                marginBottom: 'var(--space-md)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: ap.severity === 'critical' ? 'rgba(255,80,80,0.15)' : ap.severity === 'error' ? 'rgba(255,153,51,0.15)' : 'rgba(255,255,255,0.05)',
                      color: ap.severity === 'critical' ? 'var(--error)' : ap.severity === 'error' ? 'var(--accent)' : 'var(--text-secondary)'
                    }}>{ap.type}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{ap.file}:{ap.line}</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Severity: <strong style={{ color: ap.severity === 'critical' ? 'var(--error)' : '#fff' }}>{ap.severity}</strong></span>
                </div>
                <pre style={{
                  background: 'rgba(0,0,0,0.2)',
                  padding: 'var(--space-sm)',
                  borderRadius: '4px',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                  border: '1px solid rgba(255,255,255,0.01)',
                  margin: 'var(--space-sm) 0',
                }}>
                  {ap.content}
                </pre>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>
                  💡 <strong>Refactoring Recommendation:</strong> {ap.suggestion}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'hallucinations' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ paddingBottom: 'var(--space-md)' }}>Target File</th>
                <th style={{ paddingBottom: 'var(--space-md)' }}>Hallucination Type</th>
                <th style={{ paddingBottom: 'var(--space-md)' }}>Affected Library</th>
                <th style={{ paddingBottom: 'var(--space-md)' }}>Detection rationale</th>
                <th style={{ paddingBottom: 'var(--space-md)' }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {hallucinations.map((h, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: 'var(--font-sm)' }}>
                  <td style={{ padding: '1.2rem 0', fontWeight: 500 }}>{h.file}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: h.status === 'critical' ? 'rgba(255, 80, 80, 0.1)' : 'rgba(255, 153, 51, 0.1)',
                      color: h.status === 'critical' ? 'var(--error)' : 'var(--accent)'
                    }}>{h.type.replace('_', ' ')}</span>
                  </td>
                  <td><code style={{ fontSize: '0.72rem', color: '#fff' }}>{h.package}</code></td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>{h.detail}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>{h.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
