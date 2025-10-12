import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../login/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) { }

  // --- NEW METHOD: Get the current user's full profile from your backend ---
  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  // Get all users
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // Set user role (only accessible by superadmin)
  setUserRole(uid: string, role: 'superadmin' | 'admin' | 'user'): Observable<any> {
    return this.http.post(`${this.apiUrl}/set-role`, { uid, role });
  }
  
  // Deduct one credit from the current user
  deductCredit(): Observable<{ credits: number }> {
    return this.http.post<{ credits: number }>(`${this.apiUrl}/use-credit`, {});
  }
}

