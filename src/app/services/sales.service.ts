import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class SalesService {
  constructor(private firestore: AngularFirestore) {}

  getVentas(): Observable<any> {
    return this.firestore
      .collection('ventas', (ref) => ref.orderBy('fecha', 'desc'))
      .snapshotChanges();
  }

  eliminarVenta(id: string): Promise<any> {
    return this.firestore.collection('ventas').doc(id).delete();
  }
}
