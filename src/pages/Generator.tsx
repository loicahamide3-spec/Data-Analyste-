import { useMemo, useState } from 'react';
import { PasteImportPanel } from '../components/generator/PasteImportPanel';
import { ManualBuilder } from '../components/generator/ManualBuilder';
import { BlockLibraryPanel } from '../components/generator/BlockLibraryPanel';
import { ValidationReportView } from '../components/ValidationReportView';
import {
  CHOICES_COLUMNS,
  SETTINGS_COLUMNS,
  SURVEY_COLUMNS,
  buildWorkbookFromState,
  emptySheetState,
} from '../lib/xlsform/sheetState';
import type { SheetState } from '../lib/xlsform/sheetState';
import { validateXlsForm, DEFAULT_OPTIONS } from '../lib/xlsform/validate';
import { autoFixWorkbook } from '../lib/xlsform/normalize';
import { downloadXlsForm } from '../lib/xlsform/writeXlsx';

type Mode = 'coller' | 'saisie' | 'blocs';

function initSettings(): SheetState {
  const state = emptySheetState(SETTINGS_COLUMNS);
  state.rows.push(Object.fromEntries(SETTINGS_COLUMNS.map((c) => [c, ''])));
  return state;
}

export function Generator() {
  const [survey, setSurvey] = useState<SheetState>(() => emptySheetState(SURVEY_COLUMNS));
  const [choices, setChoices] = useState<SheetState>(() => emptySheetState(CHOICES_COLUMNS));
  const [settings, setSettings] = useState<SheetState>(initSettings);
  const [mode, setMode] = useState<Mode>('coller');
  const [autoFixMessages, setAutoFixMessages] = useState<string[]>([]);
  const [fileBaseName, setFileBaseName] = useState('mon_enquete');

  const hasContent = survey.rows.some((r) => (r['type'] ?? '').trim());

  const report = useMemo(() => {
    if (!hasContent) return null;
    const workbook = buildWorkbookFromState('aperçu', survey, choices, settings);
    return validateXlsForm(workbook, DEFAULT_OPTIONS);
  }, [survey, choices, settings, hasContent]);

  function handlePasteImport(s: SheetState, c: SheetState, st: SheetState) {
    setSurvey(s);
    setChoices(c);
    if (st.rows.length > 0) setSettings(st);
    setAutoFixMessages([]);
    setMode('saisie');
  }

  function handleAutoFix() {
    const result = autoFixWorkbook(survey, choices, settings);
    setSurvey(result.survey);
    setChoices(result.choices);
    setSettings(result.settings);
    setAutoFixMessages(result.changes);
  }

  function handleDownload() {
    downloadXlsForm(fileBaseName || 'formulaire', survey, choices, settings);
  }

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Générateur XLSForm</h2>
        <p>
          Le parcours normal : concevez votre questionnaire en amont (TDR, protocole), puis collez son contenu
          ci-dessous. L'outil l'interprète, lance automatiquement le contrôle du module 1 et propose de corriger les
          anomalies mécaniques en un clic. La saisie manuelle et la bibliothèque de blocs servent aux retouches.
        </p>

        <div className="tabs">
          <button type="button" className={mode === 'coller' ? 'active' : ''} onClick={() => setMode('coller')}>
            1. Coller le questionnaire
          </button>
          <button type="button" className={mode === 'saisie' ? 'active' : ''} onClick={() => setMode('saisie')}>
            2. Saisie / retouche manuelle
          </button>
          <button type="button" className={mode === 'blocs' ? 'active' : ''} onClick={() => setMode('blocs')}>
            3. Bibliothèque de blocs
          </button>
        </div>

        {mode === 'coller' && <PasteImportPanel onImport={handlePasteImport} />}
        {mode === 'saisie' && (
          <ManualBuilder
            survey={survey}
            choices={choices}
            settings={settings}
            onChangeSurvey={setSurvey}
            onChangeChoices={setChoices}
            onChangeSettings={setSettings}
          />
        )}
        {mode === 'blocs' && (
          <BlockLibraryPanel
            survey={survey}
            choices={choices}
            onInsert={(s, c) => {
              setSurvey(s);
              setChoices(c);
            }}
          />
        )}
      </div>

      {hasContent && report && (
        <div className="card">
          <div className="toolbar">
            <strong>Aperçu et contrôle</strong>
            <button type="button" className="btn secondary" onClick={handleAutoFix}>
              Corriger les anomalies mécaniques
            </button>
            <span style={{ fontSize: '0.85rem' }}>
              Nom du fichier :{' '}
              <input value={fileBaseName} onChange={(e) => setFileBaseName(e.target.value)} style={{ width: '160px' }} />
              .xlsx
            </span>
            <button type="button" className="btn" onClick={handleDownload} disabled={report.counts.bloquant > 0}>
              Générer le fichier .xlsx
            </button>
          </div>
          {report.counts.bloquant > 0 && (
            <p style={{ color: 'var(--bloquant)', fontSize: '0.85rem' }}>
              La génération est désactivée tant qu'il reste des erreurs bloquantes.
            </p>
          )}
          {autoFixMessages.length > 0 && (
            <div className="card" style={{ background: 'var(--suggestion-bg)' }}>
              <strong>Corrections appliquées :</strong>
              <ul>
                {autoFixMessages.map((m, i) => (
                  <li key={i} style={{ fontSize: '0.85rem' }}>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ValidationReportView report={report} />
        </div>
      )}
    </div>
  );
}
