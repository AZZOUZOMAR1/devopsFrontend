import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { JobOfferService } from './job-offer.service';
import { environment } from '../../environments/environment';
import { JobOffer } from '../models/job-offer.model';

describe('JobOfferService', () => {
  let service: JobOfferService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/joboffers`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [JobOfferService]
    });
    service = TestBed.inject(JobOfferService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('findAll should read Spring Page content and normalize fields', () => {
    service.findAll().subscribe((offers) => {
      expect(offers.length).toBe(1);
      expect(offers[0].contractType).toBe('CDI');
      expect(offers[0].date).toBe('2026-01-01T10:00:00');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({
      content: [
        {
          id: 1,
          title: 'Backend Engineer',
          description: 'desc',
          company: 'Acme',
          location: 'Tunis',
          contract_type: 'CDI',
          dateFin: '2026-01-01T10:00:00',
          active: true
        }
      ]
    });
  });

  it('findById should GET one offer and normalize contract_type', () => {
    service.findById(9).subscribe((offer) => {
      expect(offer.id).toBe(9);
      expect(offer.contractType).toBe('STAGE');
    });

    const req = httpMock.expectOne(`${baseUrl}/9`);
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 9,
      title: 'Internship',
      description: 'desc',
      company: 'Company',
      location: 'Sfax',
      contract_type: 'STAGE',
      active: true
    });
  });

  it('create should POST payload without legacy type field', () => {
    const payload = {
      title: 'Data Analyst',
      description: 'desc',
      company: 'DataCorp',
      location: 'Nabeul',
      contractType: 'CDD',
      active: true,
      type: 'SHOULD_NOT_BE_SENT'
    } as JobOffer & { type?: string };

    service.create(payload).subscribe((offer) => {
      expect(offer.contractType).toBe('CDD');
      expect(offer.title).toBe('Data Analyst');
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.type).toBeUndefined();
    req.flush({
      id: 12,
      ...req.request.body
    });
  });

  it('geocode should return null on HTTP error', () => {
    service.geocode('Unknown city').subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne((r) => r.url.includes('nominatim.openstreetmap.org/search'));
    expect(req.request.method).toBe('GET');
    req.flush('error', { status: 500, statusText: 'Server Error' });
  });
});
