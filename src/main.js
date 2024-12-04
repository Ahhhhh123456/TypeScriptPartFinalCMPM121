"use strict";

import { PlantGrowthManager } from './GameLogic/PlantManager.js'; // Correct import

// Initialize the PlantGrowthManager
let growthManager = new PlantGrowthManager();


// Game configuration (Phaser setup)
let config = {
  parent: "phaser-game",
  type: Phaser.CANVAS,
  render: {
    pixelArt: true, // Prevent pixel art from getting blurred when scaled
  },
  width: 640,
  height: 640,
  scene: [Load, Platformer], // Load and Platformer scenes
};

var cursors;
const SCALE = 2.0;
var my = { sprite: {}, text: {}, vfx: {} };

// Create the Phaser game instance
const game = new Phaser.Game(config);

// Load events from external YAML file
function loadEvents() {
  fetch('assets/events.yaml') // Change this path if necessary
    .then(response => response.text())  // Fetch the file as text
    .then(yamlText => {
      const events = jsyaml.load(yamlText); // Parse YAML content
      handleEvents(events);  // Handle events after loading
    })
    .catch(error => console.error('Error loading events:', error));
}

// Handle events based on the YAML data
function handleEvents(events) {
  events.forEach(event => {
    console.log(`Event: ${event.event}, Time: ${event.time}, Action: ${event.action}`);

    // Handling plant growth
    if (event.event === "Grow plants") {
      setTimeout(() => {
        console.log("Growing plants!");
        growthManager.plants.forEach(plant => plant.grow()); // Grow all plants
      }, event.time * 1000); // Convert time to milliseconds
    }

    // Handling flower generation
    if (event.event === "Generate flower") {
      setTimeout(() => {
        console.log("Generating a new flower!");
        growthManager.addPlant("Flower");  // Add a new flower to the manager
      }, event.time * 1000);
    }

    // Handling water level increase
    if (event.event === "Increase water level") {
      setTimeout(() => {
        console.log("Increasing water level by 2!");
        growthManager.waterPlant(0); // Water the first plant (for example)
      }, event.time * 1000);
    }
  });
}

// Start the game and load events
loadEvents();

// Example: Add some plants manually
growthManager.addPlant("Flower");
growthManager.addPlant("Tree");
growthManager.addPlant("Cactus");

// Simulate growth over time (e.g., in your game loop or with setInterval)
setInterval(() => {
  growthManager.updateGrowth();  // Update growth for each plant
}, 1000); // Update every second

// Simulate watering a plant (could be triggered by events as well)
growthManager.waterPlant(0);  // Water the first plant (Flower)
