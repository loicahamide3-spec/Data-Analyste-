import type { DictVariable } from './dictionary';
import { subVariableName } from './dictionary';
import { escapeQuotes } from './scriptUtils';

export function generateRScript(variables: DictVariable[], formTitle: string): string {
  const lines: string[] = [];

  lines.push(`# ${formTitle} — script d'analyse R.`);
  lines.push("# Généré automatiquement à partir du XLSForm — à adapter selon vos besoins.");
  lines.push('# Les noms de variables sont strictement identiques à ceux du XLSForm.');
  lines.push('');

  lines.push('# ===== 1. IMPORT =====');
  lines.push('library(readxl)');
  lines.push('# Adapter le chemin du fichier exporté depuis KoboToolbox.');
  lines.push('donnees <- read_excel("export_kobo.xlsx")');
  lines.push('# Pour un CSV : donnees <- read.csv("export_kobo.csv", encoding = "UTF-8")');
  lines.push('');

  const repeatVars = variables.filter((v) => v.inRepeat);
  if (repeatVars.length > 0) {
    lines.push('# Attention : les questions suivantes sont dans une répétition (begin_repeat).');
    lines.push('# KoboToolbox les exporte dans un fichier séparé, à importer et joindre sur');
    lines.push('# _parent_index / _submission__id avant analyse :');
    for (const v of repeatVars) lines.push(`#   - ${v.name}`);
    lines.push('');
  }

  lines.push('# ===== 2. LIBELLÉS ET CONVERSION EN FACTEURS =====');
  lines.push('variable_labels <- list(');
  const analysable = variables.filter((v) => !v.inRepeat);
  analysable.forEach((v, idx) => {
    const comma = idx === analysable.length - 1 ? '' : ',';
    lines.push(`  ${v.name} = "${escapeQuotes(v.label)}"${comma}`);
  });
  lines.push(')');
  lines.push('');

  for (const v of variables.filter((x) => !x.inRepeat && x.choices.length > 0 && !x.isSelectMultiple)) {
    const levels = v.choices.map((c) => `"${escapeQuotes(c.code)}"`).join(', ');
    const labels = v.choices.map((c) => `"${escapeQuotes(c.label)}"`).join(', ');
    lines.push(`donnees$${v.name} <- factor(donnees$${v.name}, levels = c(${levels}), labels = c(${labels}))`);
  }
  lines.push('');

  const selectMultiples = variables.filter((v) => !v.inRepeat && v.isSelectMultiple);
  if (selectMultiples.length > 0) {
    lines.push('# ===== 3. QUESTIONS À CHOIX MULTIPLES (select_multiple) =====');
    lines.push('# KoboToolbox exporte une colonne binaire par modalité, nommée "variable/modalite".');
    lines.push('# Renommer ces colonnes en "variable_modalite" avant import, ou ajuster les noms ci-dessous.');
    for (const v of selectMultiples) {
      for (const c of v.choices) {
        const sub = subVariableName(v, c.code);
        lines.push(`donnees$${sub} <- factor(donnees$${sub}, levels = c(0, 1), labels = c("Non coché", "Coché"))`);
      }
    }
    lines.push('');
  }

  lines.push('# ===== 4. STATISTIQUES DESCRIPTIVES =====');
  const numeric = variables.filter((v) => !v.inRepeat && v.isNumeric);
  const categorical = variables.filter((v) => !v.inRepeat && !v.isSelectMultiple && v.choices.length > 0);
  for (const v of numeric) lines.push(`summary(donnees$${v.name})`);
  for (const v of categorical) lines.push(`table(donnees$${v.name})`);

  return lines.join('\n') + '\n';
}
