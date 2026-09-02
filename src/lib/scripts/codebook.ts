import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { DictVariable } from './dictionary';

function choicesText(v: DictVariable): string {
  if (v.choices.length === 0) return '';
  return v.choices.map((c) => `${c.code} = ${c.label}`).join(' ; ');
}

export function exportCodebookToPdf(variables: DictVariable[], formTitle: string) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text(`Dictionnaire des variables — ${formTitle}`, 14, 16);
  doc.setFontSize(10);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [['Variable', 'Libellé', 'Type', 'Modalités', 'Contrainte', 'Répétition']],
    body: variables.map((v) => [
      v.name,
      v.label,
      v.type,
      choicesText(v),
      v.constraint ?? '',
      v.inRepeat ? 'Oui' : '',
    ]),
    styles: { fontSize: 8, cellWidth: 'wrap' },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 70 },
      2: { cellWidth: 30 },
      3: { cellWidth: 90 },
      4: { cellWidth: 30 },
      5: { cellWidth: 20 },
    },
    headStyles: { fillColor: [30, 64, 90] },
  });

  doc.save(`dictionnaire-variables-${formTitle.replace(/[^a-z0-9_-]+/gi, '_') || 'formulaire'}.pdf`);
}

export function exportCodebookToXlsx(variables: DictVariable[], formTitle: string) {
  const rows = variables.map((v) => ({
    variable: v.name,
    libelle: v.label,
    type: v.type,
    modalites: choicesText(v),
    contrainte: v.constraint ?? '',
    dans_repetition: v.inRepeat ? 'oui' : 'non',
    groupe: v.groupPath.join(' > '),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'dictionnaire');
  XLSX.writeFile(wb, `dictionnaire-variables-${formTitle.replace(/[^a-z0-9_-]+/gi, '_') || 'formulaire'}.xlsx`);
}
