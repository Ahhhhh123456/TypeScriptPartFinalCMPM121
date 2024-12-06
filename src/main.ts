"use strict";

// Register the Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/TypeScriptPartFinalCMPM121/service-worker.js')
    .then(() => console.log('Service Worker registered successfully.'))
    .catch((error) => console.error('Service Worker registration failed:', error));
}

// Import necessary modules with type declarations
import { PlantGrowthManager } from './GameLogic/PlantManager';  // No `.js` in TypeScript imports to rely on module resolution
import Phaser, { Types } from "phaser";  // Import Phaser and its types
import jsyaml from "js-yaml";  // Ensure jsyaml is properly imported with types
import Load from './Scenes/Load';
import Platformer from './Scenes/Platformer';

// Initialize the PlantGrowthManager with proper typing
const growthManager: PlantGrowthManager = new PlantGrowthManager();

// Define constants and variables for global usage
const SCALE: number = 2.0;
let cursors: Phaser.Types.Input.Keyboard.CursorKeys;
let my: { sprite: Record<string, Phaser.GameObjects.Sprite>, text: Record<string, Phaser.GameObjects.Text>, vfx: Record<string, any> } = {
  sprite: {},
  text: {},
  vfx: {}
};

// Game configuration with full typing via Phaser Types
const config: Types.Core.GameConfig = {
  parent: "phaser-game",
  type: Phaser.CANVAS,
  render: {
    pixelArt: true,  // Prevent pixel art from getting blurred when scaled
  },
  width: 640,
  height: 640,
  scene: [Load, Platformer],  // Load and Platformer need to be typed, if available
};

// Create the Phaser game instance
const game: Phaser.Game = new Phaser.Game(config);

// Function to load events from an external YAML file
function loadEvents(): void {
  fetch('assets/events.yaml') // Adjust path based on your project structure
    .then(response => response.text())  // Fetch the file as text
    .then((yamlText: string) => {
      // Parse YAML content using `jsyaml`
      const events = <Array<{ event: string; time: number; action: string }>>jsyaml.load(yamlText);
      handleEvents(events);  // Handle events after loading
    })
    .catch(error => console.error('Error loading events:', error));
}

// Function to handle events based on the YAML data
function handleEvents(events: Array<{ event: string; time: number; action: string }>): void {
  events.forEach(event => {
    console.log(`Event: ${event.event}, Time: ${event.time}, Action: ${event.action}`);

    // Handle plant growth
    if (event.event === "Grow plants") {
      setTimeout(() => {
        console.log("Growing plants!");
        growthManager.plants.forEach(plant => plant.grow());  // Grow all plants
      }, event.time * 1000);  // Convert time to milliseconds
    }

    // Handle flower generation
    if (event.event === "Generate flower") {
      setTimeout(() => {
        console.log("Generating a new flower!");
        growthManager.addPlant("Flower");  // Add a new flower to the manager
      }, event.time * 1000);
    }

    // Handle water level increase
    if (event.event === "Increase water level") {
      setTimeout(() => {
        console.log("Increasing water level by 2!");
        growthManager.waterPlant(0);  // Water the first plant, as an example
      }, event.time * 1000);
    }
  });
}

// Start loading events
loadEvents();

// Example: Add some plants manually for initialization
growthManager.addPlant("Flower");
growthManager.addPlant("Tree");
growthManager.addPlant("Cactus");

// Simulate growth over time (e.g., in your game loop or with setInterval)
setInterval(() => {
  growthManager.updateGrowth();  // Update growth for each plant
}, 1000);  // Update every second

// Simulate watering a plant (this could be triggered by other game events)
growthManager.waterPlant(0);  // Water the first plant (e.g., the Flower)
