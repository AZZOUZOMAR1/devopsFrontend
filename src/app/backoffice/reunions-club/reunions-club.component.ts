import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Club, ReunionClub, TypeReunion } from '../../models/club.model';
import { ClubService } from '../../services/club.service';
import { ReunionClubService } from '../../services/reunion-club.service';

@Component({
  selector: 'app-reunions-club',
  templateUrl: './reunions-club.component.html',
  styleUrls: ['./reunions-club.component.css']
})
export class ReunionsClubComponent implements OnInit {
  clubs: Club[] = [];
  reunions: ReunionClub[] = [];
  loadingClubs = false;
  loadingReunions = false;
  submitting = false;
  selectedClubId: number | null = null;
  departementsClub: string[] = [];

  form: FormGroup;
  readonly types: { value: TypeReunion; label: string }[] = [
    { value: 'PRESENTIEL', label: 'Présentielle' },
    { value: 'EN_LIGNE', label: 'En ligne' }
  ];

  constructor(
    private fb: FormBuilder,
    private clubService: ClubService,
    private reunionService: ReunionClubService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.form = this.fb.group({
      clubId: [null, Validators.required],
      date: ['', Validators.required],
      heure: ['', Validators.required],
      typeReunion: ['PRESENTIEL' as TypeReunion, Validators.required],
      audience: ['TOUS_CLUB'],
      departementsCibles: [[]],
      lieu: [''],
      lienReunion: ['']
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadClubs();
    }

    this.form.get('typeReunion')?.valueChanges.subscribe(() => this.updateValidators());
    this.form.get('audience')?.valueChanges.subscribe(() => this.updateValidators());
    this.form.get('date')?.valueChanges.subscribe(() => this.updateValidators());
    this.updateValidators();
  }

  private updateValidators(): void {
    const type = this.form.get('typeReunion')?.value as TypeReunion;
    const lieuCtrl = this.form.get('lieu');
    const lienCtrl = this.form.get('lienReunion');
    const depsCtrl = this.form.get('departementsCibles');
    const dateCtrl = this.form.get('date');
    const heureCtrl = this.form.get('heure');
    if (type === 'PRESENTIEL') {
      lieuCtrl?.setValidators([Validators.required, Validators.minLength(2)]);
      lienCtrl?.clearValidators();
      lienCtrl?.setValue('');
    } else {
      lieuCtrl?.clearValidators();
      lieuCtrl?.setValue('');
      lienCtrl?.setValidators([Validators.pattern(/^$|^https?:\/\/.+/i)]);
    }
    if (this.form.get('audience')?.value === 'DEPARTEMENTS') {
      depsCtrl?.setValidators([Validators.required]);
    } else {
      depsCtrl?.clearValidators();
      depsCtrl?.setValue([]);
    }
    dateCtrl?.setValidators([Validators.required, this.dateNotPastValidator]);
    heureCtrl?.setValidators([Validators.required]);
    lieuCtrl?.updateValueAndValidity({ emitEvent: false });
    lienCtrl?.updateValueAndValidity({ emitEvent: false });
    depsCtrl?.updateValueAndValidity({ emitEvent: false });
    dateCtrl?.updateValueAndValidity({ emitEvent: false });
    heureCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private dateNotPastValidator = (control: any) => {
    const v = control?.value;
    if (!v) return null;
    const selected = new Date(v + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today ? { datePast: true } : null;
  };

  loadClubs(): void {
    this.loadingClubs = true;
    this.clubService.getAllClubs().subscribe({
      next: (data) => {
        this.clubs = (data || []).filter((c) => c.id != null);
        this.loadingClubs = false;
      },
      error: () => {
        this.loadingClubs = false;
        this.snackBar.open('Impossible de charger les clubs', 'Fermer', { duration: 4000 });
      }
    });
  }

  onClubSelected(): void {
    const id = this.form.get('clubId')?.value;
    this.selectedClubId = id != null ? Number(id) : null;
    const c = this.clubs.find(x => x.id === this.selectedClubId);
    this.departementsClub = (c?.departements || 'RH,Marketing,Technique,Finance')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (this.selectedClubId) {
      this.loadReunions(this.selectedClubId);
    } else {
      this.reunions = [];
    }
  }

  loadReunions(clubId: number): void {
    this.loadingReunions = true;
    this.reunionService.getReunionsByClub(clubId).subscribe({
      next: (list) => {
        this.reunions = list || [];
        this.loadingReunions = false;
      },
      error: () => {
        this.reunions = [];
        this.loadingReunions = false;
        this.snackBar.open('Impossible de charger les réunions', 'Fermer', { duration: 4000 });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const clubId = Number(v.clubId);
    let heure = (v.heure || '').trim();
    if (heure.length === 5) {
      heure = `${heure}:00`;
    }

    const payload: ReunionClub = {
      date: v.date,
      heure: heure || undefined,
      typeReunion: v.typeReunion,
      audience: v.audience,
      departementsCibles: v.audience === 'DEPARTEMENTS' ? (v.departementsCibles || []).join(',') : null,
      club: { id: clubId }
    };

    if (v.typeReunion === 'PRESENTIEL') {
      payload.lieu = (v.lieu || '').trim();
    } else {
      const lien = (v.lienReunion || '').trim();
      if (lien) {
        payload.lienReunion = lien;
      }
    }

    this.submitting = true;
    this.reunionService.createReunion(payload).subscribe({
      next: (created) => {
        this.submitting = false;
        let msg =
          'Réunion créée. Un email a été envoyé aux membres du club.';
        if (created?.lienReunion && v.typeReunion === 'EN_LIGNE') {
          msg += ` Lien : ${created.lienReunion}`;
        }
        this.snackBar.open(msg, 'Fermer', { duration: 8000 });
        this.form.patchValue({
          date: '',
          heure: '',
          lieu: '',
          lienReunion: ''
        });
        this.loadReunions(clubId);
      },
      error: (err) => {
        this.submitting = false;
        const msg =
          typeof err.error === 'string'
            ? err.error
            : err.error?.message || 'Erreur lors de la création';
        this.snackBar.open(msg, 'Fermer', { duration: 5000 });
      }
    });
  }

  deleteReunion(r: ReunionClub): void {
    if (!r.id || !confirm('Supprimer cette réunion ?')) return;
    this.reunionService.deleteReunion(r.id).subscribe({
      next: () => {
        this.snackBar.open('Réunion supprimée', 'Fermer', { duration: 3000 });
        if (this.selectedClubId) this.loadReunions(this.selectedClubId);
      },
      error: () => {
        this.snackBar.open('Erreur suppression', 'Fermer', { duration: 3000 });
      }
    });
  }

  reunionTypeLabel(t?: string | null): string {
    if (t === 'EN_LIGNE') return 'En ligne';
    return 'Présentielle';
  }
}
