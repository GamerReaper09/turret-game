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
const ctx = canvas.getContext("2d");
const gameOverDiv = document.getElementById("gameOverDiv");
const gameOverScore = document.getElementById("gameOverScore");
const scoreCounter = document.getElementById("score");


const turret = {
  x:960,
  y:540,
};

const mouse = {
  x:0,
  y:0,
  angle:0,
  xRel:0,
  yRel:0,
};

let score,alive,waveSize,waveCd,projectiles,enemies,prevWave,time



function initialize() {
  gameOverDiv.hidden = true;
  score = 0;
  alive = true;
  waveSize = 5;
  waveCd = 5000;
  time = performance.now()
  prevWave = time-4000;
  

  projectiles = [];
  enemies = [];
  scoreCounter.textContent = score;

  loop()
}

function update() {
  //Projectile logic
  for (const projectile of projectiles) {
    projectile.x += projectile.dx * projectile.speed;
    projectile.y += projectile.dy * projectile.speed;
    if (projectile.x < -100 || projectile.x > 2020 || projectile.y < -100 || projectile.y > 1180) {projectile.dead = true;};
  }
  //Enemy logic
  for (const enemy of enemies) {
    enemy.x -= enemy.dx*enemy.speed;
    enemy.y -= enemy.dy*enemy.speed;
    const xDist = enemy.x - turret.x;
    const yDist = enemy.y - turret.y;
    if (xDist*xDist+yDist*yDist < 85*85) {
      alive = false;
      gameOverScore.textContent = score;
      gameOverDiv.hidden=false;
    };
  }
  //Collision check
  for (let p = 0; p < projectiles.length; p++) {
    for (let e = 0; e < enemies.length; e++) {
      if(collision(enemies[e],projectiles[p])) {
        enemies[e].dead = true;
        projectiles[p].dead = true;
        break;
      }
    }
  }
  //Score
  for (let i = 0; i < enemies.length; i++) {
    if (enemies[i].dead) {
      score += 1;
      scoreCounter.textContent = score;
    };
  };
  //Enemy spawn
  time = performance.now();
  if (time - prevWave >= waveCd) {
    prevWave = time;
    spawnEnemy();
  }
  //Collision cleanup
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

  //Game over circle
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(turret.x,turret.y,60,0,Math.PI*2);
  ctx.arc(turret.x,turret.y,55,0,Math.PI*2,true);
  ctx.fill();
  ctx.fillStyle = "red"

  //Turret pipe
  ctx.save();
  ctx.translate(turret.x,turret.y);
  ctx.rotate(mouse.angle);
  ctx.fillRect(0,-10,70,20);
  ctx.restore();

  
  

  //Projectiles
  for(let i = 0; i < projectiles.length; i++) {
    ctx.beginPath();
    ctx.arc(projectiles[i].x,projectiles[i].y,projectiles[i].radius,0,Math.PI*2);
    ctx.fill();
  }

  //Enemies
  ctx.fillStyle = "green"
  for (let i = 0; i < enemies.length; i++) {
    ctx.beginPath();
    ctx.arc(enemies[i].x,enemies[i].y,enemies[i].radius,0,Math.PI*2);
    ctx.fill();
  };

  //Crosshair
  ctx.fillStyle ="red";
  ctx.beginPath();
  ctx.arc(mouse.x,mouse.y,15,0,Math.PI*2);
  ctx.arc(mouse.x,mouse.y,10,0,Math.PI*2,true);
  ctx.fill();
  ctx.fillRect(mouse.x-20,mouse.y-2.5,40,5);
  ctx.fillRect(mouse.x-2.5,mouse.y-20,5,40);
};

function loop() {
  if (!alive) return;
  update();
  render();
  requestAnimationFrame(loop);
};

function collision(e,p) {
  const xDist = e.x - p.x;
  const yDist = e.y - p.y;
  const collisionDist = e.radius + p.radius;
  return xDist*xDist + yDist*yDist <= collisionDist*collisionDist;
};

function spawnEnemy() {
  if (!alive) return;
  for (let i = 0; i < waveSize; i++) {
    let x,y;
    let side = Math.floor(Math.random()*4)
    switch (side) {
      case 0:
        x = 0;
        y = Math.random()*1080;
        break;
      case 1:
        y = 0;
        x = Math.random()*1920;
        break;
      case 2:
        x = 1920;
        y = Math.random()*1080
        break;
      case 3:
        y = 1080;
        x = Math.random()*1920
        break;
      default:
        console.log(side)
        throw new Error("Somehow the spawn enemy side was not 0-3")
    };
    let angle = Math.atan2(y-turret.y,x-turret.x);

    enemies.push({
      x:x,
      y:y,
      radius:25,
      dead:false,
      dx:Math.cos(angle),
      dy:Math.sin(angle),
      speed:1,
    });
  };
  waveSize += 1;
}

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.x - rect.left)*canvas.width/rect.width;
  mouse.y = (e.y - rect.top)*canvas.height/rect.height;
  mouse.xRel = mouse.x - turret.x;
  mouse.yRel = mouse.y - turret.y;
  mouse.angle = Math.atan2(mouse.yRel,mouse.xRel);
});

canvas.addEventListener("mousedown", (e) => {
  const dx = Math.cos(mouse.angle);
  const dy = Math.sin(mouse.angle);

  projectiles.push({
    x:turret.x+50*dx,
    y:turret.y+50*dy,
    dx:dx,
    dy:dy,
    speed:3,
    radius:10,
    dead:false,
  });
});

document.getElementById("restartBtn").addEventListener("click",initialize);

initialize()
