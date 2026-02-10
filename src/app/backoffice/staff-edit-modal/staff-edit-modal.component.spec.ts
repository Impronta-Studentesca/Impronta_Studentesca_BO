import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffEditModalComponent } from './staff-edit-modal.component';

describe('StaffEditModalComponent', () => {
  let component: StaffEditModalComponent;
  let fixture: ComponentFixture<StaffEditModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffEditModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffEditModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
