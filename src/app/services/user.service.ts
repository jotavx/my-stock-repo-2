import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from '../models/user';
import { map, Observable, of, switchMap } from 'rxjs';
import { deleteUser } from 'firebase/auth';
import { Router } from '@angular/router';
import { SnackbarService } from './snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private auth: Auth,
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private router: Router,
    private snackBar: SnackbarService
  ) {}

  login({ email, password }: any) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }

  resetPassword(email: string): Promise<void> {
    return this.afAuth.sendPasswordResetEmail(email);
  }

  getUsers(): Observable<User[]> {
    return this.firestore.collection<User>('users').valueChanges();
  }

  getUser(id: string): Observable<any> {
    return this.firestore.collection('users').doc(id).snapshotChanges();
  }

  async getCurrentUserId(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    return user ? user.uid : null;
  }

  async createUser(
    name: string,
    email: string,
    password: string,
    role: string,
    color: string,
    ventas: string
  ): Promise<void> {
    const userCredential = await this.afAuth.createUserWithEmailAndPassword(
      email,
      password
    );
    const newUser: User = {
      uid: userCredential.user?.uid!,
      email: userCredential.user?.email!,
      name,
      role,
      color,
      ventas,
    };
    return await this.firestore
      .collection('users')
      .doc(newUser.uid)
      .set(newUser);
  }

  async updateUser(uid: string, data: Partial<User>): Promise<void> {
    try {
      // Obtener el documento del usuario actual
      const userDoc = await this.firestore
        .collection('users')
        .doc(uid)
        .get()
        .toPromise();

      if (!userDoc || !userDoc.exists) {
        throw new Error('No se pudo encontrar los datos del usuario');
      }

      // Obtener los datos actuales del usuario
      const currentUserData = userDoc.data() as User;

      if (!currentUserData || !currentUserData.role) {
        throw new Error('No se pudo obtener el rol del usuario');
      }

      // Verificar si el rol está cambiando de "admin" a "vendedor"
      if (currentUserData.role === 'admin' && data.role === 'vendedor') {
        // Verificar si existe al menos otro usuario de tipo admin
        const adminSnapshot = await this.firestore
          .collection('users')
          .ref.where('role', '==', 'admin')
          .get();

        if (adminSnapshot.size === 1) {
          throw new Error(
            'Debe haber al menos un usuario de tipo administrador'
          );
        }
      }

      // Si la validación pasó, proceder con la actualización
      await this.firestore.collection('users').doc(uid).update(data);

      // Mostrar mensaje de éxito
      this.snackBar.showSuccess('El usuario se actualizó correctamente');
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message ===
          'Debe haber al menos un usuario de tipo administrador'
        ) {
          this.snackBar.showError(
            'Debe haber al menos un usuario de tipo administrador'
          );
        } else {
          console.error('Error al actualizar el usuario:', error.message);
          this.snackBar.showError('Error al actualizar el usuario');
        }
      } else {
        console.error('Error desconocido:', error);
        this.snackBar.showError('Error desconocido al actualizar el usuario');
      }
      throw error;
    }
  }

  // async updateUser(uid: string, data: Partial<User>): Promise<void> {
  //   return this.firestore.collection('users').doc(uid).update(data);
  // }

  // createUser(
  //   name: string,
  //   email: string,
  //   password: string,
  //   role: string,
  //   color: string,
  //   ventas: string
  // ): Promise<void> {
  //   return this.afAuth
  //     .createUserWithEmailAndPassword(email, password)
  //     .then((userCredential) => {
  //       const newUser: User = {
  //         uid: userCredential.user?.uid!,
  //         email: userCredential.user?.email!,
  //         name,
  //         role,
  //         color,
  //         ventas,
  //       };
  //       return this.firestore.collection('users').doc(newUser.uid).set(newUser);
  //     });
  // }

  async deleteUserAccount(): Promise<void> {
    try {
      // Obtener el usuario actual
      const user = await this.afAuth.currentUser;

      if (user) {
        // Obtener el documento del usuario en Firestore
        const userDoc = await this.firestore
          .doc(`users/${user.uid}`)
          .get()
          .toPromise();

        // Verificar si el documento del usuario existe
        if (!userDoc || !userDoc.exists) {
          throw new Error('No se pudo encontrar los datos del usuario');
        }

        // Obtener los datos del usuario y verificar el rol
        const userData = userDoc.data() as { role?: string };

        if (!userData || !userData.role) {
          throw new Error('No se pudo obtener el rol del usuario');
        }

        // Verificar si el rol del usuario es admin
        if (userData.role === 'admin') {
          // Verificar si existe al menos un usuario de tipo admin
          const adminSnapshot = await this.firestore
            .collection('users')
            .ref.where('role', '==', 'admin')
            .get();

          if (adminSnapshot.size === 1) {
            throw new Error('Debe haber al menos un usuario de tipo admin');
          }
        }

        // Eliminar usuario de Firebase Authentication
        await deleteUser(user);

        // Eliminar usuario de Firestore
        await this.firestore.doc(`users/${user.uid}`).delete();

        // Redirigir a /login
        this.router.navigate(['/login']);
      } else {
        throw new Error('No user logged in');
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Debe haber al menos un usuario de tipo admin') {
          this.snackBar.showError(
            'Debe haber al menos un usuario de tipo administrador'
          );
        } else {
          console.error('Error al eliminar usuario:', error.message);
        }
      } else {
        console.error('Error desconocido:', error);
      }
      throw error;
    }
  }

  getUserRole(): Observable<string | null> {
    return this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          return this.firestore
            .doc<any>(`users/${user.uid}`)
            .valueChanges()
            .pipe(map((userData) => userData?.role || null));
        } else {
          return of(null);
        }
      })
    );
  }

  getUserProfile(): Observable<User | null> {
    return this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          return this.firestore
            .doc<User>(`users/${user.uid}`)
            .valueChanges()
            .pipe(map((userData) => userData || null));
        } else {
          return of(null);
        }
      })
    );
  }

  isUserAdmin(): Observable<boolean> {
    return this.getUserRole().pipe(map((role) => role === 'admin'));
  }
}

// async deleteUserAccount(): Promise<void> {
//   try {
//     // Obtener el usuario actual
//     const user = await this.afAuth.currentUser;

//     if (user) {
//       // Verificar si existe al menos un usuario de tipo admin
//       const adminSnapshot = await this.firestore
//         .collection('users')
//         .ref.where('role', '==', 'admin')
//         .get();
//       if (adminSnapshot.size === 1) {
//         throw new Error('Debe haber al menos un usuario de tipo admin');
//       }

//       // Eliminar usuario de Firebase Authentication
//       await deleteUser(user);

//       // Eliminar usuario de Firestore
//       await this.firestore.doc(`users/${user.uid}`).delete();

//       // Redirigir a /login
//       this.router.navigate(['/login']);
//     } else {
//       throw new Error('No user logged in');
//     }
//   } catch (error) {
//     if (error instanceof Error) {
//       if (error.message === 'Debe haber al menos un usuario de tipo admin') {
//         this.snackBar.showError(
//           'Debe haber al menos un usuario de tipo administrador'
//         );
//       } else {
//         console.error('Error al eliminar usuario:', error.message);
//       }
//     } else {
//       console.error('Error desconocido:', error);
//     }
//     throw error;
//   }
// }
