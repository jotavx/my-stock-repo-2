import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductViewListComponent } from './product-view-list.component';

describe('ProductViewListComponent', () => {
  let component: ProductViewListComponent;
  let fixture: ComponentFixture<ProductViewListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductViewListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductViewListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
