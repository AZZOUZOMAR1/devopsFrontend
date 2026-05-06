import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Club } from '../../models/club.model';
import { ClubMessage, ClubMessageService } from '../../services/club-message.service';
import { ParticipationClubService } from '../../services/participation-club.service';
import { AuthService } from '../../services/auth.service';
import { finalize, timeout } from 'rxjs/operators';

@Component({
  selector: 'app-club-chat',
  templateUrl: './club-chat.component.html',
  styleUrls: ['./club-chat.component.css']
})
export class ClubChatComponent implements OnInit {
  clubsMembre: Club[] = [];
  selectedClub: Club | null = null;
  messages: ClubMessage[] = [];
  newMessage = '';
  selectedScope: 'CLUB' | 'DEPARTEMENT' = 'CLUB';
  departementAffecte: string | null = null;
  loading = false;
  loadingMessages = false;
  /** true si l'appel API a échoué (timeout, erreur réseau, etc.) */
  loadError = false;

  constructor(
    private participationService: ParticipationClubService,
    private messageService: ClubMessageService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadClubsMembre();
    }
  }

  get currentUserId(): number | null {
    return this.authService.getCurrentUserId();
  }

  loadClubsMembre(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.loading = false;
      this.loadError = false;
      return;
    }
    this.loading = true;
    this.loadError = false;
    this.participationService.getClubsMembre(userId).pipe(
      timeout(30000),
      finalize(() => { this.loading = false; })
    ).subscribe({
      next: (clubs) => {
        this.loadError = false;
        this.clubsMembre = clubs || [];
        if (this.clubsMembre.length > 0 && !this.selectedClub) {
          const clubIdParam = this.route.snapshot.queryParamMap.get('clubId');
          const clubId = clubIdParam ? parseInt(clubIdParam, 10) : null;
          const club = clubId
            ? this.clubsMembre.find(c => c.id === clubId)
            : this.clubsMembre[0];
          this.selectClub(club || this.clubsMembre[0]);
        }
      },
      error: (err) => {
        this.loadError = true;
        this.clubsMembre = [];
        const msg = err?.name === 'TimeoutError'
          ? 'Délai dépassé. Vérifiez que le Gateway (8080) et le service Club (8087) sont démarrés.'
          : 'Impossible de charger vos clubs. Vérifiez que les serveurs sont démarrés.';
        this.snackBar.open(msg, 'Fermer', { duration: 6000 });
      }
    });
  }

  selectClub(club: Club): void {
    this.selectedClub = club;
    this.selectedScope = 'CLUB';
    this.loadDepartementAndMessages();
  }

  loadDepartementAndMessages(): void {
    if (!this.selectedClub?.id || !this.currentUserId) return;
    this.participationService.getDepartementAffecte(this.currentUserId, this.selectedClub.id).subscribe({
      next: (dep) => {
        this.departementAffecte = dep;
        this.loadMessages();
      },
      error: () => {
        this.departementAffecte = null;
        this.loadMessages();
      }
    });
  }

  loadMessages(): void {
    if (!this.selectedClub?.id || !this.currentUserId) return;
    this.loadingMessages = true;
    this.messageService.getMessages(
      this.selectedClub.id,
      this.currentUserId,
      this.selectedScope,
      this.selectedScope === 'DEPARTEMENT' ? (this.departementAffecte || undefined) : undefined
    ).subscribe({
      next: (msgs) => {
        this.messages = msgs || [];
        this.loadingMessages = false;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => {
        this.loadingMessages = false;
        this.snackBar.open(this.resolveApiError(err, 'Accès refusé'), 'Fermer', { duration: 3000 });
      }
    });
  }

  sendMessage(): void {
    const text = this.newMessage?.trim();
    if (!text || !this.selectedClub?.id || !this.currentUserId) return;
    this.messageService.envoyerMessage(
      this.selectedClub.id,
      this.currentUserId,
      text,
      this.selectedScope,
      this.selectedScope === 'DEPARTEMENT' ? (this.departementAffecte || undefined) : undefined
    ).subscribe({
      next: (msg) => {
        this.messages = [...this.messages, msg];
        this.newMessage = '';
        this.scrollToBottom();
      },
      error: (err) => {
        this.snackBar.open(this.resolveApiError(err, 'Erreur à l\'envoi'), 'Fermer', { duration: 8000 });
      }
    });
  }

  isOwnMessage(msg: ClubMessage): boolean {
    return msg.idEtudiant === this.currentUserId;
  }

  getDisplayName(msg: ClubMessage): string {
    return [msg.prenomEtudiant, msg.nomEtudiant].filter(Boolean).join(' ') || 'Anonyme';
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  compareClubs(c1: Club | null, c2: Club | null): boolean {
    return c1?.id === c2?.id;
  }

  switchScope(scope: 'CLUB' | 'DEPARTEMENT'): void {
    this.selectedScope = scope;
    this.loadMessages();
  }

  /**
   * Le backend doit renvoyer du JSON `{ "message": "..." }`.
   * Réponse texte brute + HttpClient générait une erreur de parse peu lisible (« Unexpected token… »).
   */
  private resolveApiError(err: unknown, fallback: string): string {
    if (!(err instanceof HttpErrorResponse)) {
      return fallback;
    }
    const body = err.error;
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const m = (body as { message: unknown }).message;
      if (typeof m === 'string' && m.trim()) {
        return m;
      }
    }
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (err.status === 0) {
      return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
    }
    return fallback;
  }

  private scrollToBottom(): void {
    const el = document.getElementById('messages-container');
    if (el) el.scrollTop = el.scrollHeight;
  }
}
