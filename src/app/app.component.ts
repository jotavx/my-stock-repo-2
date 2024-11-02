import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'], // Corregido 'styleUrl' a 'styleUrls'
})
export class AppComponent implements OnInit {
  showNavbar: boolean = true;
  isDarkMode = false;
  title = 'my-stock';
  constructor(private router: Router) {}

  ngOnInit(): void {
    // Suscribirse a los eventos de navegación para detectar cambios de ruta
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkCurrentRoute();
      });
  }

  checkCurrentRoute(): void {
    const currentRoute = this.router.url;
    if (currentRoute === '/login') {
      this.showNavbar = false;
    } else {
      this.showNavbar = true;
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    const htmlElement = document.documentElement;
    if (this.isDarkMode) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }
}
