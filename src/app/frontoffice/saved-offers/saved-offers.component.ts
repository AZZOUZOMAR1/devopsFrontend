import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SavedOfferService } from '../../services/saved-offer.service';
import { JobOfferService } from '../../services/job-offer.service';
import { SavedOffer, JobOffer } from '../../models/job-offer.model';
import { VisitorService } from '../../services/visitor.service';

@Component({
  selector: 'app-saved-offers',
  templateUrl: './saved-offers.component.html',
  styleUrls: ['./saved-offers.component.css']
})
export class SavedOffersComponent implements OnInit {
  savedOffers: SavedOffer[] = [];
  jobOffers: JobOffer[] = [];
  loading = false;
  searchTerm = '';
  selectedContractType = 'ALL';
  contractTypes = ['ALL', 'CDI', 'CDD', 'STAGE', 'ALTERNANCE', 'FREELANCE'];

  pageSize = 10;
  currentPage = 1;

  constructor(
    private savedOfferService: SavedOfferService,
    private jobOfferService: JobOfferService,
    private visitorService: VisitorService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    const studentId = this.visitorService.getVisitorId();
    this.savedOfferService.findByStudent(studentId).subscribe({
      next: (saved: SavedOffer[]) => {
        this.savedOffers = saved;
        this.loadJobOffers();
      },
      error: () => { this.loading = false; }
    });
  }

  loadJobOffers(): void {
    this.jobOfferService.findAll().subscribe({
      next: (offers: JobOffer[]) => {
        this.jobOffers = offers;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getJobOffer(jobOfferId: number): JobOffer | undefined {
    return this.jobOffers.find(o => o.id === jobOfferId);
  }

  get filteredSavedOffers(): SavedOffer[] {
    let filtered = this.savedOffers;

    if (this.selectedContractType !== 'ALL') {
      filtered = filtered.filter(s => {
        const offer = this.getJobOffer(s.jobOfferId);
        return offer?.contractType === this.selectedContractType;
      });
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(s => {
        const offer = this.getJobOffer(s.jobOfferId);
        return offer?.title?.toLowerCase().includes(term) ||
               offer?.company?.toLowerCase().includes(term) ||
               offer?.location?.toLowerCase().includes(term);
      });
    }

    return filtered;
  }

  get paginatedSavedOffers(): SavedOffer[] {
    const list = this.filteredSavedOffers;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  unsave(savedOffer: SavedOffer): void {
    this.savedOfferService.unsave(savedOffer.id!).subscribe({
      next: () => {
        this.savedOffers = this.savedOffers.filter(s => s.id !== savedOffer.id);
      },
      error: () => {}
    });
  }

  viewDetails(jobOfferId: number): void {
    this.router.navigate(['/frontoffice/job-details', jobOfferId]);
  }

  apply(jobOfferId: number): void {
    this.router.navigate(['/frontoffice/job-details', jobOfferId]);
  }

  getContractColor(contractType: string): string {
    switch (contractType) {
      case 'CDI': return 'chip-CDI';
      case 'CDD': return 'chip-CDD';
      case 'STAGE': return 'chip-STAGE';
      case 'ALTERNANCE': return 'chip-ALTERNANCE';
      case 'FREELANCE': return 'chip-FREELANCE';
      default: return '';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }
}