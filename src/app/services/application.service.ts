import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Application } from '../models/job-offer.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly base = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(
      `${this.base}/files/upload`, 
      formData, 
      { responseType: 'text' }
    );
  }

  /** Postuler à une offre (utilisé par l'étudiant) */
  applyToOffer(jobOfferId: number, application: Application): Observable<Application> {
    return this.http.post<Application>(
      `${this.base}/job-offers/${jobOfferId}/applications`,
      application
    );
  }

  /** Lister toutes les candidatures (pour le recruteur) */
  findAll(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.base}/applications`);
  }

  findById(id: number): Observable<Application> {
    return this.http.get<Application>(`${this.base}/applications/${id}`);
  }

  update(id: number, application: Application): Observable<Application> {
    return this.http.put<Application>(`${this.base}/applications/${id}`, application);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/applications/${id}`);
  }


}
