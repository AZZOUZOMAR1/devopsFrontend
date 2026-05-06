import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavedOffersComponent } from './saved-offers.component';

describe('SavedOffersComponent', () => {
  let component: SavedOffersComponent;
  let fixture: ComponentFixture<SavedOffersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SavedOffersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SavedOffersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
