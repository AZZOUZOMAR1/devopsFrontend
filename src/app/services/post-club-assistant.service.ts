import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';

export interface PostAssistantSuggestion {
  titre: string;
  description: string;
  hashtags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PostClubAssistantService {
  private readonly url = `${API_URL}/posts-club/assistant/suggest`;

  constructor(private http: HttpClient) {}

  suggest(keywords: string, clubNom?: string | null): Observable<PostAssistantSuggestion> {
    return this.http.post<PostAssistantSuggestion>(this.url, {
      keywords: keywords.trim(),
      clubNom: clubNom?.trim() || undefined
    });
  }
}


