import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FeedbackService } from '../../../services/feedback.service';
import { AuthService } from '../../../services/auth.service';
import { Evenement, FeedbackDto } from '../../../models/evenement.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-feedback-dialog',
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.css']
})
export class FeedbackDialogComponent {
  note = 0;
  hoverNote = 0;
  commentaire = '';
  loading = false;
  viewOnly = false;
  feedbacks: FeedbackDto[] = [];
  moyenne: number | null = null;
  nombreAvis = 0;
  loadingAvis = false;

  constructor(
    public dialogRef: MatDialogRef<FeedbackDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      evenement: Evenement;
      hasFeedback?: boolean;
      viewOnly?: boolean;
    },
    private feedbackService: FeedbackService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.viewOnly = data.viewOnly ?? false;
    if (this.viewOnly) {
      this.loadFeedbacks();
    } else if (data.hasFeedback) {
      this.note = 0; // L'utilisateur peut modifier
    }
  }

  loadFeedbacks(): void {
    if (!this.data.evenement?.id) return;
    this.loadingAvis = true;
    this.feedbackService.getFeedbacksByEvenement(this.data.evenement.id).subscribe({
      next: (list) => {
        this.feedbacks = list;
        this.loadingAvis = false;
      },
      error: () => {
        this.loadingAvis = false;
      }
    });
    this.feedbackService.getMoyenneByEvenement(this.data.evenement.id).subscribe({
      next: (m) => {
        this.moyenne = m.moyenne;
        this.nombreAvis = m.nombreAvis;
      }
    });
  }

  setNote(n: number): void {
    if (!this.viewOnly) this.note = n;
  }

  submit(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId || !this.data.evenement?.id) return;
    if (this.note < 1 || this.note > 5) {
      this.snackBar.open('Veuillez sélectionner une note (1 à 5 étoiles)', 'Fermer', { duration: 3000 });
      return;
    }
    this.loading = true;
    this.feedbackService.createOrUpdateFeedback(userId, this.data.evenement.id, this.note, this.commentaire).subscribe({
      next: () => {
        this.snackBar.open('Merci pour votre avis !', 'Fermer', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.error || 'Erreur lors de l\'envoi';
        this.snackBar.open(msg, 'Fermer', { duration: 4000 });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  getStars(n: number): number[] {
    return Array(5).fill(0).map((_, i) => i < n ? 1 : 0);
  }
}
