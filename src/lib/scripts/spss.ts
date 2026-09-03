import type { DictVariable } from './dictionary';
import { subVariableName } from './dictionary';
import { escapeSpss } from './scriptUtils';

export function generateSpssScript(variables: DictVariable[], formTitle: string): string {
  const lines: string[] = [];

  lines.push(`* ${formTitle} — script d'analyse SPSS.`);
  lines.push('* Généré automatiquement à partir du XLSForm — à adapter selon vos besoins.');
  lines.push('* Les noms de variables sont strictement identiques à ceux du XLSForm.');
  lines.push('');

  lines.push('* ===== 1. IMPORT =====');
  lines.push('* Adapter le chemin du fichier exporté depuis KoboToolbox (.xlsx).');
  lines.push('GET DATA /TYPE=XLSX');
  lines.push('  /FILE="export_kobo.xlsx"');
  lines.push("  /SHEET=name 'Sheet1'");
  lines.push('  /CELLRANGE=FULL');
  lines.push('  /READNAMES=ON.');
  lines.push('DATASET NAME donnees.');
  lines.push('');

  const repeatVars = variables.filter((v) => v.inRepeat);
  if (repeatVars.length > 0) {
    lines.push('* Attention : les questions suivantes sont dans une répétition (begin_repeat).');
    lines.push('* KoboToolbox les exporte dans un fichier séparé, à importer et joindre sur');
    lines.push('* la colonne _parent_index / _submission__id avant analyse :');
    for (const v of repeatVars) lines.push(`*   - ${v.name}`);
    lines.push('');
  }

  lines.push('* ===== 2. LIBELLÉS DE VARIABLES =====');
  const withLabel = variables.filter((v) => !v.inRepeat && v.label);
  if (withLabel.length > 0) {
    lines.push('VARIABLE LABELS');
    withLabel.forEach((v, idx) => {
      const end = idx === withLabel.length - 1 ? '.' : '';
      lines.push(`  ${v.name} "${escapeSpss(v.label)}"${end}`);
    });
    lines.push('');
  }

  lines.push('* ===== 3. LIBELLÉS DE MODALITÉS =====');
  const withChoices = variables.filter((v) => !v.inRepeat && v.choices.length > 0 && !v.isSelectMultiple);
  for (const v of withChoices) {
    lines.push('VALUE LABELS');
    lines.push(`  ${v.name}`);
    v.choices.forEach((c, idx) => {
      const end = idx === v.choices.length - 1 ? '.' : '';
      lines.push(`    ${c.code} "${escapeSpss(c.label)}"${end}`);
    });
  }
  if (withChoices.length > 0) lines.push('');

  const selectMultiples = variables.filter((v) => !v.inRepeat && v.isSelectMultiple);
  if (selectMultiples.length > 0) {
    lines.push('* ===== 4. QUESTIONS À CHOIX MULTIPLES (select_multiple) =====');
    lines.push('* KoboToolbox exporte une colonne binaire par modalité, nommée "variable/modalite".');
    lines.push('* Renommer ces colonnes en "variable_modalite" avant import, ou ajuster les noms ci-dessous.');
    for (const v of selectMultiples) {
      lines.push(`VARIABLE LABELS`);
      const subs = v.choices.map((c) => subVariableName(v, c.code));
      subs.forEach((sub, idx) => {
        const choiceLabel = v.choices[idx].label;
        const end = idx === subs.length - 1 ? '.' : '';
        lines.push(`  ${sub} "${escapeSpss(v.label)} : ${escapeSpss(choiceLabel)}"${end}`);
      });
      lines.push(`VALUE LABELS`);
      lines.push(`  ${subs.join(' ')}`);
      lines.push('    0 "Non coché"');
      lines.push('    1 "Coché".');
    }
    lines.push('');
  }

  lines.push('* ===== 5. NETTOYAGE =====');
  const numeric = variables.filter((v) => !v.inRepeat && v.isNumeric);
  if (numeric.length > 0) {
    lines.push('* Définir ici les codes de valeurs manquantes propres à votre collecte, ex. -99 pour "ne sait pas".');
    lines.push(`* MISSING VALUES ${numeric.map((v) => v.name).join(' ')} (-99).`);
  }
  lines.push('');

  lines.push('* ===== 6. STATISTIQUES DESCRIPTIVES =====');
  const categorical = variables.filter((v) => !v.inRepeat && !v.isSelectMultiple && v.choices.length > 0);
  if (categorical.length > 0) {
    lines.push(`FREQUENCIES VARIABLES=${categorical.map((v) => v.name).join(' ')}.`);
  }
  if (numeric.length > 0) {
    lines.push(`DESCRIPTIVES VARIABLES=${numeric.map((v) => v.name).join(' ')}.`);
  }

  return lines.join('\n') + '\n';
}
