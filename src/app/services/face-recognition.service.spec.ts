import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { FaceRecognitionService } from './face-recognition.service';

describe('FaceRecognitionService', () => {
  it('should be created', () => {
    TestBed.configureTestingModule({
      providers: [FaceRecognitionService, { provide: PLATFORM_ID, useValue: 'browser' }]
    });
    const service = TestBed.inject(FaceRecognitionService);
    expect(service).toBeTruthy();
  });

  it('isAvailableInThisContext is false on server', () => {
    TestBed.configureTestingModule({
      providers: [FaceRecognitionService, { provide: PLATFORM_ID, useValue: 'server' }]
    });
    const service = TestBed.inject(FaceRecognitionService);
    expect(service.isAvailableInThisContext()).toBe(false);
  });
});
