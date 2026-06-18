/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */
import './index.css';


const canvas = /** @type {HTMLCanvasElement}*/ (document.getElementById("canvas"));
const ctx = canvas.getContext("2d")

const turret = {
  x:960,
  y:540,
}

const mouse = {
  x:0,
  y:0,
  angle:0,
  xRel:0,
  yRel:0,
}

let projectiles = []
let enemies = []

for (let i = 0; i < 5; i++) {
  enemies.push({
    x:Math.random()*1920,
    y:Math.random()*1080,
    radius:25,
    dead:false,
  })
}


function update() {
  for (let i = 0; i < projectiles.length; i++) {

    if (projectiles[i].dead) continue;

    projectiles[i].x += projectiles[i].dx * projectiles[i].speed;
    projectiles[i].y += projectiles[i].dy * projectiles[i].speed;

    for (let j = 0; j < enemies.length; j++) {
      if(collision(enemies[j],projectiles[i])) {
        enemies[j].dead = true;
        projectiles[i].dead = true;
        console.log("Dead");
        break;
      }
    }
  }
  enemies = enemies.filter(e => !e.dead);
  projectiles = projectiles.filter(p => !p.dead);

}

function render() {
  ctx.clearRect(0,0,1920,1080);
  //Turret circle
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(turret.x,turret.y,30,0,Math.PI*2);
  ctx.fill();

  //Turret pipe
  ctx.save();
  ctx.translate(turret.x,turret.y);
  ctx.rotate(mouse.angle)
  ctx.fillRect(0,-10,70,20);
  ctx.restore()

  //Projectiles
  for(let i = 0; i < projectiles.length; i++) {
    ctx.beginPath();
    ctx.arc(projectiles[i].x,projectiles[i].y,projectiles[i].radius,0,Math.PI*2);
    ctx.fill();
  };

  //Enemies
  ctx.fillStyle = "green"
  for (let i = 0; i < enemies.length; i++) {
    ctx.beginPath()
    ctx.arc(enemies[i].x,enemies[i].y,enemies[i].radius,0,Math.PI*2)
    ctx.fill()
  }

  //Crosshair
  ctx.fillStyle ="red"
  ctx.beginPath()
  ctx.arc(mouse.x,mouse.y,15,0,Math.PI*2)
  ctx.arc(mouse.x,mouse.y,10,0,Math.PI*2,true);
  ctx.fill();
  ctx.fillRect(mouse.x-20,mouse.y-2.5,40,5)
  ctx.fillRect(mouse.x-2.5,mouse.y-20,5,40)
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

function collision(e,p) {
  const xDist = e.x - p.x
  const yDist = e.y - p.y
  const collisionDist = e.radius + p.radius;
  return xDist*xDist + yDist*yDist <= collisionDist*collisionDist;
}

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.x - rect.left)*canvas.width/rect.width;
  mouse.y = (e.y - rect.top)*canvas.height/rect.height;
  mouse.xRel = mouse.x - turret.x
  mouse.yRel = mouse.y - turret.y
  mouse.angle = Math.atan2(mouse.yRel,mouse.xRel);
});


canvas.addEventListener("mousedown", (e) => {
  const dx = Math.cos(mouse.angle)
  const dy = Math.sin(mouse.angle)

  projectiles.push({
    x:turret.x+50*dx,
    y:turret.y+50*dy,
    dx:dx,
    dy:dy,
    speed:2,
    radius:10,
    dead:false,
  });
});

loop()