import { useState } from 'react';
import { CHOICES_COLUMNS, SETTINGS_COLUMNS, SURVEY_COLUMNS, mergeWithCanonicalColumns, parsePastedTable } from '../../lib/xlsform/sheetState';
import type { SheetState } from '../../lib/xlsform/sheetState';

interface PasteImportPanelProps {
  onImport: (survey: SheetState, choices: SheetState, settings: SheetState) => void;
}

export function PasteImportPanel({ onImport }: PasteImportPanelProps) {
  const [surveyText, setSurveyText] = useState('');
  const [choicesText, setChoicesText] = useState('');
  const [settingsText, setSettingsText] = useState('');

  function interpret() {
    const survey = mergeWithCanonicalColumns(parsePastedTable(surveyText), SURVEY_COLUMNS);
    const choices = mergeWithCanonicalColumns(parsePastedTable(choicesText), CHOICES_COLUMNS);
    const settings = mergeWithCanonicalColumns(parsePastedTable(settingsText), SETTINGS_COLUMNS);
    onImport(survey, choices, settings);
  }

  const hasContent = surveyText.trim() || choicesText.trim() || settingsText.trim();

  return (
    <div>
      <p style={{ color: 'var(--text-muted)' }}>
        Collez ici le contenu de chaque feuille (copié depuis un tableur, un traitement de texte ou une conversation).
        Les colonnes sont reconnues par leur nom d'en-tête, dans n'importe quel ordre ; les colonnes absentes sont
        complétées à vide.
      </p>

      <label style={{ display: 'block', fontWeight: 600, marginTop: '0.8rem' }}>Feuille survey</label>
      <textarea
        value={surveyText}
        onChange={(e) => setSurveyText(e.target.value)}
        placeholder={'type\tname\tlabel\ntext\tnom\tQuel est votre nom ?'}
        rows={8}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
      />

      <label style={{ display: 'block', fontWeight: 600, marginTop: '0.8rem' }}>Feuille choices</label>
      <textarea
        value={choicesText}
        onChange={(e) => setChoicesText(e.target.value)}
        placeholder={'list_name\tname\tlabel\noui_non\t1\tOui'}
        rows={5}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
      />

      <label style={{ display: 'block', fontWeight: 600, marginTop: '0.8rem' }}>Feuille settings</label>
      <textarea
        value={settingsText}
        onChange={(e) => setSettingsText(e.target.value)}
        placeholder={'form_title\tform_id\nMon enquête\tmon_enquete'}
        rows={2}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
      />

      <div className="toolbar" style={{ marginTop: '0.8rem' }}>
        <button type="button" className="btn" onClick={interpret} disabled={!hasContent}>
          Interpréter le collage
        </button>
      </div>
    </div>
  );
}
