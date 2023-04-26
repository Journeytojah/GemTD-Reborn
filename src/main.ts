import { Engine as App } from './game/Engine';

console.log(`main.ts starting ${App.name}`);
window.addEventListener('DOMContentLoaded', () => {
  let canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  let app = new App(canvas);
  app.run();
});