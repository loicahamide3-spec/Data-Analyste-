import { useMemo, useState } from 'react';
import type { Severity, ValidationReport } from '../lib/xlsform/types';

const SEVERITY_LABEL: Record<Severity, string> = {
  bloquant: '🔴 Bloquant',
  avertissement: '🟠 Avertissement',
  suggestion: '🔵 Suggestion',
};

const ALL: (Severity | 'toutes')[] = ['toutes', 'bloquant', 'avertissement', 'suggestion'];

export function ValidationReportView({ report }: { report: ValidationReport }) {
  const [filter, setFilter] = useState<Severity | 'toutes'>('toutes');

  const filtered = useMemo(
    () => (filter === 'toutes' ? report.issues : report.issues.filter((i) => i.severity === filter)),
    [report, filter],
  );

  return (
    <div>
      <div className="summary-bar">
        <div className="summary-pill bloquant">🔴 {report.counts.bloquant} bloquant(s)</div>
        <div className="summary-pill avertissement">🟠 {report.counts.avertissement} avertissement(s)</div>
        <div className="summary-pill suggestion">🔵 {report.counts.suggestion} suggestion(s)</div>
        <div className="summary-pill neutral">
          ⏱ {report.questionCount} questions · ~{report.estimatedDurationMinutes} min
        </div>
      </div>

      <div className="filter-row">
        {ALL.map((s) => (
          <button
            key={s}
            className={`filter-chip${filter === s ? ' active' : ''}`}
            onClick={() => setFilter(s)}
            type="button"
          >
            {s === 'toutes' ? `Toutes (${report.issues.length})` : `${SEVERITY_LABEL[s]} (${report.counts[s]})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">Aucune anomalie de ce type. 🎉</div>
      ) : (
        <div className="issue-list">
          {filtered.map((issue) => (
            <div key={issue.id} className={`issue ${issue.severity}`}>
              <div className="meta">
                <span className={`severity-tag ${issue.severity}`}>{issue.severity}</span>
                Feuille « {issue.sheet} »{issue.row ? ` · ligne ${issue.row}` : ''}
                {issue.column ? ` · colonne ${issue.column}` : ''}
              </div>
              <div className="message">{issue.message}</div>
              {issue.suggestion && <div className="suggestion-text">💡 {issue.suggestion}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
