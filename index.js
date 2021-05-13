import * as THREE from "https://unpkg.com/three@0.126.1/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js";
import { Line2 } from "https://unpkg.com/three@0.126.1/examples/jsm/lines/Line2.js";
import { LineMaterial } from "https://unpkg.com/three@0.126.1/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "https://unpkg.com/three@0.126.1/examples/jsm/lines/LineGeometry.js";

const canvas = document.getElementById("myCanvas");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.001, 1000);
camera.position.z = 120;
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });

const controls = new OrbitControls(camera, canvas);

let particles;
const dt = 0.002;
const maxTrailLength = 200;
const rho = 28;
const sigma = 10;
const beta = 8 / 3;

class Particle {
	constructor() {
		const x = Math.random() * 20 - 10;
		const y = Math.random() * 20 - 10;
		const z = Math.random() * 20 - 10;
		this.pos = new THREE.Vector3(x, y, z);
		this.shape = this.createShape();

		this.numPoints = 0;
		this.trail = this.createTrail();
	}

	move() {
		const dx = sigma * (this.pos.y - this.pos.x);
		const dy = this.pos.x * (rho - this.pos.z) - this.pos.y;
		const dz = this.pos.x * this.pos.y - beta * this.pos.z;

		this.pos.x += dx * dt;
		this.pos.y += dy * dt;
		this.pos.z += dz * dt;
		this.shape.position.set(this.pos.x, this.pos.y, this.pos.z);

		//update trail
		for (let i = maxTrailLength * 3 - 1; i > 4; i -= 3) {
			this.trailPoints[i] = this.trailPoints[i - 3];
			this.trailPoints[i - 1] = this.trailPoints[i - 4];
			this.trailPoints[i - 2] = this.trailPoints[i - 5];
		}
		this.trailPoints[0] = this.pos.x;
		this.trailPoints[1] = this.pos.y;
		this.trailPoints[2] = this.pos.z;

		this.numPoints++;
		if (this.numPoints > maxTrailLength) this.numPoints = maxTrailLength;
		const speed = Math.ceil(Math.sqrt(new THREE.Vector3(dx, dy, dz).length()) * 10);

		this.trail.geometry.instaceCount = Math.min(Math.min(speed, this.numPoints));
		this.trail.geometry.setPositions(this.trailPoints);
	}

	createShape() {
		const geometry = new THREE.SphereGeometry(0.2, 16, 16);
		const material = new THREE.MeshBasicMaterial({ color: "#16e086" });
		const shape = new THREE.Mesh(geometry, material);
		shape.position.set(this.pos.x, this.pos.y, this.pos.z);
		scene.add(shape);
		return shape;
	}

	createTrail() {
		const material = new LineMaterial({
			color: `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`,
			linewidth: 0.005,
			opacity: 0.5,
			transparent: true,
		});
		const geometry = new LineGeometry();

		this.trailPoints = new Float32Array(maxTrailLength * 3);

		geometry.setPositions(this.trailPoints);
		geometry.instaceCount = 0;
		const line = new Line2(geometry, material);
		scene.add(line);
		return line;
	}
}

const reset = () => {
	particles = [];

	for (let i = 0; i < 50; i++) {
		particles.push(new Particle());
	}

	requestAnimationFrame(animate);
};

const animate = () => {
	requestAnimationFrame(animate);

	particles.forEach((p) => {
		p.move();
	});

	renderer.render(scene, camera); //render the scene
};

document.onload = reset();
