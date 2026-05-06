import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { JobOffer } from '../models/job-offer.model';
import { environment } from '../../environments/environment';
import { map, catchError } from 'rxjs/operators';

/** Extrait le tableau d'offres depuis la réponse backend (array, Page Spring, ou wrapper). */
function extractOffersArray(body: any): any[] {
  if (body == null) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.content)) return body.content;
  if (Array.isArray(body.data)) return body.data;
  if (body._embedded && Array.isArray(body._embedded.jobOffers)) return body._embedded.jobOffers;
  return [];
}

/** Normalise un objet offre: champs alignés sur le JSON backend (date, dateFin, contract_type, etc.). */
function normalizeJobOffer(raw: any): JobOffer {
  const { type, contract_type, contractType, date, dateFin, ...rest } = raw;
  return {
    ...rest,
    contractType: contract_type ?? contractType ?? rest.contractType,
    date: date ?? dateFin ?? rest.date,
  } as JobOffer;
}

@Injectable({ providedIn: 'root' })
export class JobOfferService {
  private readonly base = `${environment.apiUrl}/api/joboffers`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<JobOffer[]> {
    return this.http.get<any>(this.base).pipe(
      map(body => extractOffersArray(body).map(normalizeJobOffer))
    );
  }

  findById(id: number): Observable<JobOffer> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(
      map(normalizeJobOffer)
    );
  }

  create(offer: JobOffer): Observable<JobOffer> {
    const payload = { ...offer };
    delete (payload as any).type;
    return this.http.post<any>(this.base, payload).pipe(
      map(normalizeJobOffer)
    );
  }

  update(id: number, offer: JobOffer): Observable<JobOffer> {
    const payload = { ...offer };
    delete (payload as any).type;
    return this.http.put<any>(`${this.base}/${id}`, payload).pipe(
      map(normalizeJobOffer)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  geocode(location: string): Observable<{ lat: number; lng: number } | null> {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
    return this.http.get<any[]>(url).pipe(
      map(results => {
        if (results && results.length > 0) {
          return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  // ✅ Autocomplétion des villes
  searchLocations(query: string): Observable<any[]> {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
    return this.http.get<any[]>(url).pipe(
      catchError(() => of([]))
    );
  }

// ✅ Incrémente les vues
incrementView(id: number): Observable<void> {
  return this.http.post<void>(`${this.base}/${id}/view`, {});
}

// ✅ Stats vues pour dashboard
getViewStats(): Observable<JobOffer[]> {
  return this.http.get<JobOffer[]>(`${this.base}/views/top`);
}
}
