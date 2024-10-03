import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DiscountService {
  private discount: number = 0;

  setDiscount(amount: number): void {
    this.discount = amount;
  }

  getDiscount(): number {
    return this.discount;
  }
}
