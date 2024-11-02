export interface Product {
  id: string;
  nombre: string;
  modelo: string;
  categoria: string;
  proveedor: string;
  imagen: string;
  cantidad: number;
  precio: number;
  talle: number;
  color: string;
  //NEW
  sku: string;
  barcode?: string;
}
