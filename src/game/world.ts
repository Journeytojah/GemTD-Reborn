import * as BABYLON from 'babylonjs';

class Tile {
  public walkable: boolean = false;
  // public tower: Entity | null = null;

  constructor(public x: number, public y: number) { }
}

export class Board {
  public tiles: Tile[][] = [];

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
    for (let x = 0; x < this.width; x++) {
      this.tiles[x][0].walkable = true;
      this.tiles[x][this.height - 1].walkable = true;
    }
    for (let y = 0; y < this.height; y++) {
      this.tiles[0][y].walkable = true;
      this.tiles[this.width - 1][y].walkable = true;
    }

  }

  public getTile(x: number, y: number): Tile | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.tiles[x][y];
  }

  // create a mesh for each tile
  public createMeshes(scene: BABYLON.Scene) {
    // use BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);
    // to create a ground plane

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tile = this.tiles[x][y];
        const tileMesh = BABYLON.MeshBuilder.CreateBox(`tile-${x}-${y}`, { width: 1, height: 1 }, scene);
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
        if (pickResult.hit) {
          console.log(pickResult.pickedMesh?.name);
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
    this.board = new Board(24, 24);
    this.board.generateLevel();
    this.board.createMeshes(scene);
    this.board.addEventManager(scene);
  }
}