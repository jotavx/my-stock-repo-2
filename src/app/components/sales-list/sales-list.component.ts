import { Component, OnInit } from '@angular/core';
import { SalesService } from '../../services/sales.service';
import { SnackbarService } from '../../services/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { UserService } from '../../services/user.service';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Product } from '../../models/product-model';
import * as XLSX from 'xlsx'; // Librería para exportar a Excel

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.component.html',
  styleUrl: './sales-list.component.css',
})
export class SalesListComponent implements OnInit {
  ventas: any[] = [];
  ventasFiltradas: any[] = []; // Ventas después de aplicar el filtro
  ventasPorVendedor: {
    vendedor: string;
    totalVentas: number;
    cantidadVentas: number;
  }[] = [];
  isAdmin: boolean = false;

  ventasPaginadas: any[] = [];
  pageSize = 5;
  currentPage = 0;

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
        this.ventasFiltradas = this.ventas; // Al cargar, mostramos todas las ventas
      });
      this._calcularVentasPorVendedor();
      this.applyPagination();
    });
  }

  applyPagination() {
    const startIndex = this.currentPage * this.pageSize;
    this.ventasPaginadas = this.ventasFiltradas.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  onPageChange(event: any) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.applyPagination();
  }

  _calcularVentasPorVendedor() {
    const ventasPorVendedor: {
      [key: string]: { totalVentas: number; cantidadVentas: number };
    } = {};

    this.ventas.forEach((venta) => {
      const vendedor = venta.vendedor?.nombre || 'Desconocido';

      // Inicializar si no existe
      if (!ventasPorVendedor[vendedor]) {
        ventasPorVendedor[vendedor] = { totalVentas: 0, cantidadVentas: 0 };
      }

      // Sumar el total de ventas y contar la cantidad
      ventasPorVendedor[vendedor].totalVentas += venta.totalConDescuento;
      ventasPorVendedor[vendedor].cantidadVentas += 1;
    });

    // Convertir el objeto en un array para usarlo en el HTML
    this.ventasPorVendedor = Object.keys(ventasPorVendedor)
      .map((vendedor) => ({
        vendedor,
        totalVentas: ventasPorVendedor[vendedor].totalVentas,
        cantidadVentas: ventasPorVendedor[vendedor].cantidadVentas,
      }))
      .sort((a, b) => b.cantidadVentas - a.cantidadVentas);
  }

  _eliminarVenta(id: string): void {
    this.salesService.eliminarVenta(id).then(
      () => {
        // Eliminar la venta de las listas locales
        this.ventas = this.ventas.filter((venta) => venta.id !== id);
        this.ventasFiltradas = [...this.ventas];

        // Recalcular ventas por vendedor
        this._calcularVentasPorVendedor();

        // Mostrar notificación de éxito
        this.snackBar.showSuccess('Se ha eliminado el registro');
      },
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
      naranja: '#f97316',
      purple: '#a855f7',
      pink: '#ec4899',
      teal: '#14b8a6',
    };
    return colors[colorName?.toLowerCase() || ''] || '#ccc';
  }

  // Método para generar un PDF con tabla usando pdfmake
  // generatePDF(venta: any): void {
  //   const vendedorNombre =
  //     venta.vendedor?.nombre.toUpperCase() || 'Desconocido';

  //   const productos = venta.productos?.map((producto: Product) => [
  //     {
  //       text: `${producto.nombre?.toUpperCase() || 'Sin nombre'} - ${
  //         producto.modelo?.toUpperCase() || 'N/A'
  //       }`,
  //       fontSize: 10,
  //     },
  //     { text: `${producto.sku?.toUpperCase() || 0}`, fontSize: 10 },
  //     {
  //       text: `${producto.cantidad || 0}`,
  //       fontSize: 10,
  //       alignment: 'center',
  //       bold: true,
  //     },
  //     {
  //       text: `$${(producto.precio || 0).toLocaleString('en-US', {
  //         minimumFractionDigits: 2,
  //       })}`,
  //       fontSize: 10,
  //     },
  //     {
  //       text: `$${(
  //         (producto.precio || 0) * (producto.cantidad || 0)
  //       ).toLocaleString('en-US', {
  //         minimumFractionDigits: 2,
  //       })}`,
  //       fontSize: 10,
  //     },
  //   ]);

  //   const totalConDescuento =
  //     venta.totalConDescuento?.toLocaleString('en-US', {
  //       minimumFractionDigits: 2,
  //     }) || '0.00';
  //   const fecha = venta.fecha.toDate()
  //     ? `${venta.fecha.toDate().toLocaleDateString()} | ${venta.fecha
  //         .toDate()
  //         .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  //     : 'Fecha no disponible';

  //   const documentDefinition = {
  //     content: [
  //       {
  //         columns: [
  //           {
  //             width: '50%',
  //             image:
  //               'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAcHBwcIBwgJCQgMDAsMDBEQDg4QERoSFBIUEhonGB0YGB0YJyMqIiAiKiM+MSsrMT5IPDk8SFdOTldtaG2Pj8ABBwcHBwgHCAkJCAwMCwwMERAODhARGhIUEhQSGicYHRgYHRgnIyoiICIqIz4xKysxPkg8OTxIV05OV21obY+PwP/CABEIAZoBowMBIgACEQEDEQH/xAAdAAEAAQUBAQEAAAAAAAAAAAAAAQIFBgcIBAMJ/9oACAEBAAAAAOkQAARhOv8AEcYsdv8Agq9t3yPLc22L7gAAAABTrjT2tvLBAEIZptzcntAAAAD5aW0XZEAgEII+u3Og78AAAA1LzrZpIgQBCCEVbo6R9AAAAsnL+vokUiAIgIQi69RbNAAAa65ZtxAhARMEEEII3h0pIAAaW5uoEBAIEEEEIRsbr2sAA0Nz3KEBAIEEICIQZt2T9wANLc1yiAQECEEAiEEM+7IkANcclxCAQQCIIBCEIDbvVQAsvFtuQCEARBAEQgQEdO7rAORNewCEAQhAEEQQEHo7hv4GpOXUCEAQhAIEIQCA2H2KD5cQWaBEAgRAIEEQCAHXWzg0jzggiE5phUCEAgRBAIBBlvbgp4eshCDPek+UsaEBEJgggIBAOxdiGtuSiEIXfq3UWlgIhCYEEAQBDaXXBytqqCCHz7QvmhtHQQNmbQ5l+aYIBAEB9e/fR8+DvKIIjJOvr9bNRc928Tdu0vbqbmOmAEAQCHWO2sC49EEQ3d0a+1OI6S15bLrsHbea+i36z5f+EiAIAgbm6l0VzoIEOws/eT1TT8/sim3fWWJ8g26QIAgDJu5eWNTEEIyfrzIC3fZXHxifu8v0oxzjq2yAEAQn9C+MsLEENjdY+wjz/en6U1U4Z4s98vm9Fn42ssoJQAgR3Px1aSCEbX6skeX1CNWakjdmwvL8I8HGNkkAEBDpHQHxgQiOj9oXz1HxrrI59xBVvjNvh4vpaeOLDJIQCCMsx8IiJp7Wsfl9Gbez0/H0jH+cvlG2NsV/PyeTw8hYtUAEEC4fIQQ6u+mSfLFfvGY3j1/RTqfWO6s7rjxeauvxcv6wCRBAXuq2ShCKbrtzKL98MnYtLMLx7vPb7zNNr9/3ot32+OkNEW0BAG8MExQRBT8PjRl20skyHzZH68V814zb3/T5W66z4/H7voeTSmi7ClAET2xoDWEICPl5qIhk208myn5ZHarBe89+F1m2e/6hEefSnPFugCDv3RnP8AhHm+EIF527mt1v/lsFzzWLt9pALJyFhIEL13rrLkYICjy/IQKtpbTvF79mIez65XdY9PpkIsXCfyAbV668/AlAgg+XmoEBOy9rZD88lqxjzer5/L1XG4+qjw2DnLF6pB09vFxzr8hBB8fhQEAyfa+Q5P8AH43O6/T52/xeb5eurla0V1yI72vTTXLoggR8PlQEALhmuXXH7+33ez7PNYcK1HNddUmddrFHA3jEAin4fOkQAARIE111S6s3IOatGIAhFHxopCAAABVVXVeO8/sLZwl5ggIj5/OikQACRAFVdXTe+Ac78/EBAp+fzoiAAAAFeTd3Vg+PDuPQI3tfaLRuy3YDtT06Z3diur7Robvyx854V3rY+QOssXbV1F6so4SAnsvZwDBuMKRHRG0/hrbbXLeF7UyjU3TPLm0fFobvjkLErj11p2+7Q9fCHf3APdbhn5A3h1UANA85TB01sSnX2ytY6PzvKNT9b6Qo8Whu+9O6J+feOOaD2LmXEfeXCfZth5xwwM17h+gAcqafHVOJsyzbQGB5xlWp+o9AZNk+kesebcD8vXvFe7N8XHkLr7kvq/y88aXF77gv4AHIWsJbEwqM4990wTyXDHdqMGzXG7ncdd4/sXV2dWi6W7OcL+/k92FF17ZywAB8+UdSokRAiiimmAAAvvauUAABzjoCSCBEU0U0oAAZz2XdgAANZ8p2pAIKaaaaUABO+um/oAAAeTmPTMAgiKaKYgAZh1TsEAAADEub9XQCERTTTEAZJ0ZumQAAABjmi9PWeUEIpppgfXZ29NoyAAAAAjB9Y4DhdnIRTT6Muz3ZezPaAAAAAAI01ofCpu23+hbwAAAH/8QAGQEBAQEBAQEAAAAAAAAAAAAAAAECAwQF/9oACAECEAAAAADW7okznIABvpQSkxzAC9dASorPKAL2pKgCpyyC9qioAKnGB20lIWCyys8RvrFQqBYpMczurM0AFgODXaWTHQRQAc8ddDPK9LMTpoAM8u2kY5gXewA4dw5ZDwPe6bAHLtFnPMHxPL97u6bAJSzObmTlw9g30AZuiXMkucgu9g4dtECTJmBewnHfRUAzIQdKY53sqAEQNDll02AAAJxL2JCLc6zUbJzyN9GcXUl1jfO1nqY5g6bylQakGrnkA30AAJnmANdKACYwABvdATGYAALrWmczIA//xAAbAQEBAQEBAQEBAAAAAAAAAAAAAQIDBgUHBP/aAAgBAxAAAAAAkyKtoABMEKFugAYkBRUuqAc0CqlEuqBzgLQCLqhjILUKELsTEFUiiA1o5wtEUEQromBdZM6BEC61iWVq4jVyJAL0wFtIJEIF6c7K1Q9k8ZcQQLvAuwfq3pfxr5LEsRSpZboj+/7XlqkzBZdZsWNUKDOQu8SKhdWygmYOmcpbkGtUgzE1thJUSi1SSHSsJFgCoBegxlaCWUMjpRObWpFk1ncluI1sGc1YFzRcNbAZkIADWwBMECFXWgAM5gC3YAASSGrQB//EADYQAAAGAQIEBQIEBgIDAAAAAAECAwQFBgcAERITMEAQFBUgNiExCBcyUBYiIzNBRjVCGCU3/9oACAEBAAEIAOydPGbJIVXUnlalMNwB9nJEgiEe9zNcnAjyXOQrq5341rBPLiPPO6cqDufwIdQn6EpWUR2FJvdbc22BJplu8tvuwztKk2B9GZpqTjYjqLs1elgKEf8AsSyyDdIyy87mGrxvEmymMu2p+JitHj54+VFZ31gEQEBCGyHb4bhK2g86NVBInNQ9lgZxEFY7vXr6PjGxnUhZc2oJCdCAmrHNziwqyXQHqILrtlSLIVrMs/GcCMpW7vXbMQAY9yYxSlExrbmGNjhUaws1YJidc+Yku4TUUSORROpZllY7lNZuFnYibZg6jO2sFmhq6z8zI3DI03ZjnR72GnJWDeFdxtIyvGz3KZSXaXnI7CtkOzaSktIS71R6/wC/oWW3MZyo6ebOEHKCa6HY5CyeVgKsTBHUOocxz/sNEyJI1VcqB46XYSjBF8w6+SckcArwkJ+yUm8SNTf8aUJKx8zHt5Bh1coZB8gC0FFfs1CvLypyOmb9o+ZoPGvTyReSVxh5Nmc5znMc/Zb9ri2/jXnoRj8BAQ3Do2Wws67DryLmWlHsvIOX7zp799h69edQLXpHoGMUhRMbItuNY5o4IdLfvR8WjpwzdIOm1JtSFpgUHxPfl+2BGRZYRn0N/wBkxtbhrNgTMsAgIbh7ZB+1jmTl24n5p1Oy72Sc/tuILYMzA+muPbm2ycpuzgUOgQh1DlIR5j21s47z6v7JSLIet2Nk/wBFMU5SmL4uFkWyCy61jmVpybfyavt38cYt27i5sAX9S45tRge4RxIyzSbVPp79ziKxjM1VNut45invTauDNPo16UNETka/B21E1gjX5L7TZR+8eTzX/Ih0g+vdYgnvSbcg3P45gmvUbYdqToqAIkNpmmsrGwzMX8fzEkjIXehecBaUiTFMURA3vx/QVbIv5t3fcbNpBiRxDqJqJKHTU7hBdVuukulBSqUrCR8knp25SZNHLpV+8WfPXTtbo1CIGYskc1GJHiFRwbbT2P5pucjb6C1mxO4aSUXIRbkzZ97YKIWmpdnHIsEGkYybsmoODayFjxObTPJRiqaiKh01e4wdL+brDpgfWU5D06lP+ni6HEGDp/ojdMiJEgA4kECn05YNlk/6kxWW8i3Mg5nMTiQxzxjym2ZmYQU9FmN9tM6ZaHolBGHwxMOBKeSgcfw1dMC7BBNsYu5TFRKUREDMVtxTv9CZTbJZ8wcNXTU4Jue3wfKeVta7IdZ3f7JwbAOjsY38pKjElYJNGhdGTAwbDzDth3MU5DlAS7aFMpg+vlW+iMW4fXQETL9tw0JgANOF0kzlOQwpO0ToqoMGjcocsHDQwmEtwqsbaYxRuaViX8O9VZvu2pcgMbbIN34Zmec+48gPePhTGASFqh0DV4m7I7gQ8BKAhsIoAif+mKqpP1A6S+w80B0KwB9zOkgHbQKrH/tg1Op/dTQRSD+RREiofVT6kFFygxbIkApFCsklAKa21WOs8Ws1Uk4iTiXBm7/tSmMUxTFi3fnYxg71kN0Lm7T6g79HGSW8xJOAYtwbNEEQ8TpgcogKRh3EhhIQ33UYtNx0EazDRU0ybAXYPCy25rEFFJKrXMsiYGr0SlOAgYCnbfYYxkuuLjRkmjYOPVhgIyxRq7B1PV+TgJBZm+7XHDnzVHr6mrAsLiemF+lisgirMHANgD2r7EOmoHsE4hq1XblCoyjjnOocxzlMchinJTrYWQTKzeAACG+jonIInRWRbP0hSVBgwQIUurDBxtgi3LB1O1yWgHZmz/tKDZzMalGNgcn5jlc/u39lMQNA1xkDiJnG79DjjgkkB2TPxb/bfwWJxpKF0ioY6KRh8TEAdXGENFyihia30mookcqhKfaCyrbkLaWQKoIGBwim7J5dwSNaFRKmaywMdYYpxHObDWpWuvjNH3ZxkosgxRSL0TfpHTFFJOPZo6k6vHP1wcaBe6RReEra5wwKFRfN3rpVEiiATKX6VgMU5QErQ39AC+2xQ6cvHKoCuiqgsoipoOIwgUtOpzhFZKRehrbSiRDhwiZwLYxSuPSWJDrqal4mDlmJoh5ZqjMV544TcgPZrF4FVCdEDcIgOmzZ4u1TlauS2Nk1vLypXCZyAcizZuukKaqtMYEWFeNK6vEaABolzi0DB6tGShHCYqRgSvCAEcJuElS7p+Ahq/wH2k0GrN09XIg2rNMaxhSuHIBrbXEIDsCz3hDhTI1WVOKg+R5RgFBMWy4jqSZouETtl7tjl5BCo+j9+xaRwLtyKamkhRmJNIegOoexzUGtzY6MzMg4RFrYoxtRpdQFK2ohd4z66St8YCvJepOEzkAyZyEEuntNgnShVSJNLhFFAWA3BRoPFYYuaayaPMiSSRCDwuAMBg3B02TdIKoKRMFHRSIJtdtAGjqlTDc6iizk4kBFqQgAYRDRzFL9TKEF2cokBB2QwiU/AYpiKWrFCMisq5gZSHlIdwLeR69PrpntcYOAvTfy1xsCYdA31DRtGHW+wgOoa+2yF2BpHZrbOkQbWKPRxvMqccEeKu8duZAbYVqPBLs5Nq7IKrTYg7KFkqbCv1SuAIveIIQKhD3CCfuPKaB4dEA80QwHKBih9tKrFSKImAqrlXiFJEhSABd9vppd4QgmKQCKrG4zlM4AoAAHX+w8w3/bnI7Bu+jo6UbnbvbJhJotxrwU5WZ2AVFOT0A9TGrMiFEgSDmBn5a8vDh0Th/nRvbE3Kzwwl8jEZxfkDlTDaUxRY1QUT9BtbMAXizWkWZ+CbRctl0AOjKQcdLIAi8QZ2ytAU0ND3KHfOhaqeorokAjpMDOzceiEApQKXi230suosfgRaR6ZCEMcCh7RRSH7mRApg4XDNB0iog6tWF2LrjcwMrEScO7M1kenBNhYwMQy1nlgJXsG/DpKF20PvibFOQynHGwebpBMAQnY1vSbAcXdYF/ZoYeCZZSzB8kKzOThIyWbgk6QYWqvlD0Vnc4kXAISqLp4ZIqrYXoLn4FkSJFKAE6U9XYieZnZyV2pD+pPQKfo1yPGTn4hj4ZkivNUwy4dIwbhoxduiQ5yGA5KxlmxQ3Ag8YvaPcVwcxxlLVCmH1GMnIyQKYWbhs1eI8lUaU3aqitClmL3GlArpC71vmAm8ZSnnCcUcWRkUyAVQJpoH8qib5oqH9PjDW+t/DfW+h+urLDNZyGeRzlygdu4WQU6GGovz92brDqbiiScLJRwqJnTUOmfpHLvoS9IpjFMBgreVbNCcCS7WyY6uJyi4UiLhF7KMCXBsgYEZdu+bOUgURURbrJ8Kr2jV10pzBJWphoP/rAfZEZ/c9pniDs/wD49hEdgdJ5DphtJXStH/QnZYo/9sJ5I32NPJh917ZHpfVVzcIl4cUG12S5VnkAHfQe/A0VyYuXlj+GUIX0i5SRS9M5dCHUhblZYMxRYRebRUS5E60cYrnFgWYlr1obgU8Yd9cGQbOTXVmgPBINrTAOBDlFdoKF/pgqGwbKFbKfrUiYdTfiUrtYPvxGqlSEdfwzUCbiCcRW0f7SszEtgIkNikvVJySegA6Adb+37iAapkOEDVYhgfwzlBC6iGMun0x0YuhDrMpiWYGAWTDK13ZbALTOUsAbPQydRJD6SScnht4O4Js8ZqjugnDVs23lyV4B/tBW3m30Gtuv+ykNHJAPmnjnGLQoi9l8iRTdquzrH3HfQaAdAOgH2Y3gRnLhGNzeM1FoS8S+jl37Jdg9dM3HTMGjBoe02DoBoB9uDa6LOFdzK3szdWxaSzebR6hg0IaHvA0A+MBDOJyZYRiDJq3YMWrFr7LZAIWKAfxijxo4ZOl2rjqGDQhoe9DW+sHVYEGq9jde7NlR5LhOxteoOhDQhoe8AdVKuO7NOtItuzatmDRu0a+6Rj2ciwdMXlprjytTbqNc+7Aqe8/Lq6z1EgLaFlSYEidiTUsbPae01DK6xx8Gr+hyrQEDnTO/yDUVshwcuSAvVTnngsYqetdcrHlPWJK0QNjydSFYeanYevMgfS35wY61gpQithtKhM//ACWJ8KMYpKVWzG/ODHWsvWSFsdlZvImqfKK/qXmIuBjlX8iwlafeI12g2yFURqdiWZEx0zCLocEkbOMaC9KBwFYynQmFbg2bnzbUjEXw2nJ1DfVecZNMIsvJ0gHGsjtCSlCnCp+8N99gxVTP4agwduuhkykktEMJ2xyHTOZM/twAjuvY1tZPjQkqRMkDGEf6ZR4go5/R2PW1tY3+DV/T7HF3UeujklIqQiXijN/gz5m41+IT/V9Yz+eV7WXoSVm6om0jHOOrs1bLuV/w+f8AKT+s/wDyWJ8KYBhosAAfljfdSUa+i3qzJ9VPlFf1mX/59LawCK4WWW1nhsR1J1FojkVyWEx7JghaUST2PJMSaW+DK+EQT+HMatzapKqUxjyGBZdE6C6qJ/dh6ihLPgnX/SzDQB3VskZ7cBJbR88rqFk0pKxXiGXm5FKKm6NDIZ7QAIqDU1jf4NX9OM9JoOFkdXOxls0+5lgwZ8yX1+IP/V9Y0+d1/V5txajDEkhmM7JSUTJMA/D5/wApP6z/APJYnwpB+Cj10+v/ACGR1bZ4LFYpCXCqfKK/qwQDCwxa0Y/iICp0WOeqoNZsb1l6IcJ57f8AJq7BnrGb1KTx/CipIszsZB6zOt8GV1DMDSUvHMS5afFYUCVKTBb/AMzTjttZDYenXawN/dRaY8t0yRomwZM4xi3YsukIAYBKbKOOz150eUjfZgsnBV5FXTS2MoDLticSEjbWM/litOI/OyIHqbBXWN/g1f08wtcVXTlYLXTZeqLNUZLBnzJfX4gv9X1jT53X9ZMrElaK6RhHfkZdtYFQO3nLKgfKeOp+1zLB3G2TF1mrcWpJP6XuejV4hfyLu+rXUJaqPUGklVPlFf1mBVVKgyh0lnbpcABbAkeC9nfvRtd/rFafIM5aqW6BtCDlaJykw8jfJ0mlvgyusRR/nr7E72u51+sEaDLVS91ezu3LaKzqw8vcUXQeyvV6TsUohHR1WrEdV4hKOZdR03bumyzdxkXHbmquxctfGrZNnqtGDHMZaTcS0m9kXEVIrxckykELTk+etEX6c+hcwWaFiWcY2/Pe3at92lbcu0WkKpapGqyZ5Bhcb5L3DyHqMJLuYSVaSTb8+Lf/AIHPVw1WL/M1h/JPmQ58uOrNlWw2WIUi3sTmq0xMYxjkPz9uOrdcZO2vWzt/HvVY9+zepWXLdkssO4inuqbkCYp5HxI602eQtEqMk+pt9macL4Y62Wp/apUJJ8bNVqNFDGjULfI1KRWfsLheZe3qMjyFStsnU5M8hH3K9ytxOxPI+MLCyU5JIR8fSKVH06K8uj1nTRq8arNnWRcZOa0od9HdUQ0IaHQ9lXa3K2OSSYR1LpERTo7lN+wOQihDEPkHECjUVpSufUPv0x0OhDQh2NLoMzbXWzeuVmGqsaVlG9ne8VRlh5j1hMwcrBvjspHpjofAesAGMYpS0TDLx+CUjY2rNmxaotGfazdfiZ9kZrKXDDkzD8bqIMUxDCU/SHQ6HQh1KrRrDaVwKwpmMYCqgm4N3NqxzWrMCii9mxLaIMVVkB+g7D0h0OtujX6jYrEqBIyqYNimApOZ1FFFukRJHvLFQKtYuI76fwVMNhOpCy0BNwqnLkuiOttbe1Buu4VIkhA4euMtwKL1zClViuBV+iii3SIkj+wKpJLJGSWmsVUeT4zjL4EOTc0XIYivbLcQfV+ej9/O6397dk8dm4WzDG15f7cmNwLYltjSMRgyoshId9FwcNEJcEd+0OoaIeCIurfXa+3OtyJVq1TU2J4RySZ+HjrUPErGJzYqs1tFsmdIhCEKBSdt/8QAUBAAAgEDAAUFCQwGCAYDAQAAAQIDAAQRBRIhMUETUWFxgRAUICIwQEJScgYjMkNQVWKCkZOhsTNUsrPBwhUkU5Kiw9HTB2Nkc6TSRIOElP/aAAgBAQAJPwDzK5igj9eVwi/a1X7XT+rboXrQbH6c8v8ABaNpbD6EWf2ya09dD2CIv2K0veye3O7fmankY9LE92Rl6iRWkLlCPVlZa0/f9RnZ/wBqtIpOOaWFK0NbTdMLmL89eobuyPFmTXT7UrStrOfUVwH/ALpwfkOZIo1GWd2CqOsmtfSMw4ReJH2uaeKwi5ohl+12q5lnkO95XLt9reX2EHhWlpZIhuim99T/ABVowxc89scr2oa0jDPxKhsOvWpwR59dRW8K+lIwUVaCU/rM4IXsSr+WfmQnCL1KNg81leKVDlXQ6rA84IpBpGAcSdSYVdDl8Za3k8WQedEAAZJNKl7cDfN8Qh/nq9ed+AOxU6FUYA85dkdSCrKcEEcQaU31t/bD9OtXaTxccb1PMwO0Hze5CZB5ONdskhHBBRNrYcLZDv6ZDx89u3glHq7mHMwOwitSz0geyKY/Q81CXOkvU3pD0yVcvPO+9m/Icw+QHee03R3O+SLr51qVJYpFDJIhDKwPEEeZTK9zunuhtEXRHTlmYksxOSSeOfkLM+jZHzLBxT6cdXCTQSjKMPyPMR5hP9C6u0/GOP5FJls5SO+Lbg3SvM1TCWCVcg8QeII4EeWl/rLLi6nHxQPoL8j5ksJ2HfEP861MssEyB43XcQfKODpG5XxP+UnGSmLMxJJJyST8kSn+jLl/uJDx8n6OyGPjLIdy1JrzzvrMfyA6B8lS+/wJmzc+mg9DrXyJAUDJJ2AAU57wtSUtxwbnk+S5THNC4eNxvVlOQaws6+93MfqSDyD4ub1czH1IPk18WN1iK5H5SfV8N9SCCMvI3QKJ155CQuchE4IOofJz5u9HBU6Xh9A+FJ40vv8Ac+x6A8ipZ2ICqNpJPCrEckBllDZdR0j5FJ5HPJ3AHGJ99MCpGQRtBB8BwscSM7sdwVRkmt88pZR6qDYq9g8iARHG7oD64pfFaM47K2IJSyDofb8ivrXGjyIH6U3xnwHxLpGTkvqLtfyRwIZ11/ZbY1fAZGJPRiiJFfdb+nqLs1h8iviDSC97t7e9PAfMVhEIfrnxn8n+lNsnLHiFA21hZYRhOYjiDUOrONtxbfxWgVIOCCMEeQDR6OibtmPMKgSG5to8CIbpEFIyOhIZSMEEecuVkicOjczKcg1sW5t0kI5iRtHcOEgieRzzKgyaOZZ5nkc9LnJ8kMxrIJZehI9ppcCY4iP0F2DuHUmH2N0GlFrpIb13LLVs8MqncRsPUfCzmaQBj6qcTUBSKFAi+iNlLH94KjRL9Bl0G6WkKSISGU7CD5y2WsLk9kc3j9zY90yWyfXOT+A8mMS3sve0J5o1+GaGFUADso7ODdzafRIq3juouAYYYdRq5Kf8mf8Ag1aMkYetHhxWjLrP/aatET4PFhqirtLZPUTx2pXNxjVeRzkstJt453ilUAbSadetTiowmkYlLbPjccDVvJC59F1Kn8fON17asPrxeP3OLSzv+yPJDLMQFHOTXwLC2VOuR9rdzaKGtEOPq0Qe4uaiFIBQHdfEmcY361KVLDxkOw1EBTjZsJFFUuUGYJuKNUDRSoexhzrzjzc4CXkYb2XOo3cOy1tIY/tzJ5IZQT8q/VENet9xK0nYTs8BigJ2H/Wo8jnWnweY7PzpqYCnBPMNtRHB4tsqXI4quwGkA5zW/gRvFE6rbA4OKT7dtFEdto4ZpVEwXME3FGq1eFwxUEjxW1eKniPNjgg5Br4+3il/vqGrhdGP7oCPyW+HR0mOuQgVuSMD7PA41vX8RQBqJc1EKQDu4luTuTgvS1FUueHANQBFZeLm4rRdtb6Zxs6Kwg580AcrlHHwkbg4qFl1XIST0JRzqfNuFqI/uiUo55S+uH/vOT5IZLPZxfbJk+Fz4PUfCYF9zy83VTFmY5JJyTRIZTkEU4Fyg2H1x3DjnXg1ITgjIOwgihqjO8t+VIpDodR9haNuDrVuU2nUk3pIOcHzWTGpy3E8ZWNelIx+0+S0R31BcoLqSe32zoz7QXT6PArV/Fexj4S51ZE66zCeZxj8dxog93iK4qPBTEE5LJ0Hm7rFXU5BFEC6iG0esOfuHVcbm4j/AFFAq29WHRxFJrhSCC20jjRG0eI+9o3G5hUJG33uUfAkHOp80Gxdb8ST5Lj/ABoA6lvEFOOCADhRMdz6NzC3ITAe2uw9tSw6WtuEd0OQn7H+C1Jd6EuD6NwuIm6m2qakgvITueN8Z+zIpHhb6akDsIyKYEEcDXB2/PwRiQbY25mFKVdGKsDzjuAkk4AFFo2XbHGP5u79tN4pICv08zY/OmcLLkldbZt34pFdHTC8WXpU8DVrIbZZMR3IU8m/mgxqsR9nkRnBBx7JzV7DPazASNZTHxFZtrCNxtjPRVtNo6cnAS6ACP7MoyrCnBR84Y4w3HeMhuwgUilHGSrAFe0Ns+yp7jR8x9K0kMS9qHK4qa00pDwE6G2lPURla0TfaGkPx2qWh/vpWkba/TfsYawzzkVA8PTguv2rUisOg58BOiYAfjURkduAoCW6/Beruitp9bhkcOk02oSu1979QzuFMfgkFWOQ2f41EA6bCp3rmolmt5VIkjcZyKDXGjj2vD0N5kgOc8eY1vju5lPY5Hkr2SE5yVByjdamtCpPE3w5IdoPWj17o30bcPt5COQoO2GWrW10rF68D97TdqHKE0suj7g/E3iG3J+scqalUq+5uDfWBOftrAD9ITP5rioBDPwlgzavnnBj/Nq0333Dwj0ihdT1TRZNe5m6slG++tSLmEdLFNq1pm3vkHoFvGA6eK9oqJoDuy21D9YbKOQaGUkUqe2oQvO3E90hQOJpSF4g/wA2Pyra/P3V1Ap/Sg+MOgURMOY5VvwyKs5tUjBATXBz7Oaia2m3tDKhSN6spbeThrjAbqO4+YKPH5X8JGFDGb6V+yQ6/ldKymMfFTe+p/irQcc0Z3vFh17Y5K00+irp/QgmNvk9Mcnimriy0pD0/wBTnPauUNaPu9HOeNxGWiY9EqaykVOs6H4yJg+et480y7fjFITjjJIJAX7SateTuc5Se2xbTZ6HTYx5yauE03bbhDc+83PUkm56M2iNI7mtLldTLduxqj1RwkXanbzUQQd2Nv5dw9XOaOFHNtA6uc0MAcB3MNIBzgBeYsTuFJJKMbgMDbzlvyFWqjb6/AdlW656GzULj7DTFfaBH51axXELb0cBhV0YH/sJcslWDwjOBKNsbdTeWXaYXk7JHL0MC4hhl/wanmGl7hFG6Nm14/7r1oqK5Ti8BKGpRom9b01zZS5P0k8StNQaTiO0Ld+9ynpSeHfWj7jRj7uUnUSQMeAE6ZXFTIYJMLygbXQj2lPDgFq2jmQg6okAJXnCNkFMddXz3tmN1leNluqGWml0PpIHD2tz4oJqHVA+MTLJ28RTBkOfHVgRjmXH4mgAB3FJUjOc4yDxBGcCm1iNx/iPCQU7fnUMU8b7CrqGBHUal71n4wPtiarR4Jhwbc3Sp4+UGO97KCM9aIAaGx4ZIT9Q58z0lcW3EqjnUbrU7DWjo7uI7GlhGo/au5q0w2ib8jJihIjz0SQNscVo7viDjf2IMi9c0G8dJFXcU0R2M6NnGeDFfGUjmO2rVZk3KHG1OhHyCvYcVfm8tF3WV8fwilq0udA3jcXGInPQ/wAFqkt72E7mR9UntGVNa9qpGNWVMBj7W4joBrjtJ4t0nydqsqEbG9JDzqeBomaylJ5C4/lfmbyQyLi7hjb2WYZ7gy9ncxy9h8TzVirDcw2EUTpC0HoSH3xep6u30XpfnQ8lL2jc4qxGkION5Zga+Ppw1dJMQPHUHxh7Q+EtRxvGWwVcB0PY2VrSF3o2Y7feHJjY9MUlWVrpeHdrREwy9qtUV5oac8JojEP4rWmLO8ToYH8UNWDEc8TB6Lxe2hX8TVxG3Uw8goKSodUn0HHwWFfDidkbrU48iuUsoJZz+7Hcxi5tpI8ngzDANAhlJDA8CPNiQRxFS9/Wo+LmPj9j1nRukTukzyEvY4q9h0vbAbEmbkZwOiQbG7atLnRjn9Zj1UPVIuVIqZZEIzrKQy4J51yMUisnEHDKOoHKnmqyjjkB3wZifPXHszXuk0rCfUlZbxPxqbRl8n00eByK9wzSfSt5UlrQGmLLriI/ZNaavIT9NJP4rXuvh+vqLXupsG+un8DWn7Bu0f61prR/awH81e6XR6HodSaubzSsv9laxnVPW2AuKgSFmKO8SNrhGdASM+RG2eZIE6ou6mIrki5j6pfOdJyqg+Kc68f2NWhknjO94f4o9X/9E3bcYpDaPn9mvdDa3qcBdR4PbJFtNe5x51UDL2k6yk9jAGrS9tDuInt2UDtXOBWkoM+0EapEYHmx+HMKY7sDVJUY6OjpqKN+sKasrVjztAhrQ9kT/wBpa0NafZWhrKtFWYwd6wAn8QRUsabQEiZwc5O5Y499ZCzTuVB4LwHkRqyRwBpR/wAyTx37o8azkMUvsS+eaQuLf/tyMtaRFwo4Txhq0Rayj6DFK9ywBO9hEhozWj9BlSvdjdw//rr/AIh3PbcI1f8AEKU/dmvd43bFFXu7bsiir3f3AXokhjrT95pL6BuHlB7I60JDZCVDG90yjlcHyKZhhfvif2IvAHvdzC0Z6Cdx7DS6s0ErxuOZkOD8ggUBQ8qmJL59SHoii8GPEV6oSbomT5P2PczKmt6g4t2Ck1ILeJIox9FBgeDgGVMxP6ki7VaozHNC7JIh3qynBHycu2bMNp7A+G/hx+JNiK86H9B/k3IEhzLJwjjXe1RiOCCNUjQcFUY8OISQ3ERR16DW3kzmKThJGdzjw+FiB9r0vwHe2ft8dKHFLaP9t642bj7Hr9VrTeHUkMO9p/8A0rSmbK3sJ4pZeRl2O9aS74uBGZCvIyp4o6XUVfd7m51+S96kkzqYz8AGrzviODXRzqPH+2BV13vbmQRh9R38ZuhATWnf/Gn/APSjlHRCO1zXzd/mN3DgDRlv+wK07/40/wD6Vd98QJo9ImfUdMOJHO5wK+crX96Kn5C1iKh5NVnwXIUbEBNSw6RtVIWeN42XBPQ4BFFmtZVE1q54xmgE/qnLyE8OWzLQ22l5C/Y+Y60zqT2+j7aKVO95zh0jAO5Kk94EPLF8H4GNbON9aZ5S5uLGaONeQnGWdelK33l5NL2LiKsOO9O+EPRCRL5GPGkb9Q8vPFHwj8ig/pK0Ba2PrjjEaUq6kqynYQRsIPhcEtk+0vQy8EYnXoMJ1zQxJcIbhv8A7jkVzXS/sV+q1oG4KtM5B8WrZoLhAC0bbwGGRXzdN+2lf9b/AJVfrP8AKatHuZxexOUTmAatBXCRQxtJI51cKqDJNfq0NfN3+Y3c46Kg/d17nrn/AA1A0NxEQHjbeuRkV85Wv70V69t+9WsiD+jjr+3rriv08vLp2OyBaOpydvFbw9pCUoPfOizcIOkIJV7nzKf3Pc8RrPQxmPt8mZDRyJdHd7P1IDCaGHjdkYdKnB8OLNjaPiFDummH8E8nF030I/feFxnhWjlIpoCF+hNbqjfitHUWS4k+7hgaMD/HXC5kX7Vr9Vr3OE6jlc99c31KtTbiVIxyRfXxqKFr5ul/bSv+t/yq/Wf5TVkbrNwkXJiTk/hAnOcGvc6yG6tZYQ/fWccohX1K/Voa+bv8xu56Oi4D9iV7mX//AKx/t1bGAXLIeSLa+rqoEr5ytf3ooObeUoXCHVPiEMKZbS2LB555nyTSHvOCcG2U8IrbMtb7m+B7IlrDBbY2zjoiJjr4VvPJEeuNitfMp/c0CTc3MUX99gtbDMIoEA+m9b7S9lTsfD0uAbx5QOib3weFmO2jw91PwRP9TUQit7eMJGo4AeTAIIwQahJ0XM+1R8Q5/k8H09IsPsjSp+Ss5zJBK+C+CoBU4SrnlbSBooY3wUBL5LHD1vTSSfjG9fqtPYhXldhmY0YC1wjMnJOW2LXzdL+2lf8AW/5VfrP8poxcsLqOX3xsLhQaew++NY14okQ9j0bURw2nJESyFDkOTTWhgR0UiOQs2XredFQfu6ew++NGEySxcqvJMWGMkV85Wv70U5Rg9vtBwf0q1cSyAHIDsW/Ot1rZEDrlNGTlpIRKgSLXAQkrWvqQOFcOmpgtW6WYT/fKHr5lP7mhlLflJ2+olF8XJcRBI9fOpRk5WGMSMrxamyt13ZRv2oSngw68r7z6MacXc8AKTpml4zScXPlYlkilQo6MMhlYYINBpdFTP71JxhPqP4FrZPEZmlJmRy2W6nFKgmuZmlcICFBY8Mk0FMtrMkqB86pKHIBwRVpYpFyqyZhRw2V63NWejmhto9RC8chf8Hqw0V91L/uVBbRtboyIIFZQQ3PrM1RQSStC0REwZlwxB9ErUFrF3pyupyCuueVxnOuzerSRvNbPrIsgJQnGNoBFWGivupf9ytH6K+6l/wByre0kkvv0omRyBtLbNVhWj9E/dS/7lWlhHC7o5aFHD5Trc1ZaNMVrCkSF45SxCdUlaP0T91L/ALlQ20bwQ8kogVlGMlvSLUFMltPHMgbJUtGwYZxVpYJBMUJMSOH8Rg/Fz3LWzl77KGQzo7H3v2GWo4UlMaRhIQVQBOhiahtpRdamuJ1dgOTzjGoy1BbxTcisRECsqkJ7RarLRvIm25DPJy51dTU9ere2lmkgMPv6swCkgnGqVqG2j71VxGIFZR4+8nXZqSF5XhaFlmBKFWIPArVrZxPahwhgR1yH59dm8C3M08pwBwA4sx4AURLeTAG6uPXPl4UmhlUq8bjKsDwNB59Ft2vb9D/IcBeRvhN6Ea8Wc0OVupQO+LkjxpD/AAXzFQysCGUjIIPA1Czwb5bIbXTpi+QV5GzRsT3bjxE6BztUGrxkkO15W9Zz5pi00lxbdFN7Yq0eCZefcw51PEeegkscADjQe1tN6Wm6WX2/UFQJDBEoVI0GFAHm1mk0Zzq52MhPFTwNFr+z9QD39KBBBIIIwQR51akQBsSXMnixJSC80jxuJBsj9hfOrUW94d11CMP9bg1Q9/2q+nBtcDpTzfR0sq5w02MRL1uanF9P/YJshFRpHGgwqIAqgDgAPPdHqtwf/kQ+9y1ex3icIpcRSVo6e2PAyIQrdR3HzGF5ZHOFRFLMeoCrUWFufTuThuxK19JTj+12RdiVEkcaDCogCqoHAAfIMayIwwyMAwPWDWje9ZT6dq3JVpxDzR3Mf8yVoxbheeCVXrRN5bgcZIHQeRtZZm5o0Ln8K0BdIDxmAh/eYrSVpaJzJmZ6lur9+Z35KP7ErRtvapzRoFJ6WO8/JOjbWcnjJCj/AJitDWMWG9C3Rat418bgoHdRW98A2jNaNtZNi/ChU1oLR6Mc7VtowaUKo3ADA83/AP/EACcRAAEDAgYCAwEBAQAAAAAAAAEAAhESIAMQITBBUTFABCJhMkJS/9oACAECAQE/ANgMcUGKlvSgdWUjpUBFh9AMJQAG2QCizrcAJTWgb7gCiCNkCSgAPRITmxeBKAgemURBuYIHqkTawSZ9d45sAgWEoEz6ZEZNEm0qUCDZMIOB3XjLD8E2uyBhB4K07RcETKCadx3jJv8AItcdlrp3R4tdd8n5gZ9cMy5fE+VXLHnUc5tdtkam+LfmYJZiVAfVybMiPIXxnYrsIHEEHNrvQLYQ0WihQVCxsIYuGWlYHw24cOdqbQ5CDsVJvi6AqFBGZHSiLpKD0CLimH67MBFmcAqDcDBtPjJh3C1Qc4ChQoUIeLHnTIGDvQqQqVT+qCoUWuMnNh49dxgWAwUCDmTAVWkqrQFVHpVHpF34qjB0QMhVHpcKv8RdAVWkwg49KrWLXGTa10Zu8FcQj/AQnkL/AGnf0EZpMpvgITrC4QOhC/5CbyEzlcT+2ON7XcHJwkKlUmIQqUGqUQZBChxBQqCAcFwmiAi2Sg2CgCAVRoh4yc6Nlru/RLtsOIQM7pMIu3g/tAg87JICL+kST6NRVZQd+Z1firPSLjt//8QAKxEAAQIDBwQCAgMAAAAAAAAAAQARAiAwAwQQEiExQAUGQWFCURQiIzKh/9oACAEDAQE/AKGYJ05lcp044BKc1AapL1xogaRL8IGgS/EBmPFEpPHBkOsgRHCGJ2lGBlIqw4RbyjEhapigMDUG+B3lFEjhCbofbEd5EF4vf62XiDyV3D25+KDerqHsvlAPjiRx+2eqi+3IWUZ/msWB9jwVGIDBFnbI2rrrdncrPqFsLnHms/8AAfWJHABlddMv9pcL5ZW8Gw/sPsLrPc1vfwbGwezsfP3FKRSMzlCJOKZFCKi5QKFEyjfCKoIlpQMkO/AcrMVmWYLMFmCzSjbGIccCgE2rJtWTBZfab2m9opveGX2gE3tN7TaSgSkYjde18iiy+KGxQZwjui2mDauvsqLwovC8yQicjAJ04dFk+iBDLRFk4wJdOwRLhEjRZtUd8AKJHBApkIhqrIQ1jCmNFkIeEwWVZUyZMsqYU//Z',
  //             fit: [120, 80],
  //             margin: [0, 0, 0, 20],
  //           },
  //           {
  //             width: '50%',
  //             alignment: 'right',
  //             text: `\n \n FACTURA\n ${venta.id?.toUpperCase() || '12345'}`,
  //             bold: true,
  //             fontSize: 12,
  //             margin: [0, 0, 0, 20],
  //           },
  //         ],
  //       },
  //       {
  //         columns: [
  //           {
  //             width: '*',
  //             text: `\n \n ${fecha}`,
  //             fontSize: 12,
  //           },
  //           {
  //             width: '*',
  //             alignment: 'right', // Alineación a la derecha
  //             text: `\n \n ${vendedorNombre.toUpperCase()}`,
  //             fontSize: 12,
  //           },
  //         ],
  //         margin: [0, 0, 0, 10],
  //       },
  //       {
  //         table: {
  //           headerRows: 1,
  //           widths: ['*', '*', 'auto', 'auto', 'auto'],
  //           body: [
  //             [
  //               {
  //                 text: 'PRODUCTOS',
  //                 bold: true,
  //                 fillColor: '#001f3f',
  //                 color: 'white',
  //               },
  //               {
  //                 text: 'SKU',
  //                 bold: true,
  //                 fillColor: '#001f3f',
  //                 color: 'white',
  //               },
  //               {
  //                 text: 'CANT',
  //                 bold: true,
  //                 fillColor: '#001f3f',
  //                 color: 'white',
  //               },
  //               {
  //                 text: 'UNIT',
  //                 bold: true,
  //                 fillColor: '#001f3f',
  //                 color: 'white',
  //               },
  //               {
  //                 text: 'TOTAL',
  //                 bold: true,
  //                 fillColor: '#001f3f',
  //                 color: 'white',
  //               },
  //             ],
  //             [{ text: '', colSpan: 5, margin: [0, 5, 0, 5] }, {}, {}, {}, {}],
  //             // Filas de productos con márgenes entre ellos
  //             ...productos.map(
  //               (fila: Array<{ text: string; fontSize?: number }>) =>
  //                 fila.map((col) => ({ ...col, margin: [0, 5, 0, 5] }))
  //             ),
  //           ],
  //         },
  //         margin: [0, 20, 0, 20],
  //         layout: {
  //           hLineWidth: (i: number) => (i === 0 ? 1 : 0), // Solo muestra la línea superior
  //           vLineWidth: () => 0, // Sin líneas verticales
  //           hLineColor: () => '#001f3f', // Línea superior azul marino
  //         },
  //       },
  //       {
  //         columns: [
  //           { width: '*', text: '' },
  //           { width: '*', text: '' },
  //           {
  //             table: {
  //               widths: ['auto', 'auto'],
  //               body: [
  //                 [
  //                   { text: '\n \n TOTAL FINAL' },
  //                   { text: `\n \n $${totalConDescuento}`, bold: true },
  //                 ],
  //               ],
  //             },
  //             layout: 'noBorders',
  //           },
  //         ],
  //       },
  //     ],
  //     footer: (currentPage: number, pageCount: number) => ({
  //       columns: [
  //         {
  //           text: '1234-5678\nhola@sitioincreible.com\nCoronel Mercau 467, Merlo SL\nwww.sitioincreible.com',
  //           alignment: 'center',
  //           fontSize: 10,
  //           margin: [0, 0, 0, 10],
  //         },
  //       ],
  //     }),
  //     pageMargins: [40, 60, 40, 60],
  //   };

  //   pdfMake
  //     .createPdf(documentDefinition)
  //     .download(`venta-${venta.id?.toUpperCase()}.pdf`);
  // }

  // Método para generar un PDF con desc incluido
  generatePDF(venta: any): void {
    const vendedorNombre =
      venta.vendedor?.nombre.toUpperCase() || 'Desconocido';

    const productos = venta.productos?.map((producto: Product) => [
      {
        text: `${producto.nombre?.toUpperCase() || 'Sin nombre'} - ${
          producto.modelo?.toUpperCase() || 'N/A'
        }`,
        fontSize: 10,
      },
      { text: `${producto.sku?.toUpperCase() || 0}`, fontSize: 10 },
      {
        text: `${producto.cantidad || 0}`,
        fontSize: 10,
        alignment: 'center',
        bold: true,
      },
      {
        text: `$${(producto.precio || 0).toLocaleString('en-US', {
          minimumFractionDigits: 2,
        })}`,
        fontSize: 10,
      },
      {
        text: `$${(
          (producto.precio || 0) * (producto.cantidad || 0)
        ).toLocaleString('en-US', {
          minimumFractionDigits: 2,
        })}`,
        fontSize: 10,
      },
    ]);

    const totalConDescuento =
      venta.totalConDescuento?.toLocaleString('en-US', {
        minimumFractionDigits: 2,
      }) || '0.00';
    const fecha = venta.fecha.toDate()
      ? `${venta.fecha.toDate().toLocaleDateString()} | ${venta.fecha
          .toDate()
          .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : 'Fecha no disponible';

    const documentDefinition = {
      content: [
        {
          columns: [
            {
              width: '50%',
              image:
                'data:image/jpeg;base64,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',
              fit: [120, 80],
              margin: [0, 0, 0, 20],
            },
            {
              width: '50%',
              alignment: 'right',
              text: `\n \n FACTURA\n ${venta.id?.toUpperCase() || '12345'}`,
              bold: true,
              fontSize: 12,
              margin: [0, 0, 0, 20],
            },
          ],
        },
        {
          columns: [
            {
              width: '*',
              text: `\n \n ${fecha}`,
              fontSize: 12,
            },
            {
              width: '*',
              alignment: 'right', // Alineación a la derecha
              text: `\n \n ${vendedorNombre.toUpperCase()}`,
              fontSize: 12,
            },
          ],
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', 'auto', 'auto', 'auto'],
            body: [
              [
                {
                  text: 'PRODUCTOS',
                  bold: true,
                  fillColor: '#001f3f',
                  color: 'white',
                },
                {
                  text: 'SKU',
                  bold: true,
                  fillColor: '#001f3f',
                  color: 'white',
                },
                {
                  text: 'CANT',
                  bold: true,
                  fillColor: '#001f3f',
                  color: 'white',
                },
                {
                  text: 'UNIT',
                  bold: true,
                  fillColor: '#001f3f',
                  color: 'white',
                },
                {
                  text: 'TOTAL',
                  bold: true,
                  fillColor: '#001f3f',
                  color: 'white',
                },
              ],
              [{ text: '', colSpan: 5, margin: [0, 5, 0, 5] }, {}, {}, {}, {}],
              // Filas de productos con márgenes entre ellos
              ...productos.map(
                (fila: Array<{ text: string; fontSize?: number }>) =>
                  fila.map((col) => ({ ...col, margin: [0, 5, 0, 5] }))
              ),
            ],
          },
          margin: [0, 20, 0, 20],
          layout: {
            hLineWidth: (i: number) => (i === 0 ? 1 : 0), // Solo muestra la línea superior
            vLineWidth: () => 0, // Sin líneas verticales
            hLineColor: () => '#001f3f', // Línea superior azul marino
          },
        },
        {
          columns: [
            { width: '*', text: '' },
            { width: '*', text: '' },
            {
              table: {
                widths: ['auto', 'auto'],
                body: [
                  [
                    { text: 'DESCUENTO' },
                    {
                      text: `$${
                        venta.descuento?.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        }) || '0.00'
                      }`,
                      bold: true,
                    },
                  ],
                  [
                    { text: 'TOTAL FINAL' },
                    { text: `$${totalConDescuento}`, bold: true },
                  ],
                ],
              },
              layout: 'noBorders',
            },
          ],
        },
      ],
      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          {
            text: '1234-5678\nhola@sitioincreible.com\nCoronel Mercau 467, Merlo SL\nwww.sitioincreible.com',
            alignment: 'center',
            fontSize: 10,
            margin: [0, 0, 0, 10],
          },
        ],
      }),
      pageMargins: [40, 60, 40, 60],
    };

    pdfMake
      .createPdf(documentDefinition)
      .download(`venta-${venta.id?.toUpperCase()}.pdf`);
  }

  filtrarVentas(event: Event) {
    const target = event.target as HTMLSelectElement; // Casteo correcto
    const rango = target.value;

    const hoy = new Date();
    let fechaInicio = new Date();

    switch (rango) {
      case '7d':
        fechaInicio.setDate(hoy.getDate() - 7);
        break;
      case '30d':
        fechaInicio.setDate(hoy.getDate() - 30);
        break;
      default:
        this.ventasFiltradas = [...this.ventas];
        return;
    }

    // Filtrar las ventas según el rango seleccionado
    this.ventasFiltradas = this.ventas.filter((venta) => {
      const fechaVenta = venta.fecha.toDate();
      return fechaVenta >= fechaInicio && fechaVenta <= hoy;
    });
  }

  exportarExcel() {
    const datos = this.ventasFiltradas.map((venta) => ({
      Fecha: venta.fecha.toDate().toLocaleDateString(),
      Productos: venta.productos
        .map(
          (producto: any) =>
            `${producto.nombre}: ${producto.modelo || 'N/A'} (${
              producto.cantidad || 0
            })`
        ) // Incluir nombre, modelo y cantidad
        .join('; '), // Agrupar nombres, modelos y cantidades
      Vendedor: venta.vendedor?.nombre || 'Desconocido',
      Total: venta.totalConDescuento,
    }));

    // Aquí puedes continuar con la creación del archivo Excel
    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas');

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    XLSX.writeFile(workbook, 'ventas.xlsx');
  }
}
