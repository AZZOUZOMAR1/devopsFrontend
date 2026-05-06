import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Club } from '../../models/club.model';
import { ClubService } from '../../services/club.service';
import { AuthService } from '../../services/auth.service';
import { PostClub, PostClubService } from '../../services/post-club.service';
import {
  AdminEngagementRow,
  PostClubEngagementService
} from '../../services/post-club-engagement.service';
import {
  PostAssistantSuggestion,
  PostClubAssistantService
} from '../../services/post-club-assistant.service';

@Component({
  selector: 'app-club-posts',
  templateUrl: './club-posts.component.html',
  styleUrls: ['./club-posts.component.css']
})
export class ClubPostsComponent implements OnInit {
  clubs: Club[] = [];
  selectedClubId: number | null = null;
  posts: PostClub[] = [];
  form: FormGroup;
  mediaPreviews: string[] = [];
  readonly maxMediaCount = 6;

  pageSize = 6;
  pageIndex = 0;
  pageSizeOptions = [3, 6, 12, 18];

  /** Onglet 0 = studio, 1 = engagement admin */
  selectedTabIndex = 0;

  adminRows: AdminEngagementRow[] = [];
  adminTotal = 0;
  adminPageIndex = 0;
  adminPageSize = 10;
  adminLoading = false;

  readonly reactionLabels: Record<string, string> = {
    LIKE: 'Utile',
    LOVE: 'J’adore',
    SUPPORT: 'Soutien',
    INSIGHTFUL: 'Intéressant',
    CELEBRATE: 'Bravo'
  };

  /** Assistant Ollama */
  aiKeywords = '';
  aiLoading = false;
  aiPreview: PostAssistantSuggestion | null = null;

  constructor(
    private fb: FormBuilder,
    private clubService: ClubService,
    private postService: PostClubService,
    private engagementService: PostClubEngagementService,
    private assistantService: PostClubAssistantService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      contenu: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(16000)]]
    });
  }

  ngOnInit(): void {
    this.clubService.getAllClubs().subscribe({ next: (c) => (this.clubs = c || []) });
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    if (index === 1) {
      this.loadAdminEngagement();
    }
  }

  suggestWithOllama(): void {
    const k = (this.aiKeywords || '').trim();
    if (k.length < 3) {
      this.snackBar.open('Indiquez au moins 3 caractères : mots-clés, titre ou idée.', 'OK', { duration: 4000 });
      return;
    }
    this.aiLoading = true;
    this.aiPreview = null;
    this.assistantService.suggest(k, this.getClubName(this.selectedClubId)).subscribe({
      next: (s) => {
        this.aiLoading = false;
        this.aiPreview = s;
      },
      error: (err: { error?: unknown; message?: string }) => {
        this.aiLoading = false;
        const body = err?.error;
        const msg =
          typeof body === 'string' && body.length > 0
            ? body
            : 'Génération impossible. Vérifiez qu’Ollama tourne (ollama serve) et que le modèle llama3 est disponible.';
        this.snackBar.open(msg, 'Fermer', { duration: 9000 });
      }
    });
  }

  applyFullSuggestion(): void {
    if (!this.aiPreview) return;
    const text = this.composePostBody(this.aiPreview);
    this.form.patchValue({ contenu: text });
    this.form.get('contenu')?.markAsTouched();
    this.snackBar.open('Proposition insérée dans le post — relisez et ajustez avant publication.', 'OK', {
      duration: 4000
    });
  }

  dismissAiPreview(): void {
    this.aiPreview = null;
  }

  private composePostBody(s: PostAssistantSuggestion): string {
    const titre = (s.titre || 'Annonce').trim();
    const desc = (s.description || '').trim();
    const tags = (s.hashtags || [])
      .map((h) => '#' + String(h).replace(/^#+/, '').replace(/\s+/g, ''))
      .filter(Boolean);
    const lineTags = tags.join(' ');
    let out = titre + '\n\n' + desc;
    if (lineTags) {
      out += '\n\n' + lineTags;
    }
    if (out.length > 16000) {
      out = out.substring(0, 15997) + '…';
    }
    return out;
  }

  getClubName(id: number | null): string {
    if (id == null) return '';
    return this.clubs.find((c) => c.id === id)?.nom ?? '';
  }

  onClubChange(): void {
    this.pageIndex = 0;
    if (this.selectedClubId) {
      this.postService.getByClub(this.selectedClubId).subscribe({ next: (p) => (this.posts = p || []) });
    } else {
      this.posts = [];
    }
    if (this.selectedTabIndex === 1) {
      this.adminPageIndex = 0;
      this.loadAdminEngagement();
    }
  }

  get paginatedPosts(): PostClub[] {
    const start = this.pageIndex * this.pageSize;
    return this.posts.slice(start, start + this.pageSize);
  }

  onPostsPageChange(ev: PageEvent): void {
    this.pageIndex = ev.pageIndex;
    this.pageSize = ev.pageSize;
  }

  loadAdminEngagement(): void {
    this.adminLoading = true;
    this.engagementService
      .adminEngagementPage(this.selectedClubId, this.adminPageIndex, this.adminPageSize)
      .subscribe({
        next: (page) => {
          this.adminRows = page.content || [];
          this.adminTotal = page.totalElements;
          this.adminLoading = false;
        },
        error: (err: unknown) => {
          this.adminLoading = false;
          const status =
            typeof err === 'object' && err !== null && 'status' in err
              ? Number((err as { status?: number }).status)
              : NaN;
          const hint =
            status === 0 || Number.isNaN(status)
              ? 'Vérifiez que la gateway (8080) et le service club (8087) sont démarrés.'
              : `Erreur HTTP ${status}.`;
          this.snackBar.open(`Impossible de charger l’engagement des posts. ${hint}`, 'Fermer', {
            duration: 6500
          });
        }
      });
  }

  onAdminPageChange(ev: PageEvent): void {
    this.adminPageIndex = ev.pageIndex;
    this.adminPageSize = ev.pageSize;
    this.loadAdminEngagement();
  }

  reactionLabel(key: string): string {
    return this.reactionLabels[key] || key;
  }

  deleteAdminComment(row: AdminEngagementRow, commentId: number): void {
    if (!confirm('Supprimer ce commentaire ?')) return;
    this.engagementService.adminDeleteComment(commentId).subscribe({
      next: () => {
        row.comments = row.comments.filter((c) => c.id !== commentId);
        row.totalComments = Math.max(0, row.totalComments - 1);
        this.snackBar.open('Commentaire supprimé', 'OK', { duration: 2500 });
      },
      error: () =>
        this.snackBar.open('Suppression impossible', 'Fermer', { duration: 3500 })
    });
  }

  publier(): void {
    if (this.form.invalid || !this.selectedClubId) return;
    const userId = this.authService.getCurrentUserId() || 0;
    this.postService
      .create({
        contenu: this.form.value.contenu.trim(),
        idAuteur: userId,
        medias: this.mediaPreviews.length ? JSON.stringify(this.mediaPreviews) : undefined,
        club: { id: this.selectedClubId }
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Post publié', 'Fermer', { duration: 3000 });
          this.form.reset();
          this.mediaPreviews = [];
          this.onClubChange();
          if (this.selectedTabIndex === 1) {
            this.loadAdminEngagement();
          }
        }
      });
  }

  supprimer(p: PostClub): void {
    if (!p.id) return;
    this.postService.delete(p.id).subscribe({
      next: () => {
        this.onClubChange();
        if (this.selectedTabIndex === 1) {
          this.loadAdminEngagement();
        }
      }
    });
  }

  async onMediaSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;
    if (this.mediaPreviews.length + files.length > this.maxMediaCount) {
      this.snackBar.open(`Maximum ${this.maxMediaCount} médias par post`, 'Fermer', { duration: 3000 });
      input.value = '';
      return;
    }
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        this.snackBar.open('Formats acceptés: image/*, video/*', 'Fermer', { duration: 3000 });
        continue;
      }
      const maxSize = isVideo ? 10 * 1024 * 1024 : 4 * 1024 * 1024;
      if (file.size > maxSize) {
        this.snackBar.open(`Fichier trop volumineux (${isVideo ? '10MB' : '4MB'} max)`, 'Fermer', {
          duration: 3000
        });
        continue;
      }
      const dataUrl = await this.readAsDataUrl(file);
      this.mediaPreviews.push(dataUrl);
    }
    input.value = '';
  }

  removeMedia(i: number): void {
    this.mediaPreviews.splice(i, 1);
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

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
