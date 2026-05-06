import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BackofficeRoutingModule } from './backoffice-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { AddUserDialogComponent } from './user-management/add-user-dialog.component';
import { EditUserDialogComponent } from './user-management/edit-user-dialog.component';
import { ViewUserDialogComponent } from './user-management/view-user-dialog.component';
import { CoursesManagementComponent } from './courses-management/courses-management.component';
import { ClubsManagementComponent } from './clubs-management/clubs-management.component';
import { LayoutComponent } from './layout/layout.component';
import { BackofficeProfileComponent } from './profile/backoffice-profile.component';
import { ReclamationsManagementComponent } from './reclamations-management/reclamations-management.component';
import { DemandesClubComponent } from './demandes-club/demandes-club.component';
import { ReunionsClubComponent } from './reunions-club/reunions-club.component';
import { ClubMembersComponent } from './club-members/club-members.component';
import { ClubPostsComponent } from './club-posts/club-posts.component';
import { EventsManagementComponent } from './events-management/events-management.component';
import { EventDialogComponent } from './events-management/event-dialog/event-dialog.component';
import { FeedbackViewDialogComponent } from './events-management/feedback-view-dialog/feedback-view-dialog.component';
import { ClubDialogComponent } from './clubs-management/club-dialog/club-dialog.component';
import { FeedbacksManagementComponent } from './feedbacks-management/feedbacks-management.component';
import { PilotageVieAssociativeComponent } from './pilotage-vie-associative/pilotage-vie-associative.component';
import { SharedModule } from '../shared/shared.module';

// Angular Material Modules
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import { JobsManagementComponent } from './jobs-management/jobs-management.component';
import { ApplicationsManagementComponent } from './applications-management/applications-management.component';
import { JobOfferStatsComponent } from './job-offer-stats/job-offer-stats.component';
import { InterviewCalendarComponent } from './interview-calendar/interview-calendar.component';
import { FraudDashboardComponent } from './fraud-dashboard/fraud-dashboard.component';

@NgModule({
  declarations: [
    DashboardComponent,
    UserManagementComponent,
    AddUserDialogComponent,
    EditUserDialogComponent,
    ViewUserDialogComponent,
    CoursesManagementComponent,
    ClubsManagementComponent,
    DemandesClubComponent,
    ClubMembersComponent,
    ClubPostsComponent,
    ReunionsClubComponent,
    EventsManagementComponent,
    EventDialogComponent,
    FeedbackViewDialogComponent,
    ClubDialogComponent,
    FeedbacksManagementComponent,
    PilotageVieAssociativeComponent,
    ReclamationsManagementComponent,
    LayoutComponent,
    BackofficeProfileComponent,
    JobsManagementComponent,
    ApplicationsManagementComponent,
    JobOfferStatsComponent,
    InterviewCalendarComponent,
    FraudDashboardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BackofficeRoutingModule,
    RouterModule,
    SharedModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatBadgeModule,
    MatTabsModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule
  ]
})
export class BackofficeModule { }
