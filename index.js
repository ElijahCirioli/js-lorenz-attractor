import * as THREE from "https://unpkg.com/three@0.126.1/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js";

const canvas = document.getElementById("myCanvas");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.001, 1000);
camera.position.z = 90;
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });

const controls = new OrbitControls(camera, canvas);

//global variables
let particles, stats, numParticles;
let showTrails = true;
let playing = true;

//constants
const dt = 0.002;
const maxTrailLength = 100;
const rho = 28;
const sigma = 10;
const beta = 8 / 3;

class Particle {
	constructor() {
		const x = Math.random() * 30 - 15;
		const y = Math.random() * 30 - 15;
		const z = Math.random() * 30 - 15;
		this.pos = new THREE.Vector3(x, y, z);
		this.shape = this.createShape();

		this.numPoints = 0;
		this.trail = this.createTrail();
	}

	move() {
		//the actual lorenz equations
		const dx = sigma * (this.pos.y - this.pos.x);
		const dy = this.pos.x * (rho - this.pos.z) - this.pos.y;
		const dz = this.pos.x * this.pos.y - beta * this.pos.z;

		//move the particle
		this.pos.x += dx * dt;
		this.pos.y += dy * dt;
		this.pos.z += dz * dt;
		this.shape.position.set(this.pos.x, this.pos.y, this.pos.z);

		//update trail (very inefficient)
		for (let i = maxTrailLength * 3 - 1; i > 4; i -= 3) {
			this.trailPoints[i] = this.trailPoints[i - 3];
			this.trailPoints[i - 1] = this.trailPoints[i - 4];
			this.trailPoints[i - 2] = this.trailPoints[i - 5];
		}
		this.trailPoints[0] = this.pos.x;
		this.trailPoints[1] = this.pos.y;
		this.trailPoints[2] = this.pos.z;

		if (this.numPoints < maxTrailLength) this.numPoints++;
		const speed = Math.ceil(Math.sqrt(new THREE.Vector3(dx, dy, dz).length()) * 15);

		//display trail (if applicable)
		if (showTrails) {
			this.trail.geometry.setDrawRange(0, Math.min(speed, this.numPoints));
			const pos = this.trail.geometry.attributes.position;
			pos.array = this.trailPoints;
			pos.needsUpdate = true;
		} else {
			this.trail.geometry.setDrawRange(0, 0);
		}
	}

	//create THREE.js shape for point
	createShape() {
		const geometry = new THREE.SphereGeometry(0.2, 16, 16);
		const material = new THREE.MeshBasicMaterial({ color: "#16e086" });
		const shape = new THREE.Mesh(geometry, material);
		shape.position.set(this.pos.x, this.pos.y, this.pos.z);
		scene.add(shape);
		return shape;
	}

	//create THREE.js shape for trail
	createTrail() {
		//randomly assign color
		const material = new THREE.LineBasicMaterial({
			color: `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`,
		});
		const geometry = new THREE.BufferGeometry();

		//we can't do this as an array of vectors which is annoying
		this.trailPoints = new Float32Array(maxTrailLength * 3);
		for (let i = 0; i < maxTrailLength * 3; i += 3) {
			this.trailPoints[i] = this.pos.x;
			this.trailPoints[i + 1] = this.pos.y;
			this.trailPoints[i + 2] = this.pos.z;
		}

		geometry.setAttribute("position", new THREE.BufferAttribute(this.trailPoints, 3));
		geometry.setDrawRange(0, this.numPoints);
		const line = new THREE.Line(geometry, material);
		scene.add(line);
		return line;
	}
}

const reset = () => {
	//remove all children
	while (scene.children.length) {
		scene.remove(scene.children[0]);
	}

	particles = []; //empty particle array
	updateSlider(); //add particles from slider value
};

const animate = () => {
	stats.begin();

	if (playing) {
		particles.forEach((p) => {
			p.move();
		});
	}

	renderer.render(scene, camera); //render the scene
	stats.end();
	requestAnimationFrame(animate);
};

//update the slider that controls how many particles there are
const updateSlider = () => {
	numParticles = document.getElementById("number").value;
	//special case to remove "s" from label
	if (numParticles === 1) {
		document.getElementById("label").textContent = "1 particle";
	} else {
		document.getElementById("label").textContent = `${numParticles} particles`;
	}

	//add or remove particles to match the desired number
	if (particles.length < numParticles) {
		for (let i = particles.length; i < numParticles; i++) {
			particles.push(new Particle());
		}
	} else if (particles.length > numParticles) {
		for (let i = particles.length - 1; i >= numParticles; i--) {
			const p = particles[i];
			scene.remove(p.trail);
			scene.remove(p.shape);
			particles.splice(i, 1);
		}
	}
};

window.onload = () => {
	reset();

	//create fps counter
	stats = new Stats();
	stats.showPanel(0);
	document.getElementById("fps-holder").appendChild(stats.dom);

	requestAnimationFrame(animate); //start render loop

	//event listeners
	document.getElementById("number").addEventListener("input", updateSlider);
	document.getElementById("reset").addEventListener("click", reset);
	document.getElementById("trails").addEventListener("input", function () {
		showTrails = this.checked;
	});
	document.getElementById("points").addEventListener("input", function () {
		particles.forEach((p) => {
			p.shape.visible = this.checked;
		});
	});
	document.getElementById("fps").addEventListener("input", function () {
		if (this.checked) {
			document.getElementById("fps-holder").style.display = "block";
		} else {
			document.getElementById("fps-holder").style.display = "none";
		}
	});
	document.getElementById("play").addEventListener("click", function () {
		if (playing) {
			this.textContent = "Play";
		} else {
			this.textContent = "Stop";
		}
		playing = !playing;
	});
};
