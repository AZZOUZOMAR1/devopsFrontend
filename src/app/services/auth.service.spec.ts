import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { API_URL } from '../api.config';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('signinFaceOnly should POST face descriptor to signin-face-only', () => {
    const descriptor = Array.from({ length: 128 }, () => 0.1);
    const mockUser = {
      id: 1,
      firstName: 'A',
      lastName: 'B',
      email: 'a@test.com',
      role: 'STUDENT' as const
    };

    service.signinFaceOnly({ faceDescriptor: descriptor }).subscribe(user => {
      expect(user.email).toBe('a@test.com');
    });

    const req = httpMock.expectOne(`${API_URL}/auth/signin-face-only`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ faceDescriptor: descriptor });
    req.flush(mockUser);
  });
});
