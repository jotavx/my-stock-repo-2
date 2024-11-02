import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, combineLatest } from 'rxjs';
import { Product } from '../models/product-model';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class StockAlertService {
  constructor(private firestore: AngularFirestore) {}

  observarStockBajo(): Observable<{ productos: Product[]; cantidad: number }> {
    // Obtén el umbral desde la colección 'config'
    const umbral$ = this.firestore
      .doc<{ stockThreshold: number }>('config/stockAlert')
      .valueChanges();

    return umbral$.pipe(
      switchMap((config) => {
        const umbral = config?.stockThreshold || 5; // Umbral por defecto si no existe el documento

        // Filtra productos con cantidad menor o igual al umbral dinámico
        return this.firestore
          .collection<Product>('products', (ref) =>
            ref.where('cantidad', '<=', umbral)
          )
          .valueChanges({ idField: 'id' })
          .pipe(
            map((productos: Product[]) => {
              const cantidad = productos.length;
              if (cantidad > 0) {
                // Aquí podrías mostrar una alerta o notificación
                // console.warn('Productos con stock bajo:', productos);
              }
              return { productos, cantidad };
            })
          );
      })
    );
  }

  getStockThreshold(): Observable<number> {
    return this.firestore
      .doc<{ stockThreshold: number }>('config/stockAlert')
      .valueChanges()
      .pipe(
        map((config) => config?.stockThreshold || 5) // Retorna 5 si no hay valor configurado
      );
  }
}
