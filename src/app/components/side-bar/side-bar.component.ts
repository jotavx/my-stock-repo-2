import {
  Component,
  AfterViewInit,
  HostListener,
  ElementRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CartService } from '../../services/cart.service';
import { UserService } from '../../services/user.service';
import { StockAlertService } from '../../services/stock-alert.service';
import { LogoutDialogComponent } from '../logout-dialog/logout-dialog.component';
import { CreateProductDialogComponent } from '../create-product-dialog/create-product-dialog.component';
import { CreateProviderComponent } from '../create-provider/create-provider.component';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css'],
})
export class SideBarComponent implements AfterViewInit {
  cantidadProductosBajoStock: number = 0;
  totalProductosEnCarrito: number = 0;
  isAdmin: boolean = false;
  isMenuOpen: boolean = false;

  //OLD NAVBAR
  // isConfigMenuOpen: boolean = false;
  // isProductsMenuOpen: boolean = false;

  constructor(
    public dialog: MatDialog,
    private cartService: CartService,
    private userService: UserService,
    private stockAlertService: StockAlertService,
    private eRef: ElementRef,
    private router: Router
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.closeSidebar();
      }
    });
  }

  ngAfterViewInit() {
    const openButton = document.querySelector<HTMLButtonElement>(
      '[data-drawer-toggle="separator-sidebar"]'
    );
    const closeButton = document.getElementById('close-sidebar-btn');
    const sidebar = document.getElementById('separator-sidebar');

    if (openButton && sidebar) {
      // Abrir el sidebar
      openButton.addEventListener('click', () => {
        sidebar.classList.remove('-translate-x-full');
        this.isMenuOpen = true; // Actualizamos el estado
      });
    }

    if (closeButton && sidebar) {
      // Cerrar el sidebar desde el botón interno
      closeButton.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        this.isMenuOpen = false; // Actualizamos el estado
      });
    }
  }

  ngOnInit(): void {
    this.obtenerTotalCarrito();
    this.obtenerStockBajo();
    this._isUserAdmin();
  }

  _isUserAdmin() {
    this.userService.isUserAdmin().subscribe((isAdmin) => {
      this.isAdmin = isAdmin;
    });
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    const sidebar = document.getElementById('separator-sidebar');
    if (
      this.isMenuOpen &&
      sidebar &&
      !this.eRef.nativeElement.contains(event.target)
    ) {
      sidebar.classList.add('-translate-x-full');
      this.isMenuOpen = false; // Cerramos el sidebar si se hace clic fuera de él
    }
  }

  closeSidebar() {
    const sidebar = document.getElementById('separator-sidebar');
    sidebar!.classList.add('-translate-x-full');
    sidebar!.classList.remove('translate-x-0');
  }

  //SIRVE PARA TOGGLEAR EL SIDEBAR EN TODAS LAS RESOLUCIÓNES
  // isSidebarOpen: boolean = false;
  // toggleSidebar() {
  //   this.isSidebarOpen = !this.isSidebarOpen;
  // }
  //////////////////////////////////////////////////////////////////////////

  openCreateProductDialog(content?: any): void {
    const dialogRef = this.dialog.open(CreateProductDialogComponent, {
      width: '600px',
      data: content, // Pasa datos a través del diálogo si estás en modo de edición
      autoFocus: false,
    });
    // dialogRef.afterClosed().subscribe(() => {
    //   this.obtenerDatos();
    // });
  }

  openCreateProviderDialog(content?: any): void {
    const dialogRef = this.dialog.open(CreateProviderComponent, {
      width: '600px',
      data: content,
      autoFocus: false,
    });
  }

  obtenerTotalCarrito() {
    this.cartService.getTotalProductosEnCarrito().subscribe((total) => {
      this.totalProductosEnCarrito = total;
    });
  }

  obtenerStockBajo() {
    this.stockAlertService
      .observarStockBajo()
      .subscribe(({ productos, cantidad }) => {
        // Actualizar la lista de productos con stock bajo y la cantidad
        this.cantidadProductosBajoStock = cantidad;
      });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  //OLD NAVBAR
  // toggleProductsMenu(event: Event): void {
  //   event.stopPropagation();
  //   this.isProductsMenuOpen = !this.isProductsMenuOpen;

  //   if (this.isProductsMenuOpen) {
  //     this.isConfigMenuOpen = false; // Cierra el menú de opciones si se abre el de productos
  //   }
  // }

  // toggleConfigMenu(event: Event): void {
  //   event.stopPropagation();
  //   this.isConfigMenuOpen = !this.isConfigMenuOpen;

  //   if (this.isConfigMenuOpen) {
  //     this.isProductsMenuOpen = false; // Cierra el menú de productos si se abre el de opciones
  //   }
  // }

  // @HostListener('window:resize')
  // onResize(): void {
  //   // Cierra el menú si se redimensiona la ventana a un tamaño de pantalla mayor
  //   if (window.innerWidth >= 640) {
  //     this.isMenuOpen = false;
  //   }
  // }

  // @HostListener('document:click', ['$event'])
  // onDocumentClick(event: Event): void {
  //   const clickedInsideProductsMenu = (event.target as HTMLElement).closest(
  //     '.products-menu'
  //   );
  //   const clickedInsideConfigMenu = (event.target as HTMLElement).closest(
  //     '.config-menu'
  //   );

  //   if (!clickedInsideProductsMenu) {
  //     this.isProductsMenuOpen = false;
  //   }

  //   if (!clickedInsideConfigMenu) {
  //     this.isConfigMenuOpen = false;
  //   }
  // }

  openLogoutDialog(): void {
    const dialogRef = this.dialog.open(LogoutDialogComponent, {
      width: '450px',
    });
  }
}
