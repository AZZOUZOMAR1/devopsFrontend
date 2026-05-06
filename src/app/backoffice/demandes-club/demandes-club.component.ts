import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Club } from '../../models/club.model';
import { DemandeParticipationView } from '../../models/club.model';
import { ClubService } from '../../services/club.service';
import { ParticipationClubService } from '../../services/participation-club.service';

@Component({
  selector: 'app-demandes-club',
  templateUrl: './demandes-club.component.html',
  styleUrls: ['./demandes-club.component.css']
})
export class DemandesClubComponent implements OnInit {
  demandesEnAttente: DemandeParticipationView[] = [];
  clubs: Club[] = [];
  loading = false;
  selectedClubFilter: number | '' = '';
  departementsByClub: Map<number, string[]> = new Map();
  selectedDepartementByDemande: Map<number, string> = new Map();

  constructor(
    private clubService: ClubService,
    private participationService: ParticipationClubService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadClubs();
      this.loadDemandes();
    }
  }

  loadClubs(): void {
    this.clubService.getAllClubs().subscribe({
      next: (data) => {
        this.clubs = data || [];
        this.clubs.forEach(c => {
          if (c.id) {
            this.clubService.getDepartements(c.id).subscribe({
              next: deps => this.departementsByClub.set(c.id!, deps || []),
              error: () => this.departementsByClub.set(c.id!, ['RH', 'Marketing', 'Technique', 'Finance'])
            });
          }
        });
      },
      error: () => {}
    });
  }

  loadDemandes(): void {
    this.loading = true;
    const clubId = this.selectedClubFilter === '' ? undefined : this.selectedClubFilter;
    this.participationService.getDemandesEnAttente(clubId).subscribe({
      next: (data) => {
        this.demandesEnAttente = data || [];
        this.demandesEnAttente.forEach(d => {
          this.selectedDepartementByDemande.set(d.id, d.departementSouhaite || '');
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onClubFilterChange(): void {
    this.loadDemandes();
  }

  accepterDemande(d: DemandeParticipationView): void {
    const dep = this.selectedDepartementByDemande.get(d.id) || d.departementSouhaite;
    this.participationService.accepterAvecDepartement(d.id, dep || undefined).subscribe({
      next: () => {
        this.snackBar.open('Demande acceptée', 'Fermer', { duration: 3000 });
        this.loadDemandes();
      },
      error: (err) => {
        this.snackBar.open(err.error || 'Erreur', 'Fermer', { duration: 3000 });
      }
    });
  }

  refuserDemande(d: DemandeParticipationView): void {
    this.participationService.refuser(d.id).subscribe({
      next: () => {
        this.snackBar.open('Demande refusée', 'Fermer', { duration: 3000 });
        this.loadDemandes();
      },
      error: (err) => {
        this.snackBar.open(err.error || 'Erreur', 'Fermer', { duration: 3000 });
      }
    });
  }

  formatDateDemande(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  /** Score sur 10 pour les couleurs : 8+ vert, 5-8 orange, <5 rouge */
  getScoreClass(score: number): string {
    const s = (score ?? 0) / 10;
    if (s >= 8) return 'score-green';
    if (s >= 5) return 'score-orange';
    return 'score-red';
  }

  getScoreLabel(score: number): string {
    const s = (score ?? 0) / 10;
    if (s >= 8) return 'Excellent';
    if (s >= 5) return 'Moyen';
    return 'Faible';
  }

  getDepartementsForDemande(d: DemandeParticipationView): string[] {
    const list = this.departementsByClub.get(d.idClub) || [];
    if (list.length > 0) return list;
    return ['RH', 'Marketing', 'Technique', 'Finance'];
  }

  getSelectedDepartement(d: DemandeParticipationView): string {
    return this.selectedDepartementByDemande.get(d.id) || '';
  }

  setSelectedDepartement(d: DemandeParticipationView, dep: string): void {
    this.selectedDepartementByDemande.set(d.id, dep);
  }
}
