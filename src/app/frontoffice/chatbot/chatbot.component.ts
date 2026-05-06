import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChatbotService, ChatMessage, JobSuggestion } from '../../services/chatbot.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit {

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  isOpen = false;
  messages: ChatMessage[] = [];
  inputText = '';
  isTyping = false;

  constructor(
    private chatbotService: ChatbotService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // ✅ Message de bienvenue
    this.addBotMessage(
      "👋 Hello! I'm your recruitment assistant.\n\nType 'find job' or 'cherche emploi' to start!",
      []
    );
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text) return;

    // ✅ Ajoute message utilisateur
    this.messages.push({
      id: Date.now().toString(),
      text,
      isBot: false,
      timestamp: new Date()
    });

    this.inputText = '';
    this.isTyping = true;
    this.scrollToBottom();

    // ✅ Envoie au backend
    this.chatbotService.sendMessage(text).subscribe({
      next: (response) => {
        this.isTyping = false;
        this.addBotMessage(
          response.botResponse,
          response.suggestions || []
        );
      },
      error: () => {
        this.isTyping = false;
        this.addBotMessage(
          "Sorry, I'm having trouble connecting. Please try again!",
          []
        );
      }
    });
  }

  addBotMessage(text: string, suggestions: JobSuggestion[]): void {
    this.messages.push({
      id: Date.now().toString(),
      text,
      isBot: true,
      timestamp: new Date(),
      suggestions
    });
    setTimeout(() => this.scrollToBottom(), 100);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  goToOffer(offerId: number): void {
    this.router.navigate(['/frontoffice/job-details', offerId]);
    this.isOpen = false;
  }

  scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getMatchColor(percent: number): string {
    if (percent >= 70) return '#166534';
    if (percent >= 50) return '#92400e';
    return '#475569';
  }

  getMatchBg(percent: number): string {
    if (percent >= 70) return '#dcfce7';
    if (percent >= 50) return '#fef3c7';
    return '#f1f5f9';
  }

  
  // ✅ Quick replies
  quickReplies = [
    { label: '🔍 Find jobs', text: 'I am looking for a job' },
    { label: '📝 How to apply', text: 'How to apply?' },
    { label: '📍 Jobs in Tunis', text: 'Find jobs in Tunis' },
    { label: '🎓 Internships', text: 'Looking for internship' }
  ];

  sendQuickReply(text: string): void {
    this.inputText = text;
    this.sendMessage();
  }
}