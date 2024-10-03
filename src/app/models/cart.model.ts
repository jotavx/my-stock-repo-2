import { Product } from './product-model';

export interface Cart extends Product {
  id: string;
  cantidad: number;
  subtotal?: number;
  idOriginal?: string;
}
