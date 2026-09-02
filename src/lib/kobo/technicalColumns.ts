// Colonnes techniques ajoutées par KoboToolbox à l'export, sans intérêt d'analyse.
const TECHNICAL_EXACT = new Set([
  '_id',
  '_uuid',
  '_submission_time',
  '_validation_status',
  '_notes',
  '_status',
  '_submitted_by',
  '_tags',
  '_index',
  '_parent_index',
  '_parent_table_name',
  '__version__',
  'formhub/uuid',
  'meta/instanceID',
  'meta/deprecatedID',
  'start',
  'end',
]);

const TECHNICAL_PREFIXES = ['_geolocation', '_attachments', '_supplementalDetails'];

export function isTechnicalColumn(name: string): boolean {
  if (TECHNICAL_EXACT.has(name)) return true;
  return TECHNICAL_PREFIXES.some((p) => name === p || name.startsWith(`${p}/`) || name.startsWith(`${p}[`));
}

// Motifs de colonnes potentiellement identifiantes, proposées par défaut à l'anonymisation.
const IDENTIFYING_PATTERNS = [/nom/i, /prenom/i, /prénom/i, /telephone/i, /téléphone/i, /contact/i, /gps/i, /geolocalisation/i, /géolocalisation/i, /adresse/i, /cni\b/i, /identite/i];

export function looksIdentifying(name: string): boolean {
  return IDENTIFYING_PATTERNS.some((re) => re.test(name));
}
