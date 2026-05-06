import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';

export interface ClubChatbotAnswer {
  answer: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClubChatbotService {
  private readonly url = `${API_URL}/clubs/chatbot/ask`;

  constructor(private http: HttpClient) {}

  ask(question: string): Observable<ClubChatbotAnswer> {
    return this.http.post<ClubChatbotAnswer>(this.url, { question: question.trim() });
  }
}


