import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { ClubAvisDialogComponent } from './club-avis-dialog/club-avis-dialog.component';
import { PaginationComponent } from './pagination/pagination.component';
import { ToastComponent } from './toast/toast.component';



@NgModule({
  declarations: [
    NavbarComponent,
    SidebarComponent,
    ClubAvisDialogComponent,
    PaginationComponent,
    ToastComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressBarModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSelectModule
  ],
  exports: [
    NavbarComponent,
    SidebarComponent,
    ClubAvisDialogComponent,
    PaginationComponent,
    ToastComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressBarModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSelectModule
  ]
})
export class SharedModule { }
