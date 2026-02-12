import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembriDirettivoComponent } from './membri-direttivo.component';

describe('MembriDirettivoComponent', () => {
  let component: MembriDirettivoComponent;
  let fixture: ComponentFixture<MembriDirettivoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembriDirettivoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembriDirettivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
