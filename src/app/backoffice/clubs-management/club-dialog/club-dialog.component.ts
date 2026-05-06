import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClubService } from '../../../services/club.service';
import { Club } from '../../../models/club.model';

@Component({
  selector: 'app-club-dialog',
  templateUrl: './club-dialog.component.html',
  styleUrls: ['./club-dialog.component.css']
})
export class ClubDialogComponent implements OnInit {
  clubForm!: FormGroup;
  isEditMode = false;
  viewMode = false;
  imagePreview: string | null = null;

  statusOptions = [
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'pending', label: 'En attente' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ClubDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { club: Club | null; viewMode?: boolean },
    private clubService: ClubService,
    private snackBar: MatSnackBar
  ) {
    this.viewMode = data.viewMode || false;
    this.isEditMode = !!data.club && !this.viewMode;
  }

  ngOnInit(): void {
    this.initForm();
    if (this.data.club) {
      this.populateForm(this.data.club);
    }
  }

  initForm(): void {
    this.clubForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      type: [''],
      statut: ['active', Validators.required],
      dateCreation: [''],
      idResponsable: [''],
      departements: ['RH,Marketing,Technique,Finance'],
      image: ['']
    });

    if (this.viewMode) {
      this.clubForm.disable();
    }
  }

  populateForm(club: Club): void {
    this.clubForm.patchValue({
      nom: club.nom,
      description: club.description || '',
      type: club.type || '',
      statut: club.statut || 'active',
      dateCreation: club.dateCreation || '',
      idResponsable: club.idResponsable ?? '',
      departements: club.departements || 'RH,Marketing,Technique,Finance',
      image: club.image || ''
    });

    this.imagePreview = club.image || null;
  }

  onSubmit(): void {
    if (this.viewMode) return;

    if (this.clubForm.invalid) {
      this.clubForm.markAllAsTouched();
      this.snackBar.open('Veuillez corriger les champs en erreur.', 'Fermer', { duration: 3000 });
      return;
    }

    const v = this.clubForm.value;
    const payload: Club = {
      ...v,
      idResponsable: v.idResponsable === '' ? undefined : Number(v.idResponsable)
    };

    if (this.isEditMode && this.data.club?.id) {
      this.clubService.updateClub(this.data.club.id, payload).subscribe({
        next: () => {
          this.snackBar.open('Club mis à jour avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Erreur update club:', err);
          const msg = err.error?.message || 'Erreur lors de la mise à jour';
          this.snackBar.open(msg, 'Fermer', { duration: 3000 });
        }
      });
    } else {
      this.clubService.createClub(payload).subscribe({
        next: () => {
          this.snackBar.open('Club créé avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Erreur create club:', err);
          const msg = err.error?.message || 'Erreur lors de la création';
          this.snackBar.open(msg, 'Fermer', { duration: 3000 });
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

    const maxBytes = 2 * 1024 * 1024;
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
      this.clubForm.patchValue({ image: dataUrl });
      this.clubForm.get('image')?.markAsDirty();
    };
    reader.onerror = () => {
      this.snackBar.open('Impossible de lire l’image.', 'Fermer', { duration: 3000 });
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    if (this.viewMode) return;
    this.imagePreview = null;
    this.clubForm.patchValue({ image: '' });
    this.clubForm.get('image')?.markAsDirty();
  }
}

