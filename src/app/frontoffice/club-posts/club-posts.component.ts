import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Club } from '../../models/club.model';
import { ClubService } from '../../services/club.service';
import { PostClub, PostClubService } from '../../services/post-club.service';
import {
  PostClubEngagementService,
  PostCommentView,
  PostEngagementSummary
} from '../../services/post-club-engagement.service';
import { ParticipationClubService } from '../../services/participation-club.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-club-posts',
  templateUrl: './club-posts.component.html',
  styleUrls: ['./club-posts.component.css']
})
export class ClubPostsComponent implements OnInit {
  clubs: Club[] = [];
  selectedClubId: number | null = null;
  posts: PostClub[] = [];
  loading = false;

  pageSize = 6;
  pageIndex = 0;
  pageSizeOptions = [3, 6, 12, 18];

  /** Résumé engagement par post */
  engagementByPostId = new Map<number, PostEngagementSummary>();
  /** Membre accepté par club */
  memberByClubId = new Map<number, boolean>();
  /** Fil de commentaires chargé par post */
  commentsByPostId = new Map<number, PostCommentView[]>();
  /** Posts dont le fil commentaires est ouvert */
  openCommentPostIds = new Set<number>();
  /** Brouillon commentaire */
  commentDraft: Record<number, string> = {};
  commentTranslateToEnglish: Record<number, boolean> = {};
  loadingComments = new Set<number>();

  readonly reactionKinds: { type: string; icon: string; label: string }[] = [
    { type: 'LIKE', icon: 'thumb_up', label: 'Utile' },
    { type: 'LOVE', icon: 'favorite', label: 'J’adore' },
    { type: 'SUPPORT', icon: 'volunteer_activism', label: 'Soutien' },
    { type: 'INSIGHTFUL', icon: 'psychology', label: 'Intéressant' },
    { type: 'CELEBRATE', icon: 'celebration', label: 'Bravo' }
  ];

  constructor(
    private clubService: ClubService,
    private postService: PostClubService,
    private engagementService: PostClubEngagementService,
    private participationService: ParticipationClubService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.clubService.getAllClubs().subscribe({ next: (c) => (this.clubs = c || []) });
    this.loadAllPosts();
  }

  onClubChange(): void {
    this.pageIndex = 0;
    this.closeAllThreads();
    if (!this.selectedClubId) {
      this.loadAllPosts();
      return;
    }
    this.loading = true;
    this.postService.getByClub(this.selectedClubId).subscribe({
      next: (p) => {
        this.posts = p || [];
        this.loading = false;
        this.afterPostsLoaded();
      },
      error: () => {
        this.posts = [];
        this.loading = false;
      }
    });
  }

  getMedias(post: PostClub): string[] {
    if (!post.medias) return [];
    try {
      const arr = JSON.parse(post.medias);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  isVideo(url: string): boolean {
    return url.startsWith('data:video');
  }

  getClubNom(post: PostClub): string {
    const id = post.club?.id;
    if (id == null) return 'Club';
    return this.clubs.find((c) => c.id === id)?.nom || `Club #${id}`;
  }

  formatPostDate(d?: string): string {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return d;
    }
  }

  get paginatedPosts(): PostClub[] {
    const start = this.pageIndex * this.pageSize;
    return this.posts.slice(start, start + this.pageSize);
  }

  onPostsPageChange(ev: PageEvent): void {
    this.pageIndex = ev.pageIndex;
    this.pageSize = ev.pageSize;
    this.closeAllThreads();
    this.refreshEngagementBatch();
  }

  getEngagement(postId?: number): PostEngagementSummary | null {
    if (postId == null) return null;
    return this.engagementByPostId.get(postId) ?? null;
  }

  canInteract(post: PostClub): boolean {
    const uid = this.authService.getCurrentUserId();
    if (uid == null || post.club?.id == null) return false;
    return this.memberByClubId.get(post.club.id) === true;
  }

  interactionHint(post: PostClub): string {
    if (!this.authService.isLoggedIn()) {
      return 'Connectez-vous pour réagir et commenter.';
    }
    if (!this.canInteract(post)) {
      return 'Rejoignez ce club (membre accepté) pour réagir et commenter.';
    }
    return '';
  }

  onReact(post: PostClub, type: string): void {
    const pid = post.id;
    const uid = this.authService.getCurrentUserId();
    if (pid == null || uid == null || !this.canInteract(post)) return;
    const current = this.getEngagement(pid)?.myReaction;
    if (current === type) {
      this.engagementService.clearReaction(pid, uid).subscribe({
        next: () => this.refreshEngagementForPosts([pid]),
        error: (err) => this.showErr(err)
      });
    } else {
      this.engagementService.setReaction(pid, uid, type).subscribe({
        next: () => this.refreshEngagementForPosts([pid]),
        error: (err) => this.showErr(err)
      });
    }
  }

  toggleComments(post: PostClub): void {
    const id = post.id;
    if (id == null) return;
    if (this.openCommentPostIds.has(id)) {
      this.openCommentPostIds.delete(id);
      return;
    }
    this.openCommentPostIds.add(id);
    if (!this.commentsByPostId.has(id)) {
      this.loadingComments.add(id);
      this.engagementService.listComments(id).subscribe({
        next: (rows) => {
          this.commentsByPostId.set(id, rows || []);
          this.loadingComments.delete(id);
        },
        error: () => {
          this.loadingComments.delete(id);
          this.snackBar.open('Impossible de charger les commentaires', 'Fermer', { duration: 3500 });
        }
      });
    }
  }

  commentsOpen(id: number): boolean {
    return this.openCommentPostIds.has(id);
  }

  submitComment(post: PostClub): void {
    const pid = post.id;
    const uid = this.authService.getCurrentUserId();
    if (pid == null || uid == null) return;
    const text = (this.commentDraft[pid] || '').trim();
    if (text.length < 1) return;
    const translate = !!this.commentTranslateToEnglish[pid];
    this.engagementService.addComment(pid, uid, text, translate).subscribe({
      next: (c) => {
        const list = this.commentsByPostId.get(pid) || [];
        this.commentsByPostId.set(pid, [...list, c]);
        this.commentDraft[pid] = '';
        this.commentTranslateToEnglish[pid] = false;
        this.refreshEngagementForPosts([pid]);
        const parts: string[] = [];
        if (c.aiCorrectionApplied) parts.push('orthographe ajustée');
        if (c.aiTranslatedToEnglish) parts.push('traduit en anglais');
        const msg = parts.length ? `Commentaire publié (${parts.join(', ')}).` : 'Commentaire publié';
        this.snackBar.open(msg, 'OK', { duration: 3000 });
      },
      error: (err) => this.showErr(err)
    });
  }

  deleteMyComment(postId: number, comment: PostCommentView): void {
    const uid = this.authService.getCurrentUserId();
    if (uid == null || comment.idAuteur !== uid) return;
    this.engagementService.deleteOwnComment(comment.id, uid).subscribe({
      next: () => {
        const list = (this.commentsByPostId.get(postId) || []).filter((c) => c.id !== comment.id);
        this.commentsByPostId.set(postId, list);
        this.refreshEngagementForPosts([postId]);
      },
      error: (err) => this.showErr(err)
    });
  }

  chipIconFor(key: string): string {
    const r = this.reactionKinds.find((x) => x.type === key);
    return r?.icon ?? 'mood';
  }

  reactionLabel(key: string): string {
    const r = this.reactionKinds.find((x) => x.type === key);
    return r?.label ?? key;
  }

  formatCommentDate(iso: string): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return iso;
    }
  }

  sentimentLabel(sentiment?: string): string {
    if (sentiment === 'POSITIVE') return 'Positif';
    if (sentiment === 'NEGATIVE') return 'Négatif';
    return 'Neutre';
  }

  sentimentIcon(sentiment?: string): string {
    if (sentiment === 'POSITIVE') return 'sentiment_satisfied';
    if (sentiment === 'NEGATIVE') return 'sentiment_dissatisfied';
    return 'sentiment_neutral';
  }

  private closeAllThreads(): void {
    this.openCommentPostIds.clear();
  }

  private loadAllPosts(): void {
    this.pageIndex = 0;
    this.loading = true;
    this.closeAllThreads();
    this.postService.getAll().subscribe({
      next: (p) => {
        this.posts = (p || []).slice().reverse();
        this.loading = false;
        this.afterPostsLoaded();
      },
      error: () => {
        this.posts = [];
        this.loading = false;
      }
    });
  }

  private afterPostsLoaded(): void {
    this.refreshMemberMap();
    this.refreshEngagementBatch();
  }

  private refreshMemberMap(): void {
    this.memberByClubId.clear();
    const uid = this.authService.getCurrentUserId();
    if (uid == null || !this.posts.length) return;
    const clubIds = [
      ...new Set(this.posts.map((p) => p.club?.id).filter((x): x is number => x != null))
    ];
    if (!clubIds.length) return;
    const calls = clubIds.map((cid) =>
      this.participationService.getStatutParticipation(uid, cid).pipe(
        map((s) => ({ cid, ok: s === 'ACCEPTED' })),
        catchError(() => of({ cid, ok: false }))
      )
    );
    forkJoin(calls).subscribe((rows) => {
      rows.forEach((r) => this.memberByClubId.set(r.cid, r.ok));
    });
  }

  private refreshEngagementBatch(): void {
    const ids = this.paginatedPosts.map((p) => p.id).filter((x): x is number => x != null);
    if (!ids.length) {
      this.engagementByPostId.clear();
      return;
    }
    const viewer = this.authService.getCurrentUserId();
    this.engagementService.batchSummaries(ids, viewer).subscribe({
      next: (rows) => {
        ids.forEach((id) => this.engagementByPostId.delete(id));
        (rows || []).forEach((r) => this.engagementByPostId.set(r.postId, r));
      },
      error: () => {
        /* silencieux : le mur reste utilisable */
      }
    });
  }

  private refreshEngagementForPosts(postIds: number[]): void {
    const viewer = this.authService.getCurrentUserId();
    this.engagementService.batchSummaries(postIds, viewer).subscribe({
      next: (rows) => (rows || []).forEach((r) => this.engagementByPostId.set(r.postId, r))
    });
  }

  private showErr(err: unknown): void {
    const msg =
      typeof err === 'object' && err !== null && 'error' in err
        ? (err as { error?: string | { message?: string } }).error
        : null;
    const text =
      typeof msg === 'string' ? msg : typeof msg === 'object' && msg && 'message' in msg ? String((msg as { message?: string }).message) : 'Action impossible';
    this.snackBar.open(text, 'Fermer', { duration: 4500 });
  }
}
