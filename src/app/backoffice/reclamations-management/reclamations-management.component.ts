import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ReclamationListSyncService } from '../../services/reclamation-list-sync.service';
import { PageEvent } from '@angular/material/paginator';
import { Reclamation, ReclamationService } from '../../services/reclamation.service';

/** Poll interval — backup if BroadcastChannel / refresh miss */
const LIST_POLL_MS = 2 * 60 * 1000;

@Component({
  selector: 'app-reclamations-management',
  templateUrl: './reclamations-management.component.html',
  styleUrls: ['./reclamations-management.component.css']
})
export class ReclamationsManagementComponent implements OnInit, OnDestroy {
  readonly pageSizeOptions = [5, 10, 20, 50];
  reclamations: Reclamation[] = [];
  /** 0-based page index (synced with API `number`). */
  pageIndex = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  pendingTotal = 0;
  inProgressTotal = 0;
  processedTotal = 0;
  loading = false;
  errorMessage = '';
  successMessage = '';
  backfillMlLoading = false;
  activeId: number | null = null;
  responseForm: { statut: string; reponseAdmin: string } = {
    statut: 'IN_PROGRESS',
    reponseAdmin: ''
  };
  reportReason = '';
  /** Filtre back-office sur la catégorie ML (vide = toutes). */
  mlCategoryFilter = '';
  /** Tri: priorité (défaut) ou catégorie ML A→Z. */
  adminSort: 'priority' | 'mlCategory' = 'priority';
  mlCategoryOptions: string[] = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private listSyncSub: Subscription | null = null;
  private readonly onVisibility = (): void => {
    if (document.visibilityState === 'visible') {
      this.loadReclamations(true);
    }
  };

  constructor(
    private reclamationService: ReclamationService,
    private authService: AuthService,
    private reclamationListSync: ReclamationListSyncService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      this.errorMessage = 'This page is only available for admin.';
      return;
    }
    this.loadMlCategoryOptions();
    this.loadReclamations(false);
    this.listSyncSub = this.reclamationListSync.listChanged$.subscribe(() => {
      this.loadMlCategoryOptions();
      this.loadReclamations(true);
    });
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('visibilitychange', this.onVisibility);
      this.pollTimer = setInterval(() => this.loadReclamations(true), LIST_POLL_MS);
    }
  }

  ngOnDestroy(): void {
    this.listSyncSub?.unsubscribe();
    this.listSyncSub = null;
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('visibilitychange', this.onVisibility);
    }
    if (this.pollTimer != null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * @param silent when true (poll / tab focus), skip full-page loading state so the table does not flicker.
   */
  loadReclamations(silent = false): void {
    if (!silent) {
      this.loading = true;
      this.errorMessage = '';
    }
    this.reclamationService
      .getAdminPage(this.pageIndex, this.pageSize, {
        categorieMl: this.mlCategoryFilter || undefined,
        sort: this.adminSort
      })
      .subscribe({
      next: (page) => {
        this.reclamations = page.content;
        this.totalElements = page.totalElements;
        this.totalPages = page.totalPages;
        this.pageIndex = page.number;
        this.pageSize = page.size;
        this.pendingTotal = page.pendingTotal;
        this.inProgressTotal = page.inProgressTotal;
        this.processedTotal = page.processedTotal;
        this.loading = false;
      },
      error: (err) => {
        if (!silent) {
          this.errorMessage =
            err?.error?.message ||
            (typeof err?.error === 'string' ? err.error : null) ||
            'An error occurred while loading reclamations.';
        }
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadReclamations(false);
  }

  onMlFilterOrSortChange(): void {
    this.pageIndex = 0;
    this.loadReclamations(false);
  }

  private loadMlCategoryOptions(): void {
    this.reclamationService.getAdminMlCategories().subscribe({
      next: (list) => {
        this.mlCategoryOptions = Array.isArray(list) ? list : [];
      },
      error: () => {
        this.mlCategoryOptions = [];
      }
    });
  }

  /** Recalcule les catégories ML pour les réclamations créées avant l’intégration ML. */
  runBackfillMl(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.backfillMlLoading = true;
    this.reclamationService.backfillMlCategories(200).subscribe({
      next: (res) => {
        this.backfillMlLoading = false;
        this.successMessage = `ML categories updated: ${res.updated}, skipped (no ML / error): ${res.skipped}.`;
        this.loadMlCategoryOptions();
        this.loadReclamations(false);
        this.reclamationListSync.notifyListChanged();
      },
      error: (err) => {
        this.backfillMlLoading = false;
        this.errorMessage =
          err?.error?.message ||
          (typeof err?.error === 'string' ? err.error : null) ||
          'Backfill ML failed. Is Python running on port 8025 and reclamation.ml.base-url set?';
      }
    });
  }

  startTreatment(item: Reclamation): void {
    this.activeId = item.id ?? null;
    this.responseForm = {
      statut: item.statut === 'RESOLUE' ? 'RESOLUE' : (item.statut === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'EN_COURS'),
      reponseAdmin: item.reponseAdmin || ''
    };
    this.reportReason = item.reportReason || '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  submitTreatment(item: Reclamation): void {
    if (!item.id) return;
    if (!this.responseForm.reponseAdmin.trim()) {
      this.errorMessage = 'Admin response is required.';
      return;
    }

    this.reclamationService.traiterParAdmin(item.id, {
      statut: this.responseForm.statut,
      reponseAdmin: this.responseForm.reponseAdmin.trim()
    }).subscribe({
      next: () => {
        this.successMessage = 'Response sent to student successfully.';
        this.activeId = null;
        this.responseForm = { statut: 'IN_PROGRESS', reponseAdmin: '' };
        this.loadReclamations();
        this.reclamationListSync.notifyListChanged();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'An error occurred while sending the response.';
      }
    });
  }

  cancelTreatment(): void {
    this.activeId = null;
    this.responseForm = { statut: 'IN_PROGRESS', reponseAdmin: '' };
    this.reportReason = '';
  }

  reportStudent(item: Reclamation): void {
    if (!item.id) return;
    const reason = this.reportReason.trim();
    if (!reason) {
      this.errorMessage = 'Report reason is required.';
      return;
    }
    this.reclamationService.reportStudent(item.id, { reportReason: reason }).subscribe({
      next: () => {
        this.successMessage = 'Student reported successfully.';
        this.reportReason = '';
        this.loadReclamations();
        this.reclamationListSync.notifyListChanged();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'An error occurred while reporting the student.';
      }
    });
  }

  unblockStudent(item: Reclamation): void {
    if (!item.id) return;
    this.reclamationService.unblockStudent(item.id).subscribe({
      next: () => {
        this.successMessage = 'Student unblocked successfully.';
        this.loadReclamations();
        this.reclamationListSync.notifyListChanged();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'An error occurred while unblocking the student.';
      }
    });
  }

  get processedPercent(): number {
    return this.totalElements === 0 ? 0 : Math.round((this.processedTotal * 100) / this.totalElements);
  }

  get inProgressPercent(): number {
    return this.totalElements === 0 ? 0 : Math.round((this.inProgressTotal * 100) / this.totalElements);
  }

  get pendingPercent(): number {
    return this.totalElements === 0 ? 0 : Math.round((this.pendingTotal * 100) / this.totalElements);
  }

  emotionChips(tags?: string): string[] {
    if (!tags?.trim()) {
      return [];
    }
    return tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  urgencyBadgeClass(level?: string): string {
    switch (level) {
      case 'CRITICAL':
        return 'urgency urgency--critical';
      case 'HIGH':
        return 'urgency urgency--high';
      case 'MEDIUM':
        return 'urgency urgency--medium';
      default:
        return 'urgency urgency--low';
    }
  }
}
