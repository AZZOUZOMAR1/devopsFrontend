import { Component, OnInit } from '@angular/core';
import { JobOfferStatsService, JobOfferStats } from '../../services/job-offer-stats.service';

@Component({
  selector: 'app-job-offer-stats',
  templateUrl: './job-offer-stats.component.html',
  styleUrls: ['./job-offer-stats.component.css']
})
export class JobOfferStatsComponent implements OnInit {
  stats: JobOfferStats | null = null;
  loading = false;
  error = '';

  constructor(private statsService: JobOfferStatsService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.statsService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur lors du chargement des statistiques';
        this.loading = false;
      }
    });
  }

  // ✅ Convertit Map en tableau pour *ngFor
  getEntries(obj: { [key: string]: any }): { key: string, value: any }[] {
    if (!obj) return [];
    return Object.entries(obj).map(([key, value]) => ({ key, value }));
  }

  // ✅ Calcule la largeur de la barre de progression
  getBarWidth(value: number, max: number): string {
    if (max === 0) return '0%';
    return Math.min((value / max) * 100, 100) + '%';
  }

  // ✅ Max des valeurs pour les barres
  getMaxValue(obj: { [key: string]: number }): number {
    if (!obj) return 1;
    return Math.max(...Object.values(obj), 1);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return '#FF9800';
      case 'ACCEPTED': return '#4CAF50';
      case 'REJECTED': return '#F44336';
      case 'INTERVIEW': return '#2196F3';
      case 'CANCELLED': return '#9E9E9E';
      default: return '#607D8B';
    }
  }

  getContractColor(type: string): string {
    switch (type) {
      case 'CDI': return '#4CAF50';
      case 'CDD': return '#FF9800';
      case 'STAGE': return '#2196F3';
      case 'ALTERNANCE': return '#9C27B0';
      case 'FREELANCE': return '#F44336';
      default: return '#607D8B';
    }
  }

  getFillRateColor(rate: number): string {
    if (rate >= 80) return '#F44336';
    if (rate >= 50) return '#FF9800';
    return '#4CAF50';
  }
}