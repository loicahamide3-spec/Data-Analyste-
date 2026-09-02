import { useMemo, useState } from 'react';
import { FileDrop } from '../components/FileDrop';
import { importKoboFile } from '../lib/kobo/importKobo';
import type { KoboDataset } from '../lib/kobo/importKobo';
import { buildQualityReport } from '../lib/kobo/qualityChecks';
import { prepareDataset } from '../lib/kobo/prepare';
import type { PrepareOptions, SelectMultipleMode } from '../lib/kobo/prepare';
import { downloadCleaningReport, downloadDatasetAsCsv, downloadDatasetAsXlsx } from '../lib/kobo/exportCleaned';
import { looksIdentifying } from '../lib/kobo/technicalColumns';
import { parseXlsxFile } from '../lib/xlsform/parseWorkbook';
import { buildVariableDictionary } from '../lib/scripts/dictionary';
import type { DictVariable } from '../lib/scripts/dictionary';

export function DataProcessing() {
  const [dataset, setDataset] = useState<KoboDataset | null>(null);
  const [variables, setVariables] = useState<DictVariable[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<{ dataset: KoboDataset; operations: string[] } | null>(null);

  const [removeTechnicalColumns, setRemoveTechnicalColumns] = useState(true);
  const [selectMultipleMode, setSelectMultipleMode] = useState<SelectMultipleMode>('decompose');
  const [replaceCodesWithLabels, setReplaceCodesWithLabels] = useState(false);
  const [anonymizeMode, setAnonymizeMode] = useState<'remove' | 'mask'>('remove');
  const [columnsToAnonymize, setColumnsToAnonymize] = useState<string[]>([]);

  const qualityReport = useMemo(() => (dataset ? buildQualityReport(dataset, variables) : null), [dataset, variables]);
  const suggestedAnonymize = useMemo(() => (dataset ? dataset.headers.filter(looksIdentifying) : []), [dataset]);

  async function handleDataFile(file: File) {
    setError(null);
    try {
      const ds = await importKoboFile(file);
      setDataset(ds);
      setPrepared(null);
      setColumnsToAnonymize(ds.headers.filter(looksIdentifying));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de lire ce fichier.');
    }
  }

  async function handleFormFile(file: File) {
    try {
      const wb = await parseXlsxFile(file);
      setVariables(buildVariableDictionary(wb));
    } catch {
      setError('Impossible de lire le XLSForm fourni pour enrichir les contrôles.');
    }
  }

  function applyPreparation() {
    if (!dataset) return;
    const options: PrepareOptions = {
      removeTechnicalColumns,
      selectMultipleMode,
      replaceCodesWithLabels,
      columnsToAnonymize,
      anonymizeMode,
    };
    setPrepared(prepareDataset(dataset, variables, options));
  }

  const outputDataset = prepared?.dataset ?? dataset;

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Traitement des données Kobo</h2>
        <p>
          Importez votre export KoboToolbox (.csv ou .xlsx) pour en contrôler la qualité et le préparer pour
          l'analyse. Fournir en plus le XLSForm d'origine (facultatif) enrichit les contrôles : contraintes de plage,
          libellés de modalités, décomposition des choix multiples.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <strong>Export de collecte</strong>
            <FileDrop accept=".csv,.xlsx" onFile={handleDataFile} hint="Formats acceptés : .csv, .xlsx" />
          </div>
          <div>
            <strong>XLSForm d'origine (facultatif)</strong>
            <FileDrop accept=".xlsx" onFile={handleFormFile} hint="Format accepté : .xlsx" />
          </div>
        </div>
        {error && <p style={{ color: 'var(--bloquant)' }}>{error}</p>}
      </div>

      {dataset && qualityReport && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Contrôles de qualité</h3>
          <div className="summary-bar">
            <div className="summary-pill neutral">📄 {qualityReport.stats.totalSubmissions} questionnaires</div>
            <div className="summary-pill neutral">
              ⏱{' '}
              {qualityReport.stats.averageDurationMinutes !== null
                ? `${qualityReport.stats.averageDurationMinutes} min en moyenne`
                : 'durée non calculable'}
            </div>
            <div className="summary-pill avertissement">🔁 {qualityReport.duplicates.length} doublon(s)</div>
            <div className="summary-pill avertissement">📉 {qualityReport.outliers.length} variable(s) avec valeurs aberrantes</div>
          </div>

          {qualityReport.stats.byEnumerator.length > 0 && (
            <>
              <h4>Répartition par enquêteur</h4>
              <ul>
                {qualityReport.stats.byEnumerator.map((e) => (
                  <li key={e.name}>
                    {e.name} : {e.count}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h4>Taux de complétude par variable</h4>
          <div style={{ overflowX: 'auto', maxHeight: '260px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.2rem' }}>Variable</th>
                  <th style={{ textAlign: 'left', padding: '0.2rem' }}>Rempli</th>
                  <th style={{ textAlign: 'left', padding: '0.2rem' }}>Taux</th>
                </tr>
              </thead>
              <tbody>
                {qualityReport.completeness.map((c) => (
                  <tr key={c.column}>
                    <td style={{ padding: '0.2rem', borderBottom: '1px solid var(--border)' }}>{c.column}</td>
                    <td style={{ padding: '0.2rem', borderBottom: '1px solid var(--border)' }}>
                      {c.filled}/{c.total}
                    </td>
                    <td style={{ padding: '0.2rem', borderBottom: '1px solid var(--border)', color: c.rate < 80 ? 'var(--avertissement)' : undefined }}>
                      {c.rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {qualityReport.outliers.length > 0 && (
            <>
              <h4>Valeurs aberrantes</h4>
              <ul>
                {qualityReport.outliers.map((o) => (
                  <li key={o.column}>
                    <strong>{o.column}</strong> : {o.count} valeur(s) — {o.detail}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {dataset && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Préparation</h3>
          <label style={{ display: 'block', marginBottom: '0.4rem' }}>
            <input type="checkbox" checked={removeTechnicalColumns} onChange={(e) => setRemoveTechnicalColumns(e.target.checked)} /> Supprimer
            les colonnes techniques Kobo (_id, _uuid, _submission_time…)
          </label>
          <div style={{ marginBottom: '0.4rem' }}>
            <span>Questions à choix multiples {variables.length === 0 && '(fournir le XLSForm pour activer)'} :</span>
            <br />
            <label style={{ marginRight: '1rem', fontSize: '0.9rem' }}>
              <input
                type="radio"
                checked={selectMultipleMode === 'none'}
                onChange={() => setSelectMultipleMode('none')}
              />{' '}
              Ne rien changer
            </label>
            <label style={{ marginRight: '1rem', fontSize: '0.9rem' }}>
              <input
                type="radio"
                checked={selectMultipleMode === 'decompose'}
                onChange={() => setSelectMultipleMode('decompose')}
                disabled={variables.length === 0}
              />{' '}
              Décomposer en colonnes binaires
            </label>
            <label style={{ fontSize: '0.9rem' }}>
              <input
                type="radio"
                checked={selectMultipleMode === 'recompose'}
                onChange={() => setSelectMultipleMode('recompose')}
                disabled={variables.length === 0}
              />{' '}
              Recomposer en une liste de codes
            </label>
          </div>
          <label style={{ display: 'block', marginBottom: '0.4rem' }}>
            <input
              type="checkbox"
              checked={replaceCodesWithLabels}
              onChange={(e) => setReplaceCodesWithLabels(e.target.checked)}
              disabled={variables.length === 0}
            />{' '}
            Remplacer les codes par les libellés {variables.length === 0 && '(fournir le XLSForm)'}
          </label>

          <div style={{ marginTop: '0.6rem' }}>
            <strong>Anonymisation</strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>
              Colonnes potentiellement identifiantes détectées : {suggestedAnonymize.join(', ') || 'aucune détectée automatiquement'}.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', maxHeight: '140px', overflowY: 'auto' }}>
              {dataset.headers.map((h) => (
                <label key={h} style={{ fontSize: '0.8rem' }}>
                  <input
                    type="checkbox"
                    checked={columnsToAnonymize.includes(h)}
                    onChange={(e) =>
                      setColumnsToAnonymize((prev) => (e.target.checked ? [...prev, h] : prev.filter((c) => c !== h)))
                    }
                  />{' '}
                  {h}
                </label>
              ))}
            </div>
            <label style={{ fontSize: '0.85rem', marginTop: '0.4rem', display: 'block' }}>
              <input type="radio" checked={anonymizeMode === 'remove'} onChange={() => setAnonymizeMode('remove')} /> Supprimer ces colonnes
            </label>
            <label style={{ fontSize: '0.85rem' }}>
              <input type="radio" checked={anonymizeMode === 'mask'} onChange={() => setAnonymizeMode('mask')} /> Masquer leur contenu
              (« MASQUÉ »)
            </label>
          </div>

          <div className="toolbar" style={{ marginTop: '1rem' }}>
            <button className="btn" type="button" onClick={applyPreparation}>
              Appliquer la préparation
            </button>
          </div>

          {prepared && (
            <div className="card" style={{ background: 'var(--suggestion-bg)' }}>
              <strong>Opérations appliquées :</strong>
              <ul>
                {prepared.operations.map((o, i) => (
                  <li key={i} style={{ fontSize: '0.85rem' }}>
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {outputDataset && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Export</h3>
          <div className="toolbar">
            <button className="btn" type="button" onClick={() => downloadDatasetAsCsv(outputDataset)}>
              Exporter en .csv
            </button>
            <button className="btn" type="button" onClick={() => downloadDatasetAsXlsx(outputDataset)}>
              Exporter en .xlsx
            </button>
            <button
              className="btn secondary"
              type="button"
              onClick={() => downloadCleaningReport(outputDataset, prepared?.operations ?? [])}
            >
              Rapport de nettoyage (.txt)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
