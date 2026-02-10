import { TestBed } from '@angular/core/testing';

import { DipartimentiService } from './dipartimenti.service';

describe('DipartimentiService', () => {
  let service: DipartimentiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DipartimentiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
