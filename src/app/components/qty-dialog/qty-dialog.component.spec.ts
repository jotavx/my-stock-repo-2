import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QtyDialogComponent } from './qty-dialog.component';

describe('QtyDialogComponent', () => {
  let component: QtyDialogComponent;
  let fixture: ComponentFixture<QtyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QtyDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QtyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
