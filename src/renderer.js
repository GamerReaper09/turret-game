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
const nextWaveCounter = document.getElementById("nextWave");
const cashCounter = document.getElementById("cashCounter");
const speedCounter = document.getElementById("speedCounter");
const cost1Counter = document.getElementById("cost1Counter");
const bonusCounter = document.getElementById("cashBonusCounter");
const cost2Counter = document.getElementById("cost2Counter");
const sizeCounter = document.getElementById("sizeCounter");
const cost3Counter = document.getElementById("cost3Counter");
const enemySpeedCounter = document.getElementById("enemySpeedCounter");
const cost4Counter = document.getElementById("cost4Counter");
const cost5Counter = document.getElementById("cost5Counter");
const cost6Counter = document.getElementById("cost6Counter");

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

let score,alive,waveSize,waveCd,projectiles,enemies,prevWave,time,cash,bulletSpeed,cost1,cost2,cashBonus,bulletSize,cost3,enemySpeed,cost4,cost5,multishot,cost6,secret;


function initialize() {
  gameOverDiv.hidden = true;
  score = 0;
  alive = true;
  waveSize = 5;
  waveCd = 5000;
  time = performance.now();
  prevWave = time-4000;
  cash = 0;
  bulletSpeed = 2;
  cost1 = 500;
  cashBonus = 0;
  cost2 = 500;
  cost3 = 500;
  bulletSize = 10;
  cost4 = 1500;
  enemySpeed = 1;
  cost5 = 10000;
  multishot = false;
  cost6 = 50000;
  secret = false;

  projectiles = [];
  enemies = [];
  scoreCounter.textContent = score;
  cashCounter.textContent = cash;
  speedCounter.textContent = bulletSpeed;
  cost1Counter.textContent = cost1;
  bonusCounter.textContent = "0%";
  cost2Counter.textContent = cost2;
  cost3Counter.textContent = cost3;
  sizeCounter.textContent = bulletSize;
  enemySpeedCounter.textContent = enemySpeed;
  cost4Counter.textContent = cost4;
  cost5Counter.textContent = cost5;
  cost6Counter.textContent = cost6;

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
    enemy.x -= enemy.dx*enemySpeed;
    enemy.y -= enemy.dy*enemySpeed;
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
      cash += 100*(1+cashBonus/100);
      scoreCounter.textContent = score;
    };
  };
  //Enemy spawn
  time = performance.now();
  nextWaveCounter.textContent = Math.floor((waveCd-time+prevWave)/100)/10;
  if (time - prevWave >= waveCd) {
    prevWave = time;
    spawnEnemy();
  }
  //Collision cleanup
  enemies = enemies.filter(e => !e.dead);
  projectiles = projectiles.filter(p => !p.dead);

  cashCounter.textContent = cash;
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
    });
  };
  waveSize += 1;
  waveCd += 100;
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
    speed:bulletSpeed,
    radius:bulletSize,
    dead:false,
  });
  if (multishot) {
    setTimeout(() => {
      projectiles.push({
        x:turret.x+50*dx,
        y:turret.y+50*dy,
        dx:dx,
        dy:dy,
        speed:bulletSpeed,
        radius:bulletSize,
        dead:false,
      });
        setTimeout(() => {
        projectiles.push({
          x:turret.x+50*dx,
          y:turret.y+50*dy,
          dx:dx,
          dy:dy,
          speed:bulletSpeed,
          radius:bulletSize,
          dead:false,
        });
      },100);
    },100);
  }
  if (secret) {
    for (let i = 0; i < 20; i++) {
      const idx = Math.cos(Math.PI*i/10)
      const idy = Math.sin(Math.PI*i/10)
      projectiles.push({
        x:turret.x+50*dx,
        y:turret.y+50*dy,
        dx:idx,
        dy:idy,
        speed:bulletSpeed,
        radius:bulletSize,
        dead:false,
  });
    }
  }
});

document.getElementById("restartBtn").addEventListener("click",initialize);

document.getElementById("shop").addEventListener("click", (e) => {
  if (!e.target.classList.contains("slot")) return;

  switch (e.target.dataset.slot) {
    case "1":
      if (cash >= cost1) {
        cash -= cost1
        bulletSpeed ++;
        speedCounter.textContent = bulletSpeed;
        cost1 += 500;
        cost1Counter.textContent = cost1;
        if (bulletSpeed == 13) {
          cost1 = 10000000000
          cost1Counter.textContent = "Max";
        }
      }
      break;
    case "2":
      if (cash >= cost2) {
        cash -= cost2
        cashBonus += 10;
        bonusCounter.textContent = cashBonus+"%"
        cost2 += 2000;
        cost2Counter.textContent = cost2;
        if (cashBonus == 100) {
          cost2 = 10000000000
          cost2Counter.textContent = "Max"
        }
      }
      break;
    case "3":
      if (cash >= cost3) {
        cash -= cost3;
        bulletSize += 1;
        sizeCounter.textContent = bulletSize;
        cost3 += 500;
        cost3Counter.textContent=cost3;
        if (bulletSize == 30) {
          cost3 = 10000000000;
          cost3Counter.textContent = "Max"
        }
      }
      break;
    case "4":
      if (cash >= cost4) {
        cash -= cost4;
        enemySpeed = Math.floor(enemySpeed * 0.95*1000)/1000
        enemySpeedCounter.textContent = enemySpeed;
        cost4 = Math.floor(cost4*1.5)
        cost4Counter.textContent = cost4;
        if (enemySpeed < 0.5) {
          cost4 = 10000000000;
          cost4Counter.textContent = "Max"
        }

      }
      break;
    case "5":
      if (cash >= cost5) {
        cash -= cost5;
        multishot = true;
        cost5 = 10000000000;
        cost5Counter.textContent = "Already unlocked"
      }
      break;
    case "6":
      if (cash >= cost6) {
        cash -= cost6;
        cashBonus += 10000;
        bonusCounter.textContent = cashBonus+"%"
        secret = true;
        cost6Counter.textContent = "Already unlocked"
        cost6 = 10000000000;
        
      }
      break;
  }
})


initialize()
