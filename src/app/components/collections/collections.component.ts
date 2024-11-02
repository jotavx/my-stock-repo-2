import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator'; // Importar paginator
import { ProductService } from '../../services/product.service';
import { AgrupacionProducto } from '../../models/group-product.model';
import { Product } from '../../models/product-model';
import { ProductDialogComponent } from '../product-dialog/product-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { StockAlertService } from '../../services/stock-alert.service';

@Component({
  selector: 'app-collections',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.css'],
})
export class CollectionsComponent implements OnInit {
  stockThreshold: number = 10;
  skeletonCount: number = 6;
  skeletonArray: number[] = [];

  productosAgrupados: AgrupacionProducto[] = []; // Lista completa
  productosAgrupadosFiltrados: AgrupacionProducto[] = []; // Resultado de búsqueda
  productosPagina: AgrupacionProducto[] = []; // Paginación actual

  searchControl = new FormControl('');
  loading = true;

  // Variables para la paginación
  pageSize = 10; // Tamaño de página
  pageIndex = 0; // Página actual

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private productService: ProductService,
    private stockAlertService: StockAlertService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.skeletonArray = Array(this.skeletonCount).fill(0);
    this.obtenerColecciones();
    this.obtenerUmbralStock();

    // Escucha cambios en el input de búsqueda
    this.searchControl.valueChanges.subscribe((searchTerm: string | null) => {
      this.filtrarColecciones(searchTerm ?? '');
    });
  }

  obtenerColecciones() {
    setTimeout(() => {
      this.productService.groupProductsByName().subscribe({
        next: (agrupados) => {
          // Ordena los productos agrupados por `totalCantidad` en orden ascendente
          this.productosAgrupados = agrupados.sort(
            (a, b) => a.totalCantidad - b.totalCantidad
          );

          this.filtrarColecciones(''); // Inicializa filtrado
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al obtener productos agrupados:', error);
        },
      });
    }, 500);
  }

  //Sin Sort
  // obtenerColecciones() {
  //   setTimeout(() => {
  //     this.productService.groupProductsByName().subscribe({
  //       next: (agrupados) => {
  //         this.productosAgrupados = agrupados;
  //         this.filtrarColecciones(''); // Inicializa filtrado
  //         this.loading = false;
  //       },
  //       error: (error) => {
  //         console.error('Error al obtener productos agrupados:', error);
  //       },
  //     });
  //   }, 500);
  // }

  obtenerUmbralStock() {
    this.stockAlertService.getStockThreshold().subscribe((threshold) => {
      this.stockThreshold = threshold;
    });
  }

  filtrarColecciones(searchTerm: string): void {
    // Filtrar colecciones por término de búsqueda
    this.productosAgrupadosFiltrados = this.productosAgrupados.filter(
      (coleccion) =>
        coleccion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coleccion.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coleccion.totalCantidad.toString().includes(searchTerm.toLowerCase())
    );

    // Reinicia a la primera página y aplica paginación
    this.pageIndex = 0;
    this.aplicarPaginacion();
  }

  aplicarPaginacion(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.productosPagina = this.productosAgrupadosFiltrados.slice(start, end);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.aplicarPaginacion();
  }

  clearInput(input: HTMLInputElement) {
    input.value = '';
    this.searchControl.setValue('');
  }

  explorarColeccion(productos: Product[], nombreColeccion: string): void {
    this.dialog.open(ProductDialogComponent, {
      maxWidth: '80vw',
      maxHeight: '80vh',
      height: '80%',
      width: '80%',
      panelClass: 'full-screen-modal',
      data: { productos, marca: nombreColeccion },
      autoFocus: false,
    });
  }
}

// POR SI FALLA LA PAGINACIÓN AQUI EL CODIGO PREVIO A SU MODIFICACIÓN
// import { Component, OnInit } from '@angular/core';
// import { FormControl } from '@angular/forms'; // Importa FormControl
// import { ProductService } from '../../services/product.service';
// import { AgrupacionProducto } from '../../models/group-product.model';
// import { Product } from '../../models/product-model';
// import { ProductDialogComponent } from '../product-dialog/product-dialog.component';
// import { MatDialog } from '@angular/material/dialog';
// import { StockAlertService } from '../../services/stock-alert.service';

// @Component({
//   selector: 'app-collections',
//   templateUrl: './collections.component.html',
//   styleUrls: ['./collections.component.css'],
// })
// export class CollectionsComponent implements OnInit {
//   stockThreshold: number = 5; // Valor por defecto
//   skeletonCount: number = 6;
//   skeletonArray: number[] = [];
//   productosAgrupados: AgrupacionProducto[] = [];
//   productosAgrupadosFiltrados: AgrupacionProducto[] = []; // Lista de colecciones filtradas
//   searchControl = new FormControl(''); // Control de formulario para búsqueda
//   loading = true;

//   constructor(
//     private productService: ProductService,
//     private stockAlertService: StockAlertService,
//     private dialog: MatDialog
//   ) {}

//   ngOnInit(): void {
//     this.skeletonArray = Array(this.skeletonCount).fill(0);
//     this.obtenerColecciones();
//     this.obtenerUmbralStock();

//     // Suscribirse a los cambios en el control de búsqueda
//     this.searchControl.valueChanges.subscribe((searchTerm: string | null) => {
//       // Usa el operador ?? para manejar el valor null
//       this.filtrarColecciones(searchTerm ?? '');
//     });
//   }

//   obtenerColecciones() {
//     setTimeout(() => {
//       this.productService.groupProductsByName().subscribe({
//         next: (agrupados) => {
//           this.productosAgrupados = agrupados;
//           this.productosAgrupadosFiltrados = agrupados; // Inicializa con todas las colecciones
//           this.loading = false;
//         },
//         error: (error) => {
//           console.error('Error al obtener productos agrupados:', error);
//         },
//       });
//     }, 500);
//   }

//   obtenerUmbralStock() {
//     this.stockAlertService.getStockThreshold().subscribe((threshold) => {
//       this.stockThreshold = threshold;
//     });
//   }

//   filtrarColecciones(searchTerm: string): void {
//     if (!searchTerm) {
//       this.productosAgrupadosFiltrados = [...this.productosAgrupados]; // Muestra todas las colecciones si no hay búsqueda
//       return;
//     }

//     // Filtra colecciones por nombre que coincidan con el término de búsqueda
//     this.productosAgrupadosFiltrados = this.productosAgrupados.filter(
//       (coleccion) =>
//         coleccion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         coleccion.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         coleccion.totalCantidad.toString().includes(searchTerm.toLowerCase())
//     );
//   }

//   clearInput(input: HTMLInputElement) {
//     input.value = ''; // Limpia el input visualmente
//     this.searchControl.setValue(''); // Resetea el FormControl para disparar valueChanges
//   }

//   explorarColeccion(productos: Product[], nombreColeccion: string): void {
//     const dialogRef = this.dialog.open(ProductDialogComponent, {
//       maxWidth: '80vw',
//       maxHeight: '80vh',
//       height: '80%',
//       width: '80%',
//       panelClass: 'full-screen-modal',
//       data: { productos, marca: nombreColeccion },
//     });
//   }

// explorarColeccion(productos: Product[], nombreColeccion: string): void {
//   const dialogRef = this.dialog.open(ProductDialogComponent, {
//     height: '70%',
//     width: '80%',
//     maxHeight: '100%',
//     data: { productos, marca: nombreColeccion },
//   });
// }
//}
