import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserService } from '../../services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ClubService } from '../../services/club.service';
import { ParticipationClubService } from '../../services/participation-club.service';
import { ClubFeedbackService } from '../../services/club-feedback.service';
import { AuthService } from '../../services/auth.service';
import { Club } from '../../models/club.model';
import { JoinClubDialogComponent } from './join-club-dialog/join-club-dialog.component';
import { ClubAvisDialogComponent } from '../../shared/club-avis-dialog/club-avis-dialog.component';
import { ClubChatbotService } from '../../services/club-chatbot.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-clubs',
  templateUrl: './clubs.component.html',
  styleUrls: ['./clubs.component.css']
})
export class ClubsComponent implements OnInit {
  clubs: Club[] = [];
  filteredClubs: Club[] = [];
  searchTerm = '';
  selectedType = 'all';
  selectedStatus = 'all';
  loading = false;
  /** Map clubId -> PENDING | ACCEPTED | REFUSED */
  statutByClub: Map<number, string> = new Map();
  avisByClubId: Map<number, { moyenne: number; nombreAvis: number }> = new Map();
  /** id utilisateur responsable → nom affiché */
  responsableNomById: Map<number, string> = new Map();

  pageSize = 6;
  pageIndex = 0;
  pageSizeOptions = [6, 12, 18, 24];

  /** Assistant Campus Clubs (Ollama + stats réelles) */
  chatOpen = false;
  chatLoading = false;
  chatInput = '';
  chatTurns: { role: 'user' | 'bot'; text: string }[] = [];

  readonly chatIdeas: string[] = [
    'Quel club semble le plus actif sur le mur et les réunions ?',
    'Quel club a le plus d’événements listés ?',
    'Quels clubs ont le plus de membres acceptés ?',
    'Quel club a les meilleurs avis des étudiants ?',
    'Résume-moi les clubs actifs en deux phrases.'
  ];

  constructor(
    private clubService: ClubService,
    private participationService: ParticipationClubService,
    private clubFeedbackService: ClubFeedbackService,
    private userService: UserService,
    private dialog: MatDialog,
    public authService: AuthService,
    private clubChatbot: ClubChatbotService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadClubs();
    }
  }

  loadClubs(): void {
    this.loading = true;
    this.clubService.getAllClubs().subscribe({
      next: (data) => {
        this.clubs = data || [];
        this.filteredClubs = [...this.clubs];
        this.pageIndex = 0;
        this.loading = false;
        this.loadStatuts();
        this.loadAvisSummaries();
        this.loadResponsableNoms();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  /** Résout les noms des responsables (API utilisateurs). */
  private loadResponsableNoms(): void {
    const ids = [
      ...new Set(
        this.clubs
          .map((c) => c.idResponsable)
          .filter((id): id is number => typeof id === 'number' && id > 0)
      )
    ];
    if (ids.length === 0) {
      return;
    }
    const calls = ids.map((id) =>
      this.userService.getUserById(id).pipe(
        map((u) => {
          const nom = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
          return { id, label: nom || `Utilisateur #${id}` };
        }),
        catchError(() => of({ id, label: `Réf. #${id}` }))
      )
    );
    forkJoin(calls).subscribe({
      next: (results) => {
        this.responsableNomById.clear();
        results.forEach((r) => this.responsableNomById.set(r.id, r.label));
        this.filterClubs();
      },
      error: () => this.filterClubs()
    });
  }

  /** Nom du responsable pour affichage (pas l’ID). */
  getResponsableNom(club: Club): string | null {
    if (club.idResponsable == null) {
      return null;
    }
    return this.responsableNomById.get(club.idResponsable) ?? null;
  }

  private loadAvisSummaries(): void {
    this.clubFeedbackService.getPublicSummaries().subscribe({
      next: (rows) => {
        this.avisByClubId.clear();
        (rows || []).forEach((r) => {
          if (r.clubId != null) {
            this.avisByClubId.set(r.clubId, { moyenne: r.moyenne, nombreAvis: r.nombreAvis });
          }
        });
      },
      error: () => this.avisByClubId.clear()
    });
  }

  getAvisForClub(club: Club): { moyenne: number; nombreAvis: number } | null {
    if (!club.id) return null;
    return this.avisByClubId.get(club.id) ?? null;
  }

  formatMoyenne(m: number): string {
    return (Math.round(m * 10) / 10).toFixed(1);
  }

  openAvisDialog(club: Club, ev?: Event): void {
    ev?.stopPropagation();
    if (!club.id) return;
    this.dialog.open(ClubAvisDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: { clubId: club.id, nomClub: club.nom }
    });
  }

  get paginatedClubs(): Club[] {
    const start = this.pageIndex * this.pageSize;
    return this.filteredClubs.slice(start, start + this.pageSize);
  }

  onPageChange(ev: PageEvent): void {
    this.pageIndex = ev.pageIndex;
    this.pageSize = ev.pageSize;
  }

  private loadStatuts(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId || this.clubs.length === 0) return;
    const obs = this.clubs
      .filter(c => c.id)
      .map(c => this.participationService.getStatutParticipation(userId, c.id!).pipe(
        map(statut => ({ clubId: c.id!, statut })),
        catchError(() => of({ clubId: c.id!, statut: null as string | null }))
      ));
    if (obs.length === 0) return;
    forkJoin(obs).subscribe({
      next: (results) => {
        this.statutByClub.clear();
        results.forEach(r => {
          if (r.statut) this.statutByClub.set(r.clubId, r.statut);
        });
      }
    });
  }

  getButtonLabel(club: Club): string {
    const statut = club.id ? this.statutByClub.get(club.id) : null;
    if (statut === 'ACCEPTED') return 'Membre du club';
    if (statut === 'PENDING') return 'Demande envoyée';
    return 'Rejoindre';
  }

  getButtonDisabled(club: Club): boolean {
    const statut = club.id ? this.statutByClub.get(club.id) : null;
    return statut === 'ACCEPTED' || statut === 'PENDING';
  }

  getButtonIcon(club: Club): string {
    const statut = club.id ? this.statutByClub.get(club.id) : null;
    if (statut === 'ACCEPTED') return 'check_circle';
    if (statut === 'PENDING') return 'schedule';
    return 'person_add';
  }

  filterClubs(): void {
    this.pageIndex = 0;
    const s = this.searchTerm.toLowerCase().trim();
    this.filteredClubs = this.clubs.filter((club) => {
      const respNom =
        club.idResponsable != null
          ? (this.responsableNomById.get(club.idResponsable) || '').toLowerCase()
          : '';
      const matchesSearch =
        s === '' ||
        (club.nom || '').toLowerCase().includes(s) ||
        (club.description || '').toLowerCase().includes(s) ||
        respNom.includes(s);
      const matchesType = this.selectedType === 'all' || (club.type || '') === this.selectedType;
      const matchesStatus = this.selectedStatus === 'all' || (club.statut || '').toLowerCase() === this.selectedStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }

  onSearch(): void {
    this.filterClubs();
  }

  onTypeChange(): void {
    this.filterClubs();
  }

  onStatusChange(): void {
    this.filterClubs();
  }

  getStatusClass(status: string): string {
    return `status-badge ${(status || '').toLowerCase()}`;
  }

  getStatusLabel(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'active') return 'Actif';
    if (s === 'inactive') return 'Inactif';
    if (s === 'pending') return 'En attente';
    return status || 'N/A';
  }

  getUniqueTypes(): string[] {
    return (this.clubs.map((c) => c.type).filter((t, i, arr) => t && arr.indexOf(t) === i) as string[]) || [];
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  joinClub(club: Club): void {
    if (!this.authService.isLoggedIn() || this.getButtonDisabled(club)) return;
    this.dialog.open(JoinClubDialogComponent, {
      width: '480px',
      data: { club }
    }).afterClosed().subscribe((submitted) => {
      if (submitted) this.loadStatuts();
    });
  }

  toggleClubChat(): void {
    this.chatOpen = !this.chatOpen;
  }

  askClubAssistant(text?: string): void {
    const q = (text ?? this.chatInput).trim();
    if (q.length < 3) {
      this.snackBar.open('Écrivez au moins 3 caractères.', 'OK', { duration: 2500 });
      return;
    }
    this.chatLoading = true;
    this.chatTurns.push({ role: 'user', text: q });
    this.chatInput = '';
    this.clubChatbot.ask(q).subscribe({
      next: (res) => {
        this.chatLoading = false;
        this.chatTurns.push({ role: 'bot', text: res?.answer || 'Pas de réponse.' });
      },
      error: (err: { error?: unknown }) => {
        this.chatLoading = false;
        const msg =
          typeof err?.error === 'string' && err.error.length > 0
            ? err.error
            : 'Assistant indisponible. Vérifiez Ollama et le service club.';
        this.chatTurns.push({ role: 'bot', text: msg });
        this.snackBar.open('Erreur assistant', 'Fermer', { duration: 5000 });
      }
    });
  }

  clearClubChat(): void {
    this.chatTurns = [];
  }
}
