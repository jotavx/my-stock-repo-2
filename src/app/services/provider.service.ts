import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProviderService {
  constructor(private firestore: AngularFirestore) {}

  getProviders(): Observable<any> {
    return this.firestore.collection('providers').snapshotChanges();
  }

  createProvider(content: any): Observable<any> {
    return from(this.firestore.collection('providers').add(content));
  }

  editProvider(id: string, data: any): Observable<void> {
    return from(this.firestore.collection('providers').doc(id).update(data));
  }

  deleteProvider(id: string): Promise<any> {
    return this.firestore.collection('providers').doc(id).delete();
  }
}
