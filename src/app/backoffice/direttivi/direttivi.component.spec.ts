import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirettiviComponent } from './direttivi.component';

describe('DirettiviComponent', () => {
  let component: DirettiviComponent;
  let fixture: ComponentFixture<DirettiviComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirettiviComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirettiviComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
