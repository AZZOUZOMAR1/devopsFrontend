import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EvenementService } from '../../../services/evenement.service';
import { ClubService } from '../../../services/club.service';
import { Club } from '../../../models/club.model';
import { Evenement, EventStatus } from '../../../models/evenement.model';

/** Valide que la date n'est pas dans le passé pour les événements planifiés ou actifs */
function dateNotInPastValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const statusControl = control.parent?.get('status');
    if (!control.value || !statusControl?.value) return null;
    const status = statusControl.value;
    if (status !== EventStatus.PLANNED && status !== EventStatus.ACTIVE) return null;
    const date = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today ? { dateInPast: true } : null;
  };
}

/** Valide le format heure HH:mm ou HH:mm:ss */
function heureFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || (typeof value === 'string' && value.trim() === '')) return null;
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return regex.test(String(value)) ? null : { invalidHeure: true };
  };
}

/** Valide la capacité : optionnel, mais si renseigné entre 1 et 50000 */
function capaciteValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    if (isNaN(num)) return { invalidCapacite: true };
    if (num < 1) return { min: { min: 1, actual: num } };
    if (num > 50000) return { max: { max: 50000, actual: num } };
    return null;
  };
}

@Component({
  selector: 'app-event-dialog',
  templateUrl: './event-dialog.component.html',
  styleUrls: ['./event-dialog.component.css']
})
export class EventDialogComponent implements OnInit {
  eventForm!: FormGroup;
  isEditMode: boolean = false;
  viewMode: boolean = false;
  imagePreview: string | null = null;
  clubs: Club[] = [];
  clubsLoading = false;
  eventStatuses = Object.values(EventStatus);
  statusLabels: { [key: string]: string } = {
    'PLANNED': 'Planifié',
    'ACTIVE': 'Actif',
    'COMPLETED': 'Terminé',
    'CANCELLED': 'Annulé'
  };

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { evenement: Evenement | null; viewMode?: boolean; idClubPreselect?: number | null },
    private evenementService: EvenementService,
    private clubService: ClubService,
    private snackBar: MatSnackBar
  ) {
    this.viewMode = data.viewMode || false;
    this.isEditMode = !!data.evenement && !this.viewMode;
  }

  ngOnInit(): void {
    this.loadClubs();
    this.initForm();
    if (this.data.evenement) {
      this.populateForm(this.data.evenement);
    } else if (this.data.idClubPreselect != null && this.data.idClubPreselect !== undefined) {
      this.eventForm.patchValue({ idClub: this.data.idClubPreselect });
    }
  }

  private loadClubs(): void {
    this.clubsLoading = true;
    this.clubService.getAllClubs().subscribe({
      next: (list) => {
        this.clubs = list || [];
        this.clubsLoading = false;
      },
      error: () => {
        this.clubs = [];
        this.clubsLoading = false;
        this.snackBar.open('Impossible de charger la liste des clubs.', 'Fermer', { duration: 4000 });
      }
    });
  }

  initForm(): void {
    this.eventForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(2000)]],
      type: ['', [Validators.maxLength(100)]],
      date: ['', [Validators.required, dateNotInPastValidator()]],
      heure: ['', [heureFormatValidator()]],
      lieu: ['', [Validators.maxLength(200)]],
      capacite: ['', [capaciteValidator()]],
      image: [''],
      status: [EventStatus.PLANNED, Validators.required],
      /** null = événement général, sinon ID du club organisateur */
      idClub: [null as number | null]
    });

    // Revalider la date quand le statut change
    this.eventForm.get('status')?.valueChanges.subscribe(() => {
      this.eventForm.get('date')?.updateValueAndValidity();
    });

    if (this.viewMode) {
      this.eventForm.disable();
    }
  }

  populateForm(evenement: Evenement): void {
    // Format heure pour input type="time" (HH:mm)
    const heureValue = evenement.heure
      ? String(evenement.heure).substring(0, 5)
      : '';
    this.eventForm.patchValue({
      titre: evenement.titre,
      description: evenement.description || '',
      type: evenement.type || '',
      date: evenement.date || '',
      heure: heureValue,
      lieu: evenement.lieu || '',
      capacite: evenement.capacite ?? '',
      image: evenement.image || '',
      status: evenement.status || EventStatus.PLANNED,
      idClub: evenement.idClub ?? null
    });

    this.imagePreview = evenement.image || null;
  }

  onSubmit(): void {
    if (this.viewMode) {
      return;
    }

    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      this.snackBar.open('Veuillez corriger les champs en erreur.', 'Fermer', { duration: 3000 });
      return;
    }

    const formValue = this.eventForm.value;
    const evenement: Evenement = {
      ...formValue,
      capacite: formValue.capacite ? parseInt(formValue.capacite, 10) : undefined,
      idClub: formValue.idClub != null && formValue.idClub !== '' ? Number(formValue.idClub) : null
    };

    if (this.isEditMode && this.data.evenement?.id) {
      // Update
      this.evenementService.updateEvenement(this.data.evenement.id, evenement).subscribe({
        next: () => {
          this.snackBar.open('Événement mis à jour avec succès', 'Fermer', {
            duration: 3000
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour:', error);
          const message = error.error?.message || 'Erreur lors de la mise à jour';
          this.snackBar.open(message, 'Fermer', {
            duration: 3000
          });
        }
      });
    } else {
      // Create
      this.evenementService.createEvenement(evenement).subscribe({
        next: () => {
          this.snackBar.open('Événement créé avec succès', 'Fermer', {
            duration: 3000
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          const message = error.error?.message || 'Erreur lors de la création';
          this.snackBar.open(message, 'Fermer', {
            duration: 3000
          });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onImageSelected(event: Event): void {
    if (this.viewMode) return;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      this.snackBar.open('Image trop grande (max 2MB).', 'Fermer', { duration: 3000 });
      input.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Veuillez sélectionner un fichier image.', 'Fermer', { duration: 3000 });
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      this.imagePreview = dataUrl;
      this.eventForm.patchValue({ image: dataUrl });
      this.eventForm.get('image')?.markAsDirty();
    };
    reader.onerror = () => {
      this.snackBar.open('Impossible de lire l’image.', 'Fermer', { duration: 3000 });
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    if (this.viewMode) return;
    this.imagePreview = null;
    this.eventForm.patchValue({ image: '' });
    this.eventForm.get('image')?.markAsDirty();
  }

  getStatusLabel(status: EventStatus): string {
    return this.statusLabels[status] || status;
  }
}
