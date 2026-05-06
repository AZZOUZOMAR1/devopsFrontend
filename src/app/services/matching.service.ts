import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MatchingResult {
  offerId: number;
  offerTitle: string;
  offerCompany: string;
  offerLocation: string;
  offerContractType: string;
  offerSalary: string;
  matchScore: number;
  matchPercent: number;
  matchLevel: string;
  locationScore: number;
  contractScore: number;
  salaryScore: number;
  keywordScore: number;
}

export interface VisitorPreferences {
  ville?: string;
  secteur?: string;
  competences?: string;
  typeContrat?: string;
  salaireSouhaite?: number;
}

@Injectable({ providedIn: 'root' })
export class MatchingService {
  private base = '/api/matching';
  private readonly STORAGE_KEY = 'visitorPreferences';

  constructor(private http: HttpClient) {}

  saveLocalPreferences(prefs: VisitorPreferences): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
  }

  getLocalPreferences(): VisitorPreferences | null {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as VisitorPreferences;
    } catch {
      return null;
    }
  }

  // ✅ URL corrigée → /visitor
  getMatchingForVisitor(prefs: VisitorPreferences): Observable<MatchingResult[]> {
    return this.http.post<MatchingResult[]>(`${this.base}/visitor`, prefs);
  }
}