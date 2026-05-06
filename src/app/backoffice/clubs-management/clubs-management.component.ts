import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Club } from '../../models/club.model';
import { ClubService } from '../../services/club.service';
import { UserService } from '../../services/user.service';
import { ClubFeedbackService } from '../../services/club-feedback.service';
import { ClubChatbotService } from '../../services/club-chatbot.service';
import { ClubAvisDialogComponent } from '../../shared/club-avis-dialog/club-avis-dialog.component';
import { ClubDialogComponent } from './club-dialog/club-dialog.component';
import { EventDialogComponent } from '../events-management/event-dialog/event-dialog.component';

@Component({
  selector: 'app-clubs-management',
  templateUrl: './clubs-management.component.html',
  styleUrls: ['./clubs-management.component.css']
})
export class ClubsManagementComponent implements OnInit {
  clubs: Club[] = [];
  filteredClubs: Club[] = [];
  searchTerm: string = '';
  selectedType: string = 'all';
  selectedStatus: string = 'all';
  loading = false;
  avisByClubId: Map<number, { moyenne: number; nombreAvis: number }> = new Map();
  responsableNomById: Map<number, string> = new Map();
  chatOpen = false;
  chatLoading = false;
  chatInput = '';
  chatTurns: { role: 'user' | 'bot'; text: string }[] = [];

  readonly chatIdeas: string[] = [
    'Quels clubs sont les plus actifs ?',
    'Résume les clubs avec le plus d’événements.',
    'Quels clubs ont les meilleurs avis ?'
  ];

  pageSize = 8;
  pageIndex = 0;
  pageSizeOptions = [4, 8, 12, 24];

  constructor(
    private clubService: ClubService,
    private userService: UserService,
    private clubFeedbackService: ClubFeedbackService,
    private clubChatbot: ClubChatbotService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadClubs();
    }
  }

  get activeCount(): number {
    return this.clubs.filter(c => (c.statut || '').toLowerCase() === 'active').length;
  }

  get pendingCount(): number {
    return this.clubs.filter(c => (c.statut || '').toLowerCase() === 'pending').length;
  }

  get inactiveCount(): number {
    return this.clubs.filter(c => (c.statut || '').toLowerCase() === 'inactive').length;
  }

  loadClubs(): void {
    this.loading = true;
    this.clubService.getAllClubs().subscribe({
      next: (data) => {
        this.clubs = data || [];
        this.filteredClubs = [...this.clubs];
        this.pageIndex = 0;
        this.loading = false;
        this.loadAvisSummaries();
        this.loadResponsableNoms();
      },
      error: (err) => {
        console.error('Erreur chargement clubs:', err);
        this.snackBar.open('Erreur lors du chargement des clubs', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
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

  private loadResponsableNoms(): void {
    const ids = [
      ...new Set(
        this.clubs
          .map((c) => c.idResponsable)
          .filter((id): id is number => typeof id === 'number' && id > 0)
      )
    ];
    if (ids.length === 0) return;
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

  getResponsableNom(club: Club): string | null {
    if (club.idResponsable == null) return null;
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
        String(club.idResponsable ?? '').includes(s) ||
        respNom.includes(s);

      const matchesType = this.selectedType === 'all' || (club.type || '') === this.selectedType;
      const matchesStatus = this.selectedStatus === 'all' || (club.statut || '').toLowerCase() === this.selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }

  getUniqueTypes(): string[] {
    const types = this.clubs
      .map(c => c.type)
      .filter((t, i, arr) => t && arr.indexOf(t) === i);
    return types as string[];
  }

  addClub(): void {
    const ref = this.dialog.open(ClubDialogComponent, {
      width: '600px',
      data: { club: null }
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.loadClubs();
    });
  }

  editClub(club: Club): void {
    const ref = this.dialog.open(ClubDialogComponent, {
      width: '600px',
      data: { club: { ...club } }
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.loadClubs();
    });
  }

  viewClub(club: Club): void {
    this.dialog.open(ClubDialogComponent, {
      width: '600px',
      data: { club: { ...club }, viewMode: true }
    });
  }

  /** Ouvre la création d’un événement lié à ce club (pré-sélection du club). */
  createEventForClub(club: Club): void {
    if (!club.id) {
      return;
    }
    const ref = this.dialog.open(EventDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      data: { evenement: null, idClubPreselect: club.id }
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.snackBar.open(
          'Événement créé. Il apparaît dans la liste des événements avec le nom du club.',
          'Fermer',
          { duration: 5000 }
        );
      }
    });
  }

  deleteClub(club: Club): void {
    if (!club.id) return;
    if (confirm(`Êtes-vous sûr de vouloir supprimer le club "${club.nom}" ?`)) {
      this.clubService.deleteClub(club.id).subscribe({
        next: () => {
          this.snackBar.open('Club supprimé avec succès', 'Fermer', { duration: 3000 });
          this.loadClubs();
        },
        error: (err) => {
          console.error('Erreur suppression club:', err);
          const msg = err.error?.message || 'Erreur lors de la suppression';
          this.snackBar.open(msg, 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  toggleClubChat(): void {
    this.chatOpen = !this.chatOpen;
  }

  clearClubChat(): void {
    this.chatTurns = [];
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
      error: () => {
        this.chatLoading = false;
        this.chatTurns.push({
          role: 'bot',
          text: 'Assistant indisponible. Vérifiez Ollama et le service club.'
        });
        this.snackBar.open('Erreur assistant', 'Fermer', { duration: 5000 });
      }
    });
  }
}
