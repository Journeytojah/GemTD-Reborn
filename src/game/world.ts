import * as BABYLON from 'babylonjs';
import * as PF from 'pathfinding';
class Tile {
  public walkable: boolean = false;
  // public tower: Entity | null = null;

  constructor(public x: number, public y: number) { }
}

export class Board {
  public tiles: Tile[][] = [];
  public waypoints: Tile[] = [];

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

    // generate a path from 39,5
    let currentTile: Tile = this.tiles[39][5];
    waypoints.push(currentTile);
    currentTile.walkable = true;

    // generate a path to 26,5
    while (currentTile.x > 26) {
      currentTile = this.tiles[currentTile.x - 1][5];
      waypoints.push(currentTile);
      currentTile.walkable = true;
    }

    // generate a path to 26,16
    while (currentTile.y < 21) {
      currentTile = this.tiles[26][currentTile.y + 1];
      waypoints.push(currentTile);
      currentTile.walkable = true;
    }

    // generate a path to 7,21
    while (currentTile.x > 7) {
      currentTile = this.tiles[currentTile.x - 1][21];
      waypoints.push(currentTile);
      currentTile.walkable = true;
    }

    // generate a path to 8,5
    while (currentTile.y > 5) {
      currentTile = this.tiles[7][currentTile.y - 1];
      waypoints.push(currentTile);
      currentTile.walkable = true;
    }

    // generate a path to 18,5
    while (currentTile.x < 18) {
      currentTile = this.tiles[currentTile.x + 1][5];
      waypoints.push(currentTile);
      currentTile.walkable = true;
    }

    // generate a path to 18,28
    while (currentTile.y < 28) {
      currentTile = this.tiles[18][currentTile.y + 1];
      waypoints.push(currentTile);
      currentTile.walkable = true;
    }

    // generate a path to 0,31
    while (currentTile.x > 0) {
      currentTile = this.tiles[currentTile.x - 1][28];
      waypoints.push(currentTile);
      currentTile.walkable = true;
    }

    this.waypoints = waypoints;
    return waypoints;
  }

  public spawnEnemy(scene: BABYLON.Scene) {
    const enemy = BABYLON.MeshBuilder.CreateBox("enemy", { width: 0.8, height: 1 }, scene);
    enemy.position.x = this.waypoints[0].x - this.width / 2;
    enemy.position.y = 0.65;
    enemy.position.z = this.waypoints[0].y - this.height / 2;
    enemy.material = new BABYLON.StandardMaterial("enemy", scene);
    enemy.material.diffuseColor = new BABYLON.Color3(1, 1, 0);
    enemy.physicsImpostor = new BABYLON.PhysicsImpostor(enemy, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0.4, restitution: 0.9 }, scene);
  }

  // create a loop that updates the enemy's position each frame to follow the waypoints
  public updateEnemy(scene: BABYLON.Scene) {
    scene.registerBeforeRender(() => {
      const enemy = scene.getMeshByName("enemy");
      if (enemy) {
        const enemyPosition = enemy.position;
        const waypoint = this.waypoints[0];
        const waypointPosition = new BABYLON.Vector3(waypoint.x - this.width / 2, 0.1, waypoint.y - this.height / 2);
        const distance = BABYLON.Vector3.Distance(enemyPosition, waypointPosition);
        if (distance < 0.1) {
          this.waypoints.shift();
        }
      }
    });
  }

  // move the enemy in a straight line to the right for now
  public moveEnemy(scene: BABYLON.Scene) {
    const enemy = scene.getMeshByName("enemy");
    // console.log(enemy);

    var grid = new PF.Grid(this.width, this.height);
    // make a loop and set the walkable tiles to true
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tile = this.tiles[x][y];
        if (tile.walkable) {
          grid.setWalkableAt(x, y, true);
        }
      }
    }

    // create a finder
    var finder = new PF.AStarFinder();

    scene.registerBeforeRender(() => {
      if (enemy) {

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
        const tileMesh = BABYLON.MeshBuilder.CreateBox(`tile-${x}-${y}`, { width: 1, height: 0.1 }, scene);
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
          console.log(scene.pointerX, scene.pointerY);
          console.log(pickResult?.pickedMesh?.name);
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
    this.board.spawnEnemy(scene);
    this.board.moveEnemy(scene);
  }
}

