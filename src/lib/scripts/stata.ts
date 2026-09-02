import type { DictVariable } from './dictionary';
import { subVariableName } from './dictionary';
import { escapeQuotes } from './scriptUtils';

export function generateStataScript(variables: DictVariable[], formTitle: string): string {
  const lines: string[] = [];

  lines.push(`* ${formTitle} — script d'analyse Stata.`);
  lines.push("* Généré automatiquement à partir du XLSForm — à adapter selon vos besoins.");
  lines.push('* Les noms de variables sont strictement identiques à ceux du XLSForm.');
  lines.push('');

  lines.push('* ===== 1. IMPORT =====');
  lines.push('* Adapter le chemin du fichier exporté depuis KoboToolbox.');
  lines.push('import excel "export_kobo.xlsx", firstrow clear');
  lines.push('* Pour un CSV : import delimited "export_kobo.csv", clear');
  lines.push('');

  const repeatVars = variables.filter((v) => v.inRepeat);
  if (repeatVars.length > 0) {
    lines.push('* Attention : les questions suivantes sont dans une répétition (begin_repeat).');
    lines.push('* KoboToolbox les exporte dans un fichier séparé, à importer et joindre avec');
    lines.push('* merge sur _parent_index / _submission__id avant analyse :');
    for (const v of repeatVars) lines.push(`*   - ${v.name}`);
    lines.push('');
  }

  lines.push('* ===== 2. LIBELLÉS DE VARIABLES =====');
  for (const v of variables.filter((x) => !x.inRepeat && x.label)) {
    lines.push(`label variable ${v.name} "${escapeQuotes(v.label)}"`);
  }
  lines.push('');

  lines.push('* ===== 3. LIBELLÉS DE MODALITÉS =====');
  for (const v of variables.filter((x) => !x.inRepeat && x.choices.length > 0 && !x.isSelectMultiple)) {
    const labelName = `${v.name}_lbl`;
    lines.push(`label define ${labelName} ${v.choices.map((c) => `${c.code} "${escapeQuotes(c.label)}"`).join(' ')}`);
    lines.push(`label values ${v.name} ${labelName}`);
  }
  lines.push('');

  const selectMultiples = variables.filter((v) => !v.inRepeat && v.isSelectMultiple);
  if (selectMultiples.length > 0) {
    lines.push('* ===== 4. QUESTIONS À CHOIX MULTIPLES (select_multiple) =====');
    lines.push('* KoboToolbox exporte une colonne binaire par modalité, nommée "variable/modalite".');
    lines.push('* Renommer ces colonnes en "variable_modalite" avant import, ou ajuster les noms ci-dessous.');
    for (const v of selectMultiples) {
      for (const c of v.choices) {
        const sub = subVariableName(v, c.code);
        lines.push(`label variable ${sub} "${escapeQuotes(v.label)} : ${escapeQuotes(c.label)}"`);
      }
    }
    lines.push('label define oui_non_lbl 0 "Non coché" 1 "Coché"');
    for (const v of selectMultiples) {
      for (const c of v.choices) lines.push(`label values ${subVariableName(v, c.code)} oui_non_lbl`);
    }
    lines.push('');
  }

  const numeric = variables.filter((v) => !v.inRepeat && v.isNumeric);
  lines.push('* ===== 5. NETTOYAGE =====');
  if (numeric.length > 0) {
    lines.push('* Définir ici les codes de valeurs manquantes propres à votre collecte, ex. -99 pour "ne sait pas".');
    lines.push(`* mvdecode ${numeric.map((v) => v.name).join(' ')}, mv(-99)`);
  }
  lines.push('');

  lines.push('* ===== 6. STATISTIQUES DESCRIPTIVES =====');
  const categorical = variables.filter((v) => !v.inRepeat && !v.isSelectMultiple && v.choices.length > 0);
  for (const v of categorical) lines.push(`tabulate ${v.name}`);
  if (numeric.length > 0) lines.push(`summarize ${numeric.map((v) => v.name).join(' ')}`);

  return lines.join('\n') + '\n';
}
