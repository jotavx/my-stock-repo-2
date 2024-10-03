import { Component } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css',
})
export class UserManagementComponent {
  isAdmin: boolean = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this._isUserAdmin();
  }

  _isUserAdmin() {
    this.userService.isUserAdmin().subscribe((isAdmin) => {
      this.isAdmin = isAdmin;
    });
  }
}
