import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { SigninComponent } from './signin.component';
import { AuthService } from '../../services/auth.service';
import { FaceRecognitionService } from '../../services/face-recognition.service';

describe('SigninComponent', () => {
  let component: SigninComponent;
  let fixture: ComponentFixture<SigninComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SigninComponent],
      imports: [
        FormsModule,
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule
      ],
      providers: [
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        {
          provide: AuthService,
          useValue: jasmine.createSpyObj('AuthService', [
            'signin',
            'signinFaceOnly',
            'googleSignin',
            'facebookSignin'
          ])
        },
        {
          provide: FaceRecognitionService,
          useValue: jasmine.createSpyObj('FaceRecognitionService', [
            'isAvailableInThisContext',
            'extractDescriptorFromVideo'
          ])
        }
      ]
    }).compileComponents();

    const face = TestBed.inject(FaceRecognitionService) as jasmine.SpyObj<FaceRecognitionService>;
    face.isAvailableInThisContext.and.returnValue(false);

    fixture = TestBed.createComponent(SigninComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('toggleFaceLogin toggles showFaceLogin', () => {
    expect(component.showFaceLogin).toBe(false);
    component.toggleFaceLogin();
    expect(component.showFaceLogin).toBe(true);
    component.toggleFaceLogin();
    expect(component.showFaceLogin).toBe(false);
  });
});
