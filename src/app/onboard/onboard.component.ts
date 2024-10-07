import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  JoinDialogComponent,
  JoinInputs,
} from '../components/join-dialog/join-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ColyseusService } from '../services/colyseus.service';

@Component({
  selector: 'app-onboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
  ],
  templateUrl: './onboard.component.html',
  styleUrls: ['./onboard.component.scss'],
})
export class OnboardComponent implements OnInit {
  title = 'Welcome';

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private colyseusService: ColyseusService
  ) {}

  ngOnInit(): void {
    const roomId = localStorage.getItem('roomId');
    const connectionToken = localStorage.getItem('connectionToken');
    if (roomId && connectionToken) {
      this.router.navigate([`/room/${roomId}`]);
    } else {
      localStorage.clear();
    }
  }

  openRoomDialog(mode: 'create' | 'join') {
    const dialogRef = this.dialog.open(JoinDialogComponent, {
      data: { mode },
      width: '400px',
      panelClass: 'join-dialog',
    });
  
    dialogRef.afterClosed().subscribe(async (result: JoinInputs) => {
      if (result) {
        try {
          if (mode === 'create') {
            const roomId = await this.colyseusService.create(result.name);
            if (roomId) {
              this.redirectToRoom({ ...result, roomId });
            }
          } else {
            await this.colyseusService.joinRoom(result.roomId, result.name);
            await this.redirectToRoom(result);
          }
        } catch (error) {
          console.error(error);
        }
      }
    });
  }

  openCreateRoomDialog() {
    this.openRoomDialog('create');
  }

  openJoinRoomDialog() {
    this.openRoomDialog('join');
  }

  redirectToRoom(result: JoinInputs) {
    this.router.navigate([`/room/${result.roomId}`]);
  }
}
