import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobOfferStatsComponent } from './job-offer-stats.component';

describe('JobOfferStatsComponent', () => {
  let component: JobOfferStatsComponent;
  let fixture: ComponentFixture<JobOfferStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [JobOfferStatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobOfferStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
