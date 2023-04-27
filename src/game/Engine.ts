import * as BABYLON from 'babylonjs';
import { Board, WorldManager } from './world';

import cannon from "cannon";
export class Engine {
  engine: BABYLON.Engine;
  scene: BABYLON.Scene;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.engine = new BABYLON.Engine(canvas)
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
    this.scene = createScene(this.engine, this.canvas)
  }

  debug(debugOn: boolean = true) {
    if (debugOn) {
      this.scene.debugLayer.show({ overlay: true });
    } else {
      this.scene.debugLayer.hide();
    }
  }

  run() {
    this.debug(true);
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }


}
var createScene = function (engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
  // This creates a basic Babylon Scene object (non-mesh)
  var scene = new BABYLON.Scene(engine);

  window.CANNON = cannon;
  scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());
  // Create a top-down camera, position it above the floor, pointing down at the origin
  var camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, 0, 23, BABYLON.Vector3.Zero(), scene);

  camera.setPosition(new BABYLON.Vector3(0, 64, 0));

  // This targets the camera to scene origin
  camera.setTarget(BABYLON.Vector3.Zero());

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);
  // camera.detachControl(canvas);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  // from World.ts in the game folder (src\game\world.ts)

  // world manager
  const worldManager = new WorldManager(scene);


  scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());

  return scene;

};