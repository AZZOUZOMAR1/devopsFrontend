import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MatchingService, VisitorPreferences } from '../../services/matching.service';
import { JobOfferService } from '../../services/job-offer.service';

@Component({
  selector: 'app-student-preferences',
  templateUrl: './student-preferences.component.html',
  styleUrls: ['./student-preferences.component.css']
})
export class StudentPreferencesComponent implements OnInit {
  loading = false;
  saving = false;
  saved = false;

  /** Préférences du visiteur (session uniquement). */
  profile: VisitorPreferences = {
    ville: '',
    typeContrat: '',
    salaireSouhaite: undefined,
    competences: ''
  };

  skillInput = '';
  skillsList: string[] = [];

  contractTypes = ['CDI', 'CDD', 'STAGE', 'ALTERNANCE', 'FREELANCE'];

  // Autocomplétion de ville via Nominatim.
  locationSuggestions: any[] = [];
  showSuggestions = false;
  private locationSearch$ = new Subject<string>();

  constructor(
    private matchingService: MatchingService,
    private jobOfferService: JobOfferService
  ) {}

  ngOnInit(): void {
    this.loadProfile();

    this.locationSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((query: string) =>
        query.length > 2 ? this.jobOfferService.searchLocations(query) : []
      )
    ).subscribe((results: any[]) => {
      this.locationSuggestions = results;
      this.showSuggestions = results.length > 0;
    });
  }

  loadProfile(): void {
    this.loading = true;
    const stored = this.matchingService.getLocalPreferences();
    if (stored) {
      this.profile = stored;
      if (stored.competences) {
        this.skillsList = stored.competences
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
      }
    }
    this.loading = false;
  }

  addSkill(): void {
    const skill = this.skillInput.trim();
    if (skill && !this.skillsList.includes(skill)) {
      this.skillsList.push(skill);
      this.skillInput = '';
    }
  }

  removeSkill(skill: string): void {
    this.skillsList = this.skillsList.filter(s => s !== skill);
  }

  onSkillKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addSkill();
    }
  }

  onLocationInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const query = target?.value ?? '';
    this.locationSearch$.next(query);
  }

  selectLocation(suggestion: any): void {
    const displayName = suggestion.display_name.split(',').slice(0, 2).join(',').trim();
    this.profile.ville = displayName;
    this.showSuggestions = false;
    this.locationSuggestions = [];
  }

  hideSuggestions(): void {
    setTimeout(() => { this.showSuggestions = false; }, 200);
  }

  saveProfile(): void {
    this.saving = true;
    this.profile.competences = this.skillsList.join(',');

    this.matchingService.saveLocalPreferences(this.profile);

    this.matchingService.getMatchingForVisitor(this.profile).subscribe({
      next: () => {
        this.saving = false;
        this.saved = true;
        setTimeout(() => this.saved = false, 3000);
      },
      error: () => { this.saving = false; }
    });
  }

  getContractColor(type: string): string {
    switch (type) {
      case 'CDI': return '#166534';
      case 'CDD': return '#1e40af';
      case 'STAGE': return '#9a3412';
      case 'ALTERNANCE': return '#6b21a8';
      case 'FREELANCE': return '#991b1b';
      default: return '#475569';
    }
  }

  getContractBg(type: string): string {
    switch (type) {
      case 'CDI': return '#dcfce7';
      case 'CDD': return '#dbeafe';
      case 'STAGE': return '#ffedd5';
      case 'ALTERNANCE': return '#f3e8ff';
      case 'FREELANCE': return '#fee2e2';
      default: return '#f1f5f9';
    }
  }
}

