export interface JobOffer {
  id?: number;
  title: string;
  description: string;
  company: string;
  location: string;
  contractType: 'CDI' | 'CDD' | 'STAGE' | 'ALTERNANCE' | 'FREELANCE';
  salary?: number;
  /** Date de publication (aligné sur le champ date / LocalDateTime du backend). */
  date?: string;
  deadline?: string;
  active: boolean;
  latitude?: number;
  longitude?: number;
  /** Si définie, l'offre expire à cette date (backend la désactive). Null = pas d'expiration automatique. */
  expirationDate?: string;
  viewCount?: number; // ✅ ajoute

}

export interface Application {
  id?: number;
  jobOfferId: number;
  studentId?: number;
  applicantName: string;
  applicantEmail: string;
  coverLetter?: string;
  cvUrl?: string;
  coverLetterUrl?: string;
  status?: 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'INTERVIEW' | 'BLOCKED'; // ✅ ajoute
  appliedAt?: string;
  date?: string;
  interviewDate?: string; // ✅ ajoute




}

export interface SavedOffer {
  id?: number;
  jobOfferId: number;
  studentId: number;
  savedAt?: string;
  notes?: string;
}
