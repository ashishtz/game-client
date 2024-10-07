import { Injectable } from '@angular/core';
import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

import { ColyseusService, GameState } from './colyseus.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GameService {

  public shouldRestart$ = new BehaviorSubject<boolean>(false);

  private boxPositions = [
    [0, 0, 0],
    [1.1, 0, 0],
    [2.2, 0, 0],
    [0, 0, -1.1],
    [1.1, 0, -1.1],
    [2.2, 0, -1.1],
    [0, 0, -2.2],
    [1.1, 0, -2.2],
    [2.2, 0, -2.2],
  ];

  private winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  private totalBoxes = Array.from({ length: 9 }, (_, i) => `box${i}`);

  constructor(private colyseusService: ColyseusService) {
    this.colyseusService.gameState$.subscribe((state) => {
      if (state) {
        this.shouldRestart$.next(state.restarted);
      }
    })
  }

  createGameField(
    scene: BABYLON.Scene,
  ) {
    const proto = BABYLON.MeshBuilder.CreateBox('proto', { size: 1 }, scene);
    proto.material = new BABYLON.StandardMaterial('material');

    (proto.material as BABYLON.StandardMaterial).diffuseTexture =
      new BABYLON.Texture(
        'https://www.babylonjs-playground.com/textures/waterbump.png'
      );
    proto.isVisible = false;

    this.boxPositions.forEach((position, index) => {
      const box = proto.createInstance(`box${index}`);
      box.position = new BABYLON.Vector3(position[0], position[1], position[2]);
    });

    // Listen for state updates from the server and update the board dynamically
    this.colyseusService.gameState$.subscribe((state) => {
      if (state) {
        this.updateGameField(state, scene);
        const winner = state.winner;
        const board = [...state.board.values()];
        this.gameResult(winner, board, scene);
      }
    });
  }

  handlePlayerTurn(pickResult: BABYLON.PickingInfo) {
    // Check if the pick was valid and a box was clicked
    if (!pickResult.hit || !pickResult.pickedMesh!.name.includes('box')) return;

    const boxIndex = parseInt(
      pickResult.pickedMesh!.name.charAt(
        pickResult.pickedMesh!.name.length - 1
      ),
      10
    );

    // Ensure that only the player whose turn it is can make a move
    const currentState = this.colyseusService.gameState$.value;
    const currentPlayerSessionId = this.colyseusService.sessionId;

    if (!currentState || !currentPlayerSessionId) {
      console.error('Game state or player session is invalid.');
      return;
    }

    // Only send the move if the box is empty
    if (!currentState.board[boxIndex]) {
      this.colyseusService.makeMove(boxIndex); // Send the move to the server
    }
  }

  updateGameField(state: GameState, scene: BABYLON.Scene) {
    state.board.forEach((player: string, index: number) => {
      if (player && !scene.getMeshByName(`piece${index}`)) {
        const position = this.boxPositions[index];
        this.createPieceMesh(player, position, scene, index);
      }
    });
  }

  createPieceMesh(
    player: string,
    position: number[],
    scene: BABYLON.Scene,
    index: number
  ) {
    if (player === 'X') {
      const cylinder = BABYLON.MeshBuilder.CreateCylinder(
        `piece${index}`,
        { height: 1, diameter: 0.2 },
        scene
      );
      const newCylinder = cylinder.clone();
      newCylinder.rotation.x = -Math.PI / 2;
      const mesh = BABYLON.Mesh.MergeMeshes([cylinder, newCylinder]);
      mesh!.rotation.y = Math.PI / 4;
      mesh!.rotation.z = -Math.PI / 2;
      mesh!.position = new BABYLON.Vector3(
        position[0],
        position[1] + 0.5,
        position[2]
      );
      mesh!.material = new BABYLON.StandardMaterial('meshmaterial', scene);
      (mesh!.material as BABYLON.StandardMaterial).diffuseColor =
        new BABYLON.Color3(0.23, 0.1, 0.5);
    } else if (player === 'O') {
      const torus = BABYLON.MeshBuilder.CreateSphere(
        `piece${index}`,
        { diameter: 0.75 },
        scene
      );
      torus.position = new BABYLON.Vector3(
        position[0],
        position[1] + 0.5,
        position[2]
      );
      torus.material = new BABYLON.StandardMaterial('torusmaterial', scene);
      (torus.material as BABYLON.StandardMaterial).diffuseColor =
        new BABYLON.Color3(0.4, 0.2, 0.3);
    }
  }

  gameResult(winner: string, board: string[], scene: BABYLON.Scene) {
    // Exit early if no winner is provided
    if (!winner) return;

    if (winner === 'Draw') {
      // Animate all boxes as lost for a draw
      this.totalBoxes.forEach((boxName) => {
        const boxMesh = scene.getMeshByName(boxName);
        if (boxMesh) {
          this.animateLost(boxMesh, scene);
        } else {
          console.warn(`Mesh not found for: ${boxName}`);
        }
      });
      this.winMessage(winner);
      return;
    }

    let winningBoxes: string[] = [];

    // Iterate over the winning conditions
    for (const [aIdx, bIdx, cIdx] of this.winningConditions) {
      const a = board[aIdx],
        b = board[bIdx],
        c = board[cIdx];

      // If a winning condition is found
      if (a && a === b && b === c) {
        winningBoxes = [aIdx, bIdx, cIdx].map((idx) => `box${idx}`);
        break; // Exit once we find a winning combination
      }
    }

    // Animate the boxes based on whether they are winning or losing
    this.totalBoxes.forEach((boxName) => {
      const boxMesh = scene.getMeshByName(boxName);
      if (!boxMesh) {
        console.warn(`Mesh not found for: ${boxName}`);
        return;
      }

      // Apply the appropriate animation
      if (winningBoxes.includes(boxName)) {
        this.animateWin(boxMesh, scene);
      } else {
        this.animateLost(boxMesh, scene);
      }
    });

    // Show the win message
    this.winMessage(winner);
  }

  winMessage(winner: string) {
    const gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');

    const textBlock = new GUI.TextBlock('winmsg');
    textBlock.text =
      winner === 'Draw' ? "It's a Draw!" : `${winner} won the game`;
    textBlock.color = 'goldenrod';
    textBlock.fontSize = 24;
    textBlock.fontWeight = 'bold';
    textBlock.top = -40;
    textBlock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    textBlock.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

    gui.addControl(textBlock);

    // Get the scene from the GUI
    const scene = gui.getScene();

    // Animate scaleX
    BABYLON.Animation.CreateAndStartAnimation(
      'textBounceX',
      textBlock,
      'scaleX',
      30,
      30,
      1,
      1.2,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE,
      undefined,
      undefined,
      scene!
    );

    // Animate scaleY
    BABYLON.Animation.CreateAndStartAnimation(
      'textBounceY',
      textBlock,
      'scaleY',
      30,
      30,
      1,
      1.2,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE,
      undefined,
      undefined,
      scene!
    );

    // Remove the text after 2 seconds
    setTimeout(() => {
      gui.removeControl(textBlock);
      gui.dispose();
    }, 2000); // Hide after 2 seconds
  }

  animateWin(box: BABYLON.AbstractMesh, scene: BABYLON.Scene) {
    const frameRate = 10;
    const xSlide = new BABYLON.Animation(
      'xSlide',
      'position.y',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    const keyFrames = [
      { frame: 0, value: -0.1 },
      { frame: frameRate, value: 0.05 },
      { frame: 2 * frameRate, value: -0.1 },
    ];
    xSlide.setKeys(keyFrames);
    box.animations.push(xSlide);
    const animate = scene.beginAnimation(box, 0, 2 * frameRate, true);
    setTimeout(() => animate.stop(), 3000);
  }

  animateLost(box: BABYLON.AbstractMesh, scene: BABYLON.Scene) {
    const frameRate = 10;
    const xSlide = new BABYLON.Animation(
      'xSlide',
      'position.y',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    const keyFrames = [
      { frame: 0, value: 0 },
      { frame: frameRate, value: -0.2 },
      { frame: 2 * frameRate, value: -0.5 },
    ];

    xSlide.setKeys(keyFrames);
    box.animations.push(xSlide);
    const animate = scene.beginAnimation(box, 0, 2 * frameRate, false);
    setTimeout(() => animate.stop(), 3000);
  }
}
