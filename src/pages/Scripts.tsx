import { useMemo, useState } from 'react';
import { FileDrop } from '../components/FileDrop';
import { parseXlsxFile } from '../lib/xlsform/parseWorkbook';
import { validateXlsForm, DEFAULT_OPTIONS } from '../lib/xlsform/validate';
import { buildVariableDictionary } from '../lib/scripts/dictionary';
import { generateSpssScript } from '../lib/scripts/spss';
import { generateStataScript } from '../lib/scripts/stata';
import { generateRScript } from '../lib/scripts/r';
import { exportCodebookToPdf, exportCodebookToXlsx } from '../lib/scripts/codebook';
import { downloadTextFile } from '../lib/downloadTextFile';
import type { ParsedWorkbook } from '../lib/xlsform/types';
import { cellToString } from '../lib/xlsform/types';

export function Scripts() {
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [blockingCount, setBlockingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const variables = useMemo(() => (workbook ? buildVariableDictionary(workbook) : []), [workbook]);
  const formTitle = useMemo(() => {
    if (!workbook) return 'Formulaire';
    const settings = workbook.sheets['settings'];
    const row = settings?.rows[0];
    return (row && cellToString(row.values['form_title'])) || workbook.fileName.replace(/\.xlsx?$/i, '');
  }, [workbook]);

  async function handleFile(file: File) {
    setError(null);
    try {
      if (!/\.xlsx$/i.test(file.name)) throw new Error('Le fichier doit être au format .xlsx.');
      const wb = await parseXlsxFile(file);
      const report = validateXlsForm(wb, DEFAULT_OPTIONS);
      setBlockingCount(report.counts.bloquant);
      setWorkbook(wb);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de lire ce fichier.');
      setWorkbook(null);
    }
  }

  const baseName = formTitle.replace(/[^a-z0-9_-]+/gi, '_') || 'formulaire';
  const repeatCount = variables.filter((v) => v.inRepeat).length;
  const selectMultipleCount = variables.filter((v) => v.isSelectMultiple).length;

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Générateur de scripts d'analyse</h2>
        <p>
          Déposez un XLSForm valide : l'outil génère le squelette de script SPSS, Stata et R (import, libellés,
          nettoyage, statistiques descriptives) ainsi qu'un dictionnaire des variables.
        </p>
        <FileDrop accept=".xlsx" onFile={handleFile} hint="Format accepté : .xlsx" />
        {error && <p style={{ color: 'var(--bloquant)' }}>{error}</p>}
      </div>

      {workbook && (
        <div className="card">
          {blockingCount > 0 && (
            <p style={{ color: 'var(--bloquant)' }}>
              ⚠ Ce fichier contient {blockingCount} erreur(s) bloquante(s) (voir le validateur). Les scripts générés
              peuvent être incomplets tant qu'elles ne sont pas corrigées.
            </p>
          )}
          <p>
            <strong>{variables.length}</strong> variables d'analyse détectées
            {repeatCount > 0 && <> · {repeatCount} dans une répétition (export Kobo séparé)</>}
            {selectMultipleCount > 0 && <> · {selectMultipleCount} à choix multiples (décomposées en colonnes binaires)</>}
          </p>

          <div className="toolbar">
            <button className="btn" type="button" onClick={() => downloadTextFile(`${baseName}.sps`, generateSpssScript(variables, formTitle))}>
              Télécharger le script SPSS (.sps)
            </button>
            <button className="btn" type="button" onClick={() => downloadTextFile(`${baseName}.do`, generateStataScript(variables, formTitle))}>
              Télécharger le script Stata (.do)
            </button>
            <button className="btn" type="button" onClick={() => downloadTextFile(`${baseName}.R`, generateRScript(variables, formTitle))}>
              Télécharger le script R (.R)
            </button>
          </div>

          <div className="toolbar">
            <button className="btn secondary" type="button" onClick={() => exportCodebookToPdf(variables, formTitle)}>
              Dictionnaire des variables (PDF)
            </button>
            <button className="btn secondary" type="button" onClick={() => exportCodebookToXlsx(variables, formTitle)}>
              Dictionnaire des variables (Excel)
            </button>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  {['Variable', 'Libellé', 'Type', 'Modalités', 'Répétition'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.3rem' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {variables.map((v) => (
                  <tr key={v.name}>
                    <td style={{ padding: '0.3rem', borderBottom: '1px solid var(--border)' }}>{v.name}</td>
                    <td style={{ padding: '0.3rem', borderBottom: '1px solid var(--border)' }}>{v.label}</td>
                    <td style={{ padding: '0.3rem', borderBottom: '1px solid var(--border)' }}>{v.type}</td>
                    <td style={{ padding: '0.3rem', borderBottom: '1px solid var(--border)' }}>
                      {v.choices.map((c) => `${c.code}=${c.label}`).join(', ')}
                    </td>
                    <td style={{ padding: '0.3rem', borderBottom: '1px solid var(--border)' }}>{v.inRepeat ? 'Oui' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
