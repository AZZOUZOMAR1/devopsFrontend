import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsManagementComponent } from './events-management.component';

describe('EventsManagementComponent', () => {
  let component: EventsManagementComponent;
  let fixture: ComponentFixture<EventsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EventsManagementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
