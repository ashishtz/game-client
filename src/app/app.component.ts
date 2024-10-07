import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ColyseusService } from './services/colyseus.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, MatButtonModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  isLoggedIn: boolean = false;

  constructor(
    private router: Router,
    private colyseusService: ColyseusService
  ) {
    if (localStorage.getItem('sessionId')) {
      this.isLoggedIn = true;
    }
  }

  logout() {
    localStorage.clear();
    this.isLoggedIn = false;
    this.colyseusService.leaveRoom();
    window.location.href = '/';
  }
}
