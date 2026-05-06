import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, tap } from 'rxjs';
import { ReclamationService, StudentBlockStatus } from './reclamation.service';

/**
 * Polls GET /reclamations/students/{id}/block-status while a student uses the front office so that
 * an admin-imposed block (e.g. bad language) appears without signing in again.
 */
@Injectable({ providedIn: 'root' })
export class StudentReclamationBlockStatusService {
  /** How often to re-check while the student is in the front office (admin may block at any time). */
  private static readonly POLL_MS = 6000;

  private readonly statusSubject = new BehaviorSubject<StudentBlockStatus | null>(null);
  readonly status$ = this.statusSubject.asObservable();

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private activeStudentId: number | null = null;
  private pollSub: Subscription | null = null;

  constructor(private readonly reclamationService: ReclamationService) {}

  /** Updates shared status; use in error handlers that need the Observable chain. */
  fetchNow(studentId: number): Observable<StudentBlockStatus> {
    return this.reclamationService.getStudentBlockStatus(studentId).pipe(
      tap((s) => this.statusSubject.next(s))
    );
  }

  /** One immediate fetch (e.g. when opening Reclamations or on tab focus). */
  refresh(studentId: number): void {
    this.pollSub?.unsubscribe();
    this.pollSub = this.fetchNow(studentId).subscribe();
  }

  startPolling(studentId: number): void {
    this.stopPolling(false);
    this.activeStudentId = studentId;
    this.refresh(studentId);
    this.pollTimer = setInterval(() => {
      if (this.activeStudentId != null) {
        this.refresh(this.activeStudentId);
      }
    }, StudentReclamationBlockStatusService.POLL_MS);
  }

  /**
   * @param clearEmit when true (default), clears subscribers' UI (logout).
   */
  stopPolling(clearEmit = true): void {
    if (this.pollTimer != null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.pollSub?.unsubscribe();
    this.pollSub = null;
    this.activeStudentId = null;
    if (clearEmit) {
      this.statusSubject.next(null);
    }
  }
}
