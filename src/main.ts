// Register the Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/TypeScriptPartFinalCMPM121/service-worker.js')
    .then(() => console.log('Service Worker registered successfully.'))
    .catch((error) => console.error('Service Worker registration failed:', error));
}

// Import necessary modules with type declarations
import { PlantGrowthManager } from './GameLogic/PlantManager';
import Phaser, { Types } from "phaser";
import jsyaml from "js-yaml";
import Load from './Scenes/Load';
import Platformer from './Scenes/Platformer';

// Initialize the PlantGrowthManager
const growthManager: PlantGrowthManager = new PlantGrowthManager();

// Constants
const SCALE: number = 2.0;
let cursors: Phaser.Types.Input.Keyboard.CursorKeys;
let my: {
  sprite: Record<string, Phaser.GameObjects.Sprite>,
  text: Record<string, Phaser.GameObjects.Text>,
  vfx: Record<string, any>
} = {
  sprite: {},
  text: {},
  vfx: {}
};

// Game configuration with scaling
const config: Types.Core.GameConfig = {
  parent: "phaser-game", // Attach Phaser to the div with id="phaser-game"
  type: Phaser.CANVAS,
  render: {
    pixelArt: true, // Prevent pixel art from getting blurred
  },
  width: 640, // Base game width
  height: 640, // Base game height
  scale: {
    mode: Phaser.Scale.FIT, // Scale to fit available space while preserving the aspect ratio
    autoCenter: Phaser.Scale.CENTER_BOTH // Center the game canvas on the screen
  },
  scene: [Load, Platformer], // Game scenes
};

// Create the Phaser game instance
const game: Phaser.Game = new Phaser.Game(config);

// Add orientation handling to notify the player about orientation changes
game.scale.on('orientationchange', (orientation: Phaser.Scale.Orientation) => {
  if (orientation === Phaser.Scale.Orientation.PORTRAIT) {
    console.log('Portrait mode detected! Please rotate to landscape.');
    // Optional: You could show a notification or overlay here
  } else if (orientation === Phaser.Scale.Orientation.LANDSCAPE) {
    console.log('Landscape mode detected!');
  }
});

// Add resize handling to ensure game adjusts dynamically to screen size
game.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
  const { width, height } = gameSize;
  console.log(`Game resized to: width=${width}, height=${height}`);
  game.scene.scenes.forEach(scene => {
    scene.cameras.resize(width, height);
  });
});

// Load events from the YAML file
function loadEvents(): void {
  fetch('assets/events.yaml')
    .then(response => response.text())
    .then((yamlText: string) => {
      const events = <Array<{ event: string; time: number; action: string }>>jsyaml.load(yamlText);
      handleEvents(events);
    })
    .catch(error => console.error('Error loading events:', error));
}

// Handle events using YAML configuration
function handleEvents(events: Array<{ event: string; time: number; action: string }>): void {
  events.forEach((event) => {
    console.log(`Event: ${event.event}, Time: ${event.time}, Action: ${event.action}`);
    if (event.event === "Grow plants") {
      setTimeout(() => {
        console.log("Growing plants!");
        growthManager.plants.forEach(plant => plant.grow());
      }, event.time * 1000);
    }
    if (event.event === "Generate flower") {
      setTimeout(() => {
        console.log("Generating a new flower!");
        growthManager.addPlant("Flower");
      }, event.time * 1000);
    }
    if (event.event === "Increase water level") {
      setTimeout(() => {
        console.log("Increasing water level by 2!");
        growthManager.waterPlant(0);
      }, event.time * 1000);
    }
  });
}

// Load events
loadEvents();

// Add example plants for initialization
growthManager.addPlant("Flower");
growthManager.addPlant("Tree");
growthManager.addPlant("Cactus");

// Simulate growth over time
setInterval(() => {
  growthManager.updateGrowth();
}, 1000); // Update every second

// Simulate watering a plant
growthManager.waterPlant(0);