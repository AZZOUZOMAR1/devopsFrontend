import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Club } from '../../../models/club.model';
import { ParticipationClubService } from '../../../services/participation-club.service';
import { AuthService } from '../../../services/auth.service';
import { ClubService } from '../../../services/club.service';

@Component({
  selector: 'app-join-club-dialog',
  templateUrl: './join-club-dialog.component.html',
  styleUrls: ['./join-club-dialog.component.css']
})
export class JoinClubDialogComponent {
  form: FormGroup;
  loading = false;
  scoreResult: number | null = null;
  submitted = false;
  departements: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<JoinClubDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { club: Club },
    private participationService: ParticipationClubService,
    private clubService: ClubService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      experience: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      motivation: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      disponibilite: [5, [Validators.required, Validators.min(0), Validators.max(20)]],
      departementSouhaite: ['', [Validators.required]],
      texteMotivation: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(1000)]]
    });
    this.loadDepartements();
  }

  get club(): Club {
    return this.data.club;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.club.id) return;
    const userId = this.authService.getCurrentUserId();
    if (userId == null) {
      this.snackBar.open('Veuillez vous connecter pour rejoindre un club.', 'Fermer', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.participationService.demanderRejoindre({
      idEtudiant: userId,
      idClub: this.club.id,
      reponses: {
        experience: this.form.value.experience,
        motivation: this.form.value.motivation,
        disponibilite: this.form.value.disponibilite
      },
      departementSouhaite: this.form.value.departementSouhaite,
      texteMotivation: this.form.value.texteMotivation.trim()
    }).subscribe({
      next: (result) => {
        this.scoreResult = result.score;
        this.submitted = true;
        this.loading = false;
        this.snackBar.open(result.message, 'Fermer', { duration: 5000 });
      },
      error: (err) => {
        this.loading = false;
        let msg = 'Erreur lors de l\'envoi de la demande';
        if (typeof err.error === 'string') {
          msg = err.error;
        } else if (err.error?.error) {
          msg = err.error.error;
        } else if (err.error?.message) {
          msg = err.error.message;
        } else if (err.status === 0) {
          msg = 'Impossible de contacter le serveur. Vérifiez que le backend et le gateway sont démarrés.';
        } else if (err.status === 404) {
          msg = 'Service non disponible. Vérifiez la configuration.';
        }
        this.snackBar.open(msg, 'Fermer', { duration: 5000 });
      }
    });
  }

  onClose(): void {
    this.dialogRef.close(this.submitted);
  }

  private loadDepartements(): void {
    if (!this.club.id) return;
    this.clubService.getDepartements(this.club.id).subscribe({
      next: (deps) => {
        this.departements = deps || [];
        if (this.departements.length > 0) {
          this.form.patchValue({ departementSouhaite: this.departements[0] });
        }
      },
      error: () => {
        this.departements = ['RH', 'Marketing', 'Technique', 'Finance'];
        this.form.patchValue({ departementSouhaite: this.departements[0] });
      }
    });
  }
}
