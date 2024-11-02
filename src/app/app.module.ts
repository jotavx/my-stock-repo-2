import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { MatRadioModule } from '@angular/material/radio';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { HttpClientModule } from '@angular/common/http';
import { AngularFireModule } from '@angular/fire/compat';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { firebase } from '../environments/firebase';
import { CreateProductDialogComponent } from './components/create-product-dialog/create-product-dialog.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DeleteDialogComponent } from './components/delete-dialog/delete-dialog.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LoginComponent } from './components/login/login.component';
import { LogoutDialogComponent } from './components/logout-dialog/logout-dialog.component';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { CollectionsComponent } from './components/collections/collections.component';
import { ProductDialogComponent } from './components/product-dialog/product-dialog.component';
import { CartComponent } from './components/cart/cart.component';
import { QtyDialogComponent } from './components/qty-dialog/qty-dialog.component';
import { LowStockComponent } from './components/low-stock/low-stock.component';
import { MainContainerComponent } from './components/layout/main-container/main-container.component';
import { CreateUserComponent } from './components/create-user/create-user.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { ProfileComponent } from './components/profile/profile.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ProveedoresComponent } from './components/proveedores/proveedores.component';
import { CreateProviderComponent } from './components/create-provider/create-provider.component';
import { EditUserComponent } from './components/edit-user/edit-user.component';
import { ProductViewListComponent } from './components/product-view-list/product-view-list.component';
import { DiscountDialogComponent } from './components/discount-dialog/discount-dialog.component';
import { SalesListComponent } from './components/sales-list/sales-list.component';
import { NoSymbolsDirective } from './directives/no-symbols.directive';
import { BarcodeScannerComponent } from './components/barcode-scanner/barcode-scanner.component';
import { SideBarComponent } from './components/side-bar/side-bar.component';
import { ImportExcelComponent } from './components/import-excel/import-excel.component';
import { SettingsComponent } from './components/settings/settings.component';
import { DescuentoDialogComponent } from './components/descuento-dialog/descuento-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CreateProductDialogComponent,
    ProductListComponent,
    DeleteDialogComponent,
    NavbarComponent,
    LoginComponent,
    LogoutDialogComponent,
    CollectionsComponent,
    ProductDialogComponent,
    CartComponent,
    QtyDialogComponent,
    LowStockComponent,
    MainContainerComponent,
    CreateUserComponent,
    UserManagementComponent,
    ProfileComponent,
    UserListComponent,
    ConfirmDialogComponent,
    ResetPasswordComponent,
    ProveedoresComponent,
    CreateProviderComponent,
    EditUserComponent,
    ProductViewListComponent,
    DiscountDialogComponent,
    SalesListComponent,
    NoSymbolsDirective,
    BarcodeScannerComponent,
    SideBarComponent,
    ImportExcelComponent,
    SettingsComponent,
    DescuentoDialogComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(firebase.firebaseConfig),
    MatTableModule,
    BrowserAnimationsModule,
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    HttpClientModule,
    AngularFireStorageModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatTabsModule,
    MatMenuModule,
    MatCheckboxModule,
    ZXingScannerModule,
    MatListModule,
    MatExpansionModule,
    MatRadioModule,
  ],
  providers: [
    provideFirebaseApp(() => initializeApp(firebase.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideAnimationsAsync(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
