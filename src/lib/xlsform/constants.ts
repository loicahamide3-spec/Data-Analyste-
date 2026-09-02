// Constantes de référence pour la validation XLSForm.

export const REQUIRED_SHEETS = ['survey', 'choices', 'settings'] as const;

export const SURVEY_REQUIRED_COLUMNS = ['type', 'name', 'label'];
export const CHOICES_REQUIRED_COLUMNS = ['list_name', 'name', 'label'];
export const SETTINGS_REQUIRED_COLUMNS = ['form_title', 'form_id'];

// Types XLSForm simples (sans préfixe select_one/select_multiple/rank)
export const SIMPLE_TYPES = [
  'integer',
  'decimal',
  'range',
  'text',
  'select_one',
  'select_multiple',
  'select_one_from_file',
  'select_multiple_from_file',
  'rank',
  'note',
  'geopoint',
  'geotrace',
  'geoshape',
  'date',
  'time',
  'dateTime',
  'image',
  'audio',
  'video',
  'file',
  'barcode',
  'calculate',
  'acknowledge',
  'hidden',
  'xml-external',
  'begin_group',
  'end_group',
  'begin_repeat',
  'end_repeat',
  'begin repeat',
  'end repeat',
  'begin_score',
  'end_score',
  'begin_rank',
  'end_rank',
  'start',
  'end',
  'today',
  'deviceid',
  'subscriberid',
  'simserial',
  'phonenumber',
  'username',
  'email',
  'audit',
];

// Types qui ne représentent pas des variables d'analyse
export const NON_ANALYSIS_TYPES = new Set([
  'note',
  'begin_group',
  'end_group',
  'begin_repeat',
  'end_repeat',
  'begin repeat',
  'end repeat',
  'begin_score',
  'end_score',
  'begin_rank',
  'end_rank',
]);

export const NUMERIC_TYPES = new Set(['integer', 'decimal', 'range']);

// Mots réservés XLSForm / XPath ne pouvant pas servir de nom de variable
export const RESERVED_WORDS = new Set([
  'name',
  'label',
  'type',
  'hint',
  'constraint',
  'relevant',
  'calculation',
  'required',
  'default',
  'repeat_count',
  'read_only',
  'appearance',
  'parameters',
  'choice_filter',
  'if',
  'then',
  'else',
  'and',
  'or',
  'not',
  'div',
  'mod',
  'true',
  'false',
  'null',
  'position',
  'today',
  'now',
  'meta',
  'instance',
  'text',
  'group',
  'repeat',
  'body',
]);

export const NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
export const MAX_RECOMMENDED_NAME_LENGTH = 32;

export const SENSITIVE_KEYWORDS = [
  'revenu',
  'salaire',
  'maladie',
  'vih',
  'sida',
  'viol',
  'violence',
  'religion',
  'ethnie',
  'ethnicit',
  'orientation',
  'grossesse',
  'avortement',
  'consommation d\'alcool',
  'drogue',
  'handicap',
  'sexe',
];

export const DONT_KNOW_HINTS = ['ne sait pas', 'nsp', "ne se prononce pas", 'refus', 'ne souhaite pas répondre'];
