import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SavedOffer } from '../models/job-offer.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SavedOfferService {
  private readonly base = `${environment.apiUrl}/api/saved-offers`;

  constructor(private http: HttpClient) {}

  save(jobOfferId: number, studentId: number): Observable<SavedOffer> {
    return this.http.post<SavedOffer>(this.base, {
      jobOfferId,
      studentId,
      savedAt: new Date().toISOString()
    });
  }

  unsave(savedOfferId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${savedOfferId}`);
  }

  findAll(): Observable<SavedOffer[]> {
    return this.http.get<SavedOffer[]>(this.base);
  }

  findByStudent(studentId: number): Observable<SavedOffer[]> {
    return this.http.get<SavedOffer[]>(`${this.base}?studentId=${studentId}`);
  }
}