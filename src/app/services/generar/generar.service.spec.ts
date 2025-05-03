import { TestBed } from '@angular/core/testing';

import { GenerarService } from './generar.service';

describe('GenerarService', () => {
  let service: GenerarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GenerarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
