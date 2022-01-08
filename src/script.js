import "./style.css";
import * as THREE from "three";
import * as dat from "dat.gui";
import { Vector2 } from "three";

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
const squareGeometry = new THREE.BoxBufferGeometry(0.01, 0.01, 0.1);

const paramsBasic = {
	color: 0xb2b6b1,
};
gui.addColor(paramsBasic, "color").onChange(() => {
	basicMaterial.color.set(paramsBasic.color);
});

// Utils functions
const getRandomCoordinates = (width, height) => {
	return {
		x: Math.random() * width * 2 - width,
		y: Math.random() * height * 2 - height,
	};
};

const distanceBetweenTwoPoint = (x1, y1, x2, y2) => {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
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
		};

		this.fitness = 0;

		this.group = new THREE.Group();
		scene.add(this.group);

		const meshSquare = new THREE.Mesh(squareGeometry, basicMaterial);
		this.group.add(meshSquare);
		this.group.position.set(this.position.x, this.position.y, 0);
	}

	setPosition(x, y) {
		this.position = { x, y };
		this.group.position.x = x;
		this.group.position.y = y;
	}

	setPosition({ x, y }) {
		this.position = { x, y };
		this.group.position.x = x;
		this.group.position.y = y;
	}

	mutate() {
		const xDraw = Math.random();
		const yDraw = Math.random();
		if (xDraw < xMutationProbability.xProbability) {
			Math.random() > 0.5 ? (this.position.x += 0.1) : (this.position.x -= 0.1);
		}
		if (yDraw < yMutationProbability.yProbability) {
			Math.random() > 0.5 ? (this.position.y += 0.1) : (this.position.y -= 0.1);
		}
	}

	computeFitness() {
		this.fitness = distanceBetweenTwoPoint(
			this.position.x,
			this.position.y,
			mouse.x * sizes.aspectRatio,
			mouse.y
		);
	}

	crossOver(parentB) {
		const crossOverPoint = Math.random();

		const intervalX = (this.position.x - parentB.position.x) * crossOverPoint;
		const intervalY = (this.position.y - parentB.position.y) * crossOverPoint;

		return new Individual({
			x: this.position.x - intervalX,
			y: this.position.y - intervalY,
		});
	}

	checkCoordinates() {
		if (this.position.x > 1 * sizes.aspectRatio) {
			this.position.x = 1 * sizes.aspectRatio;
		}
		if (this.position.x < -1 * sizes.aspectRatio) {
			this.position.x = -1 * sizes.aspectRatio;
		}
		if (this.position.y > 1) {
			this.position.y = 1;
		}
		if (this.position.y < -1) {
			this.position.y = -1;
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
			const randomPos = getRandomCoordinates(1 * sizes.aspectRatio, 1);

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
	camera.left = -1 * sizes.aspectRatio;
	camera.right = 1 * sizes.aspectRatio;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

document.addEventListener("mousemove", (e) => {
	mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.OrthographicCamera(
	-1 * sizes.aspectRatio,
	1 * sizes.aspectRatio,
	1,
	-1,
	0.01,
	1000
);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 1;
camera.rotation.x = 0;
console.log(camera);
//camera.lookAt(plane.position);
scene.add(camera);

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

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();
