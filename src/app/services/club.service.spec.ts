import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ClubService } from './club.service';
import { API_URL } from '../api.config';
import { Club } from '../models/club.model';

describe('ClubService', () => {
  let service: ClubService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClubService]
    });
    service = TestBed.inject(ClubService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createClub should POST to /clubs', () => {
    const payload: Club = { nom: 'Club IA', type: 'Tech' };

    service.createClub(payload).subscribe((club) => {
      expect(club.nom).toBe('Club IA');
    });

    const req = httpMock.expectOne(`${API_URL}/clubs`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(payload);
  });

  it('getClubById should GET /clubs/:id', () => {
    const mockClub: Club = { id: 9, nom: 'Club Robotique' };

    service.getClubById(9).subscribe((club) => {
      expect(club.id).toBe(9);
      expect(club.nom).toBe('Club Robotique');
    });

    const req = httpMock.expectOne(`${API_URL}/clubs/9`);
    expect(req.request.method).toBe('GET');
    req.flush(mockClub);
  });

  it('updateClub should PUT /clubs/:id with payload', () => {
    const payload: Club = { nom: 'Club IA Maj', description: 'updated' };

    service.updateClub(3, payload).subscribe((club) => {
      expect(club.nom).toBe('Club IA Maj');
    });

    const req = httpMock.expectOne(`${API_URL}/clubs/3`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(payload);
  });

  it('getClubByNom should encode nom in URL', () => {
    const nom = 'Club & Design';
    const encoded = encodeURIComponent(nom);
    const mockClub: Club = { id: 5, nom };

    service.getClubByNom(nom).subscribe((club) => {
      expect(club.nom).toBe(nom);
    });

    const req = httpMock.expectOne(`${API_URL}/clubs/nom/${encoded}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockClub);
  });
});
