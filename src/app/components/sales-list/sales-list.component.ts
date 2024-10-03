import { Component, OnInit } from '@angular/core';
import { SalesService } from '../../services/sales.service';
import { SnackbarService } from '../../services/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { UserService } from '../../services/user.service';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Product } from '../../models/product-model';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.component.html',
  styleUrl: './sales-list.component.css',
})
export class SalesListComponent implements OnInit {
  ventas: any[] = [];
  isAdmin: boolean = false;

  constructor(
    private salesService: SalesService,
    private snackBar: SnackbarService,
    private userService: UserService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this._getVentas();
    this._isUserAdmin();
  }

  _isUserAdmin() {
    this.userService.isUserAdmin().subscribe((isAdmin) => {
      this.isAdmin = isAdmin;
    });
  }

  _getVentas() {
    this.salesService.getVentas().subscribe((data) => {
      this.ventas = [];
      data.forEach((element: any) => {
        const ventasData = {
          id: element.payload.doc.id,
          ...element.payload.doc.data(),
        };
        this.ventas.push(ventasData);
      });
    });
  }

  _eliminarVenta(id: string): void {
    this.salesService.eliminarVenta(id).then(
      () => this.snackBar.showSuccess('Se ha eliminado el registro'),
      (error) => {
        console.log('Error eliminando el registro:', error);
        this.snackBar.showError('Se ha producido un error');
      }
    );
  }

  openDeleteDialog(venta: { id: string }): void {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '450px',
      data: { id: venta.id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirm') {
        this._eliminarVenta(venta.id);
      }
    });
  }

  getColor(colorName?: string): string {
    const colors: { [key: string]: string } = {
      rojo: '#fb0909',
      azul: '#0d09fb',
      amarillo: '#edfe06',
      verde: '#04ff00',
    };
    return colors[colorName?.toLowerCase() || ''] || '#ccc';
  }

  // Método para generar un PDF con tabla usando pdfmake
  generatePDF(venta: any): void {
    const vendedorNombre = venta.vendedor?.nombre || 'Desconocido';

    // Mapeo de productos con precio total y precio unitario
    const productos = venta.productos?.map((producto: Product) => [
      {
        text: `${producto.nombre || 'Sin nombre'}\nModelo: ${
          producto.modelo || 'N/A'
        }\nTalle: ${producto.talle || 'N/A'}\nColor: ${
          producto.color || 'N/A'
        }`,
        fontSize: 10,
      },
      { text: `${producto.cantidad || 0}`, fontSize: 10 },
      {
        text: `$${
          producto.precio?.toLocaleString('en-US', {
            minimumFractionDigits: 2,
          }) || '0.00'
        }`,
        fontSize: 10,
      }, // Precio unitario
      {
        text: `$${
          (producto.precio * (producto.cantidad || 0)).toLocaleString('en-US', {
            minimumFractionDigits: 2,
          }) || '0.00'
        }`,
        fontSize: 10,
      }, // Precio total
    ]);

    const totalSinDescuento =
      venta.totalSinDescuento?.toLocaleString('en-US', {
        minimumFractionDigits: 2,
      }) || '0.00';
    const totalConDescuento =
      venta.totalConDescuento?.toLocaleString('en-US', {
        minimumFractionDigits: 2,
      }) || '0.00';
    const fecha = venta.fecha.toDate()
      ? venta.fecha.toDate().toLocaleDateString()
      : 'Fecha no disponible'; // Formateo de fecha

    const documentDefinition = {
      content: [
        // Cabecera del PDF: Logo, título y número de factura
        {
          columns: [
            {
              width: '50%',
              text: 'TU LOGO AQUÍ',
              bold: true,
              fontSize: 16,
              margin: [0, 0, 0, 20],
            },
            {
              width: '50%',
              alignment: 'right',
              text: `FACTURA\nNº ${venta.id?.toUpperCase() || '12345'}`,
              bold: true,
              fontSize: 12,
              margin: [0, 0, 0, 20],
            },
          ],
        },
        // Fecha de la venta
        {
          text: `Fecha: ${fecha}`,
          fontSize: 12,
          margin: [0, 0, 0, 10],
        },
        // Nombre del vendedor
        {
          text: `Vendedor: ${vendedorNombre}`,
          fontSize: 12,
          margin: [0, 0, 0, 10],
        },

        // Tabla de productos
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              // Encabezados de la tabla
              [
                { text: 'PRODUCTOS', bold: true },
                { text: 'CANT', bold: true },
                { text: 'UNIT', bold: true },
                { text: 'TOTAL', bold: true },
              ],
              // Filas de productos
              ...productos,
            ],
          },
          margin: [0, 20, 0, 20],
        },
        // Total
        {
          columns: [
            { width: '*', text: '' },
            { width: '*', text: '' }, //  Espacio en blanco
            {
              table: {
                widths: ['auto', 'auto'],
                body: [
                  [
                    { text: 'TOTAL FINAL', bold: true },
                    { text: `$${totalConDescuento}`, bold: true },
                  ],
                ],
              },
              layout: 'noBorders',
            },
          ],
        },
      ],
      footer: (currentPage: number, pageCount: number) => {
        return {
          columns: [
            {
              text: '1234-5678\nhola@sitioincreible.com\nCalle Cualquiera 123, Cualquier Lugar\nwww.sitioincreible.com',
              alignment: 'center',
              fontSize: 10,
              margin: [0, 0, 0, 10],
            },
          ],
        };
      },
      pageMargins: [40, 60, 40, 60], // Márgenes para asegurar el pie de página
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          marginBottom: 10,
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'black',
        },
        tableData: {
          fontSize: 10,
        },
      },
    };

    // Generar y descargar el PDF
    pdfMake
      .createPdf(documentDefinition)
      .download(`venta-${venta.id?.toUpperCase()}.pdf`);
  }
}
