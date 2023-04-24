import * as BABYLON from 'babylonjs';

export class Entity {
  name: string;
  position: BABYLON.Vector3;
  color: BABYLON.Color3;
  size: number;
  hp: number;
  damage: number;
  range: number;
  mesh: BABYLON.Mesh;

  constructor(name: string, position: BABYLON.Vector3, color: BABYLON.Color3, size: number, hp: number, damage: number, range: number, mesh: BABYLON.Mesh) {
    this.name = name;
    this.position = position;
    this.color = color;
    this.size = size;
    this.hp = hp;
    this.damage = damage;
    this.range = range;
    this.mesh = new BABYLON.Mesh(name);
  }

  // add action manager to entity
  addActions(scene: BABYLON.Scene, action: BABYLON.Action) {
    this.mesh.actionManager = new BABYLON.ActionManager(scene);
    this.mesh.actionManager.registerAction(action);
  }
}