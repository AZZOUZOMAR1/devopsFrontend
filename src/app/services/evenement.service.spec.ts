import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { EvenementService } from './evenement.service';
import { API_URL } from '../api.config';
import { Evenement, EventStatus } from '../models/evenement.model';

describe('EvenementService', () => {
  let service: EvenementService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EvenementService]
    });
    service = TestBed.inject(EvenementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createEvenement should POST to /evenements', () => {
    const payload: Evenement = {
      titre: 'Hackathon',
      date: '2026-05-01',
      status: EventStatus.PLANNED
    };

    service.createEvenement(payload).subscribe((event) => {
      expect(event.titre).toBe('Hackathon');
    });

    const req = httpMock.expectOne(`${API_URL}/evenements`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(payload);
  });

  it('getEvenementById should GET /evenements/:id', () => {
    const mockEvent: Evenement = {
      id: 11,
      titre: 'Forum',
      date: '2026-05-10'
    };

    service.getEvenementById(11).subscribe((event) => {
      expect(event.id).toBe(11);
      expect(event.titre).toBe('Forum');
    });

    const req = httpMock.expectOne(`${API_URL}/evenements/11`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEvent);
  });

  it('getEvenementsByType should encode type in URL', () => {
    const type = 'Conférence & Workshop';
    const encoded = encodeURIComponent(type);
    const response: Evenement[] = [{ id: 2, titre: 'Event', date: '2026-06-01', type }];

    service.getEvenementsByType(type).subscribe((events) => {
      expect(events.length).toBe(1);
      expect(events[0].type).toBe(type);
    });

    const req = httpMock.expectOne(`${API_URL}/evenements/type/${encoded}`);
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });

  it('getEvenementsByStatus should call status endpoint', () => {
    const response: Evenement[] = [{ id: 3, titre: 'Salon', date: '2026-07-01', status: EventStatus.ACTIVE }];

    service.getEvenementsByStatus(EventStatus.ACTIVE).subscribe((events) => {
      expect(events[0].status).toBe(EventStatus.ACTIVE);
    });

    const req = httpMock.expectOne(`${API_URL}/evenements/statut/ACTIVE`);
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });
});
