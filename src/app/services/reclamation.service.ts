import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_URL } from '../api.config';

export interface Reclamation {
  id?: number;
  sujet: string;
  description: string;
  studentId?: number;
  statut?: string;
  reponseAdmin?: string;
  studentReported?: boolean;
  containsBadWords?: boolean;
  reportReason?: string;
  reportedAt?: string;
  createdAt?: string;
  /** LOW | MEDIUM | HIGH | CRITICAL */
  urgencyLevel?: string;
  /** Comma-separated: URGENT, BLOCKED, FRUSTRATED, ANXIOUS, NEUTRAL */
  emotionTags?: string;
  /** 0–100, higher = more urgent for triage */
  priorityScore?: number;
  /** Human-readable summary for admins */
  sentimentLabel?: string;
  /** Catégorie prédite par le modèle ML (Random Forest), si le service Python est activé côté API */
  categorieMl?: string | null;
}

/** Back-office paginated list + global status totals. */
export interface ReclamationAdminPage {
  content: Reclamation[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  pendingTotal: number;
  inProgressTotal: number;
  processedTotal: number;
}

/** Normalize gateway / Spring odd shapes into a plain array for the UI. */
export function parseReclamationListResponse(data: unknown): Reclamation[] {
  if (Array.isArray(data)) {
    return data as Reclamation[];
  }
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    const content = o['content'];
    if (Array.isArray(content)) {
      return content as Reclamation[];
    }
    const nestedData = o['data'];
    if (Array.isArray(nestedData)) {
      return nestedData as Reclamation[];
    }
    const reclamations = o['reclamations'];
    if (Array.isArray(reclamations)) {
      return reclamations as Reclamation[];
    }
  }
  return [];
}

export interface TraiterReclamationPayload {
  statut: string;
  reponseAdmin: string;
}

export interface ChatbotAssistRequest {
  message: string;
  sujet?: string;
  description?: string;
}

export interface ChatbotAssistResponse {
  reply: string;
  suggestedSubject: string;
  suggestedDescription: string;
  aiUsed: boolean;
}

export interface ReportStudentPayload {
  reportReason: string;
}

export interface StudentBlockStatus {
  blocked: boolean;
  blockedUntil?: string | null;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReclamationService {
  private readonly apiUrl = `${API_URL}/reclamations`;

  /** Avoid stale list data: browsers / proxies may cache GET /reclamations. */
  private readonly noCacheHeaders = new HttpHeaders({
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache'
  });

  constructor(private http: HttpClient) {}

  private bustParams(extra?: Record<string, string>): HttpParams {
    let p = new HttpParams().set('cb', String(Date.now()));
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => {
        p = p.set(k, v);
      });
    }
    return p;
  }

  getAdminPage(
    page: number,
    size: number,
    options?: { categorieMl?: string; sort?: 'priority' | 'mlCategory' }
  ): Observable<ReclamationAdminPage> {
    const extra: Record<string, string> = {
      page: String(Math.max(0, page)),
      size: String(Math.min(100, Math.max(1, size))),
      sort: options?.sort === 'mlCategory' ? 'mlCategory' : 'priority'
    };
    const ml = options?.categorieMl?.trim();
    if (ml) {
      extra['categorieMl'] = ml;
    }
    return this.http.get<ReclamationAdminPage>(`${this.apiUrl}/admin`, {
      headers: this.noCacheHeaders,
      params: this.bustParams(extra)
    });
  }

  /** Valeurs distinctes de categorieMl pour le filtre back-office */
  getAdminMlCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/admin/ml-categories`, {
      headers: this.noCacheHeaders,
      params: this.bustParams()
    });
  }

  /** Recalcule categorieMl pour les lignes encore vides (Python + base-url requis). */
  backfillMlCategories(limit = 100): Observable<{ updated: number; skipped: number }> {
    return this.http.post<{ updated: number; skipped: number }>(
      `${this.apiUrl}/admin/backfill-ml`,
      {},
      {
        headers: this.noCacheHeaders,
        params: this.bustParams({ limit: String(Math.min(500, Math.max(1, limit))) })
      }
    );
  }

  getByStudent(studentId: number): Observable<Reclamation[]> {
    return this.http.get<unknown>(this.apiUrl, {
      headers: this.noCacheHeaders,
      params: this.bustParams({ studentId: String(studentId) })
    }).pipe(map(parseReclamationListResponse));
  }

  getUnreadNotifications(studentId: number): Observable<Reclamation[]> {
    return this.http.get<unknown>(`${this.apiUrl}/notifications`, {
      headers: this.noCacheHeaders,
      params: this.bustParams({ studentId: String(studentId) })
    }).pipe(map(parseReclamationListResponse));
  }

  getById(id: number): Observable<Reclamation> {
    return this.http.get<Reclamation>(`${this.apiUrl}/${id}`, {
      headers: this.noCacheHeaders,
      params: this.bustParams()
    });
  }

  create(reclamation: Reclamation): Observable<Reclamation> {
    return this.http.post<Reclamation>(this.apiUrl, reclamation);
  }

  update(id: number, reclamation: Reclamation): Observable<Reclamation> {
    return this.http.put<Reclamation>(`${this.apiUrl}/${id}`, reclamation);
  }

  traiterParAdmin(id: number, payload: TraiterReclamationPayload): Observable<Reclamation> {
    return this.http.put<Reclamation>(`${this.apiUrl}/${id}/traitement`, payload);
  }

  markNotificationAsRead(id: number): Observable<Reclamation> {
    return this.http.put<Reclamation>(`${this.apiUrl}/${id}/notifications/read`, {});
  }

  assistWithChatbot(payload: ChatbotAssistRequest): Observable<ChatbotAssistResponse> {
    return this.http.post<ChatbotAssistResponse>(`${this.apiUrl}/chatbot/assist`, payload);
  }

  reportStudent(id: number, payload: ReportStudentPayload): Observable<Reclamation> {
    return this.http.put<Reclamation>(`${this.apiUrl}/${id}/report-student`, payload);
  }

  unblockStudent(id: number): Observable<Reclamation> {
    return this.http.put<Reclamation>(`${this.apiUrl}/${id}/unblock-student`, {});
  }

  getStudentBlockStatus(studentId: number): Observable<StudentBlockStatus> {
    return this.http.get<StudentBlockStatus>(`${this.apiUrl}/students/${studentId}/block-status`, {
      headers: this.noCacheHeaders,
      params: this.bustParams()
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
