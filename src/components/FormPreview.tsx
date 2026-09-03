import type { ParsedWorkbook } from '../lib/xlsform/types';
import { cellToString } from '../lib/xlsform/types';

export function FormPreview({ workbook }: { workbook: ParsedWorkbook }) {
  const survey = workbook.sheets['survey'];
  const choices = workbook.sheets['choices'];

  if (!survey) return <div className="empty-state">Aucune feuille survey à afficher.</div>;

  const rows = survey.rows.filter((r) => cellToString(r.values['type']) !== '');

  return (
    <div>
      {rows.map((row) => {
        const type = cellToString(row.values['type']);
        const name = cellToString(row.values['name']);
        const label = cellToString(row.values['label']) || <em>(sans libellé)</em>;

        if (type === 'begin_group' || type === 'begin_repeat' || type === 'begin repeat') {
          return (
            <div key={row.rowNumber} style={{ margin: '1rem 0 0.4rem', fontWeight: 700, color: 'var(--primary)' }}>
              ▸ Groupe : {label} {type.startsWith('begin_repeat') || type.startsWith('begin repeat') ? '(répétition)' : ''}
            </div>
          );
        }
        if (type === 'end_group' || type === 'end_repeat' || type === 'end repeat') {
          return null;
        }

        const listName = type.includes(' ') ? type.split(' ').slice(1).join(' ') : undefined;
        const options =
          listName && choices ? choices.rows.filter((c) => cellToString(c.values['list_name']) === listName) : [];

        return (
          <div className="preview-question" key={row.rowNumber}>
            <div className="q-type">
              {type} {name ? `· ${name}` : ''}
            </div>
            <div className="q-label">{label}</div>
            {options.length > 0 && (
              <ul>
                {options.map((o, idx) => (
                  <li key={idx}>{cellToString(o.values['label']) || cellToString(o.values['name'])}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
