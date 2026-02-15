import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordSetPageComponent } from './password-set-page.component';

describe('PasswordSetPageComponent', () => {
  let component: PasswordSetPageComponent;
  let fixture: ComponentFixture<PasswordSetPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordSetPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasswordSetPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
