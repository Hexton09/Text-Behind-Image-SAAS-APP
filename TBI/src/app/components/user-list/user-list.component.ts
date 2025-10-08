import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../login/auth-service.service';
import { User } from '../../login/user.model';
import { UserService } from '../../services/user.service';
@Component({
  selector: 'app-user-list',
  standalone: false,
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  allUsers$!: Observable<User[]>;
  currentUser$: Observable<User | null | undefined> | undefined;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.allUsers$ = this.userService.getAllUsers();
    this.currentUser$ = this.authService.currentUser$;
  }

  promoteToAdmin(user: User): void {
    if (!user.uid) return;
    this.userService.setUserRole(user.uid, 'admin')
      .subscribe({
        next: () => console.log(`${user.displayName} promoted to Admin.`),
        error: (err) => console.error('Error promoting user:', err)
      });
  }
}