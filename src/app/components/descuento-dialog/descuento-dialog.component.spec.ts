import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescuentoDialogComponent } from './descuento-dialog.component';

describe('DescuentoDialogComponent', () => {
  let component: DescuentoDialogComponent;
  let fixture: ComponentFixture<DescuentoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DescuentoDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DescuentoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
