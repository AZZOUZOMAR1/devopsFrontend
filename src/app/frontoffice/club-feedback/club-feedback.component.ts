import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Club, ClubFeedback } from '../../models/club.model';
import { ParticipationClubService } from '../../services/participation-club.service';
import { ClubFeedbackService } from '../../services/club-feedback.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-club-feedback',
  templateUrl: './club-feedback.component.html',
  styleUrls: ['./club-feedback.component.css']
})
export class ClubFeedbackComponent implements OnInit {
  clubs: Club[] = [];
  selectedClubId: number | null = null;
  feedbacks: ClubFeedback[] = [];
  loading = false;
  loadingFeedbacks = false;
  saving = false;

  form: FormGroup;

  constructor(
    private participationService: ParticipationClubService,
    private feedbackService: ClubFeedbackService,
    public authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.form = this.fb.group({
      note: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      commentaire: ['', [Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && this.authService.isLoggedIn()) {
      this.loadMyClubs();
    }
  }

  get stars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  setNote(n: number): void {
    this.form.patchValue({ note: n });
  }

  loadMyClubs(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;
    this.loading = true;
    this.participationService.getClubsMembre(userId).subscribe({
      next: (clubs) => {
        this.clubs = clubs || [];
        this.loading = false;
        if (this.clubs.length > 0) {
          this.selectedClubId = this.clubs[0].id || null;
          if (this.selectedClubId) this.loadFeedbacks(this.selectedClubId);
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onClubChange(): void {
    if (this.selectedClubId) {
      this.loadFeedbacks(this.selectedClubId);
    } else {
      this.feedbacks = [];
    }
  }

  loadFeedbacks(clubId: number): void {
    this.loadingFeedbacks = true;
    this.feedbackService.getByClub(clubId).subscribe({
      next: (list) => {
        this.feedbacks = list || [];
        this.loadingFeedbacks = false;
      },
      error: () => {
        this.feedbacks = [];
        this.loadingFeedbacks = false;
      }
    });
  }

  get selectedClubNom(): string {
    const c = this.clubs.find((x) => x.id === this.selectedClubId);
    return c?.nom || '';
  }

  formatFeedbackDate(s?: string): string {
    if (!s) return '';
    try {
      return new Date(s).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return s;
    }
  }

  submit(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId || !this.selectedClubId || this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving = true;
    this.feedbackService.createOrUpdate({
      idEtudiant: userId,
      idClub: this.selectedClubId,
      note: Number(v.note),
      commentaire: v.commentaire?.trim()
    }).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Merci ! Votre avis a été enregistré.', 'Fermer', { duration: 3500 });
        this.form.patchValue({ commentaire: '' });
        this.loadFeedbacks(this.selectedClubId!);
      },
      error: (err) => {
        this.saving = false;
        const msg = typeof err.error === 'string' ? err.error : 'Erreur lors de l’envoi';
        this.snackBar.open(msg, 'Fermer', { duration: 4000 });
      }
    });
  }
}

