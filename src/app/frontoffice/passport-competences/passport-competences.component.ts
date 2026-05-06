import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Club } from '../../models/club.model';
import { Evenement } from '../../models/evenement.model';
import { AuthService } from '../../services/auth.service';
import { ClubService } from '../../services/club.service';
import { EvenementService } from '../../services/evenement.service';
import { InscriptionEvenementService } from '../../services/inscription-evenement.service';
import { ParticipationClubService } from '../../services/participation-club.service';

export interface PassportBadge {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  accent: 'violet' | 'amber' | 'emerald' | 'sky' | 'rose';
}

@Component({
  selector: 'app-passport-competences',
  templateUrl: './passport-competences.component.html',
  styleUrls: ['./passport-competences.component.css']
})
export class PassportCompetencesComponent implements OnInit {
  loading = true;
  loadError = false;
  notLoggedIn = false;
  /** Évite un rendu incohérent pendant le SSR */
  isBrowser = false;

  displayName = '';
  mesClubs: Club[] = [];
  /** Événements auxquels l’étudiant est inscrit (ou liste d’attente) */
  evenementsParticipes: Evenement[] = [];
  badges: PassportBadge[] = [];
  isResponsableClub = false;
  nbAteliers = 0;

  constructor(
    private authService: AuthService,
    private participationService: ParticipationClubService,
    private clubService: ClubService,
    private evenementService: EvenementService,
    private inscriptionService: InscriptionEvenementService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    this.displayName = this.authService.getDisplayName() || 'Étudiant';
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (!this.isBrowser) {
      this.loading = false;
      return;
    }
    const uid = this.authService.getCurrentUserId();
    if (uid == null) {
      this.notLoggedIn = true;
      this.loading = false;
      return;
    }
    this.load(uid);
  }

  private load(userId: number): void {
    this.loading = true;
    this.loadError = false;

    forkJoin({
      mesClubs: this.participationService.getClubsMembre(userId).pipe(catchError(() => of([] as Club[]))),
      allClubs: this.clubService.getAllClubs().pipe(catchError(() => of([] as Club[]))),
      evenements: this.evenementService.getAllEvenements().pipe(catchError(() => of([] as Evenement[])))
    })
      .pipe(
        switchMap(({ mesClubs, allClubs, evenements }) => {
          const evs = (evenements || []).filter(e => e.id != null);
          if (evs.length === 0) {
            return of({ mesClubs, allClubs, evenements, participated: [] as Evenement[] });
          }
          return forkJoin(
            evs.map(e =>
              this.inscriptionService.getStatutInscription(userId, e.id!).pipe(
                catchError(() => of({ inscrit: false, enListeAttente: false, positionListeAttente: 0 })),
                map((s) => (s.inscrit || s.enListeAttente ? e : null))
              )
            )
          ).pipe(
            map((parts) => ({
              mesClubs,
              allClubs,
              evenements,
              participated: parts.filter((x): x is Evenement => x != null)
            }))
          );
        })
      )
      .subscribe({
        next: ({ mesClubs, allClubs, participated }) => {
          this.mesClubs = mesClubs || [];
          this.evenementsParticipes = participated.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

          this.isResponsableClub = (allClubs || []).some(
            c => c.idResponsable === userId && this.mesClubs.some(m => m.id === c.id)
          );
          if (!this.isResponsableClub) {
            this.isResponsableClub = (allClubs || []).some(c => c.idResponsable === userId);
          }

          const atelierRe = /atelier|workshop|conférence|conference|séminaire|seminaire/i;
          this.nbAteliers = this.evenementsParticipes.filter(e => atelierRe.test(e.type || '') || atelierRe.test(e.titre || '')).length;

          this.badges = this.computeBadges();
          this.loading = false;
        },
        error: () => {
          this.loadError = true;
          this.loading = false;
        }
      });
  }

  private computeBadges(): PassportBadge[] {
    const nClub = this.mesClubs.length;
    const nEv = this.evenementsParticipes.length;

    return [
      {
        id: 'debutant',
        icon: 'waving_hand',
        title: 'Bienvenue',
        description: 'Rejoindre au moins un club et une activité événement.',
        unlocked: nClub >= 1 && nEv >= 1,
        accent: 'sky'
      },
      {
        id: 'actif',
        icon: 'directions_run',
        title: 'Actif',
        description: 'Participer à 5 événements ou plus.',
        unlocked: nEv >= 5,
        accent: 'emerald'
      },
      {
        id: 'explorateur',
        icon: 'explore',
        title: 'Explorateur',
        description: 'Être membre de 3 clubs ou plus.',
        unlocked: nClub >= 3,
        accent: 'violet'
      },
      {
        id: 'curieux',
        icon: 'school',
        title: 'Curieux d’apprendre',
        description: 'Participer à 3+ événements type atelier / conférence.',
        unlocked: this.nbAteliers >= 3,
        accent: 'amber'
      },
      {
        id: 'leader',
        icon: 'military_tech',
        title: 'Leader',
        description: 'Être responsable d’un club.',
        unlocked: this.isResponsableClub,
        accent: 'rose'
      },
      {
        id: 'ambassadeur',
        icon: 'stars',
        title: 'Ambassadeur',
        description: '10+ participations événements.',
        unlocked: nEv >= 10,
        accent: 'violet'
      }
    ];
  }

  unlockedCount(): number {
    return this.badges.filter(b => b.unlocked).length;
  }
}
