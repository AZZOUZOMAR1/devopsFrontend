import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { CoursesComponent } from './courses/courses.component';
import { ChatComponent } from './chat/chat.component';
import { ReclamationsComponent } from './reclamations/reclamations.component';
import { EventsComponent } from './events/events.component';
import { ClubsComponent } from './clubs/clubs.component';
import { ClubChatComponent } from './club-chat/club-chat.component';
import { ClubFeedbackComponent } from './club-feedback/club-feedback.component';
import { ClubPostsComponent } from './club-posts/club-posts.component';
import { PassportCompetencesComponent } from './passport-competences/passport-competences.component';
import { JobOffersComponent } from './job-offers/job-offers.component';
import { JobDetailsComponent } from './job-details/job-details.component';
import { SavedOffersComponent } from './saved-offers/saved-offers.component';
import { StudentPreferencesComponent } from './student-preferences/student-preferences.component';
import { ChatbotComponent } from './chatbot/chatbot.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'courses', component: CoursesComponent },
      { path: 'chat', component: ChatComponent },
      { path: 'reclamations', component: ReclamationsComponent },
      { path: 'events', component: EventsComponent },
      { path: 'clubs', component: ClubsComponent },
      { path: 'club-chat', component: ClubChatComponent },
      { path: 'club-feedback', component: ClubFeedbackComponent },
      { path: 'club-posts', component: ClubPostsComponent },
      { path: 'passport', component: PassportCompetencesComponent },
      { path: 'job-offers', component: JobOffersComponent },
      { path: 'job-details/:id', component: JobDetailsComponent },
      { path: 'saved-offers', component: SavedOffersComponent },
      { path: 'preferences', component: StudentPreferencesComponent },
      { path: 'chatbot', component: ChatbotComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FrontofficeRoutingModule { }
