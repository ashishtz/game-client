import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  ColyseusService,
  GameState,
  Player,
} from '../services/colyseus.service';
import { Observable } from 'rxjs';
import { SceneComponent } from '../components/scene/scene.component';
import { GameService } from '../services/game.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SceneComponent,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
  ],
  providers: [GameService],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
  roomId!: string;
  gameState$: Observable<GameState | null>;
  currentPlayerTurn$: Observable<string | null>;
  players: Player[] = [];
  player: Player | undefined;
  winner: string = '';
  draws: number = 0;

  isConnecting: boolean = false;
  canBePlayed: boolean = false;
  isCopied: boolean = false;
  turn: string = 'Your turn';

  name: string = '';

  constructor(
    private colyseusService: ColyseusService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.gameState$ = this.colyseusService.gameState$;
    this.currentPlayerTurn$ = this.colyseusService.currentPlayerTurn$;
    this.name = localStorage.getItem('name') || '';
  }

  async ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('roomId')!;

    if (this.name && this.roomId) {
      await this.handleReconnection();
    } else {
      this.redirectToHome('Invalid credentials. Redirecting!');
    }
    this.subscribeToGameState();

    this.gameState$.subscribe((state) => {
      if (state) {
        this.draws = state.draws;
      }
    });

    this.colyseusService.player$.subscribe((state) => {
      if (state) {
        this.player = state;
      }
    });

    this.currentPlayerTurn$.subscribe((state) => {
      if (this.winner) {
        this.turn = `${this.winner} won the game!`;
      } else if (state === this.player?.name) {
        this.turn = 'Your Turn';
      } else {
        this.turn = `${state}'s Turn`;
      }
    });
  }

  private async handleReconnection(): Promise<void> {
    this.isConnecting = true;
    try {
      await this.colyseusService.reconnectOrJoin();
    } catch (error) {
      this.colyseusService.clearRoomData();
      this.redirectToHome();
    } finally {
      this.isConnecting = false;
    }
  }

  private redirectToHome(message?: string): void {
    if (message) {
      console.error(message);
    }
    this.router.navigate(['/']);
  }

  private subscribeToGameState(): void {
    this.gameState$.subscribe((state) => {
      if (state) {
        this.players = Object.values(state.players.toJSON());
        this.canBePlayed = this.players.length === 2;
        this.winner = state.winner;
      }
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(): void {
    // this.colyseusService.leaveRoom();
  }

  copyUniqueId(): void {
    this.isCopied = true;
    navigator.clipboard.writeText(this.roomId);

    setTimeout(() => {
      this.isCopied = false;
    }, 3000);
  }

  restartGame(): void {
    this.colyseusService.restart();
  }

  isMoveDisabled(): boolean {
    return !this.colyseusService.isMyTurn() || !this.canBePlayed;
  }
}
