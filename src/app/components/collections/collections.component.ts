import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms'; // Importa FormControl
import { ProductService } from '../../services/product.service';
import { AgrupacionProducto } from '../../models/group-product.model';
import { Product } from '../../models/product-model';
import { ProductDialogComponent } from '../product-dialog/product-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-collections',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.css'],
})
export class CollectionsComponent implements OnInit {
  skeletonCount: number = 6;
  skeletonArray: number[] = [];
  productosAgrupados: AgrupacionProducto[] = [];
  productosAgrupadosFiltrados: AgrupacionProducto[] = []; // Lista de colecciones filtradas
  searchControl = new FormControl(''); // Control de formulario para búsqueda
  loading = true;

  constructor(
    private productService: ProductService,

    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.skeletonArray = Array(this.skeletonCount).fill(0);
    this.obtenerColecciones();

    // Suscribirse a los cambios en el control de búsqueda
    this.searchControl.valueChanges.subscribe((searchTerm: string | null) => {
      // Usa el operador ?? para manejar el valor null
      this.filtrarColecciones(searchTerm ?? '');
    });
  }

  obtenerColecciones() {
    setTimeout(() => {
      this.productService.groupProductsByName().subscribe({
        next: (agrupados) => {
          this.productosAgrupados = agrupados;
          this.productosAgrupadosFiltrados = agrupados; // Inicializa con todas las colecciones
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al obtener productos agrupados:', error);
        },
      });
    }, 500);
  }

  filtrarColecciones(searchTerm: string): void {
    if (!searchTerm) {
      this.productosAgrupadosFiltrados = [...this.productosAgrupados]; // Muestra todas las colecciones si no hay búsqueda
      return;
    }

    // Filtra colecciones por nombre que coincidan con el término de búsqueda
    this.productosAgrupadosFiltrados = this.productosAgrupados.filter(
      (coleccion) =>
        coleccion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coleccion.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coleccion.totalCantidad.toString().includes(searchTerm.toLowerCase())
    );
  }

  explorarColeccion(productos: Product[]): void {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      height: '70%',
      width: 'calc(100% - 30px)',
      maxWidth: '100%',
      maxHeight: '100%',
      data: { productos },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Manejar el resultado si es necesario
      }
    });
  }
}
