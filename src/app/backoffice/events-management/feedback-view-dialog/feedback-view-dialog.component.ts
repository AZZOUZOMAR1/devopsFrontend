import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FeedbackService } from '../../../services/feedback.service';
import { Evenement, FeedbackDto } from '../../../models/evenement.model';

@Component({
  selector: 'app-feedback-view-dialog',
  templateUrl: './feedback-view-dialog.component.html',
  styleUrls: ['./feedback-view-dialog.component.css']
})
export class FeedbackViewDialogComponent {
  feedbacks: FeedbackDto[] = [];
  moyenne: number | null = null;
  nombreAvis = 0;
  loading = true;

  constructor(
    public dialogRef: MatDialogRef<FeedbackViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { evenement: Evenement },
    private feedbackService: FeedbackService
  ) {
    this.loadFeedbacks();
  }

  loadFeedbacks(): void {
    if (!this.data.evenement?.id) {
      this.loading = false;
      return;
    }
    this.feedbackService.getFeedbacksByEvenement(this.data.evenement.id).subscribe({
      next: (list) => {
        this.feedbacks = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
    this.feedbackService.getMoyenneByEvenement(this.data.evenement.id).subscribe({
      next: (m) => {
        this.moyenne = m.moyenne;
        this.nombreAvis = m.nombreAvis;
      }
    });
  }

  getStars(n: number): number[] {
    return Array(5).fill(0).map((_, i) => i < n ? 1 : 0);
  }

  close(): void {
    this.dialogRef.close();
  }
}
