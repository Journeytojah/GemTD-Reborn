import * as BABYLON from '@babylonjs/core';
import * as PF from 'pathfinding';
class Tile {
  public walkable: boolean = false;

  constructor(public x: number, public y: number) { }
}

class Projectile {
  mesh: BABYLON.Mesh;
  speed: number;
  damage: number;
  target: Enemy;

  constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, target: Enemy) {
    // create a sphere mesh for the projectile
    const projectileMaterial = new BABYLON.StandardMaterial("projectileMaterial", scene);
    projectileMaterial.diffuseColor = BABYLON.Color3.Red();
    const projectileMesh = BABYLON.MeshBuilder.CreateSphere("projectileMesh", { diameter: 0.5 }, scene);
    projectileMesh.physicsImpostor = new BABYLON.PhysicsImpostor(projectileMesh, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.9 }, scene);
    projectileMesh.material = projectileMaterial;
    projectileMesh.position = position;

    this.mesh = projectileMesh;
    this.speed = 10; // units per second
    this.damage = 1; // damage per attack
    this.target = target; // current target mesh
  }
}


class Tower {
  mesh: BABYLON.Mesh;
  range: number;
  damage: number;
  attackSpeed: number;
  currentTarget: Enemy;
  fireRate: number;
  lastFireTime: number;
  position: BABYLON.Vector3;

  constructor(scene: BABYLON.Scene, position: BABYLON.Vector3) {
    // create a cylinder mesh for the tower
    const towerMaterial = new BABYLON.StandardMaterial("towerMaterial", scene);
    towerMaterial.diffuseColor = BABYLON.Color3.Black();
    const towerMesh = BABYLON.MeshBuilder.CreateCylinder("towerMesh", { diameter: 1, height: 3 }, scene);
    // towerMesh.physicsImpostor = new BABYLON.PhysicsImpostor(towerMesh, BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 0, restitution: 0.9 }, scene);
    towerMesh.material = towerMaterial;
    towerMesh.position = position;

    this.mesh = towerMesh;
    this.range = 10; // tower range in units
    this.damage = 0.1; // damage per attack
    this.attackSpeed = 0.1; // attacks per second
    this.currentTarget = null; // current target mesh
    this.fireRate = 1 / this.attackSpeed; // time between attacks
    this.lastFireTime = 0; // last time tower fired
    this.position = position;
  }


  shootAtEnemy(scene: BABYLON.Scene, enemies: Enemy[], deltaTime: number) {
    // create a ray from the tower mesh position in the direction of the nearest enemy
    let nearestEnemy = null;
    let nearestDistance = this.range;
    for (const enemy of enemies) {
      const distance = BABYLON.Vector3.Distance(enemy.mesh.position, this.mesh.position);
      if (distance <= this.range && (nearestEnemy == null || distance < nearestDistance)) {
        nearestEnemy = enemy;
        nearestDistance = distance;
      }
    }

    // console.log(nearestEnemy);

    if (nearestEnemy != null) {
      const direction = nearestEnemy.mesh.position.subtract(this.mesh.position);
      const ray = new BABYLON.Ray(this.mesh.position, direction, this.range);
      const rayHelper = new BABYLON.RayHelper(ray);

      // check if the ray intersects with the enemy mesh
      const hit = ray.intersectsMesh(nearestEnemy.mesh);
      if (hit) {
        // rayHelper.show(scene, BABYLON.Color3.Red());
        // setTimeout(() => {
        //   rayHelper.dispose();
        // }, 500);
        // if the tower has waited long enough between attacks, fire
        if (this.lastFireTime >= this.fireRate) {
          nearestEnemy.health -= this.damage;
          this.lastFireTime = 0;

          // create a projectile and animate it towards the enemy
          const projectile = new Projectile(scene, this.mesh.position, nearestEnemy);
          projectile.mesh.physicsImpostor.applyImpulse(direction.scale(projectile.speed), projectile.mesh.getAbsolutePosition());

          scene.registerBeforeRender(() => {
            // animate the projectile moving towards the enemy


          });

          // if the enemy is dead, remove it from the scene
          if (nearestEnemy.health <= 0) {
            nearestEnemy.mesh.dispose();
            enemies.splice(enemies.indexOf(nearestEnemy), 1);
          }

          // remove the projectile after 1 second
          setTimeout(() => {
            projectile.mesh.dispose();
          }, 1000);


        }
      }
    }

    this.lastFireTime += deltaTime;

  }
}

export class Board {
  public tiles: Tile[][] = [];
  public waypoints: Tile[] = [];
  public obstacles: Tile[] = [];
  public towers: Tower[] = [];
  public enemies: Enemy[] = [];

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
      }
    }


    // // make all the tiles walkable
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.tiles[x][y].walkable = true;
      }
    }

    // make random clusters of tiles unwalkable to create obstacles but not on the waypoints
    // for (let i = 0; i < 500; i++) {
    //   const x = Math.floor(Math.random() * this.width);
    //   const y = Math.floor(Math.random() * this.height);
    //   if (!waypoints.find((waypoint) => waypoint.x === x && waypoint.y === y)) {
    //     this.tiles[x][y].walkable = false;
    //     this.obstacles.push(this.tiles[x][y]);
    //   } else {
    //     i--;
    //   }
    // }



    this.waypoints = waypoints;
    return waypoints;
  }

  public spawnEnemy(scene: BABYLON.Scene) {
    // if there is an enemy already spawned, dispose of it
    if (scene.getMeshByName("enemy")) {
      scene.getMeshByName("enemy")?.dispose();
    }
    const enemy = new Enemy(scene, this.width, this.height);
    enemy.spawn();
    this.enemies.push(enemy);
  }


  public moveEnemy(scene: BABYLON.Scene) {
    const enemy = scene.getMeshByName("enemy");
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
      weight: 3
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
          scene.getMeshByName("path")?.dispose();
        }
        const lineMesh = BABYLON.MeshBuilder.CreateLines("path", { points: path.map((point) => new BABYLON.Vector3(point[0] - this.width / 2, 0.1, point[1] - this.height / 2)) }, scene);
        lineMesh.color = new BABYLON.Color3(0, 0, 0);
        lineMesh.outlineWidth = 1;
        lineMesh.isPickable = false;
        lineMesh.alpha = 0.5;
        lineMesh.position.y = 1;

        // move the enemy towards the next tile on the pathfinding path
        const nextTilePosition = new BABYLON.Vector3(path[1][0] - this.width / 2, 1, path[1][1] - this.height / 2);

        // rotate the enemy to face the next tile
        enemy.lookAt(nextTilePosition);
        enemy.moveWithCollisions(enemy.getDirection(BABYLON.Axis.Z).scale(0.3));

        // if it reaches the last waypoint, move it back to the first waypoint
        if (currentWaypointIndex === this.waypoints.length - 1) {
          currentWaypointIndex = 0;
          waypoint = this.waypoints[currentWaypointIndex];
        }
      }
    });
  }



  // create a mesh for each tile
  public createMeshes(scene: BABYLON.Scene) {
    // use BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);
    // to create a ground plane
    const walkableMaterial = new BABYLON.StandardMaterial("walkable", scene);
    walkableMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
    const unwalkableMaterial = new BABYLON.StandardMaterial("unwalkable", scene);
    unwalkableMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tile = this.tiles[x][y];
        const tileMesh = BABYLON.MeshBuilder.CreatePlane(`tile-${x}-${y}`, { width: 1, height: 1 }, scene);
        tileMesh.rotation.x = Math.PI / 2;
        tileMesh.position.x = x;
        tileMesh.position.y = 0;
        tileMesh.position.z = y;
        if (tile.walkable) {
          tileMesh.material = walkableMaterial;
        } else {
          tileMesh.material = unwalkableMaterial;
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
          const tileName = tileMesh?.name;
          const tileNameParts = tileName?.split("-");
          const tileX = parseInt(tileNameParts![1]);
          const tileY = parseInt(tileNameParts![2]);
          const tile = this.tiles[tileX][tileY];
          // place a tower on it using our tower class
          const tower = new Tower(scene, new BABYLON.Vector3(tileX, 0, tileY));
          tower.position.x -= this.width / 2;
          tower.position.y += 1;
          tower.position.z -= this.height / 2;
          // call tower update with time delta and enemies array
          scene.registerBeforeRender(() => {
            tower.shootAtEnemy(scene, this.enemies, scene.getEngine().getDeltaTime());
          });
          this.towers.push(tower);
          // add it as an obstacle
          tile.walkable = !tile.walkable;
          // log the clicked position as a babylon vector 3
          console.log(new BABYLON.Vector3(tileX, 0, tileY));

        }
      }
    });
  }
}

export class Enemy {
  public mesh: BABYLON.Mesh;
  public waypoints: Tile[] = [];
  public width: number;
  public height: number;
  public scene: BABYLON.Scene;
  public health: number;
  public position: BABYLON.Vector3;

  constructor(scene: BABYLON.Scene, width: number, height: number) {
    this.mesh = BABYLON.MeshBuilder.CreateSphere("enemy", { diameter: 1 }, scene);
    this.width = width;
    this.height = height;
    this.scene = scene;
    this.health = 1000;
    this.position = new BABYLON.Vector3(39 - this.width / 2, 1, 5 - this.height / 2)
  }

  public spawn() {
    const enemyMaterial = new BABYLON.StandardMaterial("enemy", this.scene);
    enemyMaterial.diffuseColor = BABYLON.Color3.Yellow();

    this.mesh.material = enemyMaterial;
    // position it on the firs path tile
    this.mesh.position = new BABYLON.Vector3(39 - this.width / 2, 1, 5 - this.height / 2);
    // this.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(this.mesh, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.9 }, this.scene);
  }

  public takeDamage(damage: number) {
    this.health -= damage;
    console.log(`enemy health: ${this.health}`);

    if (this.health <= 0) {
      this.mesh.dispose();
      console.log(`enemy killed`);
    }
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

