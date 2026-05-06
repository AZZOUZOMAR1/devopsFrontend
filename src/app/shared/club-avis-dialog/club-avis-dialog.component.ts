import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClubFeedback } from '../../models/club.model';
import { ClubFeedbackService } from '../../services/club-feedback.service';

@Component({
  selector: 'app-club-avis-dialog',
  templateUrl: './club-avis-dialog.component.html',
  styleUrls: ['./club-avis-dialog.component.css']
})
export class ClubAvisDialogComponent implements OnInit {
  feedbacks: ClubFeedback[] = [];
  loading = true;
  loadError = false;

  constructor(
    private dialogRef: MatDialogRef<ClubAvisDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { clubId: number; nomClub: string },
    private feedbackService: ClubFeedbackService
  ) {}

  ngOnInit(): void {
    this.feedbackService.getByClub(this.data.clubId).subscribe({
      next: (list) => {
        this.feedbacks = list || [];
        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      }
    });
  }

  fermer(): void {
    this.dialogRef.close();
  }

  formatDate(s?: string): string {
    if (!s) return '';
    try {
      return new Date(s).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return s;
    }
  }
}
