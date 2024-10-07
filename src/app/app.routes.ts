import { Routes } from '@angular/router';
import { OnboardComponent } from './onboard/onboard.component';
import { GameComponent } from './game/game.component';

export const routes: Routes = [
  { path: '', component: OnboardComponent },
  { path: 'room/:roomId', component: GameComponent }
];
