import { useState } from 'react';
import type { Block } from '../../data/blockLibrary';
import { BUILTIN_BLOCKS, deleteCustomBlock, loadCustomBlocks, saveCustomBlock } from '../../data/blockLibrary';
import type { SheetState } from '../../lib/xlsform/sheetState';
import { normalizeVariableName } from '../../lib/xlsform/normalize';

interface BlockLibraryPanelProps {
  survey: SheetState;
  choices: SheetState;
  onInsert: (survey: SheetState, choices: SheetState) => void;
}

export function BlockLibraryPanel({ survey, choices, onInsert }: BlockLibraryPanelProps) {
  const [, forceRefresh] = useState(0);
  const customBlocks = loadCustomBlocks();
  const allBlocks = [...BUILTIN_BLOCKS, ...customBlocks];

  const domains = Array.from(new Set(allBlocks.map((b) => b.domain)));
  const [activeDomain, setActiveDomain] = useState(domains[0]);
  const blocksForDomain = allBlocks.filter((b) => b.domain === activeDomain);

  function insertBlock(block: Block) {
    const existingNames = new Set(survey.rows.map((r) => (r['name'] ?? '').trim()).filter(Boolean));

    const newSurveyRows = block.surveyRows.map((br) => {
      const row: Record<string, string> = {};
      for (const h of survey.headers) row[h] = '';
      for (const [k, v] of Object.entries(br)) row[k] = v ?? '';

      let name = row['name'];
      if (name) {
        let candidate = name;
        let suffix = 2;
        while (existingNames.has(candidate)) {
          candidate = `${normalizeVariableName(name)}_${suffix}`;
          suffix += 1;
        }
        existingNames.add(candidate);
        row['name'] = candidate;
      }
      return row;
    });

    const newChoiceRows = (block.choiceRows ?? []).map((cr) => {
      const row: Record<string, string> = {};
      for (const h of choices.headers) row[h] = '';
      row['list_name'] = cr.list_name;
      row['name'] = cr.name;
      row['label'] = cr.label;
      return row;
    });

    onInsert({ ...survey, rows: [...survey.rows, ...newSurveyRows] }, { ...choices, rows: [...choices.rows, ...newChoiceRows] });
  }

  function saveCurrentAsBlock() {
    const title = window.prompt('Nom du bloc à enregistrer ?');
    if (!title) return;
    const domain = window.prompt('Domaine (ex. Personnalisé) ?', 'Personnalisé') || 'Personnalisé';
    const id = `custom_${normalizeVariableName(title)}_${Date.now()}`;
    const block: Block = {
      id,
      domain,
      title,
      description: 'Bloc personnalisé enregistré depuis le questionnaire courant.',
      surveyRows: survey.rows
        .filter((r) => (r['type'] ?? '').trim())
        .map((r) => ({ type: r['type'] ?? '', name: r['name'] ?? '', label: r['label'] ?? '', required: r['required'], relevant: r['relevant'], constraint: r['constraint'], constraint_message: r['constraint_message'], calculation: r['calculation'] })),
      choiceRows: choices.rows
        .filter((r) => (r['list_name'] ?? '').trim())
        .map((r) => ({ list_name: r['list_name'] ?? '', name: r['name'] ?? '', label: r['label'] ?? '' })),
      custom: true,
    };
    saveCustomBlock(block);
    forceRefresh((v) => v + 1);
  }

  return (
    <div>
      <p style={{ color: 'var(--text-muted)' }}>
        Insérez un bloc de questions prêt à l'emploi, puis ajustez-le librement. Vous pouvez aussi enregistrer le
        questionnaire courant comme bloc personnalisé pour le réutiliser plus tard.
      </p>
      <div className="filter-row">
        {domains.map((d) => (
          <button key={d} type="button" className={`filter-chip${d === activeDomain ? ' active' : ''}`} onClick={() => setActiveDomain(d)}>
            {d}
          </button>
        ))}
      </div>

      <div className="module-grid">
        {blocksForDomain.map((b) => (
          <div key={b.id} className="card" style={{ margin: 0 }}>
            <h4 style={{ margin: '0 0 0.3rem' }}>{b.title}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.6rem' }}>{b.description}</p>
            <div className="toolbar" style={{ margin: 0 }}>
              <button type="button" className="btn" onClick={() => insertBlock(b)}>
                Insérer
              </button>
              {b.custom && (
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    deleteCustomBlock(b.id);
                    forceRefresh((v) => v + 1);
                  }}
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn secondary" style={{ marginTop: '1rem' }} onClick={saveCurrentAsBlock}>
        Enregistrer le questionnaire courant comme bloc personnalisé
      </button>
    </div>
  );
}
