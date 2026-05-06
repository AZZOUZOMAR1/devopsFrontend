import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApplicationService } from '../../services/application.service';
import { JobOfferService } from '../../services/job-offer.service';
import { FraudService, FraudResult } from '../../services/fraud.service';
import { Application, JobOffer } from '../../models/job-offer.model';

// ✅ Interface CV Analysis
export interface CvAnalysis {
  applicationId: number;
  jobOfferId: number;
  applicantName: string;
  extractedText: string;
  detectedSkills: string[];
  detectedLocation: string;
  detectedExperienceYears: number;
  detectedEmail: string;
  skillsScore: number;
  locationScore: number;
  experienceScore: number;
  overallScore: number;
  overallPercent: number;
  matchLevel: string;
}

// ✅ Interface CV Screening
export interface CvScreeningResult {
  applicationId: number;
  applicantName: string;
  applicantEmail: string;
  cvUrl: string;
  overallScore: number;
  matchLevel: string;
  matchedSkills: string[];
  missingSkills: string[];
  detectedLocation: string;
  detectedExperienceYears: number;
  skillsScore: number;
  locationScore: number;
  experienceScore: number;
  rank: number;
}

// ✅ Interface Plagiat
export interface PlagiatResult {
  applicationId1: number;
  applicantName1: string;
  applicantEmail1: string;
  applicationId2: number;
  applicantName2: string;
  applicantEmail2: string;
  similarityScore: number;
  similarityPercent: number;
  plagiatLevel: string;
}

@Component({
  selector: 'app-applications-management',
  templateUrl: './applications-management.component.html',
  styleUrls: ['./applications-management.component.css']
})
export class ApplicationsManagementComponent implements OnInit {

  applications: Application[] = [];
  filteredApplications: Application[] = [];
  jobOffers: JobOffer[] = [];
  loading = false;

  // ✅ Fraud Map
  fraudMap: Map<number, FraudResult> = new Map();

  // ✅ Side Panel
  selectedApp: Application | null = null;
  showSidePanel = false;

  // ✅ Interview Popup
  showInterviewPopup = false;
  pendingInterviewApp: Application | null = null;
  scheduleMode: 'auto' | 'manual' = 'auto';
  selectedInterviewDate = '';
  minDate = new Date().toISOString().slice(0, 16);

  // ✅ CV Analysis
  cvAnalysis: CvAnalysis | null = null;
  loadingCv = false;

  // ✅ CV Screening
  showScreening = false;
  loadingScreening = false;
  screeningDone = false;
  screeningResults: CvScreeningResult[] = [];
  newSkill = '';
  screeningRequest = {
    jobOfferId: null as number | null,
    requiredSkills: [] as string[],
    preferredLocation: '',
    minExperienceYears: 0,
    topN: 5
  };

  // ✅ Plagiat
  showPlagiat = false;
  loadingPlagiat = false;
  plagiatDone = false;
  plagiatResults: PlagiatResult[] = [];
  selectedPlagiatOfferId: number | null = null;

  // Filtres
  selectedJobOfferId = 'ALL';
  selectedStatus = 'ALL';
  selectedRisk = 'ALL';
  searchTerm = '';

  statuses = ['ALL', 'PENDING', 'INTERVIEW', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'BLOCKED'];
  contractTypes = ['ALL', 'CDI', 'CDD', 'STAGE', 'ALTERNANCE', 'FREELANCE'];

  pageSize = 10;
  currentPage = 1;

  constructor(
    private applicationService: ApplicationService,
    private jobOfferService: JobOfferService,
    private fraudService: FraudService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.jobOfferService.findAll().subscribe({
      next: (offers) => {
        this.jobOffers = offers;
        this.applicationService.findAll().subscribe({
          next: (apps) => {
            this.applications = apps;
            this.fraudService.getAllFraud().subscribe({
              next: (fraudScores) => {
                this.fraudMap.clear();
                fraudScores.forEach(f => {
                  this.fraudMap.set(f.applicationId, f);
                });
                this.applyFilters();
                this.loading = false;
              },
              error: () => {
                this.applyFilters();
                this.loading = false;
              }
            });
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters(): void {
    let filtered = [...this.applications];

    if (this.selectedJobOfferId !== 'ALL') {
      filtered = filtered.filter(a => a.jobOfferId === +this.selectedJobOfferId);
    }
    if (this.selectedStatus !== 'ALL') {
      filtered = filtered.filter(a => a.status === this.selectedStatus);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.applicantName?.toLowerCase().includes(term) ||
        a.applicantEmail?.toLowerCase().includes(term)
      );
    }
    if (this.selectedRisk !== 'ALL') {
      filtered = filtered.filter(a => {
        const fraud = this.fraudMap.get(a.id!);
        return (fraud?.fraudLevel ?? 'CLEAN') === this.selectedRisk;
      });
    }

    this.filteredApplications = filtered;
    this.currentPage = 1;
  }

  // ─── CV Screening ────────────────────────────

  toggleScreening(): void {
    this.showScreening = !this.showScreening;
  }

  addScreeningSkill(): void {
    const skill = this.newSkill.trim();
    if (skill && !this.screeningRequest.requiredSkills.includes(skill)) {
      this.screeningRequest.requiredSkills.push(skill);
      this.newSkill = '';
    }
  }

  removeScreeningSkill(skill: string): void {
    this.screeningRequest.requiredSkills =
      this.screeningRequest.requiredSkills.filter(s => s !== skill);
  }

  runScreening(): void {
    this.loadingScreening = true;
    this.screeningResults = [];
    this.screeningDone = false;

    this.http.post<CvScreeningResult[]>(
      '/api/applications/screening',
      this.screeningRequest
    ).subscribe({
      next: (results) => {
        this.screeningResults = results;
        this.loadingScreening = false;
        this.screeningDone = true;
      },
      error: () => {
        this.loadingScreening = false;
        this.screeningDone = true;
      }
    });
  }

  acceptFromScreening(applicationId: number): void {
    const app = this.applications.find(a => a.id === applicationId);
    if (app) {
      this.pendingInterviewApp = app;
      this.scheduleMode = 'auto';
      this.selectedInterviewDate = '';
      this.showInterviewPopup = true;
    }
  }

  getRankColor(rank: number): string {
    if (rank === 1) return '#f59e0b';
    if (rank === 2) return '#94a3b8';
    if (rank === 3) return '#cd7c2f';
    return '#475569';
  }

  getScoreColor(score: number): string {
    if (score >= 75) return '#166534';
    if (score >= 50) return '#92400e';
    return '#991b1b';
  }

  getScoreBg(score: number): string {
    if (score >= 75) return '#dcfce7';
    if (score >= 50) return '#fef3c7';
    return '#fee2e2';
  }

  // ─── Plagiat ──────────────────────────────────

  togglePlagiat(): void {
    this.showPlagiat = !this.showPlagiat;
  }

  runPlagiatDetection(): void {
    this.loadingPlagiat = true;
    this.plagiatResults = [];
    this.plagiatDone = false;

    const url = this.selectedPlagiatOfferId
      ? `/api/applications/plagiat?jobOfferId=${this.selectedPlagiatOfferId}`
      : '/api/applications/plagiat';

    this.http.get<PlagiatResult[]>(url).subscribe({
      next: (results) => {
        this.plagiatResults = results;
        this.loadingPlagiat = false;
        this.plagiatDone = true;
      },
      error: () => {
        this.loadingPlagiat = false;
        this.plagiatDone = true;
      }
    });
  }

  getPlagiatColor(level: string): string {
    switch (level) {
      case 'PLAGIAT': return '#991b1b';
      case 'SUSPECT': return '#92400e';
      default:        return '#166534';
    }
  }

  getPlagiatBg(level: string): string {
    switch (level) {
      case 'PLAGIAT': return '#fee2e2';
      case 'SUSPECT': return '#fef3c7';
      default:        return '#dcfce7';
    }
  }

  getPlagiatIcon(level: string): string {
    switch (level) {
      case 'PLAGIAT': return '🚨';
      case 'SUSPECT': return '⚠️';
      default:        return '✅';
    }
  }

  // ─── Status ───────────────────────────────────

  updateStatus(app: Application, status: string): void {
    if (status === 'INTERVIEW') {
      this.pendingInterviewApp = app;
      this.scheduleMode = 'auto';
      this.selectedInterviewDate = '';
      this.showInterviewPopup = true;
      return;
    }

    const updated = { ...app, status: status as any };
    this.applicationService.update(app.id!, updated).subscribe({
      next: () => {
        app.status = status as any;
        const index = this.applications.findIndex(a => a.id === app.id);
        if (index !== -1) this.applications[index].status = status as any;
        this.applyFilters();
      },
      error: () => {}
    });
  }

  updateStatusFromPanel(app: Application, status: string): void {
    if (status === 'INTERVIEW') {
      this.pendingInterviewApp = app;
      this.scheduleMode = 'auto';
      this.selectedInterviewDate = '';
      this.showInterviewPopup = true;
      return;
    }

    const updated = { ...app, status: status as any };
    this.applicationService.update(app.id!, updated).subscribe({
      next: () => {
        app.status = status as any;
        const index = this.applications.findIndex(a => a.id === app.id);
        if (index !== -1) this.applications[index].status = status as any;
        this.applyFilters();
      },
      error: () => {}
    });
  }

  confirmInterview(): void {
    if (!this.pendingInterviewApp) return;

    const updated: any = {
      ...this.pendingInterviewApp,
      status: 'INTERVIEW',
      interviewDate: this.scheduleMode === 'manual'
        ? this.selectedInterviewDate
        : null
    };

    this.applicationService.update(
      this.pendingInterviewApp.id!, updated
    ).subscribe({
      next: (result) => {
        if (this.pendingInterviewApp) {
          this.pendingInterviewApp.status = 'INTERVIEW' as any;
          this.pendingInterviewApp.interviewDate = result.interviewDate;
          const index = this.applications.findIndex(
            a => a.id === this.pendingInterviewApp?.id
          );
          if (index !== -1) {
            this.applications[index].status = 'INTERVIEW' as any;
            this.applications[index].interviewDate = result.interviewDate;
          }
        }
        this.applyFilters();
        this.showInterviewPopup = false;
        this.pendingInterviewApp = null;

        if (this.selectedApp && this.selectedApp.id === result.id) {
          this.selectedApp = result;
        }
      },
      error: () => {
        this.showInterviewPopup = false;
      }
    });
  }

  cancelInterview(): void {
    this.showInterviewPopup = false;
    this.pendingInterviewApp = null;
    this.selectedInterviewDate = '';
  }

  // ─── Side Panel ───────────────────────────────

  openSidePanel(app: Application): void {
    this.selectedApp = app;
    this.showSidePanel = true;
    this.cvAnalysis = null;
    setTimeout(() => {
      const panel = document.querySelector('.panel-body');
      if (panel) panel.scrollTop = 0;
    }, 100);
  }

  closeSidePanel(): void {
    this.showSidePanel = false;
    this.selectedApp = null;
    this.cvAnalysis = null;
  }

  // ─── CV Analysis ──────────────────────────────

  analyzeCv(appId: number): void {
    this.loadingCv = true;
    this.cvAnalysis = null;
    this.http.get<CvAnalysis>(`/api/applications/${appId}/analyze-cv`).subscribe({
      next: (data) => {
        this.cvAnalysis = data;
        this.loadingCv = false;
      },
      error: () => { this.loadingCv = false; }
    });
  }

  getCvScoreColor(score: number): string {
    if (score >= 0.75) return '#166534';
    if (score >= 0.50) return '#92400e';
    return '#991b1b';
  }

  getCvScoreBg(score: number): string {
    if (score >= 0.75) return '#dcfce7';
    if (score >= 0.50) return '#fef3c7';
    return '#fee2e2';
  }

  // ─── Fraud ────────────────────────────────────

  getFraud(appId: number): FraudResult | null {
    return this.fraudMap.get(appId) || null;
  }

  getRiskLevel(appId: number): string {
    return this.fraudMap.get(appId)?.fraudLevel ?? 'CLEAN';
  }

  getRiskColor(level: string): string {
    switch (level) {
      case 'CLEAN':      return '#166534';
      case 'SUSPICIOUS': return '#92400e';
      case 'BLOCKED':    return '#991b1b';
      default:           return '#475569';
    }
  }

  getRiskBg(level: string): string {
    switch (level) {
      case 'CLEAN':      return '#dcfce7';
      case 'SUSPICIOUS': return '#fef3c7';
      case 'BLOCKED':    return '#fee2e2';
      default:           return '#f1f5f9';
    }
  }

  getRiskIcon(level: string): string {
    switch (level) {
      case 'CLEAN':      return 'verified';
      case 'SUSPICIOUS': return 'warning';
      case 'BLOCKED':    return 'dangerous';
      default:           return 'help_outline';
    }
  }

  getRiskLabel(level: string): string {
    switch (level) {
      case 'CLEAN':      return 'Verified';
      case 'SUSPICIOUS': return 'To Check';
      case 'BLOCKED':    return 'Risky';
      default:           return 'Unknown';
    }
  }

  getRiskCount(level: string): number {
    if (level === 'ALL') return this.applications.length;
    return this.applications.filter(a => {
      const fraud = this.fraudMap.get(a.id!);
      return (fraud?.fraudLevel ?? 'CLEAN') === level;
    }).length;
  }

  getConfidenceScore(appId: number): number {
    const fraud = this.fraudMap.get(appId);
    if (!fraud) return 100;
    return Math.round((1 - fraud.totalScore) * 100);
  }

  // ─── Pagination ───────────────────────────────

  get paginatedApplications(): Application[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredApplications.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void { this.currentPage = page; }
  onPageSizeChange(size: number): void { this.pageSize = size; this.currentPage = 1; }

  // ─── Helpers ──────────────────────────────────

  getJobTitle(jobOfferId: number): string {
    const offer = this.jobOffers.find(o => o.id === jobOfferId);
    return offer ? offer.title : 'Unknown offer';
  }

  getJobContractType(jobOfferId: number): string {
    const offer = this.jobOffers.find(o => o.id === jobOfferId);
    return offer ? offer.contractType : '';
  }

  openFile(url: string): void { window.open(url, '_blank'); }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':   return '#92400e';
      case 'INTERVIEW': return '#1e40af';
      case 'ACCEPTED':  return '#166534';
      case 'REJECTED':  return '#991b1b';
      case 'CANCELLED': return '#475569';
      case 'BLOCKED':   return '#ffffff';
      default:          return '#475569';
    }
  }

  getStatusBg(status: string): string {
    switch (status) {
      case 'PENDING':   return '#fef3c7';
      case 'INTERVIEW': return '#dbeafe';
      case 'ACCEPTED':  return '#dcfce7';
      case 'REJECTED':  return '#fee2e2';
      case 'CANCELLED': return '#f1f5f9';
      case 'BLOCKED':   return '#7f1d1d';
      default:          return '#f1f5f9';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':   return '⏳ Pending';
      case 'INTERVIEW': return '📅 Interview';
      case 'ACCEPTED':  return '✅ Accepted';
      case 'REJECTED':  return '❌ Rejected';
      case 'CANCELLED': return '🚫 Cancelled';
      case 'BLOCKED':   return '🚨 Blocked';
      default:          return status;
    }
  }

  // ─── Plagiat Actions ──────────────────────────

plagiatStatusMap: { [key: number]: string } = {};

getAppStatus(appId: number): string {
  return this.plagiatStatusMap[appId]
    || this.applications.find(a => a.id === appId)?.status
    || 'PENDING';
}

getAppCvUrl(appId: number): string {
  return this.applications.find(a => a.id === appId)?.cvUrl || '';
}

changePlagiatStatus(appId: number, status: string): void {
  const app = this.applications.find(a => a.id === appId);
  if (!app) return;

  const updated = { ...app, status: status as any };
  this.applicationService.update(appId, updated).subscribe({
    next: () => {
      app.status = status as any;
      this.plagiatStatusMap[appId] = status;
      const i = this.applications.findIndex(a => a.id === appId);
      if (i !== -1) this.applications[i].status = status as any;
      this.applyFilters();
      console.log(`✅ Status changed: ${app.applicantName} → ${status}`);
    },
    error: () => console.error('❌ Status update failed')
  });
}

rejectPlagiat(appId1: number, appId2: number): void {
  this.changePlagiatStatus(appId1, 'REJECTED');
  setTimeout(() => {
    this.changePlagiatStatus(appId2, 'REJECTED');
  }, 300);
}
}