import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { CoursesManagementComponent } from './courses-management/courses-management.component';
import { ClubsManagementComponent } from './clubs-management/clubs-management.component';
import { BackofficeProfileComponent } from './profile/backoffice-profile.component';
import { ReclamationsManagementComponent } from './reclamations-management/reclamations-management.component';
import { DemandesClubComponent } from './demandes-club/demandes-club.component';
import { ReunionsClubComponent } from './reunions-club/reunions-club.component';
import { ClubMembersComponent } from './club-members/club-members.component';
import { ClubPostsComponent } from './club-posts/club-posts.component';
import { EventsManagementComponent } from './events-management/events-management.component';
import { FeedbacksManagementComponent } from './feedbacks-management/feedbacks-management.component';
import { PilotageVieAssociativeComponent } from './pilotage-vie-associative/pilotage-vie-associative.component';
import { JobsManagementComponent } from './jobs-management/jobs-management.component';
import { ApplicationsManagementComponent } from './applications-management/applications-management.component';
import { JobOfferStatsComponent } from './job-offer-stats/job-offer-stats.component';
import { InterviewCalendarComponent } from './interview-calendar/interview-calendar.component';
import { FraudDashboardComponent } from './fraud-dashboard/fraud-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'courses', component: CoursesManagementComponent },
      { path: 'clubs', component: ClubsManagementComponent },
      { path: 'demandes-club', component: DemandesClubComponent },
      { path: 'club-members', component: ClubMembersComponent },
      { path: 'club-posts', component: ClubPostsComponent },
      { path: 'reunions-club', component: ReunionsClubComponent },
      { path: 'events', component: EventsManagementComponent },
      { path: 'feedbacks', component: FeedbacksManagementComponent },
      { path: 'vie-associative', component: PilotageVieAssociativeComponent },
      { path: 'reclamations', component: ReclamationsManagementComponent },
      { path: 'profile', component: BackofficeProfileComponent },
      { path: 'jobs', component: JobsManagementComponent },
      { path: 'applications', component: ApplicationsManagementComponent },
      { path: 'job-stats', component: JobOfferStatsComponent },
      { path: 'interviews', component: InterviewCalendarComponent },
      { path: 'fraud', component: FraudDashboardComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BackofficeRoutingModule { }
