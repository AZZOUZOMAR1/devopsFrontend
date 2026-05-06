import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationsManagementComponent } from './applications-management.component';

describe('ApplicationsManagementComponent', () => {
  let component: ApplicationsManagementComponent;
  let fixture: ComponentFixture<ApplicationsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApplicationsManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplicationsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
