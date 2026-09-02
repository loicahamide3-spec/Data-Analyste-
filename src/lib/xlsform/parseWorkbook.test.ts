import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { parseXlsxFile } from './parseWorkbook';
import { validateXlsForm, DEFAULT_OPTIONS } from './validate';

function buildSampleXlsxFile(): File {
  const wb = XLSX.utils.book_new();
  const survey = [
    ['type', 'name', 'label', 'constraint', 'constraint_message'],
    ['integer', 'age', 'Âge', '. >= 0 and . <= 120', "L'âge doit être entre 0 et 120 ans"],
    ['select_one sexe', 'sexe', 'Sexe', '', ''],
  ];
  const choices = [
    ['list_name', 'name', 'label'],
    ['sexe', '1', 'Homme'],
    ['sexe', '2', 'Femme'],
  ];
  const settings = [
    ['form_title', 'form_id'],
    ['Enquête démo', 'enquete_demo'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(survey), 'survey');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(choices), 'choices');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(settings), 'settings');

  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new File([buffer], 'sample.xlsx');
}

describe('parseXlsxFile (lecture réelle via SheetJS)', () => {
  it('lit correctement les trois feuilles et produit un formulaire valide', async () => {
    const file = buildSampleXlsxFile();
    const workbook = await parseXlsxFile(file);

    expect(workbook.sheetNames).toEqual(['survey', 'choices', 'settings']);
    expect(workbook.sheets.survey.rows).toHaveLength(2);
    expect(workbook.sheets.survey.rows[0].values.name).toBe('age');
    expect(workbook.sheets.choices.rows).toHaveLength(2);

    const report = validateXlsForm(workbook, DEFAULT_OPTIONS);
    expect(report.counts.bloquant).toBe(0);
    expect(report.questionCount).toBe(2);
  });
});
