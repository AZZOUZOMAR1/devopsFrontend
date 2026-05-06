import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FraudDashboardComponent } from './fraud-dashboard.component';

describe('FraudDashboardComponent', () => {
  let component: FraudDashboardComponent;
  let fixture: ComponentFixture<FraudDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FraudDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FraudDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
