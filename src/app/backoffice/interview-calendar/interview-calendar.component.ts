import { Component, OnInit } from '@angular/core';
import { ApplicationService } from '../../services/application.service';
import { JobOfferService } from '../../services/job-offer.service';
import { forkJoin } from 'rxjs';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  color: string;
  textColor: string;
  extendedProps: {
    applicantName: string;
    applicantEmail: string;
    offerTitle: string;
    company: string;
    status: string;
  };
}

@Component({
  selector: 'app-interview-calendar',
  templateUrl: './interview-calendar.component.html',
  styleUrls: ['./interview-calendar.component.css']
})
export class InterviewCalendarComponent implements OnInit {

  calendarEvents: CalendarEvent[] = [];
  filteredEvents: CalendarEvent[] = [];
  nextInterviews: CalendarEvent[] = [];

  loading = false;
  selectedEvent: CalendarEvent | null = null;
  showPanel = false;

  totalInterviews = 0;
  todayInterviews = 0;
  upcomingInterviews = 0;
  thisWeekInterviews = 0;
  thisMonthInterviews = 0;

  activeFilter = 'all';
  searchTerm = '';
  today = new Date();

  constructor(
    private applicationService: ApplicationService,
    private jobOfferService: JobOfferService
  ) {}

  ngOnInit(): void {
    this.loadInterviews();
  }

  loadInterviews(): void {
    this.loading = true;
    forkJoin({
      applications: this.applicationService.findAll(),
      offers: this.jobOfferService.findAll()
    }).subscribe({
      next: ({ applications, offers }) => {
        const interviews = applications.filter(
          a => a.status === 'INTERVIEW' && a.interviewDate
        );

        const now = new Date();
        const todayStr = now.toDateString();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const monthStart = new Date(
            now.getFullYear(), now.getMonth(), 1);

        this.totalInterviews   = interviews.length;
        this.todayInterviews   = interviews.filter(a =>
          new Date(a.interviewDate!).toDateString() === todayStr
        ).length;
        this.upcomingInterviews = interviews.filter(a =>
          new Date(a.interviewDate!) >= now
        ).length;
        this.thisWeekInterviews = interviews.filter(a => {
          const d = new Date(a.interviewDate!);
          return d >= weekStart && d <= now;
        }).length;
        this.thisMonthInterviews = interviews.filter(a => {
          const d = new Date(a.interviewDate!);
          return d >= monthStart;
        }).length;

        this.calendarEvents = interviews
          .sort((a, b) =>
            new Date(a.interviewDate!).getTime()
            - new Date(b.interviewDate!).getTime())
          .map(app => {
            const offer = offers.find(o => o.id === app.jobOfferId);
            return {
              id: String(app.id),
              title: app.applicantName,
              start: app.interviewDate!,
              color: '#7c3aed',
              textColor: '#ffffff',
              extendedProps: {
                applicantName: app.applicantName,
                applicantEmail: app.applicantEmail,
                offerTitle: offer?.title || 'Unknown offer',
                company: offer?.company || '',
                status: app.status || ''
              }
            };
          });

        // ✅ Prochains entretiens (max 5)
        this.nextInterviews = this.calendarEvents
          .filter(e => new Date(e.start) >= now)
          .slice(0, 5);

        this.filteredEvents = [...this.calendarEvents];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  // ─── Filters ─────────────────────────────────────────────────────

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    let events = [...this.calendarEvents];
    const now = new Date();
    const todayStr = now.toDateString();

    switch (this.activeFilter) {
      case 'today':
        events = events.filter(e =>
          new Date(e.start).toDateString() === todayStr);
        break;
      case 'upcoming':
        events = events.filter(e => new Date(e.start) >= now);
        break;
      case 'past':
        events = events.filter(e =>
          new Date(e.start) < now
          && new Date(e.start).toDateString() !== todayStr);
        break;
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      events = events.filter(e =>
        e.extendedProps.applicantName.toLowerCase().includes(term)
        || e.extendedProps.applicantEmail.toLowerCase().includes(term)
        || e.extendedProps.offerTitle.toLowerCase().includes(term)
      );
    }

    this.filteredEvents = events;
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  isToday(dateStr: string): boolean {
    return new Date(dateStr).toDateString()
        === new Date().toDateString();
  }

  isPast(dateStr: string): boolean {
    return new Date(dateStr) < new Date()
        && !this.isToday(dateStr);
  }

  isUpcoming(dateStr: string): boolean {
    return new Date(dateStr) > new Date()
        && !this.isToday(dateStr);
  }

  onEventClick(event: CalendarEvent): void {
    this.selectedEvent = event;
    this.showPanel = true;
  }

  closePanel(): void {
    this.showPanel = false;
    this.selectedEvent = null;
  }
}