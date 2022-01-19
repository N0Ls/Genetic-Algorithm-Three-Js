import "./style.css";
import * as THREE from "three";
import * as dat from "dat.gui";
import { Vector2 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Mouse object
const mouse = new Vector2();

// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Basic material and geometry
const basicMaterial = new THREE.MeshStandardMaterial({ color: "#b2b6b1" });
const squareGeometry = new THREE.BoxBufferGeometry(0.01, 0.01, 0.01);

const paramsBasic = {
	color: 0xb2b6b1,
};
gui.addColor(paramsBasic, "color").onChange(() => {
	basicMaterial.color.set(paramsBasic.color);
});

// Utils functions
const getRandomCoordinates = (width, height, depth) => {
	return {
		x: Math.random() * width * 2 - width,
		y: Math.random() * height * 2 - height,
		z: Math.random() * depth * 2 - depth,
	};
};

const distanceBetweenTwoPoint = (x1, y1, z1, x2, y2, z2) => {
	return Math.sqrt(
		Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2)
	);
};

// Population Size
const populationSize = 1000;

//Mutation rates
let xMutationProbability = { xProbability: 0.3 };
const probabilitiesFolder = gui.addFolder("Probabilities");
probabilitiesFolder
	.add(xMutationProbability, "xProbability")
	.min(0)
	.max(1)
	.step(0.001);
const yMutationProbability = { yProbability: 0.3 };
probabilitiesFolder
	.add(yMutationProbability, "yProbability")
	.min(0)
	.max(1)
	.step(0.001);

const zMutationProbability = { zProbability: 0.3 };
probabilitiesFolder
	.add(yMutationProbability, "yProbability")
	.min(0)
	.max(1)
	.step(0.001);

const selectionRate = 0.5;
const numberOfSurvivors = Math.round(populationSize * selectionRate);
const sliceIndex = Math.round(populationSize * (1 - selectionRate));

const survivalProbability = { p: 2 };
probabilitiesFolder.add(survivalProbability, "p").min(1.1).max(10).step(0.1);

// Sizes object
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
	aspectRatio: window.innerWidth / window.innerHeight,
};

// Classes
class Individual {
	constructor(position) {
		this.position = {
			x: position.x,
			y: position.y,
			z: position.z,
		};

		this.fitness = 0;

		this.group = new THREE.Group();
		scene.add(this.group);

		const meshSquare = new THREE.Mesh(squareGeometry, basicMaterial);
		this.group.add(meshSquare);
		this.group.position.set(this.position.x, this.position.y, this.position.z);
	}

	setPosition(x, y, z) {
		this.position = { x, y, z };
		this.group.position.x = x;
		this.group.position.y = y;
		this.group.position.z = z;
	}

	setPosition({ x, y, z }) {
		this.position = { x, y, z };
		this.group.position.x = x;
		this.group.position.y = y;
		this.group.position.z = z;
	}

	mutate() {
		const xDraw = Math.random();
		const yDraw = Math.random();
		const zDraw = Math.random();
		if (xDraw < xMutationProbability.xProbability) {
			Math.random() > 0.5 ? (this.position.x += 0.1) : (this.position.x -= 0.1);
		}
		if (yDraw < yMutationProbability.yProbability) {
			Math.random() > 0.5 ? (this.position.y += 0.1) : (this.position.y -= 0.1);
		}
		if (zDraw < zMutationProbability.zProbability) {
			Math.random() > 0.5 ? (this.position.z += 0.1) : (this.position.z -= 0.1);
		}
	}

	computeFitness() {
		this.fitness = distanceBetweenTwoPoint(
			this.position.x,
			this.position.y,
			this.position.z,
			sphereMesh.position.x,
			sphereMesh.position.y,
			sphereMesh.position.z
		);
	}

	crossOver(parentB) {
		const crossOverPoint = Math.random();

		const intervalX = (this.position.x - parentB.position.x) * crossOverPoint;
		const intervalY = (this.position.y - parentB.position.y) * crossOverPoint;
		const intervalZ = (this.position.z - parentB.position.z) * crossOverPoint;

		return new Individual({
			x: this.position.x - intervalX,
			y: this.position.y - intervalY,
			z: this.position.z - intervalZ,
		});
	}

	checkCoordinates() {
		if (this.position.x > 1) {
			this.position.x = 1;
		}
		if (this.position.x < -1) {
			this.position.x = -1;
		}
		if (this.position.y > 1) {
			this.position.y = 1;
		}
		if (this.position.y < -1) {
			this.position.y = -1;
		}
		if (this.position.z > 1) {
			this.position.z = 1;
		}
		if (this.position.z < -1) {
			this.position.z = -1;
		}
	}
}

class Population {
	constructor(nbOfIndividuals) {
		this.nbOfIndividuals = nbOfIndividuals;

		this.population = [];
	}

	initializePopulation() {
		for (let i = 0; i < this.nbOfIndividuals; i++) {
			const randomPos = getRandomCoordinates(1, 1, 1);

			this.population[i] = new Individual(randomPos);
		}
	}

	computeNextGeneration() {
		//Compute fitness of all the individuals
		this.population.map((x) => x.computeFitness());

		//Selection
		this.population.sort((a, b) => b.fitness - a.fitness);

		// Old selection
		// for (let y = this.population.length; y > numberOfSurvivors; y--) {
		// 	if (this.population[y] === undefined) {
		// 		continue;
		// 	}
		// 	scene.remove(this.population[y].group);
		// 	this.population.pop();
		// }

		const survivorArray = [];
		for (let j = 0; j < this.population.length; j++) {
			const rdn = Math.random();
			const proba = j / (this.population.length * survivalProbability.p);
			if (rdn < proba) {
				scene.remove(this.population[j].group);
			} else {
				survivorArray.push(this.population[j]);
			}
		}
		this.population = survivorArray;

		//Crossover
		for (let y = this.population.length; y < populationSize; y++) {
			const randomA = Math.round(Math.random() * sliceIndex);
			const randomB = Math.round(Math.random() * sliceIndex);
			const parentA = this.population[randomA];
			const parentB = this.population[randomB];

			this.population.push(parentA.crossOver(parentB));
		}

		//Mutation
		this.population.map((x) => x.mutate());
		this.population.map((x) => x.checkCoordinates());
	}
}

const mainPopulation = new Population(populationSize);
mainPopulation.initializePopulation();

// Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
gui.add(ambientLight, "intensity").min(0).max(1).step(0.001);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xff0000, 1, 2);
pointLight.position.x = 0;
pointLight.position.z = 0;
pointLight.position.y = 0;
scene.add(pointLight);

/**
 * Materials
 */

const paramsPBR = {
	color: 0x5baa39,
};
const PBRmaterial = new THREE.MeshPhysicalMaterial({
	color: 0x5baa39,
	roughness: 0.5,
	metalness: 0.0,
	reflectivity: 0.5,
});

const physicalFolder = gui.addFolder("Physical Material");
physicalFolder.addColor(paramsPBR, "color").onChange(() => {
	PBRmaterial.color.set(paramsPBR.color);
});
physicalFolder.add(PBRmaterial, "metalness").min(0).max(1).step(0.01);
physicalFolder.add(PBRmaterial, "roughness").min(0).max(1).step(0.01);
physicalFolder.add(PBRmaterial, "reflectivity").min(0).max(1).step(0.01);

/**
 * Objects
 */

//Plane
const plane = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), PBRmaterial);
plane.rotation.x = 0;
plane.position.y = 0;
plane.position.z = -1;

scene.add(plane);

window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;
	sizes.aspectRatio = sizes.width / sizes.height;

	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

document.addEventListener("keydown", (e) => {
	if (e.key === "d") {
		sphereMesh.position.x += 0.05;
	}
	if (e.key === "q") {
		sphereMesh.position.x -= 0.05;
	}
	if (e.key === "z") {
		sphereMesh.position.y += 0.05;
	}
	if (e.key === "s") {
		sphereMesh.position.y -= 0.05;
	}
	if (e.key === "c") {
		sphereMesh.position.z += 0.05;
	}
	if (e.key === "v") {
		sphereMesh.position.z -= 0.05;
	}
	console.log(e);
});

document.addEventListener("mousemove", (e) => {
	mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Covid sphere
const basicMaterialSphere = new THREE.MeshStandardMaterial({
	color: "#86dc3d",
});
const sphereGeometry = new THREE.SphereBufferGeometry(0.1, 24, 24);

const sphereMesh = new THREE.Mesh(sphereGeometry, basicMaterialSphere);

scene.add(sphereMesh);

// Line
const boundaries = [2, 2, 2];
const geometry = new THREE.BoxGeometry(
	boundaries[0],
	boundaries[1],
	boundaries[2]
);
const wireframe = new THREE.EdgesGeometry(geometry);
const line = new THREE.LineSegments(wireframe);

line.material.color = new THREE.Color(0xffffff);
line.material.transparent = false;
scene.add(line);
line.visible = false;

gui.add(line, "visible");
/**
 * Camera
 */
// Base camera
// Base camera
const camera = new THREE.PerspectiveCamera(
	75,
	sizes.width / sizes.height,
	0.1,
	10000
);
camera.position.z = 3;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 1;
controls.maxDistance = 3;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

let tickCount = 0;

const tick = () => {
	const elapsedTime = clock.getElapsedTime();

	pointLight.position.x = mouse.x * sizes.aspectRatio;
	pointLight.position.y = mouse.y;

	if (tickCount % 120000) {
		mainPopulation.computeNextGeneration();
	}
	tickCount++;

	// Render
	renderer.render(scene, camera);

	// Update controls
	controls.update();

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();
