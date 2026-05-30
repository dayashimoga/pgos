// ============================================================
// @pgos/dashboard — Architecture Guard Page
// Displays layer maps, rule enforcement, and circular dependency checks
// ============================================================

'use client';

import React, { useState } from 'react';

export default function ArchitecturePage() {
  const [selectedProject, setSelectedProject] = useState('pgos-runtime');

  const layers = [
    { name: 'L1 — UI Layout Dashboard', color: '#66ccff', files: 12, size: '240 KB', entry: 'apps/dashboard/src/app/page.tsx' },
    { name: 'L2 — API Gateway Server', color: '#ff99ff', files: 25, size: '1.2 MB', entry: 'apps/api/src/server.ts' },
    { name: 'L3 — PGOS Core Core Engines', color: '#ffcc66', files: 92, size: '4.8 MB', entry: 'packages/core/src/index.ts' },
    { name: 'L4 — Persistence Infrastructure', color: '#00e673', files: 15, size: '640 KB', entry: 'apps/api/src/db/connection.ts' },
  ];

  const rules = [
    { name: 'ui_no_direct_db', type: 'no_direct_access', source: 'L1 — UI Layout Dashboard', target: 'L4 — Persistence Infrastructure', status: 'passed', description: 'Web dashboard must query database strictly via Fastify REST API endpoints.' },
    { name: 'core_no_circular', type: 'no_circular', source: 'L3 — PGOS Core Core Engines', target: 'L3 — PGOS Core Core Engines', status: 'passed', description: 'Core modules must not introduce structural circular imports.' },
    { name: 'strict_layer_integrity', type: 'preserve_layer', source: '*', target: '*', status: 'passed', description: 'Structural components must adhere strictly to L1-L4 monorepo layer boundaries.' },
    { name: 'policy_enforcement_block', type: 'required_component', source: 'L2 — API Gateway Server', target: 'L3 — @pgos/policy-engine', status: 'failed', description: 'Policy engine guard enforcer must run pre-commit validations on all repository operations.', blocker: 'Rule mapping currently bypasses pre-commit triggers' },
  ];

  const circularChecks = [
    { path: 'packages/core -> packages/context-engine -> packages/core', length: 3, status: 'resolved', resolution: 'Extracted common interfaces to separate types directory' },
    { path: 'packages/validation-engine -> packages/test-engine -> packages/validation-engine', length: 3, status: 'resolved', resolution: 'Decoupled assertion checks from Vitest compilation engines' },
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
            Architecture Guard
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginTop: 'var(--space-xs)' }}>
            Map structure bounds, track layer dependencies, circular references, and fingerprinter drift.
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
          <option value="pgos-runtime">Project Guardian OS</option>
        </select>
      </header>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-lg)',
      }}>
        {/* Left Column: Visual Map */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="card glass" style={{ padding: 'var(--space-lg)', flex: 1 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>🛡️ Structural Architecture Layers</h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-md)',
              margin: 'var(--space-md) 0',
            }}>
              {layers.map((layer, idx) => (
                <div key={idx} style={{
                  border: `1px solid rgba(255,255,255,0.05)`,
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)',
                  background: 'rgba(255,255,255,0.01)',
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                    <div style={{ width: '4px', height: '30px', background: layer.color, borderRadius: '2px' }} />
                    <div>
                      <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{layer.name}</h4>
                      <code style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>Entry: {layer.entry}</code>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    <div>{layer.files} Files</div>
                    <div style={{ color: 'var(--text-tertiary)' }}>{layer.size}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Circular Dependencies */}
          <div className="card glass" style={{ padding: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>🔗 Circular Dependency Checks</h3>
            
            {circularChecks.map((check, idx) => (
              <div key={idx} style={{
                background: 'rgba(0, 230, 115, 0.02)',
                border: '1px solid rgba(0, 230, 115, 0.1)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-sm) var(--space-md)',
                marginBottom: 'var(--space-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <code style={{ fontSize: '0.72rem', color: '#fff', fontFamily: 'monospace' }}>{check.path}</code>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    ✔ Resolved: {check.resolution}
                  </div>
                </div>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--success)' }}>
                  {check.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Rules Enforcement */}
        <section className="card glass" style={{ padding: 'var(--space-lg)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>📜 Architectural Rule Compliance</h3>

          {rules.map((rule, idx) => (
            <div key={idx} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${rule.status === 'passed' ? 'rgba(255,255,255,0.05)' : 'rgba(255,80,80,0.15)'}`,
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-md)',
              marginBottom: 'var(--space-md)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                  <code style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>{rule.name}</code>
                  <span style={{
                    fontSize: '0.58rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '2px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-secondary)'
                  }}>{rule.type.replace('_', ' ')}</span>
                </div>

                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: rule.status === 'passed' ? 'var(--success)' : 'var(--error)'
                }}>{rule.status}</span>
              </div>

              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 'var(--space-xs) 0' }}>
                {rule.description}
              </p>

              {rule.blocker && (
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--error)', marginTop: 'var(--space-xs)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  ⚠️ <strong style={{ fontWeight: 600 }}>Blocker:</strong> {rule.blocker}
                </div>
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
