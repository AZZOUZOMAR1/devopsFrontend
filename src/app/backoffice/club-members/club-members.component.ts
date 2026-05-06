import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Club } from '../../models/club.model';
import { ClubService } from '../../services/club.service';
import { ParticipationClubService } from '../../services/participation-club.service';

interface MembreClub {
  participationId: number;
  idEtudiant: number;
  prenomEtudiant: string;
  nomEtudiant: string;
  emailEtudiant: string;
  departementAssigne?: string;
  statut: string;
}

@Component({
  selector: 'app-club-members',
  templateUrl: './club-members.component.html',
  styleUrls: ['./club-members.component.css']
})
export class ClubMembersComponent implements OnInit {
  clubs: Club[] = [];
  selectedClubId: number | null = null;
  membres: MembreClub[] = [];
  loading = false;

  constructor(
    private clubService: ClubService,
    private participationService: ParticipationClubService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.clubService.getAllClubs().subscribe({ next: c => this.clubs = c || [] });
  }

  getClubName(id: number | null): string {
    if (id == null) return '';
    return this.clubs.find(c => c.id === id)?.nom ?? '';
  }

  onClubChange(): void {
    if (!this.selectedClubId) return;
    this.loading = true;
    this.participationService.getMembresClub(this.selectedClubId).subscribe({
      next: (m: any) => { this.membres = m || []; this.loading = false; },
      error: () => { this.membres = []; this.loading = false; }
    });
  }

  bloquer(m: MembreClub): void {
    this.participationService.bloquerMembre(m.participationId).subscribe({
      next: () => { this.snackBar.open('Membre bloqué', 'Fermer', { duration: 3000 }); this.onClubChange(); }
    });
  }

  supprimer(m: MembreClub): void {
    if (!confirm('Supprimer ce membre du club ?')) return;
    this.participationService.supprimerMembre(m.participationId).subscribe({
      next: () => { this.snackBar.open('Membre supprimé', 'Fermer', { duration: 3000 }); this.onClubChange(); }
    });
  }
}

