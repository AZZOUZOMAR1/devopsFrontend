import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FrontofficeRoutingModule } from './frontoffice-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { CoursesComponent } from './courses/courses.component';
import { ChatComponent } from './chat/chat.component';
import { LayoutComponent } from './layout/layout.component';
import { SharedModule } from '../shared/shared.module';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ReclamationsComponent } from './reclamations/reclamations.component';
import { EventsComponent } from './events/events.component';
import { ClubsComponent } from './clubs/clubs.component';
import { ClubChatComponent } from './club-chat/club-chat.component';
import { ClubFeedbackComponent } from './club-feedback/club-feedback.component';
import { ClubPostsComponent } from './club-posts/club-posts.component';
import { PassportCompetencesComponent } from './passport-competences/passport-competences.component';
import { JoinClubDialogComponent } from './clubs/join-club-dialog/join-club-dialog.component';
import { QrInvitationDialogComponent } from './events/qr-invitation-dialog/qr-invitation-dialog.component';
import { FeedbackDialogComponent } from './events/feedback-dialog/feedback-dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { JobOffersComponent } from './job-offers/job-offers.component';
import { JobDetailsComponent } from './job-details/job-details.component';
import { SavedOffersComponent } from './saved-offers/saved-offers.component';
import { StudentPreferencesComponent } from './student-preferences/student-preferences.component';
import { ChatbotComponent } from './chatbot/chatbot.component';


@NgModule({
  declarations: [
    DashboardComponent,
    ProfileComponent,
    CoursesComponent,
    ChatComponent,
    LayoutComponent,
    ReclamationsComponent,
    EventsComponent,
    ClubsComponent,
    ClubChatComponent,
    ClubFeedbackComponent,
    ClubPostsComponent,
    PassportCompetencesComponent,
    JoinClubDialogComponent,
    QrInvitationDialogComponent,
    FeedbackDialogComponent,
    JobOffersComponent,
    JobDetailsComponent,
    SavedOffersComponent,
    StudentPreferencesComponent,
    ChatbotComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FrontofficeRoutingModule,
    SharedModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MatIconModule,
    MatOptionModule,
    MatDialogModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule
  ]
})
export class FrontofficeModule { }
