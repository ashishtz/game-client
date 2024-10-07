import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-scene',
  standalone: true,
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.scss'],
})
export class SceneComponent implements OnInit, OnDestroy {
  @ViewChild('renderCanvas', { static: true })
  renderCanvas!: ElementRef<HTMLCanvasElement>;

  private engine!: BABYLON.Engine;
  private scene!: BABYLON.Scene;
  private shouldRestart: boolean = false;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.initBabylon();

    this.gameService.shouldRestart$.subscribe((state) => {
      if (state !== this.shouldRestart) {
        this.shouldRestart = state;
        if (state) {
          this.onRestart();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.gameService.shouldRestart$.unsubscribe();
    if (this.engine) {
      window.removeEventListener('resize', () => {
        this.engine.resize();
      });
      this.engine.dispose();
    }
  }

  initBabylon() {
    this.engine = new BABYLON.Engine(this.renderCanvas.nativeElement, true);
    this.scene = new BABYLON.Scene(this.engine);

    this.setupCamera();
    this.setupLighting();
    this.setupGameField();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    window.addEventListener('resize', () => {
      this.engine.resize();
    });

    // Handle clicks for the game
    this.scene.onPointerDown = (evt, pickResult) => {
      this.gameService.handlePlayerTurn(pickResult);
    };
  }

  setupCamera() {
    const camera = new BABYLON.ArcRotateCamera(
      'Camera',
      -Math.PI / 2,
      Math.PI / 4,
      9,
      BABYLON.Vector3.Zero(),
      this.scene
    );
    camera.attachControl(this.renderCanvas.nativeElement, true);
    camera.lowerRadiusLimit = 4;
    camera.upperRadiusLimit = 30;
  }

  setupLighting() {
    new BABYLON.HemisphericLight(
      'hemiLight',
      new BABYLON.Vector3(-1, 2, -2),
      this.scene
    );
    const light = new BABYLON.PointLight(
      'pointLight',
      new BABYLON.Vector3(0, 5, 0),
      this.scene
    );
    light.intensity = 0.75;
  }

  onRestart() {
    this.scene.dispose();
    this.initBabylon();
  }

  setupGameField() {
    this.gameService.createGameField(this.scene);
    // this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
  }
}
