import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BarcodeScannerComponent } from '../barcode-scanner/barcode-scanner.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  constructor(private dialog: MatDialog) {}

  openDialog() {
    this.dialog.open(BarcodeScannerComponent, {
      width: '700px',
    });
  }
}
