import { Component, OnInit } from '@angular/core';
import { FeedbackService } from '../../services/feedback.service';
import { EvenementService } from '../../services/evenement.service';
import { ClubFeedbackService } from '../../services/club-feedback.service';
import { FeedbackDto, Evenement } from '../../models/evenement.model';
import { ClubFeedback, ClubFeedbackStats } from '../../models/club.model';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-feedbacks-management',
  templateUrl: './feedbacks-management.component.html',
  styleUrls: ['./feedbacks-management.component.css']
})
export class FeedbacksManagementComponent implements OnInit {
  activeTab: 'events' | 'clubs' = 'clubs';

  // Events feedback
  feedbacks: FeedbackDto[] = [];
  evenements: Evenement[] = [];
  evenementMap: Map<number, Evenement> = new Map();

  // Clubs feedback
  clubFeedbacks: ClubFeedback[] = [];
  clubStats: ClubFeedbackStats | null = null;

  loading = false;

  constructor(
    private feedbackService: FeedbackService,
    private evenementService: EvenementService,
    private clubFeedbackService: ClubFeedbackService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'events' || tab === 'clubs') {
      this.activeTab = tab;
    }
    this.route.queryParamMap.subscribe((params) => {
      const t = params.get('tab');
      if (t === 'events' || t === 'clubs') {
        this.activeTab = t;
      }
    });
    this.loadData();
  }

  setTab(tab: 'events' | 'clubs'): void {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  loadData(): void {
    this.loading = true;
    this.evenementService.getAllEvenements().subscribe({
      next: (events) => {
        this.evenements = events;
        this.evenementMap.clear();
        events.forEach(e => { if (e.id) this.evenementMap.set(e.id, e); });
        this.loadFeedbacksEvents();
      },
      error: () => {
        this.loading = false;
      }
    });

    this.clubFeedbackService.getAllForAdmin().subscribe({
      next: (list) => { this.clubFeedbacks = list || []; },
      error: () => {}
    });
    this.clubFeedbackService.getStatsForAdmin().subscribe({
      next: (stats) => { this.clubStats = stats; },
      error: () => {}
    });
  }

  loadFeedbacksEvents(): void {
    this.feedbackService.getAllFeedbacksForAdmin().subscribe({
      next: (list) => {
        this.feedbacks = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getEvenementTitre(evenementId?: number): string {
    if (!evenementId) return '-';
    return this.evenementMap.get(evenementId)?.titre ?? '-';
  }

  getStars(n: number): number[] {
    return Array(5).fill(0).map((_, i) => i < n ? 1 : 0);
  }

  getMoyenneParEvenement(): { evenementId: number; titre: string; moyenne: number; count: number }[] {
    const map = new Map<number, { sum: number; count: number }>();
    this.feedbacks.forEach(f => {
      const eid = f.evenementId ?? 0;
      const cur = map.get(eid) || { sum: 0, count: 0 };
      cur.sum += f.note;
      cur.count += 1;
      map.set(eid, cur);
    });
    return Array.from(map.entries()).map(([eid, v]) => ({
      evenementId: eid,
      titre: this.getEvenementTitre(eid),
      moyenne: v.count > 0 ? Math.round((v.sum / v.count) * 10) / 10 : 0,
      count: v.count
    }));
  }

  getMaxDistribution(): number {
    if (!this.clubStats?.distributionNotes?.length) return 1;
    return Math.max(...this.clubStats.distributionNotes.map(d => d.count), 1);
  }

  getSentimentClass(sentiment?: string): string {
    switch (sentiment) {
      case 'NEGATIVE':
        return 'sentiment-chip--neg';
      case 'POSITIVE':
        return 'sentiment-chip--pos';
      default:
        return 'sentiment-chip--neu';
    }
  }

  getSentimentLabel(sentiment?: string): string {
    switch (sentiment) {
      case 'NEGATIVE':
        return '😡 Négatif';
      case 'POSITIVE':
        return '😊 Positif';
      case 'NEUTRAL':
        return 'Neutre';
      default:
        return '—';
    }
  }
}
