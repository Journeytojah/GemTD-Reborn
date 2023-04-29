import * as BABYLON from '@babylonjs/core';
import * as PF from 'pathfinding';
class Tile {
  public walkable: boolean = false;
  public mesh: BABYLON.Mesh = BABYLON.MeshBuilder.CreatePlane("tile", { size: 1 });
  // public tower: Entity | null = null;

  constructor(public x: number, public y: number) { }
}

export class Board {
  public tiles: Tile[][] = [];
  public waypoints: Tile[] = [];
  public obstacles: Tile[] = [];

  constructor(public width: number, public height: number) {
    for (let x = 0; x < width; x++) {
      const row: Tile[] = [];
      for (let y = 0; y < height; y++) {
        row.push(new Tile(x, y));
      }
      this.tiles.push(row);
    }
  }

  public generateLevel() {
    // store the waypoints in an array for easy access
    const waypoints: Tile[] = [];
    waypoints.push(this.tiles[39][5]);
    waypoints.push(this.tiles[26][5]);
    waypoints.push(this.tiles[26][21]);
    waypoints.push(this.tiles[7][21]);
    waypoints.push(this.tiles[7][5]);
    waypoints.push(this.tiles[18][5]);
    waypoints.push(this.tiles[18][28]);
    waypoints.push(this.tiles[1][28]);
    waypoints.push(this.tiles[0][28]);



    // color the waypoints to indicate they are walkable
    waypoints.forEach((waypoint) => {
      waypoint.walkable = true;
    });

    // make a walkable path between the waypoints by setting the tiles to walkable
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      const xIncrement = dx / steps;
      const yIncrement = dy / steps;
      for (let j = 0; j < steps; j++) {
        const x = Math.round(start.x + j * xIncrement);
        const y = Math.round(start.y + j * yIncrement);
        this.tiles[x][y].walkable = true;

        // color the tiles black 
        this.tiles[x][y].mesh.material = new BABYLON.StandardMaterial("tile");
        this.tiles[x][y].mesh.material.diffuseColor = new BABYLON.Color3(0, 0, 0);
      }
    }


    // // make all the tiles walkable
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.tiles[x][y].walkable = true;
      }
    }

    // make random clusters of tiles unwalkable to create obstacles but not on the waypoints
    for (let i = 0; i < 500; i++) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      if (!waypoints.find((waypoint) => waypoint.x === x && waypoint.y === y)) {
        this.tiles[x][y].walkable = false;
        this.tiles[x][y].mesh.material = new BABYLON.StandardMaterial("tile");
        this.tiles[x][y].mesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
        this.obstacles.push(this.tiles[x][y]);
      }
    }



    this.waypoints = waypoints;
    return waypoints;
  }

  public spawnEnemy(scene: BABYLON.Scene) {
    const enemy = BABYLON.MeshBuilder.CreateSphere("enemy", { diameter: 1 }, scene);
    enemy.position.x = this.waypoints[0].x - this.width / 2;
    enemy.position.y = 1.05;
    enemy.position.z = this.waypoints[0].y - this.height / 2;
    enemy.material = new BABYLON.StandardMaterial("enemy", scene);
    enemy.material.diffuseColor = new BABYLON.Color3(1, 1, 0);
    enemy.physicsImpostor = new BABYLON.PhysicsImpostor(enemy, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.9 }, scene);
  }


  // move the enemy in a straight line to the right for now
  public moveEnemy(scene: BABYLON.Scene) {
    const enemy = scene.getMeshByName("enemy");
    // console.log(enemy);

    // create a matrix from the tiles array to use with the pathfinding library
    const grid = new PF.Grid(this.width, this.height);
    // grid setWalkableAt (x, y, true); 
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        grid.setWalkableAt(x, y, this.tiles[x][y].walkable);
      }
    }



    // create a finder
    var finder = new PF.AStarFinder({
      diagonalMovement: PF.DiagonalMovement.Never,
      heuristic: PF.Heuristic.manhattan,
      weight: 1
    });
    let currentWaypointIndex = 0;
    let currentTile = this.tiles[0][0];
    let waypoint = this.waypoints[currentWaypointIndex];
    scene.registerBeforeRender(() => {
      if (enemy) {
        // find the path from the current tile to the next tile towards the waypoint
        const enemyPosition = enemy.position;
        currentTile = this.tiles[Math.round(enemyPosition.x + this.width / 2)][Math.round(enemyPosition.z + this.height / 2)];

        // if we reached the waypoint, move to the next one
        if (currentTile.x === waypoint.x && currentTile.y === waypoint.y) {
          currentWaypointIndex++;
          waypoint = this.waypoints[currentWaypointIndex];
        }


        const path = finder.findPath(currentTile.x, currentTile.y, waypoint.x, waypoint.y, grid.clone());


        // draw the path using a line mesh, once a second and dispose of older lines to save memory 
        if (scene.getMeshByName("path")) {
          scene.getMeshByName("path").dispose();
        }
        const lineMesh = BABYLON.MeshBuilder.CreateLines("path", { points: path.map((point) => new BABYLON.Vector3(point[0] - this.width / 2, 0.1, point[1] - this.height / 2)) }, scene);
        lineMesh.color = new BABYLON.Color3(0, 0, 0);
        lineMesh.outlineWidth = 1;
        lineMesh.isPickable = false;
        lineMesh.alpha = 0.5;
        lineMesh.position.y = 1;

        // move the enemy towards the next tile on the pathfinding path
        const nextTilePosition = new BABYLON.Vector3(path[1][0] - this.width / 2, 0, path[1][1] - this.height / 2);

        // rotate the enemy to face the next tile


        enemy.lookAt(nextTilePosition);

        enemy.moveWithCollisions(enemy.getDirection(BABYLON.Axis.Z).scale(0.3));

        // // change the tileMesh color to a  color to indicate it's been walked on
        // const tileMesh = scene.getMeshByName(`tile-${currentTile.x}-${currentTile.y}`);
        // tileMesh.material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);

        // if it reaches the last waypoint, move it back to the first waypoint
        if (currentWaypointIndex === this.waypoints.length - 1) {
          currentWaypointIndex = 0;
          waypoint = this.waypoints[currentWaypointIndex];
        }

        // dispose of the enemy if it reaches the second to last waypoint
        // if (currentWaypointIndex === this.waypoints.length - 1) {
        //   enemy.dispose();
        // }
      }
    });
  }



  // create a mesh for each tile
  public createMeshes(scene: BABYLON.Scene) {
    // use BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);
    // to create a ground plane

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tile = this.tiles[x][y];
        const tileMesh = BABYLON.MeshBuilder.CreatePlane(`tile-${x}-${y}`, { width: 1, height: 1 }, scene);
        tileMesh.rotation.x = Math.PI / 2;
        tileMesh.position.x = x;
        tileMesh.position.y = 0;
        tileMesh.position.z = y;
        if (tile.walkable) {
          tileMesh.material = new BABYLON.StandardMaterial("walkable", scene);
          tileMesh.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
        } else {
          tileMesh.material = new BABYLON.StandardMaterial("unwalkable", scene);
          tileMesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
        }

        // center the plan
        tileMesh.position.x -= this.width / 2;
        tileMesh.position.z -= this.height / 2;

        // enable physics
        tileMesh.physicsImpostor = new BABYLON.PhysicsImpostor(tileMesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);

      }
    }

  }


  // log the tile being clicked on to the console
  public addEventManager(scene: BABYLON.Scene) {
    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        const pickResult = scene.pick(scene.pointerX, scene.pointerY);
        if (pickResult?.hit) {
          // log the tile being clicked on to the console
          const tileMesh = pickResult.pickedMesh;
          const tileName = tileMesh.name;
          const tileNameParts = tileName.split("-");
          const tileX = parseInt(tileNameParts[1]);
          const tileY = parseInt(tileNameParts[2]);
          const tile = this.tiles[tileX][tileY];
          console.log(tile);
          // add it as an obstacle
          tile.walkable = false;
          tileMesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
          new BABYLON.PhysicsImpostor(tileMesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);



        }
      }
    });
  }
}

export class WorldManager {
  public board: Board;
  public scene: BABYLON.Scene;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
    this.board = new Board(40, 40);
    this.board.generateLevel();
    this.board.createMeshes(scene);
    this.board.addEventManager(scene);
  }
}

