import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PGOS — Project Guardian OS',
  description: 'AI-native project runtime, validation, portability, recovery, context, and quality operating system',
  keywords: ['AI', 'coding', 'project management', 'validation', 'context engine'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function Sidebar() {
  const navSections = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', icon: '📊', href: '/', active: true },
        { name: 'Projects', icon: '📁', href: '/projects' },
        { name: 'Documentation', icon: '📚', href: '/docs' },
      ],
    },
    {
      title: 'Intelligence',
      items: [
        { name: 'Context', icon: '🧠', href: '/context' },
        { name: 'Memory', icon: '💾', href: '/memory' },
        { name: 'Agents', icon: '🤖', href: '/agents' },
      ],
    },
    {
      title: 'Quality',
      items: [
        { name: 'Validation', icon: '✅', href: '/validation' },
        { name: 'Architecture', icon: '🏗️', href: '/architecture' },
        { name: 'Tests', icon: '🧪', href: '/tests' },
      ],
    },
    {
      title: 'Recovery',
      items: [
        { name: 'Snapshots', icon: '📸', href: '/snapshots' },
        { name: 'Recovery', icon: '🔄', href: '/recovery' },
        { name: 'Semantic Git', icon: '🔀', href: '/git' },
      ],
    },
    {
      title: 'System',
      items: [
        { name: 'Observability', icon: '📈', href: '/observability' },
        { name: 'Settings', icon: '⚙️', href: '/settings' },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">⚡</div>
        <h1>Guardian OS</h1>
      </div>
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.title} className="nav-section">
            <div className="nav-section-title">{section.title}</div>
            {section.items.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`nav-item ${item.active ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </a>
            ))}
          </div>
        ))}
      </nav>
      <div style={{
        padding: 'var(--space-md)',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.72rem',
        color: 'var(--text-tertiary)',
        textAlign: 'center',
      }}>
        PGOS v0.1.0
      </div>
    </aside>
  );
}
