import { Component, ChangeDetectorRef, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { EvenementService } from '../../services/evenement.service';
import { InscriptionEvenementService } from '../../services/inscription-evenement.service';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../services/auth.service';
import { Evenement, EventStatus, InscriptionEvenement, StatutInscriptionDto } from '../../models/evenement.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { QrInvitationDialogComponent } from './qr-invitation-dialog/qr-invitation-dialog.component';
import { FeedbackDialogComponent } from './feedback-dialog/feedback-dialog.component';

interface EventStats {
  inscriptionCount: number;
  statut: StatutInscriptionDto;
  moyenne?: number | null;
  nombreAvis?: number;
  hasFeedback?: boolean;
}

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit {
  evenements: Evenement[] = [];
  filteredEvenements: Evenement[] = [];
  searchTerm: string = '';
  selectedType: string = 'all';
  selectedStatus: string = 'all';
  loading: boolean = false;
  currentUserId: number | null = null;
  eventStats: Map<number, EventStats> = new Map();
  pageSize = 8;
  pageSizeOptions = [3, 6, 9, 12, 15];
  pageIndex = 0;

  constructor(
    private evenementService: EvenementService,
    private inscriptionService: InscriptionEvenementService,
    private feedbackService: FeedbackService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();
    if (isPlatformBrowser(this.platformId)) {
      this.loadEvenements();
    }
  }

  loadEvenements(): void {
    this.loading = true;
    this.evenementService.getAllEvenements().pipe(
      switchMap((data) => {
        this.evenements = data;
        this.filteredEvenements = [...this.evenements];
        return this.loadEventStats();
      })
    ).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des événements:', error);
        this.snackBar.open('Erreur lors du chargement des événements', 'Fermer', {
          duration: 3000
        });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadEventStats() {
    const observables = this.evenements
      .filter(e => e.id)
      .map(evenement => {
        const id = evenement.id!;
        const count$ = this.inscriptionService.countInscriptionsByEvenement(id);
        const statut$ = this.currentUserId
          ? this.inscriptionService.getStatutInscription(this.currentUserId, id)
          : of({ inscrit: false, enListeAttente: false, positionListeAttente: 0 });
        const moyenne$ = this.feedbackService.getMoyenneByEvenement(id);
        const hasFeedback$ = this.currentUserId
          ? this.feedbackService.hasEtudiantFeedback(this.currentUserId, id)
          : of(false);
        return forkJoin({ count: count$, statut: statut$, moyenne: moyenne$, hasFeedback: hasFeedback$ }).pipe(
          map(result => ({
            eventId: id,
            count: result.count,
            statut: result.statut,
            moyenne: result.moyenne?.moyenne ?? null,
            nombreAvis: result.moyenne?.nombreAvis ?? 0,
            hasFeedback: result.hasFeedback
          }))
        );
      });
    if (observables.length === 0) {
      this.eventStats = new Map();
      return of([]);
    }
    return forkJoin(observables).pipe(
      map((results) => {
        const newMap = new Map<number, EventStats>();
        results.forEach(r => {
          newMap.set(r.eventId, {
            inscriptionCount: r.count,
            statut: r.statut,
            moyenne: r.moyenne,
            nombreAvis: r.nombreAvis,
            hasFeedback: r.hasFeedback
          });
        });
        this.eventStats = newMap;
        return results;
      })
    );
  }

  filterEvenements(): void {
    this.pageIndex = 0;
    this.filteredEvenements = this.evenements.filter(evenement => {
      const matchesSearch = this.searchTerm === '' || 
        evenement.titre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (evenement.description && evenement.description.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (evenement.lieu && evenement.lieu.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (evenement.nomClubOrganisateur && evenement.nomClubOrganisateur.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesType = this.selectedType === 'all' || evenement.type === this.selectedType;
      const matchesStatus = this.selectedStatus === 'all' || evenement.status === this.selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }

  onSearch(): void {
    this.filterEvenements();
  }

  onTypeChange(): void {
    this.filterEvenements();
  }

  onStatusChange(): void {
    this.filterEvenements();
  }

  get paginatedEvenements(): Evenement[] {
    const start = this.pageIndex * this.pageSize;
    return this.filteredEvenements.slice(start, start + this.pageSize);
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  getStatusClass(status?: EventStatus): string {
    if (!status) return 'status-badge';
    return `status-badge ${status.toLowerCase()}`;
  }

  getStatusLabel(status?: EventStatus): string {
    if (!status) return 'N/A';
    const labels: { [key: string]: string } = {
      'PLANNED': 'Planifié',
      'ACTIVE': 'Actif',
      'COMPLETED': 'Terminé',
      'CANCELLED': 'Annulé'
    };
    return labels[status] || status;
  }

  getStats(evenement: Evenement): EventStats | undefined {
    return evenement.id ? this.eventStats.get(evenement.id) : undefined;
  }

  getPlacesRestantes(evenement: Evenement): number | null {
    const stats = this.getStats(evenement);
    if (!evenement.capacite) return null;
    if (!stats) return null;
    return Math.max(0, evenement.capacite - stats.inscriptionCount);
  }

  getPlacesText(evenement: Evenement): string {
    const capacite = evenement.capacite;
    if (!capacite) return 'Places illimitées';
    const restantes = this.getPlacesRestantes(evenement);
    if (restantes === null) return `${capacite} places`;
    if (restantes === 0) return 'Complet - Liste d\'attente disponible';
    return `${restantes} place${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}`;
  }

  isEventFull(evenement: Evenement): boolean {
    const restantes = this.getPlacesRestantes(evenement);
    return restantes !== null && restantes === 0;
  }

  canRegister(evenement: Evenement): boolean {
    if (!evenement.status) return false;
    return evenement.status === EventStatus.PLANNED || evenement.status === EventStatus.ACTIVE;
  }

  isInscrit(evenement: Evenement): boolean {
    return this.getStats(evenement)?.statut?.inscrit ?? false;
  }

  isEnListeAttente(evenement: Evenement): boolean {
    return this.getStats(evenement)?.statut?.enListeAttente ?? false;
  }

  getButtonLabel(evenement: Evenement): string {
    if (!this.currentUserId) return 'Connectez-vous pour vous inscrire';
    if (this.isInscrit(evenement)) return 'Annuler l\'inscription';
    if (this.isEnListeAttente(evenement)) {
      const pos = this.getStats(evenement)?.statut?.positionListeAttente;
      return pos ? `Annuler (liste d'attente #${pos})` : 'Annuler la liste d\'attente';
    }
    if (this.isEventFull(evenement)) return 'S\'inscrire en liste d\'attente';
    return 'S\'inscrire';
  }

  inscrireEvenement(evenement: Evenement): void {
    if (!evenement.id) return;
    const userId = this.authService.getCurrentUserId();
    if (userId == null) {
      this.snackBar.open('Veuillez vous connecter pour vous inscrire.', 'Fermer', { duration: 3000 });
      return;
    }

    // Si déjà inscrit ou en liste d'attente -> annuler
    if (this.isInscrit(evenement) || this.isEnListeAttente(evenement)) {
      this.desinscrireEvenement(evenement);
      return;
    }

    const inscription: InscriptionEvenement = {
      idEtudiant: userId,
      dateInscription: new Date().toISOString().split('T')[0],
      evenement: evenement
    };

    this.inscriptionService.createInscription(inscription).subscribe({
      next: (result) => {
        if (result.listeAttente && result.position != null) {
          this.snackBar.open(
            `Événement complet. Vous êtes en liste d'attente (position ${result.position}). Un email vous a été envoyé.`,
            'Fermer',
            { duration: 5000 }
          );
        } else if (result.inscription && result.inscription.id) {
          this.snackBar.open('Inscription réussie! Un email de confirmation vous a été envoyé.', 'Fermer', {
            duration: 3000
          });
          this.dialog.open(QrInvitationDialogComponent, {
            width: '400px',
            data: {
              inscriptionId: result.inscription.id,
              titreEvenement: evenement.titre
            }
          });
        }
        this.loadEvenements();
      },
      error: (error) => {
        console.error('Erreur lors de l\'inscription:', error);
        const message = error.error?.error || error.error?.message || 'Erreur lors de l\'inscription';
        this.snackBar.open(message, 'Fermer', {
          duration: 5000
        });
      }
    });
  }

  desinscrireEvenement(evenement: Evenement): void {
    if (!evenement.id || !this.currentUserId) return;
    this.inscriptionService.desinscrireEtudiant(this.currentUserId, evenement.id).subscribe({
      next: () => {
        this.snackBar.open('Inscription annulée avec succès.', 'Fermer', { duration: 3000 });
        this.loadEvenements();
      },
      error: (error) => {
        const message = error.error?.error || error.error?.message || 'Erreur lors de l\'annulation';
        this.snackBar.open(message, 'Fermer', { duration: 3000 });
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatTime(time: string): string {
    if (!time) return '';
    return time.substring(0, 5); // Format HH:mm
  }

  getMoyenneDisplay(evenement: Evenement): string {
    const stats = this.getStats(evenement);
    if (!stats?.moyenne) return '';
    return `${stats.moyenne.toFixed(1)} ★ (${stats.nombreAvis || 0} avis)`;
  }

  canGiveFeedback(evenement: Evenement): boolean {
    if (!this.currentUserId || !evenement.id) return false;
    if (!this.isInscrit(evenement)) return false;
    const status = evenement.status;
    return status === EventStatus.COMPLETED || status === EventStatus.ACTIVE;
  }

  openFeedbackDialog(evenement: Evenement): void {
    if (!evenement.id || !this.currentUserId) return;
    this.dialog.open(FeedbackDialogComponent, {
      width: '450px',
      data: {
        evenement,
        hasFeedback: this.getStats(evenement)?.hasFeedback ?? false
      }
    }).afterClosed().subscribe(() => this.loadEvenements());
  }

  openAvisDialog(evenement: Evenement): void {
    if (!evenement.id) return;
    this.dialog.open(FeedbackDialogComponent, {
      width: '500px',
      data: { evenement, viewOnly: true }
    });
  }

  getUniqueTypes(): string[] {
    const types = this.evenements
      .map(e => e.type)
      .filter((type, index, self) => type && self.indexOf(type) === index);
    return types as string[];
  }
}
