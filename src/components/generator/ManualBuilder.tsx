import type { SheetState } from '../../lib/xlsform/sheetState';
import { emptyRow } from '../../lib/xlsform/sheetState';
import { SIMPLE_TYPES } from '../../lib/xlsform/constants';

interface ManualBuilderProps {
  survey: SheetState;
  choices: SheetState;
  settings: SheetState;
  onChangeSurvey: (state: SheetState) => void;
  onChangeChoices: (state: SheetState) => void;
  onChangeSettings: (state: SheetState) => void;
}

const SURVEY_EDIT_COLUMNS = ['type', 'name', 'label', 'required', 'relevant', 'constraint', 'constraint_message'];
const CHOICES_EDIT_COLUMNS = ['list_name', 'name', 'label'];

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function ManualBuilder({ survey, choices, settings, onChangeSurvey, onChangeChoices, onChangeSettings }: ManualBuilderProps) {
  function updateSurveyCell(idx: number, key: string, value: string) {
    const rows = survey.rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r));
    onChangeSurvey({ ...survey, rows });
  }

  function updateChoiceCell(idx: number, key: string, value: string) {
    const rows = choices.rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r));
    onChangeChoices({ ...choices, rows });
  }

  return (
    <div>
      <h3>Questions (survey)</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              {SURVEY_EDIT_COLUMNS.map((c) => (
                <th key={c} style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.3rem' }}>
                  {c}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {survey.rows.map((row, idx) => (
              <tr key={idx}>
                {SURVEY_EDIT_COLUMNS.map((c) => (
                  <td key={c} style={{ padding: '0.2rem', borderBottom: '1px solid var(--border)' }}>
                    {c === 'type' ? (
                      <input
                        list="xlsform-types"
                        value={row[c] ?? ''}
                        onChange={(e) => updateSurveyCell(idx, c, e.target.value)}
                        style={{ width: '140px' }}
                      />
                    ) : (
                      <input
                        value={row[c] ?? ''}
                        onChange={(e) => updateSurveyCell(idx, c, e.target.value)}
                        style={{ width: c === 'label' ? '220px' : '120px' }}
                      />
                    )}
                  </td>
                ))}
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" onClick={() => onChangeSurvey({ ...survey, rows: moveItem(survey.rows, idx, idx - 1) })} title="Monter">
                    ↑
                  </button>
                  <button type="button" onClick={() => onChangeSurvey({ ...survey, rows: moveItem(survey.rows, idx, idx + 1) })} title="Descendre">
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeSurvey({ ...survey, rows: survey.rows.filter((_, i) => i !== idx) })}
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <datalist id="xlsform-types">
        {SIMPLE_TYPES.map((t) => (
          <option key={t} value={t} />
        ))}
        <option value="select_one " />
        <option value="select_multiple " />
      </datalist>
      <button
        type="button"
        className="btn secondary"
        style={{ marginTop: '0.5rem' }}
        onClick={() => onChangeSurvey({ ...survey, rows: [...survey.rows, emptyRow(survey.headers)] })}
      >
        + Ajouter une question
      </button>

      <h3 style={{ marginTop: '1.5rem' }}>Listes de choix (choices)</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              {CHOICES_EDIT_COLUMNS.map((c) => (
                <th key={c} style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.3rem' }}>
                  {c}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {choices.rows.map((row, idx) => (
              <tr key={idx}>
                {CHOICES_EDIT_COLUMNS.map((c) => (
                  <td key={c} style={{ padding: '0.2rem', borderBottom: '1px solid var(--border)' }}>
                    <input value={row[c] ?? ''} onChange={(e) => updateChoiceCell(idx, c, e.target.value)} style={{ width: '140px' }} />
                  </td>
                ))}
                <td>
                  <button
                    type="button"
                    onClick={() => onChangeChoices({ ...choices, rows: choices.rows.filter((_, i) => i !== idx) })}
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="btn secondary"
        style={{ marginTop: '0.5rem' }}
        onClick={() => onChangeChoices({ ...choices, rows: [...choices.rows, emptyRow(choices.headers)] })}
      >
        + Ajouter une modalité
      </button>

      <h3 style={{ marginTop: '1.5rem' }}>Paramètres (settings)</h3>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {settings.headers.map((h) => (
          <label key={h} style={{ fontSize: '0.85rem' }}>
            {h}
            <br />
            <input
              value={settings.rows[0]?.[h] ?? ''}
              onChange={(e) => {
                const row = { ...(settings.rows[0] ?? emptyRow(settings.headers)), [h]: e.target.value };
                onChangeSettings({ ...settings, rows: [row] });
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
