import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ValidationReport } from '../xlsform/types';

const SEVERITY_LABEL: Record<string, string> = {
  bloquant: 'Bloquant',
  avertissement: 'Avertissement',
  suggestion: 'Suggestion',
};

export function exportValidationReportToPdf(report: ValidationReport, fileName: string) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const date = new Date().toLocaleDateString('fr-FR');

  doc.setFontSize(16);
  doc.text('Rapport de validation XLSForm', 14, 16);
  doc.setFontSize(10);
  doc.text(`Fichier analysé : ${fileName}`, 14, 24);
  doc.text(`Date du contrôle : ${date}`, 14, 30);
  doc.text(
    `Bloquants : ${report.counts.bloquant}   Avertissements : ${report.counts.avertissement}   Suggestions : ${report.counts.suggestion}`,
    14,
    36,
  );
  doc.text(
    `Questions : ${report.questionCount}   Durée estimée de l'entretien : ${report.estimatedDurationMinutes} min`,
    14,
    42,
  );

  autoTable(doc, {
    startY: 48,
    head: [['Gravité', 'Feuille', 'Ligne', 'Colonne', 'Problème', 'Correction proposée']],
    body: report.issues.map((i) => [
      SEVERITY_LABEL[i.severity] ?? i.severity,
      i.sheet,
      i.row ? String(i.row) : '',
      i.column ?? '',
      i.message,
      i.suggestion ?? '',
    ]),
    styles: { fontSize: 8, cellWidth: 'wrap' },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 20 },
      2: { cellWidth: 14 },
      3: { cellWidth: 22 },
      4: { cellWidth: 100 },
      5: { cellWidth: 90 },
    },
    headStyles: { fillColor: [30, 64, 90] },
  });

  const outName = fileName.replace(/\.xlsx?$/i, '') || 'formulaire';
  doc.save(`rapport-validation-${outName}.pdf`);
}
