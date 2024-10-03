import { Product } from './product-model';

export interface AgrupacionProducto {
  nombre: string;
  productos: Product[];
  totalCantidad: number;
  imagen: string;
  categoria: string;
}
