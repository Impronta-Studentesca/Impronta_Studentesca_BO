import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffDaApprovareComponent } from './staff-da-approvare.component';

describe('StaffDaApprovareComponent', () => {
  let component: StaffDaApprovareComponent;
  let fixture: ComponentFixture<StaffDaApprovareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffDaApprovareComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffDaApprovareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
