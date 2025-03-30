import { TestBed } from '@angular/core/testing';

import { VersionesService } from './versiones.service';

describe('VersionesService', () => {
  let service: VersionesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VersionesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
