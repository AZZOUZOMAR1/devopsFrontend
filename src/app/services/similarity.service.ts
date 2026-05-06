import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SimilarityResult {
  offerId: number;
  offerTitle: string;
  offerCompany: string;
  offerLocation: string;
  offerContractType: string;
  offerSalary: string;
  similarityScore: number;
  similarityPercent: number;
  cosinusScore: number;
  contractScore: number;
  locationScore: number;
  salaryScore: number;
}

@Injectable({ providedIn: 'root' })
export class SimilarityService {
  private base = '/api/similarity';

  constructor(private http: HttpClient) {}

  getSimilarOffers(offerId: number): Observable<SimilarityResult[]> {
    return this.http.get<SimilarityResult[]>(`${this.base}/${offerId}`);
  }
}