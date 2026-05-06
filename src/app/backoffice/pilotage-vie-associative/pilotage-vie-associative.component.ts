import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Club } from '../../models/club.model';
import { Evenement } from '../../models/evenement.model';
import { ClubService } from '../../services/club.service';
import { EvenementService } from '../../services/evenement.service';
import { InscriptionEvenementService } from '../../services/inscription-evenement.service';
import { ParticipationClubService } from '../../services/participation-club.service';
import { PostClub, PostClubService } from '../../services/post-club.service';

export type PilotageAlertSeverity = 'danger' | 'warning' | 'info';

export interface PilotageAlert {
  severity: PilotageAlertSeverity;
  title: string;
  detail: string;
  clubId?: number;
  clubName?: string;
}

@Component({
  selector: 'app-pilotage-vie-associative',
  templateUrl: './pilotage-vie-associative.component.html',
  styleUrls: ['./pilotage-vie-associative.component.css']
})
export class PilotageVieAssociativeComponent implements OnInit {
  loading = true;
  loadError = false;

  clubs: Club[] = [];
  evenements: Evenement[] = [];
  totalInscriptions = 0;
  eventsWithInscriptions = 0;
  /** % d'événements ayant au moins une inscription */
  tauxEvenementsEngages = 0;
  totalMembres = 0;
  clubsActifs = 0;
  clubsPending = 0;
  alerts: PilotageAlert[] = [];

  clubRows: {
    club: Club;
    membres: number;
    nbEvenements: number;
    derniereActivite: string | null;
    joursSansActivite: number | null;
  }[] = [];

  constructor(
    private clubService: ClubService,
    private evenementService: EvenementService,
    private inscriptionService: InscriptionEvenementService,
    private participationService: ParticipationClubService,
    private postClubService: PostClubService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;

    this.clubService.getAllClubs().pipe(
      catchError(() => of([] as Club[])),
      switchMap((clubs) => {
        const withIds = (clubs || []).filter(c => c.id != null) as (Club & { id: number })[];
        const membres$ =
          withIds.length === 0
            ? of([] as { clubId: number; membres: number }[])
            : forkJoin(
                withIds.map(c =>
                  this.participationService.getMembresClub(c.id).pipe(
                    catchError(() => of([])),
                    map((m: unknown[]) => ({ clubId: c.id, membres: Array.isArray(m) ? m.length : 0 }))
                  )
                )
              );

        return forkJoin({
          clubs: of(clubs || []),
          evenements: this.evenementService.getAllEvenements().pipe(catchError(() => of([] as Evenement[]))),
          posts: this.postClubService.getAll().pipe(catchError(() => of([] as PostClub[]))),
          membresCounts: membres$
        });
      }),
      switchMap(({ clubs, evenements, posts, membresCounts }) => {
        const evs = (evenements || []).filter(e => e.id != null);
        if (evs.length === 0) {
          return of({
            clubs,
            evenements,
            posts,
            membresCounts,
            insByEvent: new Map<number, number>(),
            totalInscriptions: 0
          });
        }
        return forkJoin(
          evs.map(e =>
            this.inscriptionService.countInscriptionsByEvenement(e.id!).pipe(
              catchError(() => of(0)),
              map(n => ({ id: e.id!, n: typeof n === 'number' ? n : 0 }))
            )
          )
        ).pipe(
          map((pairs) => {
            const insByEvent = new Map<number, number>();
            let totalInscriptions = 0;
            for (const p of pairs) {
              insByEvent.set(p.id, p.n);
              totalInscriptions += p.n;
            }
            return { clubs, evenements, posts, membresCounts, insByEvent, totalInscriptions };
          })
        );
      })
    ).subscribe({
      next: ({ clubs, evenements, posts, membresCounts, insByEvent, totalInscriptions }) => {
        this.clubs = clubs;
        this.evenements = evenements;
        this.totalInscriptions = totalInscriptions;

        const memMap = new Map<number, number>();
        let totalM = 0;
        for (const x of membresCounts) {
          memMap.set(x.clubId, x.membres);
          totalM += x.membres;
        }
        this.totalMembres = totalM;

        const withIns = evenements.filter(e => e.id != null && (insByEvent.get(e.id!) || 0) > 0).length;
        this.eventsWithInscriptions = withIns;
        this.tauxEvenementsEngages = evenements.length ? Math.round((withIns / evenements.length) * 100) : 0;

        this.clubsActifs = clubs.filter(c => (c.statut || '').toLowerCase() === 'active').length;
        this.clubsPending = clubs.filter(c => (c.statut || '').toLowerCase() === 'pending').length;

        const postsByClub = new Map<number, string>();
        for (const p of posts) {
          const cid = p.club?.id;
          if (cid == null) continue;
          const d = p.datePost || '';
          const prev = postsByClub.get(cid);
          if (!prev || d > prev) postsByClub.set(cid, d);
        }

        const now = new Date();
        const ms60 = 60 * 24 * 60 * 60 * 1000;
        const alerts: PilotageAlert[] = [];
        const clubRows: typeof this.clubRows = [];

        for (const club of clubs) {
          const cid = club.id;
          if (cid == null) continue;

          const evClub = evenements.filter(e => e.idClub === cid);
          const lastEventDates = evClub.map(e => e.date).filter(Boolean).sort().reverse();
          const lastPost = postsByClub.get(cid);
          let derniere: string | null = null;
          if (lastEventDates.length && lastPost) {
            derniere = lastEventDates[0]! > lastPost! ? lastEventDates[0]! : lastPost!;
          } else if (lastEventDates.length) derniere = lastEventDates[0]!;
          else if (lastPost) derniere = lastPost;

          let jours: number | null = null;
          if (derniere) {
            const t = new Date(derniere).getTime();
            if (!isNaN(t)) jours = Math.floor((now.getTime() - t) / (24 * 60 * 60 * 1000));
          }

          clubRows.push({
            club,
            membres: memMap.get(cid) || 0,
            nbEvenements: evClub.length,
            derniereActivite: derniere,
            joursSansActivite: jours
          });

          const isActive = (club.statut || '').toLowerCase() === 'active';
          if (isActive) {
            if (evClub.length === 0) {
              alerts.push({
                severity: 'warning',
                title: 'Aucun événement rattaché',
                detail: `Le club « ${club.nom} » n’a encore aucun événement associé.`,
                clubId: cid,
                clubName: club.nom
              });
            } else if (derniere) {
              const t = new Date(derniere).getTime();
              if (!isNaN(t) && now.getTime() - t > ms60) {
                const j = Math.floor((now.getTime() - t) / (24 * 60 * 60 * 1000));
                alerts.push({
                  severity: j > 120 ? 'danger' : 'warning',
                  title: 'Activité en pause',
                  detail: `« ${club.nom} » : pas d’événement ni de post daté depuis ~${j} jours.`,
                  clubId: cid,
                  clubName: club.nom
                });
              }
            }
          }

          if ((club.statut || '').toLowerCase() === 'pending') {
            alerts.push({
              severity: 'info',
              title: 'Club en attente de validation',
              detail: `« ${club.nom} » est en statut « pending ».`,
              clubId: cid,
              clubName: club.nom
            });
          }
        }

        alerts.sort((a, b) => {
          const o: Record<PilotageAlertSeverity, number> = { danger: 0, warning: 1, info: 2 };
          return o[a.severity] - o[b.severity];
        });

        this.alerts = alerts;
        this.clubRows = clubRows.sort((a, b) => a.club.nom.localeCompare(b.club.nom));
        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      }
    });
  }

  get engagementMoyenMembres(): number {
    if (!this.clubsActifs) return 0;
    const activeIds = new Set(
      this.clubs.filter(c => (c.statut || '').toLowerCase() === 'active' && c.id != null).map(c => c.id!)
    );
    let sum = 0;
    for (const r of this.clubRows) {
      if (r.club.id != null && activeIds.has(r.club.id)) sum += r.membres;
    }
    return Math.round((sum / this.clubsActifs) * 10) / 10;
  }

  trackClub(_i: number, row: { club: Club }): number | undefined {
    return row.club.id;
  }
}
