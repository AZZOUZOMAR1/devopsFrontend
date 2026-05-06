import { Component, OnInit } from '@angular/core';
import { FraudService, FraudResult } from '../../services/fraud.service';

@Component({
  selector: 'app-fraud-dashboard',
  templateUrl: './fraud-dashboard.component.html',
  styleUrls: ['./fraud-dashboard.component.css']
})
export class FraudDashboardComponent implements OnInit {
  allFraud: FraudResult[] = [];
  filteredFraud: FraudResult[] = [];
  loading = false;
  selectedLevel = 'ALL';

  levels = ['ALL', 'CLEAN', 'SUSPICIOUS', 'BLOCKED'];

  displayedColumns = [
    'fraudLevel', 'applicantEmail', 'studentId',
    'jobOfferId', 'totalScore', 'reasons', 'detectedAt'
  ];

  constructor(private fraudService: FraudService) {}

  ngOnInit(): void {
    this.loadFraud();
  }

  loadFraud(): void {
    this.loading = true;
    this.fraudService.getAllFraud().subscribe({
      next: (data) => {
        this.allFraud = data;
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    if (this.selectedLevel === 'ALL') {
      this.filteredFraud = this.allFraud;
    } else {
      this.filteredFraud = this.allFraud
        .filter(f => f.fraudLevel === this.selectedLevel);
    }
  }

  onFilterChange(level: string): void {
    this.selectedLevel = level;
    this.applyFilter();
  }

  // ✅ KPIs
  getCount(level: string): number {
    if (level === 'ALL') return this.allFraud.length;
    return this.allFraud.filter(f => f.fraudLevel === level).length;
  }

  // ✅ Couleurs
  getLevelColor(level: string): string {
    switch (level) {
      case 'CLEAN':      return '#166534';
      case 'SUSPICIOUS': return '#92400e';
      case 'BLOCKED':    return '#991b1b';
      default:           return '#475569';
    }
  }

  getLevelBg(level: string): string {
    switch (level) {
      case 'CLEAN':      return '#dcfce7';
      case 'SUSPICIOUS': return '#fef3c7';
      case 'BLOCKED':    return '#fee2e2';
      default:           return '#f1f5f9';
    }
  }

  getLevelIcon(level: string): string {
    switch (level) {
      case 'CLEAN':      return 'check_circle';
      case 'SUSPICIOUS': return 'warning';
      case 'BLOCKED':    return 'block';
      default:           return 'help';
    }
  }

  getScoreColor(score: number): string {
    if (score >= 0.75) return '#f44336';
    if (score >= 0.50) return '#FF9800';
    return '#4CAF50';
  }

  getScorePercent(score: number): number {
    return Math.round(score * 100);
  }
}