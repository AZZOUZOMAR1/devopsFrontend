import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from '../../shared/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  username = 'User';
  userAvatar = '';

  backofficeMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', routerLink: '/backoffice/dashboard' },
    { id: 'reclamations', label: 'Reclamation Management', icon: 'report', routerLink: '/backoffice/reclamations' },
    { id: 'users', label: 'User Management', icon: 'people', routerLink: '/backoffice/users' },
    { id: 'courses', label: 'Course Management', icon: 'school', routerLink: '/backoffice/courses' },
    { id: 'clubs', label: 'Club Management', icon: 'groups', routerLink: '/backoffice/clubs' },
    { id: 'demandes-club', label: 'Club Requests', icon: 'assignment', routerLink: '/backoffice/demandes-club' },
    { id: 'club-members', label: 'Club Members', icon: 'group', routerLink: '/backoffice/club-members' },
    { id: 'club-posts', label: 'Club Posts', icon: 'article', routerLink: '/backoffice/club-posts' },
    { id: 'reunions-club', label: 'Club Meetings', icon: 'groups_2', routerLink: '/backoffice/reunions-club' },
    { id: 'events', label: 'Events Management', icon: 'event', routerLink: '/backoffice/events' },
    { id: 'feedbacks', label: 'Avis & Feedback', icon: 'reviews', routerLink: '/backoffice/feedbacks' },
    { id: 'vie-associative', label: 'Pilotage Vie Associative', icon: 'analytics', routerLink: '/backoffice/vie-associative' },
    { id: 'jobs', label: 'Job Offers', icon: 'work', routerLink: '/backoffice/jobs' },
    { id: 'applications', label: 'Applications', icon: 'description', routerLink: '/backoffice/applications' },
    { id: 'job-stats', label: 'Offer Statistics', icon: 'bar_chart', routerLink: '/backoffice/job-stats' },
    { id: 'interviews', label: 'Interview Calendar', icon: 'calendar_month', routerLink: '/backoffice/interviews' },
    { id: 'reports', label: 'Reports', icon: 'assessment', routerLink: '/backoffice/reports' },
    { id: 'settings', label: 'Settings', icon: 'settings', routerLink: '/backoffice/settings' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (!user) {
        this.username = 'User';
        this.userAvatar = '';
        return;
      }
      this.username = `${user.firstName} ${user.lastName}`;
      // Utiliser la vraie photo de profil si disponible, sinon avatar avec initiales
      if (user.photoBase64) {
        // Si la valeur ressemble à une URL (Google / Facebook), on l'utilise directement
        if (user.photoBase64.startsWith('http://') || user.photoBase64.startsWith('https://')) {
          this.userAvatar = user.photoBase64;
        } else {
          // Sinon c'est un base64 classique encodé côté signup
          this.userAvatar = `data:image/jpeg;base64,${user.photoBase64}`;
        }
      } else {
        const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        this.userAvatar = this.buildInitialsAvatar(initials, '#4caf50');
      }
    });
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  onMenuItemClick(item: MenuItem) {
    this.router.navigate([item.routerLink]);
  }

  onLogout() {
    this.authService.signout();
    this.router.navigate(['/auth/signin']);
  }

  onProfile() {
    this.router.navigate(['/backoffice/profile']);
  }

  onSettings() {
    this.router.navigate(['/backoffice/settings']);
  }

  private buildInitialsAvatar(initials: string, bgColor: string): string {
    const safeInitials = (initials || 'U').slice(0, 2).toUpperCase();
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">` +
      `<rect width="40" height="40" rx="20" fill="${bgColor}"/>` +
      `<text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"` +
      ` font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="700" fill="#ffffff">` +
      `${safeInitials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}
