import * as THREE from "https://cdn.skypack.dev/three@0.128.0";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/GLTFLoader.js";
import { SkeletonUtils } from "https://cdn.skypack.dev/three@0.128.0/examples/jsm/utils/SkeletonUtils.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
scene.background = new THREE.Color(0x8cc3f4);
document.body.appendChild(renderer.domElement);

camera.position.set(0, 50, 5);
camera.lookAt(new THREE.Vector3(0, 0, -100)); // = 5;
const PI = 3.14;

// Load plane model
var plane = undefined;
const loader = new GLTFLoader();
loader.load(
  "assets/new_plane/scene.gltf",
  function (gltf) {
    plane = gltf.scene;
    let scale = 0.4;
    plane.scale.set(scale, scale, scale);
    plane.rotation.set(0, 0, 0);
    plane.position.set(0, 0, -100);
    plane.rotation.x = PI + PI / 6;
    plane.rotation.z = PI;
    plane.position.x = -30;
    scene.add(gltf.scene);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

// Load stars model
const NUM_STARS = 10;
var stars = [];
var star = undefined;
for (let i = 0; i < NUM_STARS; i++) {
  loader.load(
    "assets/star/scene.gltf",
    function (gltf) {
      star = gltf.scene;
      let xloc = (Math.random() - 0.5) * window.innerWidth * 0.4;
      let zloc = (Math.random() - 0.5) * 600 - 500;
      star.position.set(xloc, 20, zloc);
      let scale = 4;
      star.scale.set(scale, scale, scale);
      scene.add(gltf.scene);
      stars.push(star);
      console.log("star added");
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );
}

// Load missiles
var missiles = [];
var missilePrototype = undefined;
loader.load(
  "assets/missile/scene.gltf",
  function (gltf) {
    missilePrototype = gltf.scene;
    missilePrototype.scale.set(0.2, 0.2, 0.2);
    missilePrototype.rotation.x = (3 * PI) / 2;
  },
  undefined,
  function (error) {
    console.log(error);
  }
);

// Load enemies
const NUM_ENEMIES = 3;
var enemies = [];
var enemy = undefined;
for (let i = 0; i < NUM_ENEMIES; i++) {
  loader.load(
    "assets/enemy/scene.gltf",
    function (gltf) {
      enemy = gltf.scene;
      let scale = 5;
      enemy.scale.set(scale, scale, scale);
      let zloc = -200 * Math.random() - 150;
      let xloc = (Math.random() - 0.5) * window.innerWidth * 0.2;
      enemy.position.set(xloc, 30, zloc);
      enemy.rotation.x = PI / 60;
      enemy.direction = 1;
      enemies.push(enemy);
      scene.add(enemy);
    },
    undefined,
    function (error) {
      console.log(error);
    }
  );
}

// Function to spawn missile on shoot
function spawnMissile(pos) {
  console.log("spawning new missile");
  let newMissile = SkeletonUtils.clone(missilePrototype);
  newMissile.position.set(pos.x + 25, pos.y, pos.z - 40);
  scene.add(newMissile);
  missiles.push(newMissile);
}

var health = 100;
var score = 0;
var gameOver = false;

function animate() {
  requestAnimationFrame(animate);

  if (gameOver) {
    renderGameOver();
    return;
  }

  // Star movement
  for (let star of stars) {
    star.rotation.x += 0.1;
    star.position.z += 1.5;
    if (star.position.z > -10) {
      star.position.z = -500;
      star.position.x = (Math.random() - 0.5) * window.innerWidth * 0.4;
    }
    // Star collision with player
    if (
      star.position.z < plane.position.z + 10 &&
      star.position.z > plane.position.z - 10 &&
      star.position.x < plane.position.x + 70 &&
      star.position.x > plane.position.x - 10
    ) {
      star.position.z = -500;
      star.position.x = (Math.random() - 0.5) * window.innerWidth * 0.4;
      score += 5;
    }
  }

  // Enemy movement
  for (let enemy of enemies) {
    enemy.position.z += 0.2;
    if (enemy.position.z > -10) {
      enemy.position.z = -200;
      enemy.position.x = (Math.random() - 0.5) * window.innerWidth * 0.2;
    }

    enemy.position.x += 0.2 * enemy.direction;
    if (
      enemy.position.x > 0.1 * window.innerWidth ||
      enemy.position.x < -0.1 * window.innerWidth
    ) {
      enemy.direction *= -1;
    }
    // Enemy collision with player
    if (
      enemy.position.z < plane.position.z + 10 &&
      enemy.position.z > plane.position.z - 5 &&
      enemy.position.x < plane.position.x + 40 &&
      enemy.position.x > plane.position.x - 10
    ) {
      enemy.position.z = -200 * Math.random() - 250;
      enemy.position.x = (Math.random() - 0.5) * window.innerWidth * 0.2;
      health -= 10;
    }
    enemy.rotation.y += 0.1;
  }

  // Missile movement
  for (let i = 0; i < missiles.length; i++) {
    missiles[i].position.z -= 7.6;
    if (missiles[i].position.z < -800) {
      scene.remove(missiles[i]);
      missiles.splice(i, 1);
      console.log("removed");
    }
    // Missile collision with enemies
    for (let enemy of enemies) {
      if (
        enemy.position.z < missiles[i].position.z + 10 &&
        enemy.position.z > missiles[i].position.z - 10 &&
        enemy.position.x < missiles[i].position.x + 10 &&
        enemy.position.x > missiles[i].position.x - 10
      ) {
        score += 20;
        enemy.position.z = -200 * Math.random() - 250;
        enemy.position.x = (Math.random() - 0.5) * window.innerWidth * 0.2;
        scene.remove(missiles[i]);
        missiles.splice(i, 1);
      }
    }
  }

  // Handle game over
  if (health <= 0) {
    scene.remove(plane);
    for (let enemy of enemies) {
      scene.remove(enemy);
    }
    for (let star of stars) {
      scene.remove(star);
    }
    gameOver = true;
  }

  renderer.render(scene, camera);

  renderScore();
}

function inputHandler(e) {
  if (e.key == "a") {
    plane.position.x = Math.max(
      plane.position.x - 1.5,
      -0.1 * window.innerWidth
    );
  } else if (e.key == "d") {
    plane.position.x = Math.min(
      plane.position.x + 1.5,
      0.1 * window.innerWidth - 50
    );
  } else if (e.key == "w") {
    plane.position.z = Math.max(plane.position.z - 1.5, -200);
  } else if (e.key == "s") {
    plane.position.z = Math.min(plane.position.z + 1.5, 0);
  } else if (e.key == "k") {
    spawnMissile(plane.position);
  } else {
    console.log(e.key);
  }
}

function renderScore() {
  let hud = document.getElementById("hud");
  hud.innerHTML = `Health: ${health} <br>Score: ${score}`;
}

function renderGameOver() {
  let gameover = document.getElementById("gameover");
  gameover.innerText = "Game Over";
}

window.addEventListener("keypress", inputHandler);

animate();
