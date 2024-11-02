import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  user$?: Observable<User | null>;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.user$ = this.userService.getUserProfile();
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
    return colors[colorName?.toLowerCase() || ''] || '#ccc'; //
  }
}
