import { Component, ViewChild, ElementRef } from '@angular/core';
import { BarcodeFormat } from '@zxing/library';
import { BehaviorSubject } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import JsBarcode from 'jsbarcode';

@Component({
  selector: 'app-barcode-scanner',
  templateUrl: './barcode-scanner.component.html',
  styleUrls: ['./barcode-scanner.component.css'],
})
export class BarcodeScannerComponent {
  @ViewChild('barcodeCanvas', { static: false }) barcodeCanvas!: ElementRef;

  availableDevices!: MediaDeviceInfo[];
  currentDevice!: MediaDeviceInfo | undefined;

  hasDevices!: boolean;
  hasPermission!: boolean;
  qrResultString!: string;
  loading: boolean = true;

  torchEnabled = false;
  torchAvailable$ = new BehaviorSubject<boolean>(false);
  tryHarder = false;

  formatsEnabled: BarcodeFormat[] = [
    BarcodeFormat.CODE_128,
    BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.EAN_13,
    BarcodeFormat.QR_CODE,
  ];

  constructor(
    private readonly _dialog: MatDialog,
    public dialogRef: MatDialogRef<BarcodeScannerComponent>
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.loading = false;
    }, 1000);
    this.clearResult();
  }

  clearResult(): void {
    this.qrResultString = '';
    // this.clearBarcodeImage();
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);
  }

  onCodeResult(resultString: string) {
    this.qrResultString = resultString;
    // this.generateBarcodeImage(resultString);
    setTimeout(() => {
      this.dialogRef.close(resultString); // Cierra el diálogo y pasa el resultado
    }, 1000);
  }

  onDeviceSelectChange(selected: string) {
    const device = this.availableDevices.find((x) => x.deviceId === selected);
    this.currentDevice = device || undefined;
  }

  onHasPermission(has: boolean) {
    this.hasPermission = has;
  }

  onTorchCompatible(isCompatible: boolean): void {
    this.torchAvailable$.next(isCompatible || false);
  }

  toggleTorch(): void {
    this.torchEnabled = !this.torchEnabled;
  }

  toggleTryHarder(): void {
    this.tryHarder = !this.tryHarder;
  }

  generateBarcodeImage(code: string): void {
    if (this.barcodeCanvas) {
      JsBarcode(this.barcodeCanvas.nativeElement, code, {
        format: 'CODE128',
        displayValue: true,
        fontSize: 18,
        lineColor: '#000000',
        width: 2,
        height: 50,
      });
    }
  }

  clearBarcodeImage(): void {
    const canvas = this.barcodeCanvas.nativeElement as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}
