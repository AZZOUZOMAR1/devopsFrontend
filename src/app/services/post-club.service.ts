import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';

export interface PostClub {
  id?: number;
  contenu: string;
  datePost?: string;
  idAuteur: number;
  medias?: string;
  club: { id: number };
}

@Injectable({
  providedIn: 'root'
})
export class PostClubService {
  private apiUrl = `${API_URL}/posts-club`;

  constructor(private http: HttpClient) {}

  create(post: PostClub): Observable<PostClub> {
    return this.http.post<PostClub>(this.apiUrl, post);
  }

  getByClub(clubId: number): Observable<PostClub[]> {
    return this.http.get<PostClub[]>(`${this.apiUrl}/club/${clubId}/recent`);
  }

  getAll(): Observable<PostClub[]> {
    return this.http.get<PostClub[]>(this.apiUrl);
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }
}



