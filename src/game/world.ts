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
    waypoints.push(this.tiles[26][16]);
    waypoints.push(this.tiles[7][21]);
    waypoints.push(this.tiles[8][5]);
    waypoints.push(this.tiles[18][5]);
    waypoints.push(this.tiles[18][28]);
    waypoints.push(this.tiles[0][31]);







    // // make all the tiles walkable
    // for (let x = 0; x < this.width; x++) {
    //   for (let y = 0; y < this.height; y++) {
    //     this.tiles[x][y].walkable = true;
    //   }
    // }


    this.waypoints = waypoints;
    return waypoints;
  }

  public spawnEnemy(scene: BABYLON.Scene) {
    const enemy = BABYLON.MeshBuilder.CreateSphere("enemy", { diameter: 1 }, scene);
    enemy.position.x = this.waypoints[0].x - this.width / 2;
    enemy.position.y = 0.65;
    enemy.position.z = this.waypoints[0].y - this.height / 2;
    enemy.material = new BABYLON.StandardMaterial("enemy", scene);
    enemy.material.diffuseColor = new BABYLON.Color3(1, 1, 0);
    enemy.physicsImpostor = new BABYLON.PhysicsImpostor(enemy, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0.4 }, scene);
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

    // create a grid from the waypoints
    var grid = new PF.Grid(this.width, this.height);



    // create a finder
    var finder = new PF.AStarFinder();
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


        const path = finder.findPath(currentTile.x, currentTile.y, waypoint.x, waypoint.y, grid);
        // console.log(path);

        // move the enemy towards the next tile on the path
        const nextTile = this.waypoints[currentWaypointIndex];
        const nextTilePosition = new BABYLON.Vector3(nextTile.x - this.width / 2, 0.1, nextTile.y - this.height / 2);
        enemy.lookAt(nextTilePosition);

        enemy.moveWithCollisions(enemy.getDirection(BABYLON.Axis.Z).scale(0.3));

        // // change the tileMesh color to a  color to indicate it's been walked on
        // const tileMesh = scene.getMeshByName(`tile-${currentTile.x}-${currentTile.y}`);
        // tileMesh.material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);

        // move enemy to the start if it reaches the end
        if (currentWaypointIndex === this.waypoints.length - 1) {
          currentWaypointIndex = 0;
          waypoint = this.waypoints[currentWaypointIndex];
          enemy.position.x = waypoint.x - this.width / 2;
          enemy.position.y = 0.65;
          enemy.position.z = waypoint.y - this.height / 2;
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
          // place a cube mesh on the tile that was clicked
          const tileMesh = BABYLON.MeshBuilder.CreateBox("tile", { width: 1, height: 1 }, scene);
          tileMesh.position = pickResult.pickedPoint;
          tileMesh.position.y = 0.5;
          tileMesh.material = new BABYLON.StandardMaterial("tile", scene);
          tileMesh.material.diffuseColor = new BABYLON.Color3(0, 0, 1);
          // give mesh physics
          tileMesh.physicsImpostor = new BABYLON.PhysicsImpostor(tileMesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0.9 }, scene);

          // add them to a obstacles array
          this.obstacles.push(tileMesh);
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
    setTimeout(() => {
      this.board.moveEnemy(scene);
    }, 1500);
  }
}

