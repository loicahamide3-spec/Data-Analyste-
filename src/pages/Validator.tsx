import { useState } from 'react';
import { FileDrop } from '../components/FileDrop';
import { ValidationReportView } from '../components/ValidationReportView';
import { FormPreview } from '../components/FormPreview';
import { parseXlsxFile } from '../lib/xlsform/parseWorkbook';
import { validateXlsForm, DEFAULT_OPTIONS } from '../lib/xlsform/validate';
import { exportValidationReportToPdf } from '../lib/pdf/exportValidationReport';
import type { ParsedWorkbook, ValidationReport } from '../lib/xlsform/types';

export function Validator() {
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [tab, setTab] = useState<'rapport' | 'apercu'>('rapport');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(DEFAULT_OPTIONS.secondsPerQuestion);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      if (!/\.xlsx$/i.test(file.name)) {
        throw new Error('Le fichier doit être au format .xlsx.');
      }
      const wb = await parseXlsxFile(file);
      setWorkbook(wb);
      setReport(validateXlsForm(wb, { ...DEFAULT_OPTIONS, secondsPerQuestion }));
      setTab('rapport');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de lire ce fichier.');
      setWorkbook(null);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  function revalidate(newSeconds: number) {
    setSecondsPerQuestion(newSeconds);
    if (workbook) {
      setReport(validateXlsForm(workbook, { ...DEFAULT_OPTIONS, secondsPerQuestion: newSeconds }));
    }
  }

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Validateur XLSForm</h2>
        <p>
          Déposez votre fichier .xlsx pour vérifier qu'il sera accepté par KoboToolbox et qu'il ne présente pas de
          risque de collecte ou d'analyse. Rien n'est envoyé hors de votre navigateur.
        </p>
        <FileDrop accept=".xlsx" onFile={handleFile} hint="Format accepté : .xlsx" />
        {loading && <p>Analyse en cours…</p>}
        {error && <p style={{ color: 'var(--bloquant)' }}>{error}</p>}
      </div>

      {workbook && report && (
        <div className="card">
          <div className="toolbar">
            <strong>{workbook.fileName}</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Temps moyen par question :{' '}
              <input
                type="number"
                min={5}
                max={180}
                value={secondsPerQuestion}
                onChange={(e) => revalidate(Number(e.target.value) || DEFAULT_OPTIONS.secondsPerQuestion)}
                style={{ width: '60px' }}
              />{' '}
              s
            </span>
            <button className="btn secondary" type="button" onClick={() => exportValidationReportToPdf(report, workbook.fileName)}>
              Exporter le rapport en PDF
            </button>
          </div>

          <div className="tabs">
            <button type="button" className={tab === 'rapport' ? 'active' : ''} onClick={() => setTab('rapport')}>
              Rapport de contrôle
            </button>
            <button type="button" className={tab === 'apercu' ? 'active' : ''} onClick={() => setTab('apercu')}>
              Vue formulaire
            </button>
          </div>

          {tab === 'rapport' ? <ValidationReportView report={report} /> : <FormPreview workbook={workbook} />}
        </div>
      )}
    </div>
  );
}
