import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  suggestions?: JobSuggestion[];
}

export interface JobSuggestion {
  id: number;
  title: string;
  company: string;
  location: string;
  contractType: string;
  salary: string;
  matchPercent: number;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private base = '/api/chatbot';

  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<any> {
    return this.http.post<any>(`${this.base}/message`, {
      userMessage: message
    });
  }
}