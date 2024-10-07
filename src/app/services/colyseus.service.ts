import { Injectable } from '@angular/core';
import { Client, Room } from 'colyseus.js';
import { BehaviorSubject } from 'rxjs';
import { MapSchema } from '@colyseus/schema';
import { environment } from '../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface Player {
  name: string;
  symbol: string;
  sessionId: string;
  connected: boolean;
  won: number;
}

export interface GameState {
  board: string[]; // The Tic-Tac-Toe board, a 3x3 grid
  currentTurn: string; // The session ID of the player whose turn it is
  players: MapSchema<Player>; // A MapSchema holding the players
  gameOver: boolean;
  winner: string; // The name of the winner or "Draw" if the game is a draw
  draws: number;
  restarted: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ColyseusService {
  private client: Client;
  public room: Room<GameState> | undefined;
  public sessionId: string | null = null;
  public name: string | null = null;
  public player$ = new BehaviorSubject<Player | null>(null);

  public gameState$ = new BehaviorSubject<GameState | null>(null);
  public currentPlayerTurn$ = new BehaviorSubject<string | null>(null);
  public winner$ = new BehaviorSubject<string | null>(null);
  symbol: string | undefined;

  roomId: string | null = null;
  reconnectToken: string | null = null;

  constructor(private snackBar: MatSnackBar) {
    console.log('environment.serverSocketUrl :>> ', environment.serverSocketUrl);
    this.client = new Client(environment.serverSocketUrl);
    this.initializeLocalStorageData();
  }

  async reconnectOrJoin(): Promise<void> {
    this.initializeLocalStorageData();
    if (this.room) {
      this.setupRoomListeners();
    } else if (this.reconnectToken) {
      this.reconnect();
    } else {
      throw 'Invalid session';
    }
  }

  async create(name: string): Promise<string> {
    try {
      this.room = await this.client.create('tic_tac_toe', { name });
      this.sessionId = this.room.sessionId;
      this.name = name;
      this.saveRoomData();
      return this.room.id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.handleError('Failed to create a room', error);
      throw error;
    }
  }

  async reconnect(): Promise<void> {
    try {
      this.room = await this.client.reconnect(this.reconnectToken!);

      localStorage.setItem('connectionToken', this.room.reconnectionToken);
      
      this.sessionId = this.room!.sessionId;
      this.setupRoomListeners();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.clearRoomData();
      this.handleError('Failed to reconnect', error);
      throw error;
    }
  }

  async joinRoom(roomId: string, name: string): Promise<string> {
    try {
      this.room = await this.client.joinById<GameState>(roomId, { name });
      this.sessionId = this.room.sessionId;
      this.name = name;
      this.saveRoomData();
      this.setupRoomListeners();
      return this.room?.id || '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.handleError('Failed to join room', error);
      throw error;
    }
  }

  makeMove(index: number): void {
    if (!this.room || this.winner$.getValue()) {
      this.snackBar.open(
        'Cannot make a move. Check the network connection or if the game is over.'
      );
      return;
    }

    const currentState = this.gameState$.value;
    if (currentState && currentState.currentTurn === this.sessionId) {
      this.room.send('make_move', { index });
    } else {
      this.snackBar.open(`It's not your turn`, 'Ok', { panelClass: 'warn' });
    }
  }

  restart(): void {
    if (!this.room || !this.room.state.winner) {
      this.snackBar.open(
        'Cannot restart. Either the game is still in progress or there is no room.'
      );
      return;
    }

    this.room.send('restart_game');
  }

  public isMyTurn(): boolean {
    const currentState = this.gameState$.value;
    return currentState ? currentState.currentTurn === this.sessionId : false;
  }

  async leaveRoom(): Promise<void> {
    if (this.room) {
      await this.room.leave();
    }
    this.clearRoomData();
  }

  // Helper methods

  private initializeLocalStorageData(): void {
    this.roomId = this.getFromLocalStorage('roomId');
    this.reconnectToken = this.getFromLocalStorage('connectionToken');
    this.sessionId = this.getFromLocalStorage('sessionId');
    this.name = this.getFromLocalStorage('name');
  }

  private saveRoomData(): void {
    this.setToLocalStorage('roomId', this.room!.id);
    this.setToLocalStorage('sessionId', this.sessionId!);
    this.setToLocalStorage('name', this.name!);
    this.setToLocalStorage('connectionToken', this.room!.reconnectionToken);
  }

  clearRoomData(): void {
    this.removeFromLocalStorage('roomId');
    this.removeFromLocalStorage('sessionId');
    this.removeFromLocalStorage('name');
    this.removeFromLocalStorage('connectionToken');
    this.removeFromLocalStorage('symbol');
  }

  private setupRoomListeners(): void {
    if (!this.room) return;

    this.room.onStateChange((state: GameState) => {
      const player = state.players.get(this.sessionId!);
      this.gameState$.next(state);
      this.player$.next(player!);

      const currentPlayer = state.players.get(state.currentTurn);      

      this.currentPlayerTurn$.next(currentPlayer ? currentPlayer.name : null);

      if (state.winner) {
        this.winner$.next(
          state.winner === 'Draw' ? 'Draw' : `${state.winner} won the game!`
        );
      } else {
        this.winner$.next('');
      }
    });

    this.room.onMessage('error', (error) => {
      this.snackBar.open(`Error from server: ${error?.message}`, 'Ok', {
        panelClass: 'warn',
      });
    });

    this.room.onLeave(() => {
      console.log('Left room', this.room!.id);
      this.clearRoomData();
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.snackBar.open(`${message}: ${error?.message}`, 'Ok', {
      panelClass: 'warn',
    });
  }

  private getFromLocalStorage(key: string): string | null {
    return localStorage.getItem(key);
  }

  private setToLocalStorage(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  private removeFromLocalStorage(key: string): void {
    localStorage.removeItem(key);
  }
}
