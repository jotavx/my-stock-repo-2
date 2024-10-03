import { Component, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LogoutDialogComponent } from '../logout-dialog/logout-dialog.component';
import { CartService } from '../../services/cart.service';
import { StockAlertService } from '../../services/stock-alert.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  cantidadProductosBajoStock: number = 0;
  totalProductosEnCarrito: number = 0;

  isAdmin: boolean = false;
  isMenuOpen: boolean = false;
  isConfigMenuOpen: boolean = false;
  isProductsMenuOpen: boolean = false;

  constructor(
    public dialog: MatDialog,
    private cartService: CartService,
    private userService: UserService,
    private stockAlertService: StockAlertService
  ) {}

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

  toggleProductsMenu(event: Event): void {
    event.stopPropagation();
    this.isProductsMenuOpen = !this.isProductsMenuOpen;

    if (this.isProductsMenuOpen) {
      this.isConfigMenuOpen = false; // Cierra el menú de opciones si se abre el de productos
    }
  }

  toggleConfigMenu(event: Event): void {
    event.stopPropagation();
    this.isConfigMenuOpen = !this.isConfigMenuOpen;

    if (this.isConfigMenuOpen) {
      this.isProductsMenuOpen = false; // Cierra el menú de productos si se abre el de opciones
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    // Cierra el menú si se redimensiona la ventana a un tamaño de pantalla mayor
    if (window.innerWidth >= 640) {
      this.isMenuOpen = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const clickedInsideProductsMenu = (event.target as HTMLElement).closest(
      '.products-menu'
    );
    const clickedInsideConfigMenu = (event.target as HTMLElement).closest(
      '.config-menu'
    );

    if (!clickedInsideProductsMenu) {
      this.isProductsMenuOpen = false;
    }

    if (!clickedInsideConfigMenu) {
      this.isConfigMenuOpen = false;
    }
  }

  openLogoutDialog(): void {
    const dialogRef = this.dialog.open(LogoutDialogComponent, {
      width: '450px',
    });
  }
}
