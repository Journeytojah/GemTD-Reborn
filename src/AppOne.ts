import * as BABYLON from 'babylonjs';
import { Entity } from './entity';
import { Tower } from './tower';
import { Enemy } from './enemy';
export class AppOne {
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
    // set fps to 60
    this.engine.getFps = () => 60;
    this.debug(true);
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }


}
var createScene = function (engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
  // This creates a basic Babylon Scene object (non-mesh)
  var scene = new BABYLON.Scene(engine);

  // Create a top-down camera, position it above the floor, pointing down at the origin
  var camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, 0, 35, BABYLON.Vector3.Zero(), scene);

  // This targets the camera to scene origin
  camera.setTarget(BABYLON.Vector3.Zero());

  // This attaches the camera to the canvas
  // camera.attachControl(canvas, true);
  camera.detachControl(canvas);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  var groundSize = 28; // size of the ground
  var tileSize = 1; // size of each tile
  var groundSubdivisions = 10; // subdivisions of the ground
  var tilesPerSide = groundSize / tileSize; // number of tiles per side


  // Create the tile material, dark green with a light green wireframe
  var tileMaterial = new BABYLON.StandardMaterial("tileMaterial", scene);
  tileMaterial.diffuseColor = new BABYLON.Color3(0, 0.5, 0);


  const tiles = [];
  // Create the tile meshes
  for (var i = 0; i < tilesPerSide; i++) {
    for (var j = 0; j < tilesPerSide; j++) {
      var tile = BABYLON.MeshBuilder.CreateBox("tile_" + i + "_" + j, { width: tileSize, height: 0.1, depth: tileSize }, scene);
      tile.material = tileMaterial;
      // tileMaterial.wireframe = true;
      tile.position.x = i * tileSize - (groundSize / 2) + (tileSize / 2);
      tile.position.y = 0.05 - 0.01;
      tile.position.z = j * tileSize - (groundSize / 2) + (tileSize / 2);
      tile.checkCollisions = false;

      tiles.push(tile);
    }
  }
  // Enable mouse interaction with the tiles using the action manager
  for (var i = 0; i < tiles.length; i++) {

    var tile = tiles[i];
    tile.actionManager = new BABYLON.ActionManager(scene);
    tile.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function (evt) {
      var tile = evt.source;

      // console.log("tile picked: " + tile.position.x + ", " + tile.position.z);

      // tile.material = new BABYLON.StandardMaterial("tileMaterial", scene);
      // tile.material.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    }));
  }

  // create a function that spawns 5 enemies with a 0.1 delay between each one and animates them along the path
  function spawnEnemies() {

    // Create a path that enemies follow, starting at the enemy's spawn position

    // moves right to 4.5, -10.5
    var path1 = [new BABYLON.Vector3(13.5, 0.05, -10.5), new BABYLON.Vector3(4.5, 0.05, -10.5)];

    // moves down to 4.5, 6.5
    var path2 = [new BABYLON.Vector3(4.5, 0.05, -10.5), new BABYLON.Vector3(4.5, 0.05, 6.5)];

    // moves right to -10.5, 6.5
    var path3 = [new BABYLON.Vector3(4.5, 0.05, 6.5), new BABYLON.Vector3(-10.5, 0.05, 6.5)];

    // moves up to -10.5, -10.5
    var path4 = [new BABYLON.Vector3(-10.5, 0.05, 6.5), new BABYLON.Vector3(-10.5, 0.05, -10.5)];

    // moves left to -0.5, -10.5
    var path5 = [new BABYLON.Vector3(-10.5, 0.05, -10.5), new BABYLON.Vector3(-0.5, 0.05, -10.5)];

    // moves down to -0.5, 10.5
    var path6 = [new BABYLON.Vector3(-0.5, 0.05, -10.5), new BABYLON.Vector3(-0.5, 0.05, 10.5)];

    // moves right to -13.5, 10.5
    var path7 = [new BABYLON.Vector3(-0.5, 0.05, 10.5), new BABYLON.Vector3(-13.5, 0.05, 10.5)];
    for (var i = 0; i < 5; i++) {
      setTimeout(function () {
        var enemy = new Enemy("enemy", new BABYLON.Vector3(13.5, 0.05, -10.5), new BABYLON.Color3(1, 0, 0), 1, 100, 10, 5);
        var enemyMesh = BABYLON.MeshBuilder.CreateBox("enemyMesh", { width: enemy.size, height: enemy.size, depth: enemy.size }, scene);
        enemyMesh.material = new BABYLON.StandardMaterial("enemyMaterial", scene);
        enemyMesh.material.diffuseColor = enemy.color;
        enemyMesh.position = enemy.position;

        // animate the enemy through each path in the array
        var animation = new BABYLON.Animation("enemyAnimation", "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        var keys = [];
        keys.push({
          frame: 0,
          value: path1[0]
        });
        keys.push({
          frame: 100,
          value: path1[1]
        });
        keys.push({
          frame: 200,
          value: path2[1]
        });
        keys.push({
          frame: 300,
          value: path3[1]
        });
        keys.push({
          frame: 400,
          value: path4[1]
        });
        keys.push({
          frame: 500,
          value: path5[1]
        });
        keys.push({
          frame: 600,
          value: path6[1]
        });
        keys.push({
          frame: 700,
          value: path7[1]
        });
        animation.setKeys(keys);
        enemyMesh.animations.push(animation);
        scene.beginAnimation(enemyMesh, 0, 700, true);

      }, i * 1000);
    }
  }

  document.querySelector("#start").addEventListener("click", function () {
    spawnEnemies();
    // hide the start button
    document.querySelector("#start").style.display = "none";
  });

  return scene;
};