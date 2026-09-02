export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p>{description}</p>
      <p style={{ color: 'var(--text-muted)' }}>Ce module est en cours de construction, après le validateur XLSForm.</p>
    </div>
  );
}
