import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InscriptionEvenement, InscriptionResultDto, StatutInscriptionDto } from '../models/evenement.model';
import { API_URL } from '../api.config';

@Injectable({
  providedIn: 'root'
})
export class InscriptionEvenementService {
  private apiUrl = `${API_URL}/inscriptions`;

  constructor(private http: HttpClient) { }

  // CREATE - Créer une nouvelle inscription (ou liste d'attente si complet)
  createInscription(inscription: InscriptionEvenement): Observable<InscriptionResultDto> {
    return this.http.post<InscriptionResultDto>(this.apiUrl, inscription);
  }

  // READ - Récupérer toutes les inscriptions
  getAllInscriptions(): Observable<InscriptionEvenement[]> {
    return this.http.get<InscriptionEvenement[]>(this.apiUrl);
  }

  // READ - Récupérer une inscription par son ID
  getInscriptionById(id: number): Observable<InscriptionEvenement> {
    return this.http.get<InscriptionEvenement>(`${this.apiUrl}/${id}`);
  }

  // UPDATE - Mettre à jour une inscription
  updateInscription(id: number, inscription: InscriptionEvenement): Observable<InscriptionEvenement> {
    return this.http.put<InscriptionEvenement>(`${this.apiUrl}/${id}`, inscription);
  }

  // DELETE - Supprimer une inscription
  deleteInscription(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Récupérer les inscriptions d'un étudiant
  getInscriptionsByEtudiant(idEtudiant: number): Observable<InscriptionEvenement[]> {
    return this.http.get<InscriptionEvenement[]>(`${this.apiUrl}/etudiant/${idEtudiant}`);
  }

  // Récupérer les inscriptions d'un événement
  getInscriptionsByEvenement(evenementId: number): Observable<InscriptionEvenement[]> {
    return this.http.get<InscriptionEvenement[]>(`${this.apiUrl}/evenement/${evenementId}`);
  }

  // Vérifier si un étudiant est inscrit à un événement
  isEtudiantInscrit(idEtudiant: number, evenementId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/verifier/${idEtudiant}/${evenementId}`);
  }

  getStatutInscription(idEtudiant: number, evenementId: number): Observable<StatutInscriptionDto> {
    return this.http.get<StatutInscriptionDto>(`${this.apiUrl}/statut/${idEtudiant}/${evenementId}`);
  }

  // Compter les inscriptions pour un événement
  countInscriptionsByEvenement(evenementId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count/evenement/${evenementId}`);
  }

  // Désinscrire un étudiant d'un événement
  desinscrireEtudiant(idEtudiant: number, evenementId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/desinscrire/${idEtudiant}/${evenementId}`);
  }
}

