// PlantManager.js

// Internal DSL for defining plant types and their growth conditions
const PlantTypes = {
  Flower: {
    name: "Flower",
    growthRate: 1.5, // How quickly the flower grows
    maxGrowth: 100,  // Maximum size of the flower
    waterRequirement: 10, // Amount of water needed for growth
    grow() {
      console.log("The flower is growing!");
      this.size += this.growthRate;
      if (this.size > this.maxGrowth) this.size = this.maxGrowth;
    }
  },

  Tree: {
    name: "Tree",
    growthRate: 0.5,
    maxGrowth: 200,
    waterRequirement: 20,
    grow() {
      console.log("The tree is growing!");
      this.size += this.growthRate;
      if (this.size > this.maxGrowth) this.size = this.maxGrowth;
    }
  },

  Cactus: {
    name: "Cactus",
    growthRate: 0.2,
    maxGrowth: 50,
    waterRequirement: 5,
    grow() {
      console.log("The cactus is growing!");
      this.size += this.growthRate;
      if (this.size > this.maxGrowth) this.size = this.maxGrowth;
    }
  }
};

// Growth manager for handling plant growth over time
class PlantGrowthManager {
  constructor() {
    this.plants = [];
  }

  addPlant(plantType) {
    let plant = Object.create(PlantTypes[plantType]);
    plant.size = 0;  // Initial size of the plant
    this.plants.push(plant);
  }

  waterPlant(plantIndex) {
    let plant = this.plants[plantIndex];
    console.log(`${plant.name} is being watered.`);
    plant.size += plant.waterRequirement; // Increase size based on water requirement
    if (plant.size > plant.maxGrowth) plant.size = plant.maxGrowth;
  }

  updateGrowth() {
    this.plants.forEach(plant => {
      plant.grow();
      console.log(`${plant.name} size: ${plant.size}`);
    });
  }
}

// Export PlantManager for use in other files
export { PlantGrowthManager };
