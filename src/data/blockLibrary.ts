// Bibliothèque de blocs réutilisables pour le générateur XLSForm.
// Décrite en donnée (pas codée dans la logique de validation/génération) :
// ajouter un domaine ou un bloc ne nécessite que d'éditer ce fichier.

export interface BlockRow {
  type: string;
  name: string;
  label: string;
  required?: string;
  relevant?: string;
  constraint?: string;
  constraint_message?: string;
  calculation?: string;
  hint?: string;
  appearance?: string;
}

export interface BlockChoiceRow {
  list_name: string;
  name: string;
  label: string;
}

export interface Block {
  id: string;
  domain: string;
  title: string;
  description: string;
  surveyRows: BlockRow[];
  choiceRows?: BlockChoiceRow[];
  /** true pour les blocs enregistrés par l'utilisateur (stockés en localStorage) */
  custom?: boolean;
}

export const TRANSVERSAL_DOMAIN = 'Transversal';

export const BUILTIN_BLOCKS: Block[] = [
  {
    id: 'consentement',
    domain: TRANSVERSAL_DOMAIN,
    title: 'Consentement éclairé',
    description: "Information de l'enquêté et recueil du consentement.",
    surveyRows: [
      { type: 'note', name: 'note_consentement', label: "Nous menons une enquête. Vos réponses resteront confidentielles et anonymes." },
      { type: 'select_one oui_non', name: 'consentement', label: "Acceptez-vous de participer à cette enquête ?", required: 'yes' },
    ],
    choiceRows: [
      { list_name: 'oui_non', name: '1', label: 'Oui' },
      { list_name: 'oui_non', name: '2', label: 'Non' },
    ],
  },
  {
    id: 'identification_entretien',
    domain: TRANSVERSAL_DOMAIN,
    title: 'Identification de l’entretien',
    description: 'Enquêteur, date, lieu, heures de début et de fin.',
    surveyRows: [
      { type: 'begin_group', name: 'grp_identification', label: 'Identification' },
      { type: 'text', name: 'nom_enqueteur', label: "Nom de l'enquêteur", required: 'yes' },
      { type: 'date', name: 'date_entretien', label: "Date de l'entretien", required: 'yes' },
      { type: 'text', name: 'lieu_entretien', label: "Lieu de l'entretien", required: 'yes' },
      { type: 'start', name: 'heure_debut', label: 'Heure de début' },
      { type: 'end_group', name: '', label: '' },
    ],
  },
  {
    id: 'sociodemo',
    domain: TRANSVERSAL_DOMAIN,
    title: 'Caractéristiques sociodémographiques',
    description: 'Âge, sexe, niveau d’instruction, situation matrimoniale, activité.',
    surveyRows: [
      { type: 'begin_group', name: 'grp_sociodemo', label: 'Caractéristiques sociodémographiques' },
      { type: 'integer', name: 'age_repondant', label: 'Quel âge avez-vous ?', required: 'yes', constraint: '. >= 0 and . <= 120', constraint_message: 'L’âge doit être compris entre 0 et 120 ans.' },
      { type: 'select_one sexe', name: 'sexe_repondant', label: 'Sexe', required: 'yes' },
      { type: 'select_one niveau_instruction', name: 'niveau_instruction', label: "Quel est le niveau d'instruction le plus élevé atteint ?" },
      { type: 'select_one situation_matrimoniale', name: 'situation_matrimoniale', label: 'Quelle est votre situation matrimoniale ?' },
      { type: 'select_one activite_principale', name: 'activite_principale', label: 'Quelle est votre activité principale ?' },
      { type: 'end_group', name: '', label: '' },
    ],
    choiceRows: [
      { list_name: 'sexe', name: '1', label: 'Masculin' },
      { list_name: 'sexe', name: '2', label: 'Féminin' },
      { list_name: 'niveau_instruction', name: '1', label: 'Aucun' },
      { list_name: 'niveau_instruction', name: '2', label: 'Primaire' },
      { list_name: 'niveau_instruction', name: '3', label: 'Secondaire' },
      { list_name: 'niveau_instruction', name: '4', label: 'Supérieur' },
      { list_name: 'situation_matrimoniale', name: '1', label: 'Célibataire' },
      { list_name: 'situation_matrimoniale', name: '2', label: 'Marié(e)' },
      { list_name: 'situation_matrimoniale', name: '3', label: 'Divorcé(e) / séparé(e)' },
      { list_name: 'situation_matrimoniale', name: '4', label: 'Veuf / veuve' },
      { list_name: 'activite_principale', name: '1', label: 'Agriculture / élevage' },
      { list_name: 'activite_principale', name: '2', label: 'Salarié' },
      { list_name: 'activite_principale', name: '3', label: 'Indépendant / entrepreneur' },
      { list_name: 'activite_principale', name: '4', label: 'Sans emploi' },
      { list_name: 'activite_principale', name: '5', label: 'Étudiant' },
    ],
  },
  {
    id: 'composition_menage',
    domain: TRANSVERSAL_DOMAIN,
    title: 'Composition du ménage (répétition)',
    description: 'Liste des membres du ménage avec âge, sexe et lien de parenté.',
    surveyRows: [
      { type: 'integer', name: 'nb_membres_menage', label: 'Combien de personnes vivent dans ce ménage ?', constraint: '. >= 1 and . <= 30', constraint_message: 'Le nombre de membres doit être compris entre 1 et 30.' },
      { type: 'begin_repeat', name: 'rpt_membres', label: 'Membre du ménage', calculation: '' },
      { type: 'text', name: 'nom_membre', label: 'Prénom du membre' },
      { type: 'integer', name: 'age_membre', label: 'Âge', constraint: '. >= 0 and . <= 120', constraint_message: 'L’âge doit être compris entre 0 et 120 ans.' },
      { type: 'select_one sexe', name: 'sexe_membre', label: 'Sexe' },
      { type: 'select_one lien_parente', name: 'lien_parente', label: 'Lien de parenté avec le chef de ménage' },
      { type: 'end_repeat', name: '', label: '' },
    ],
    choiceRows: [
      { list_name: 'lien_parente', name: '1', label: 'Chef de ménage' },
      { list_name: 'lien_parente', name: '2', label: 'Conjoint(e)' },
      { list_name: 'lien_parente', name: '3', label: 'Enfant' },
      { list_name: 'lien_parente', name: '4', label: 'Autre parent' },
      { list_name: 'lien_parente', name: '5', label: 'Sans lien de parenté' },
    ],
  },
  {
    id: 'geoloc_media',
    domain: TRANSVERSAL_DOMAIN,
    title: 'Géolocalisation, photo, signature',
    description: 'Position GPS, photo du lieu, signature de l’enquêté.',
    surveyRows: [
      { type: 'geopoint', name: 'geolocalisation', label: 'Position GPS' },
      { type: 'image', name: 'photo_lieu', label: 'Photo du lieu' },
      { type: 'text', name: 'signature_enquete', label: "Signature (nom complet) de l'enquêté" },
    ],
  },
  {
    id: 'satisfaction_likert',
    domain: TRANSVERSAL_DOMAIN,
    title: 'Satisfaction (échelle de Likert)',
    description: 'Question d’opinion sur une échelle en 5 points.',
    surveyRows: [
      { type: 'select_one echelle_satisfaction', name: 'satisfaction_generale', label: 'Dans l’ensemble, êtes-vous satisfait(e) ?' },
    ],
    choiceRows: [
      { list_name: 'echelle_satisfaction', name: '1', label: 'Très insatisfait' },
      { list_name: 'echelle_satisfaction', name: '2', label: 'Insatisfait' },
      { list_name: 'echelle_satisfaction', name: '3', label: 'Neutre' },
      { list_name: 'echelle_satisfaction', name: '4', label: 'Satisfait' },
      { list_name: 'echelle_satisfaction', name: '5', label: 'Très satisfait' },
    ],
  },
  {
    id: 'cloture',
    domain: TRANSVERSAL_DOMAIN,
    title: 'Clôture et observations',
    description: 'Fin de l’entretien et observations de l’enquêteur.',
    surveyRows: [
      { type: 'end', name: 'heure_fin', label: 'Heure de fin' },
      { type: 'text', name: 'observations_enqueteur', label: "Observations de l'enquêteur" },
    ],
  },

  // ---- Santé ---------------------------------------------------------
  {
    id: 'sante_acces_soins',
    domain: 'Santé',
    title: 'Accès aux soins',
    description: 'Recours aux soins en cas de maladie.',
    surveyRows: [
      { type: 'select_one oui_non', name: 'malade_derniers_30j', label: 'Un membre du ménage a-t-il été malade au cours des 30 derniers jours ?' },
      { type: 'select_one oui_non', name: 'recours_soins', label: 'A-t-il/elle consulté un professionnel de santé ?', relevant: "${malade_derniers_30j} = '1'" },
      { type: 'select_one structure_sante', name: 'structure_consultee', label: 'Quelle structure a été consultée ?', relevant: "${recours_soins} = '1'" },
    ],
    choiceRows: [
      { list_name: 'structure_sante', name: '1', label: 'Centre de santé public' },
      { list_name: 'structure_sante', name: '2', label: 'Hôpital' },
      { list_name: 'structure_sante', name: '3', label: 'Clinique privée' },
      { list_name: 'structure_sante', name: '4', label: 'Tradipraticien' },
      { list_name: 'structure_sante', name: '5', label: 'Pharmacie' },
    ],
  },
  {
    id: 'sante_depenses',
    domain: 'Santé',
    title: 'Dépenses de santé',
    description: 'Montant dépensé pour les soins.',
    surveyRows: [
      { type: 'integer', name: 'depense_sante', label: 'Quel montant a été dépensé pour ces soins (dernier mois) ?', constraint: '. >= 0', constraint_message: 'Le montant doit être positif ou nul.' },
    ],
  },
  {
    id: 'sante_vaccination',
    domain: 'Santé',
    title: 'Couverture vaccinale',
    description: 'Statut vaccinal des enfants du ménage.',
    surveyRows: [
      { type: 'select_one oui_non', name: 'enfant_vaccine', label: 'Cet enfant a-t-il reçu tous les vaccins recommandés pour son âge ?' },
      { type: 'select_one raison_non_vaccination', name: 'raison_non_vaccination', label: 'Si non, pour quelle raison principale ?', relevant: "${enfant_vaccine} = '2'" },
    ],
    choiceRows: [
      { list_name: 'raison_non_vaccination', name: '1', label: 'Centre de santé trop loin' },
      { list_name: 'raison_non_vaccination', name: '2', label: 'Manque d’information' },
      { list_name: 'raison_non_vaccination', name: '3', label: 'Coût' },
      { list_name: 'raison_non_vaccination', name: '4', label: 'Rupture de vaccins' },
      { list_name: 'raison_non_vaccination', name: '5', label: 'Autre' },
    ],
  },

  // ---- Éducation -------------------------------------------------------
  {
    id: 'education_scolarisation',
    domain: 'Éducation',
    title: 'Scolarisation',
    description: 'Fréquentation scolaire des enfants du ménage.',
    surveyRows: [
      { type: 'select_one oui_non', name: 'enfant_scolarise', label: 'Cet enfant est-il actuellement scolarisé ?' },
      { type: 'select_one niveau_scolaire', name: 'niveau_scolaire', label: 'Quel niveau/classe fréquente-t-il/elle ?', relevant: "${enfant_scolarise} = '1'" },
    ],
    choiceRows: [
      { list_name: 'niveau_scolaire', name: '1', label: 'Préscolaire' },
      { list_name: 'niveau_scolaire', name: '2', label: 'Primaire' },
      { list_name: 'niveau_scolaire', name: '3', label: 'Secondaire' },
      { list_name: 'niveau_scolaire', name: '4', label: 'Supérieur' },
    ],
  },
  {
    id: 'education_abandon',
    domain: 'Éducation',
    title: 'Abandon scolaire',
    description: 'Raison d’abandon pour les enfants non scolarisés.',
    surveyRows: [
      { type: 'select_one raison_abandon', name: 'raison_abandon', label: 'Pour quelle raison principale n’est-il/elle pas scolarisé(e) ?', relevant: "${enfant_scolarise} = '2'" },
    ],
    choiceRows: [
      { list_name: 'raison_abandon', name: '1', label: 'Coût des frais scolaires' },
      { list_name: 'raison_abandon', name: '2', label: 'Travail / aide familiale' },
      { list_name: 'raison_abandon', name: '3', label: 'École trop loin' },
      { list_name: 'raison_abandon', name: '4', label: 'Mariage précoce' },
      { list_name: 'raison_abandon', name: '5', label: 'Autre' },
    ],
  },
  {
    id: 'education_depenses',
    domain: 'Éducation',
    title: 'Dépenses scolaires',
    description: 'Frais de scolarité et fournitures.',
    surveyRows: [
      { type: 'integer', name: 'depense_scolaire_annuelle', label: 'Quel est le montant total dépensé pour la scolarité cette année ?', constraint: '. >= 0', constraint_message: 'Le montant doit être positif ou nul.' },
    ],
  },

  // ---- Économie et emploi ----------------------------------------------
  {
    id: 'eco_activite',
    domain: 'Économie et emploi',
    title: 'Activité économique',
    description: 'Statut d’activité et secteur.',
    surveyRows: [
      { type: 'select_one statut_emploi', name: 'statut_emploi', label: 'Quel est votre statut d’activité principal ?' },
    ],
    choiceRows: [
      { list_name: 'statut_emploi', name: '1', label: 'Salarié secteur formel' },
      { list_name: 'statut_emploi', name: '2', label: 'Travailleur indépendant informel' },
      { list_name: 'statut_emploi', name: '3', label: 'Sans emploi, en recherche' },
      { list_name: 'statut_emploi', name: '4', label: 'Inactif' },
    ],
  },
  {
    id: 'eco_revenus',
    domain: 'Économie et emploi',
    title: 'Revenus et épargne',
    description: 'Revenu mensuel et capacité d’épargne.',
    surveyRows: [
      { type: 'integer', name: 'revenu_mensuel', label: 'Quel est le revenu mensuel approximatif du ménage ?', constraint: '. >= 0', constraint_message: 'Le montant doit être positif ou nul.' },
      { type: 'select_one oui_non', name: 'menage_epargne', label: 'Le ménage arrive-t-il à épargner ?' },
    ],
  },
  {
    id: 'eco_credit',
    domain: 'Économie et emploi',
    title: 'Accès au crédit',
    description: 'Recours à l’emprunt et source.',
    surveyRows: [
      { type: 'select_one oui_non', name: 'acces_credit', label: 'Le ménage a-t-il contracté un crédit au cours des 12 derniers mois ?' },
      { type: 'select_one source_credit', name: 'source_credit', label: 'Auprès de qui ?', relevant: "${acces_credit} = '1'" },
    ],
    choiceRows: [
      { list_name: 'source_credit', name: '1', label: 'Banque' },
      { list_name: 'source_credit', name: '2', label: 'Institution de microfinance' },
      { list_name: 'source_credit', name: '3', label: 'Tontine / association' },
      { list_name: 'source_credit', name: '4', label: 'Famille / amis' },
      { list_name: 'source_credit', name: '5', label: 'Prêteur informel' },
    ],
  },

  // ---- Agriculture -------------------------------------------------------
  {
    id: 'agri_parcelles',
    domain: 'Agriculture',
    title: 'Exploitation et parcelles (répétition)',
    description: 'Liste des parcelles exploitées par le ménage.',
    surveyRows: [
      { type: 'integer', name: 'nb_parcelles', label: 'Combien de parcelles le ménage exploite-t-il ?', constraint: '. >= 0 and . <= 50', constraint_message: 'Le nombre de parcelles doit être compris entre 0 et 50.' },
      { type: 'begin_repeat', name: 'rpt_parcelles', label: 'Parcelle' },
      { type: 'decimal', name: 'superficie_parcelle', label: 'Superficie de la parcelle (hectares)', constraint: '. > 0', constraint_message: 'La superficie doit être positive.' },
      { type: 'select_one culture_principale', name: 'culture_principale', label: 'Quelle est la culture principale sur cette parcelle ?' },
      { type: 'end_repeat', name: '', label: '' },
    ],
    choiceRows: [
      { list_name: 'culture_principale', name: '1', label: 'Maïs' },
      { list_name: 'culture_principale', name: '2', label: 'Riz' },
      { list_name: 'culture_principale', name: '3', label: 'Manioc' },
      { list_name: 'culture_principale', name: '4', label: 'Cacao / café' },
      { list_name: 'culture_principale', name: '5', label: 'Maraîchage' },
      { list_name: 'culture_principale', name: '6', label: 'Autre' },
    ],
  },
  {
    id: 'agri_production',
    domain: 'Agriculture',
    title: 'Production, rendements et intrants',
    description: 'Quantité récoltée et usage d’intrants.',
    surveyRows: [
      { type: 'decimal', name: 'quantite_recoltee', label: 'Quelle quantité a été récoltée (kg) lors de la dernière saison ?', constraint: '. >= 0', constraint_message: 'La quantité doit être positive ou nulle.' },
      { type: 'select_one oui_non', name: 'usage_engrais', label: 'Avez-vous utilisé des engrais ?' },
      { type: 'select_one oui_non', name: 'usage_semences_ameliorees', label: 'Avez-vous utilisé des semences améliorées ?' },
    ],
  },
  {
    id: 'agri_commercialisation',
    domain: 'Agriculture',
    title: 'Commercialisation',
    description: 'Vente de la production et circuit de vente.',
    surveyRows: [
      { type: 'select_one oui_non', name: 'vente_production', label: 'Une partie de la production a-t-elle été vendue ?' },
      { type: 'select_one lieu_vente', name: 'lieu_vente', label: 'Où la production a-t-elle été vendue principalement ?', relevant: "${vente_production} = '1'" },
    ],
    choiceRows: [
      { list_name: 'lieu_vente', name: '1', label: 'Marché local' },
      { list_name: 'lieu_vente', name: '2', label: 'Coopérative' },
      { list_name: 'lieu_vente', name: '3', label: 'Intermédiaire / collecteur' },
      { list_name: 'lieu_vente', name: '4', label: 'Vente directe à l’exploitation' },
    ],
  },

  // ---- Ménages et conditions de vie --------------------------------------
  {
    id: 'menage_habitat',
    domain: 'Ménages et conditions de vie',
    title: 'Habitat et équipements',
    description: 'Type de logement et principaux équipements.',
    surveyRows: [
      { type: 'select_one type_logement', name: 'type_logement', label: 'Quel est le type principal de logement ?' },
      { type: 'select_multiple equipements_menage', name: 'equipements_menage', label: 'Quels équipements le ménage possède-t-il ?' },
    ],
    choiceRows: [
      { list_name: 'type_logement', name: '1', label: 'Maison individuelle en dur' },
      { list_name: 'type_logement', name: '2', label: 'Maison en matériaux précaires' },
      { list_name: 'type_logement', name: '3', label: 'Appartement' },
      { list_name: 'equipements_menage', name: '1', label: 'Électricité' },
      { list_name: 'equipements_menage', name: '2', label: 'Téléphone / smartphone' },
      { list_name: 'equipements_menage', name: '3', label: 'Réfrigérateur' },
      { list_name: 'equipements_menage', name: '4', label: 'Moto / véhicule' },
    ],
  },
  {
    id: 'menage_eau_energie',
    domain: 'Ménages et conditions de vie',
    title: 'Eau, énergie, assainissement',
    description: 'Source d’eau potable, énergie de cuisson, type de toilettes.',
    surveyRows: [
      { type: 'select_one source_eau', name: 'source_eau_potable', label: 'Quelle est la principale source d’eau potable du ménage ?' },
      { type: 'select_one type_toilettes', name: 'type_toilettes', label: 'Quel type de toilettes le ménage utilise-t-il ?' },
    ],
    choiceRows: [
      { list_name: 'source_eau', name: '1', label: 'Robinet dans le logement' },
      { list_name: 'source_eau', name: '2', label: 'Borne fontaine / robinet public' },
      { list_name: 'source_eau', name: '3', label: 'Puits' },
      { list_name: 'source_eau', name: '4', label: 'Rivière / source non protégée' },
      { list_name: 'type_toilettes', name: '1', label: 'Toilettes avec chasse d’eau' },
      { list_name: 'type_toilettes', name: '2', label: 'Latrine améliorée' },
      { list_name: 'type_toilettes', name: '3', label: 'Latrine traditionnelle' },
      { list_name: 'type_toilettes', name: '4', label: 'Pas de toilettes / nature' },
    ],
  },
  {
    id: 'menage_securite_alimentaire',
    domain: 'Ménages et conditions de vie',
    title: 'Sécurité alimentaire',
    description: 'Fréquence des repas et difficultés d’accès à la nourriture.',
    surveyRows: [
      { type: 'integer', name: 'nb_repas_jour', label: 'Combien de repas les membres du ménage prennent-ils par jour habituellement ?', constraint: '. >= 0 and . <= 10', constraint_message: 'Le nombre de repas doit être compris entre 0 et 10.' },
      { type: 'select_one frequence_manque_nourriture', name: 'frequence_manque_nourriture', label: 'Au cours des 30 derniers jours, à quelle fréquence le ménage a-t-il manqué de nourriture ?' },
    ],
    choiceRows: [
      { list_name: 'frequence_manque_nourriture', name: '1', label: 'Jamais' },
      { list_name: 'frequence_manque_nourriture', name: '2', label: 'Rarement (1-2 fois)' },
      { list_name: 'frequence_manque_nourriture', name: '3', label: 'Parfois (3-10 fois)' },
      { list_name: 'frequence_manque_nourriture', name: '4', label: 'Souvent (plus de 10 fois)' },
    ],
  },

  // ---- Marché et consommation --------------------------------------------
  {
    id: 'marche_habitudes_achat',
    domain: 'Marché et consommation',
    title: 'Habitudes d’achat',
    description: 'Lieu et fréquence d’achat.',
    surveyRows: [
      { type: 'select_one lieu_achat_habituel', name: 'lieu_achat_habituel', label: 'Où achetez-vous habituellement ce produit ?' },
    ],
    choiceRows: [
      { list_name: 'lieu_achat_habituel', name: '1', label: 'Marché de quartier' },
      { list_name: 'lieu_achat_habituel', name: '2', label: 'Supermarché' },
      { list_name: 'lieu_achat_habituel', name: '3', label: 'Boutique de proximité' },
      { list_name: 'lieu_achat_habituel', name: '4', label: 'Vente en ligne' },
    ],
  },
  {
    id: 'marche_prix_acceptable',
    domain: 'Marché et consommation',
    title: 'Prix acceptable et notoriété',
    description: 'Prix maximum accepté et connaissance de la marque.',
    surveyRows: [
      { type: 'integer', name: 'prix_maximum_accepte', label: 'Quel est le prix maximum que vous accepteriez de payer ?', constraint: '. >= 0', constraint_message: 'Le montant doit être positif ou nul.' },
      { type: 'select_one oui_non', name: 'connait_marque', label: 'Connaissez-vous cette marque ?' },
    ],
  },

  // ---- Évaluation de projet -----------------------------------------------
  {
    id: 'projet_connaissance',
    domain: 'Évaluation de projet',
    title: 'Connaissance et participation au projet',
    description: 'Notoriété du projet et niveau de participation.',
    surveyRows: [
      { type: 'select_one oui_non', name: 'connait_projet', label: 'Avez-vous entendu parler de ce projet ?' },
      { type: 'select_one niveau_participation', name: 'niveau_participation', label: 'Avez-vous participé aux activités du projet ?', relevant: "${connait_projet} = '1'" },
    ],
    choiceRows: [
      { list_name: 'niveau_participation', name: '1', label: 'Participation active / régulière' },
      { list_name: 'niveau_participation', name: '2', label: 'Participation ponctuelle' },
      { list_name: 'niveau_participation', name: '3', label: 'Aucune participation' },
    ],
  },
  {
    id: 'projet_effets',
    domain: 'Évaluation de projet',
    title: 'Bénéfices perçus et effets déclarés',
    description: 'Satisfaction et changements attribués au projet.',
    surveyRows: [
      { type: 'select_one echelle_satisfaction', name: 'satisfaction_projet', label: 'Dans l’ensemble, êtes-vous satisfait(e) des effets du projet ?', relevant: "${connait_projet} = '1'" },
      { type: 'text', name: 'principal_effet_percu', label: 'Quel est, selon vous, le principal changement apporté par le projet ?', relevant: "${connait_projet} = '1'" },
    ],
  },
];

const CUSTOM_BLOCKS_KEY = 'xlsform-outils.blocs-personnalises';

export function loadCustomBlocks(): Block[] {
  try {
    const raw = localStorage.getItem(CUSTOM_BLOCKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Block[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomBlock(block: Block) {
  const existing = loadCustomBlocks().filter((b) => b.id !== block.id);
  existing.push({ ...block, custom: true });
  localStorage.setItem(CUSTOM_BLOCKS_KEY, JSON.stringify(existing));
}

export function deleteCustomBlock(id: string) {
  const existing = loadCustomBlocks().filter((b) => b.id !== id);
  localStorage.setItem(CUSTOM_BLOCKS_KEY, JSON.stringify(existing));
}
