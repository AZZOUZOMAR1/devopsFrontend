import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FraudResult {
  applicationId: number;
  studentId: number;
  jobOfferId: number;
  applicantEmail: string;
  speedScore: number;
  emailScore: number;
  duplicateScore: number;
  volumeScore: number;
  totalScore: number;
  fraudLevel: string;
  reasons: string[];
  detectedAt: string;
}

@Injectable({ providedIn: 'root' })
export class FraudService {
  private base = '/api/fraud';

  constructor(private http: HttpClient) {}

  getAllFraud(): Observable<FraudResult[]> {
    return this.http.get<FraudResult[]>(`${this.base}/all`);
  }

  getSuspicious(): Observable<FraudResult[]> {
    return this.http.get<FraudResult[]>(`${this.base}/suspicious`);
  }
}