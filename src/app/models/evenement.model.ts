export enum EventStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Evenement {
  id?: number;
  titre: string;
  description?: string;
  type?: string;
  date: string; // Format: YYYY-MM-DD
  heure?: string; // Format: HH:mm:ss
  lieu?: string;
  capacite?: number;
  image?: string;
  status?: EventStatus;
  /** Club organisateur (événements créés au nom d'un club) */
  idClub?: number | null;
  nomClubOrganisateur?: string | null;
  inscriptions?: InscriptionEvenement[];
}

export interface InscriptionEvenement {
  id?: number;
  idEtudiant: number;
  dateInscription?: string; // Format: YYYY-MM-DD
  evenement?: Evenement;
}

export interface InscriptionResultDto {
  inscription: InscriptionEvenement | null;
  listeAttente: boolean;
  position?: number;
}

export interface StatutInscriptionDto {
  inscrit: boolean;
  enListeAttente: boolean;
  positionListeAttente: number;
}

export interface FeedbackDto {
  id?: number;
  idEtudiant: number;
  evenementId?: number;
  note: number;
  commentaire?: string;
  dateCreation?: string;
  nomEtudiant?: string;
  /** POSITIVE | NEGATIVE | NEUTRAL (analyse serveur) */
  sentiment?: string;
}

export interface StatistiquesEvenement {
  tauxRemplissage: number;
  moyenneParticipation: number;
  plusPopulaire: { id: number; titre: string; nombreInscriptions: number } | null;
  evolutionMensuelle: { mois: string; nombreInscriptions: number }[];
}

export interface MoyenneFeedbackDto {
  evenementId: number;
  moyenne: number | null;
  nombreAvis: number;
}

export interface InvitationDto {
  inscriptionId: number;
  evenementId: number;
  titreEvenement: string;
  descriptionEvenement?: string;
  dateEvenement: string;
  heureEvenement?: string;
  lieuEvenement?: string;
  typeEvenement?: string;
  nomEtudiant: string;
  prenomEtudiant: string;
  emailEtudiant: string;
}
