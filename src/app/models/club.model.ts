export interface Club {
  id?: number;
  nom: string;
  description?: string;
  type?: string;
  image?: string; // URL ou base64 data URL
  statut?: string; // ex: active|inactive|pending (ou autre)
  dateCreation?: string; // YYYY-MM-DD
  idResponsable?: number;
  departements?: string;
}

export interface DemandeParticipation {
  idEtudiant: number;
  idClub: number;
  reponses: {
    experience: number;
    motivation: number;
    disponibilite: number;
  };
  texteMotivation: string;
  departementSouhaite?: string;
}

export interface ResultDemande {
  id: number;
  score: number;
  message: string;
}

export type TypeReunion = 'PRESENTIEL' | 'EN_LIGNE';

export interface ReunionClub {
  id?: number;
  date: string; // YYYY-MM-DD
  heure?: string; // HH:mm ou HH:mm:ss
  lieu?: string | null;
  typeReunion?: TypeReunion;
  lienReunion?: string | null;
  audience?: 'TOUS_CLUB' | 'DEPARTEMENTS';
  departementsCibles?: string | null;
  club: { id: number };
}

export interface ClubFeedback {
  id?: number;
  idEtudiant: number;
  idClub: number;
  nomClub?: string;
  note: number;
  commentaire?: string;
  dateCreation?: string;
  prenomEtudiant?: string;
  nomEtudiant?: string;
  sentiment?: string;
}

/** Résumé public (liste des clubs) */
export interface ClubFeedbackSummary {
  clubId: number;
  moyenne: number;
  nombreAvis: number;
}

export interface ClubFeedbackStats {
  totalFeedbacks: number;
  moyenneGlobale: number;
  distributionNotes: { note: number; count: number }[];
  topClubs: { clubId: number; nomClub: string; moyenne: number; totalAvis: number }[];
  tendanceMensuelle: { mois: string; totalAvis: number; moyenne: number }[];
}

export interface DemandeParticipationView {
  id: number;
  idEtudiant: number;
  idClub: number;
  nomClub: string;
  dateDemande: string;
  statut: 'PENDING' | 'ACCEPTED' | 'REFUSED';
  score: number;
  reponsesFormulaire?: string;
  texteMotivation?: string;
  departementSouhaite?: string;
  departementAssigne?: string;
  nomEtudiant: string;
  prenomEtudiant: string;
  emailEtudiant: string;
}

