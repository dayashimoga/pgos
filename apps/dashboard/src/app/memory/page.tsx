// ============================================================
// @pgos/dashboard — Memory Browser Page
// Displays consolidated coding decisions, lessons, and semantic traces
// ============================================================

'use client';

import React, { useState } from 'react';

export default function MemoryBrowserPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'decision' | 'lesson' | 'constraint'>('all');

  const memories = [
    { id: 1, type: 'decision', title: 'Adopted Drizzle ORM over Prisma', content: 'Drizzle provides native TypeScript inference, zero-dependency execution overhead, and direct compatibility with Postgres vector extensions (pgvector) essential for persistent semantic search memory operations.', relevance: 98, date: '2026-05-26' },
    { id: 2, type: 'lesson', title: 'Isolated Node runtimes in Docker Desktop TTY checks', content: 'In non-interactive runner environments (CI/CD / agent loops), executing interactive `docker run -it` allocates pseudo-TTY errors. The `-it` terminal flag has been cleanly removed to ensure automated execution works flawlessly without manual intervention.', relevance: 95, date: '2026-05-26' },
    { id: 3, type: 'constraint', title: 'Strict layer access rules in UI-to-DB calls', content: 'Dashboard interfaces (L1) must query databases strictly via Fastify gateway endpoints (L2). Direct pgvector connection pools inside Next.js routes are structurally forbidden to preserve portability and clean encapsulation boundaries.', relevance: 92, date: '2026-05-26' },
    { id: 4, type: 'decision', title: 'Fastify Socket.IO attachment strategy', content: 'WebSockets have been wrapped as a custom FP decorator plugin attached directly to Fastify server.server instances. This prevents encapsulation and exports the global `.io` instance to all transactional routes.', relevance: 88, date: '2026-05-26' },
  ];

  const filteredMemories = memories.filter((m) => {
    const matchesFilter = activeFilter === 'all' || m.type === activeFilter;
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
            Semantic Memory Browser
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginTop: 'var(--space-xs)' }}>
            Search vector-stored decisions, lessons, and system constraints preserving project continuity.
          </p>
        </div>
      </header>

      {/* Control Bar */}
      <section style={{
        display: 'flex',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
        alignItems: 'center',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder="🔍 Search memories semantically (e.g. Drizzle ORM, Docker TTY)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              padding: '0.8rem 1.2rem',
              fontSize: 'var(--font-sm)',
              outline: 'none',
              backdropFilter: 'blur(10px)',
            }}
          />
        </div>

        {/* Filter Buttons */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.2rem',
        }}>
          {[
            { id: 'all', label: 'All Traces' },
            { id: 'decision', label: 'Decisions' },
            { id: 'lesson', label: 'Lessons' },
            { id: 'constraint', label: 'Constraints' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setActiveFilter(btn.id as any)}
              style={{
                background: activeFilter === btn.id ? 'var(--accent)' : 'none',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: activeFilter === btn.id ? '#fff' : 'var(--text-secondary)',
                padding: '0.5rem 1.2rem',
                fontSize: 'var(--font-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 'var(--space-md)',
      }}>
        {filteredMemories.length > 0 ? (
          filteredMemories.map((m) => (
            <article key={m.id} className="card glass" style={{
              padding: 'var(--space-lg)',
              display: 'grid',
              gridTemplateColumns: '1fr 120px',
              gap: 'var(--space-md)',
              alignItems: 'center',
            }}>
              <div>
                <header style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                  <span style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: m.type === 'decision' ? 'rgba(0,180,255,0.1)' : m.type === 'lesson' ? 'rgba(0,230,115,0.1)' : 'rgba(255,153,51,0.1)',
                    color: m.type === 'decision' ? 'var(--info)' : m.type === 'lesson' ? 'var(--success)' : 'var(--accent)'
                  }}>{m.type}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Recorded on {m.date}</span>
                </header>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>{m.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', lineHeight: '1.5' }}>
                  {m.content}
                </p>
              </div>

              {/* Relevance Score Ring */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Relevance</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)' }}>{m.relevance}%</span>
              </div>
            </article>
          ))
        ) : (
          <div className="card glass" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No memories found matching the current search parameters.
          </div>
        )}
      </section>
    </div>
  );
}
