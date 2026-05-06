import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentPreferencesComponent } from './student-preferences.component';

describe('StudentPreferencesComponent', () => {
  let component: StudentPreferencesComponent;
  let fixture: ComponentFixture<StudentPreferencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StudentPreferencesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentPreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
