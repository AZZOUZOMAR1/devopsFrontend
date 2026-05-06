import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EvenementService } from '../../services/evenement.service';
import { InscriptionEvenementService } from '../../services/inscription-evenement.service';
import { Evenement, EventStatus } from '../../models/evenement.model';
import { EventDialogComponent } from './event-dialog/event-dialog.component';
import { FeedbackViewDialogComponent } from './feedback-view-dialog/feedback-view-dialog.component';

@Component({
  selector: 'app-events-management',
  templateUrl: './events-management.component.html',
  styleUrls: ['./events-management.component.css']
})
export class EventsManagementComponent implements OnInit {
  evenements: Evenement[] = [];
  filteredEvenements: Evenement[] = [];
  searchTerm: string = '';
  selectedType: string = 'all';
  selectedStatus: string = 'all';
  loading: boolean = false;
  pageSize = 8;
  pageSizeOptions = [5, 8, 12, 24, 48];
  pageIndex = 0;
  statistiques: {
    tauxRemplissage: number;
    moyenneParticipation: number;
    plusPopulaire: { id: number; titre: string; nombreInscriptions: number } | null;
    evolutionMensuelle: { mois: string; nombreInscriptions: number }[];
  } | null = null;

  constructor(
    private evenementService: EvenementService,
    private inscriptionService: InscriptionEvenementService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    // Évite les appels HTTP pendant le prerender SSR
    if (isPlatformBrowser(this.platformId)) {
      this.loadEvenements();
    }
  }

  loadEvenements(): void {
    this.loading = true;
    this.evenementService.getAllEvenements().subscribe({
      next: (data) => {
        this.evenements = data;
        this.filteredEvenements = [...this.evenements];
        this.loadStatistiques();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des événements:', error);
        this.snackBar.open('Erreur lors du chargement des événements', 'Fermer', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  loadStatistiques(): void {
    this.evenementService.getStatistiques().subscribe({
      next: (stats) => {
        this.statistiques = stats;
      },
      error: () => {
        this.statistiques = null;
      }
    });
  }

  filterEvenements(): void {
    this.pageIndex = 0;
    this.filteredEvenements = this.evenements.filter(evenement => {
      const matchesSearch = this.searchTerm === '' || 
        evenement.titre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (evenement.description && evenement.description.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (evenement.nomClubOrganisateur && evenement.nomClubOrganisateur.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesType = this.selectedType === 'all' || evenement.type === this.selectedType;
      const matchesStatus = this.selectedStatus === 'all' || evenement.status === this.selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }

  get paginatedEvenements(): Evenement[] {
    const start = this.pageIndex * this.pageSize;
    return this.filteredEvenements.slice(start, start + this.pageSize);
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
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

  get activeCount(): number {
    return this.evenements.filter(e => e.status === EventStatus.ACTIVE).length;
  }

  get plannedCount(): number {
    return this.evenements.filter(e => e.status === EventStatus.PLANNED).length;
  }

  get completedCount(): number {
    return this.evenements.filter(e => e.status === EventStatus.COMPLETED).length;
  }

  addEvent(): void {
    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '600px',
      data: { evenement: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEvenements();
      }
    });
  }

  editEvent(evenement: Evenement): void {
    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '600px',
      data: { evenement: { ...evenement } }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEvenements();
      }
    });
  }

  deleteEvent(evenement: Evenement): void {
    if (!evenement.id) return;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${evenement.titre}" ?`)) {
      this.evenementService.deleteEvenement(evenement.id).subscribe({
        next: () => {
          this.snackBar.open('Événement supprimé avec succès', 'Fermer', {
            duration: 3000
          });
          this.loadEvenements();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          const message = error.error?.message || 'Erreur lors de la suppression';
          this.snackBar.open(message, 'Fermer', {
            duration: 3000
          });
        }
      });
    }
  }

  viewEvent(evenement: Evenement): void {
    this.dialog.open(EventDialogComponent, {
      width: '600px',
      data: { evenement: { ...evenement }, viewMode: true }
    });
  }

  viewFeedbacks(evenement: Evenement): void {
    this.dialog.open(FeedbackViewDialogComponent, {
      width: '500px',
      data: { evenement }
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

  getUniqueTypes(): string[] {
    const types = this.evenements
      .map(e => e.type)
      .filter((type, index, self) => type && self.indexOf(type) === index);
    return types as string[];
  }

  getEvolutionHeight(count: number): number {
    if (!this.statistiques?.evolutionMensuelle?.length) return 0;
    const max = Math.max(...this.statistiques.evolutionMensuelle.map(e => e.nombreInscriptions));
    if (max === 0) return count > 0 ? 20 : 0;
    const pct = (count / max) * 100;
    return count > 0 ? Math.max(20, pct) : 0;
  }

  loadInscriptionsCount(evenement: Evenement): void {
    if (!evenement.id) return;
    this.inscriptionService.countInscriptionsByEvenement(evenement.id).subscribe({
      next: (count) => {
        // Mettre à jour le nombre d'inscriptions si nécessaire
        console.log(`Nombre d'inscriptions pour ${evenement.titre}: ${count}`);
      }
    });
  }
}
