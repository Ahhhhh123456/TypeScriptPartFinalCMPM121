import { PlantGrowthManager } from '../GameLogic/PlantManager';  // No `.js` in TypeScript imports to rely on module resolution


class TileGrid {
  rows: number;
  cols: number;
  totalTiles: number;
  tileSize: number;
  stateArray: Uint8Array;
  plantTypes: string[];

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.totalTiles = rows * cols;

    // Byte array format: [sunLevel, waterLevel, plantType, growthLevel] per tile
    this.tileSize = 4; // Number of attributes per tile
    this.stateArray = new Uint8Array(this.totalTiles * this.tileSize);

    // Plant types are stored as indices
    this.plantTypes = ["species1", "species2", "species3", "dirt"]; // Add "dirt" as the last entry
  }

  getIndex(row: number, col: number): number {
    return (row * this.cols + col) * this.tileSize;
  }

  getTile(row: number, col: number): { sunLevel: number, waterLevel: number, plantType: string, growthLevel: number } {
    const index = this.getIndex(row, col);
    const plantTypeIndex = this.stateArray[index + 2];
    return {
      sunLevel: this.stateArray[index],
      waterLevel: this.stateArray[index + 1],
      plantType: this.plantTypes[plantTypeIndex], // Get plant type from the index
      growthLevel: plantTypeIndex !== 3 ? this.stateArray[index + 3] : 0, // If not dirt, return growth level
    };
  }

  setTile(row: number, col: number, sunLevel: number, waterLevel: number, plantType: string, growthLevel: number): void {
    const index = this.getIndex(row, col);
    this.stateArray[index] = sunLevel;
    this.stateArray[index + 1] = waterLevel;

    if (plantType) {
      this.stateArray[index + 2] = this.plantTypes.indexOf(plantType);
      this.stateArray[index + 3] = growthLevel;
    } else {
      this.stateArray[index + 2] = 3; // Set to "dirt"
      this.stateArray[index + 3] = 0; // No growth for dirt
    }
  }
randomizeInnerTiles(tilemap: Phaser.Tilemaps.Tilemap, layer: Phaser.Tilemaps.TilemapLayer, flowerTileIds: { [key: string]: number }) {
  for (let row = 1; row < this.rows - 1; row++) {
    for (let col = 1; col < this.cols - 1; col++) {
      const isFlower = Math.random() < 0.3; // 30% chance to generate a flower
      if (isFlower) {
        const randomSun = Math.floor(Math.random() * 11); // Random sun level (0-10)
        const randomWater = Math.floor(Math.random() * 11); // Random water level (0-10)
        const randomGrowth = Math.floor(Math.random() * 3) + 1; // Growth levels 1 to 3

        // Randomly pick a species
        const speciesOptions: string[] = ["species1", "species2", "species3"];
        const randomSpecies = speciesOptions[Math.floor(Math.random() * speciesOptions.length)];
        
        // Get the tile ID for the species
        const speciesTileId = flowerTileIds[randomSpecies] || flowerTileIds.default;

        // Set the tile with random flower properties
        this.setTile(row, col, randomSun, randomWater, randomSpecies, randomGrowth);

        // Place the tile in the Tiled map layer
        tilemap.putTileAt(speciesTileId, col, row, true, layer);
      } else {
        const randomSun = Math.floor(Math.random() * 11);
        const randomWater = Math.floor(Math.random() * 11);

        // Set the tile with "dirt" (no plant, no growth)
        this.setTile(row, col, randomSun, randomWater, "dirt", 0);

        // Set a dirt tile ID (adjust as needed)
        const dirtTileId = 26; // Example ID for dirt
        tilemap.putTileAt(dirtTileId, col, row, true, layer);
      }
    }
  }
}
  
  

updateTile(row: number, col: number, neighbors: { sunLevel: number, waterLevel: number, plantType: string, growthLevel: number }[]): void {
  const tile = this.getTile(row, col);

  if (tile.plantType !== "dirt") { // Only update non-dirt tiles (flowers)
    const neighboringPlants = neighbors.filter((neighbor) => neighbor.plantType !== "dirt").length;

    if (tile.sunLevel > 5 && tile.waterLevel > 5 && neighboringPlants >= 2) {
      tile.growthLevel = Math.min(tile.growthLevel + 1, 3); // Max growth level 3
      this.setTile(row, col, tile.sunLevel, tile.waterLevel, tile.plantType, tile.growthLevel);
    }
  }
}

getNeighbors(row: number, col: number): { sunLevel: number, waterLevel: number, plantType: string, growthLevel: number }[] {
  const directions: [number, number][] = [
    [-1, 0], // up
    [1, 0], // down
    [0, -1], // left
    [0, 1], // right
  ];

  return directions
    .map(([dRow, dCol]) => {
      const nRow = row + dRow;
      const nCol = col + dCol;
      if (nRow >= 0 && nRow < this.rows && nCol >= 0 && nCol < this.cols) {
        return this.getTile(nRow, nCol);
      }
      return null;
    })
    .filter((tile): tile is { sunLevel: number, waterLevel: number, plantType: string, growthLevel: number } => tile !== null);
}
}

class Platformer extends Phaser.Scene {
  private instructionsText!: Phaser.GameObjects.Text; // Instructions text on the top-left corner


  private reapedFlowers: number;
  private waterLevel: number;
  private grid!: TileGrid; // Define as TileGrid type (ensure TileGrid is properly typed)
  private stepsTaken: number;
  private won: boolean;
  private TILE_SIZE!: number; // Tile size for calculating positions
  private player!: Phaser.GameObjects.Sprite; // Player sprite object
  private isMoving: boolean;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys; // Cursor keys for keyboard input
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private oneKey!: Phaser.Input.Keyboard.Key;
  private twoKey!: Phaser.Input.Keyboard.Key;
  private lKey!: Phaser.Input.Keyboard.Key;
  private zKey!: Phaser.Input.Keyboard.Key;
  private yKey!: Phaser.Input.Keyboard.Key;
  private nKey!: Phaser.Input.Keyboard.Key;


  private spaceButton!: Phaser.GameObjects.Image;
  private saveSlot1Button!: Phaser.GameObjects.Image;
  private saveSlot2Button!: Phaser.GameObjects.Image;
  private zButton!: Phaser.GameObjects.Image;
  private yButton!: Phaser.GameObjects.Image;
  private nButton!: Phaser.GameObjects.Image;
  private lButton!: Phaser.GameObjects.Image;
  private upButton!: Phaser.GameObjects.Image;
  private downButton!: Phaser.GameObjects.Image;
  private leftButton!: Phaser.GameObjects.Image;
  private rightButton!: Phaser.GameObjects.Image;


  private spaceButtonDisabled: boolean = false;
  private saveSlot1ButtonDisabled: boolean = false;
  private saveSlot2ButtonDisabled: boolean = false;
  private zButtonDisabled: boolean = false;
  private yButtonDisabled: boolean = false;
  private nButtonDisabled: boolean = false;
  private lButtonDisabled: boolean = false;
  private upButtonDisabled: boolean = false;
  private downButtonDisabled: boolean = false;
  private leftButtonDisabled: boolean = false;
  private rightButtonDisabled: boolean = false;

  private undoStack: string[]; // Stack for undo states
  private redoStack: string[]; // Stack for redo states

  private map!: Phaser.Tilemaps.Tilemap; // Tilemap for the game
  private tileset!: Phaser.Tilemaps.Tileset; // Tileset used in the tilemap
  private backgroundLayer!: Phaser.Tilemaps.TilemapLayer; // Background layer
  private grassLayer!: Phaser.Tilemaps.TilemapLayer; // Grass layer


  private reapedFlowersText!: Phaser.GameObjects.Text; 
  private waterCountText!: Phaser.GameObjects.Text; 
  private winText!: Phaser.GameObjects.Text; 
  private langFile: any;
  private currentLang: string = 'en'; // Keep track of the current language




  constructor() {
    super("platformerScene");
    this.reapedFlowers = 0;
    this.waterLevel = 0;
    this.stepsTaken = 0;
    this.won = false;
    this.isMoving = false;
    this.undoStack = [];
    this.redoStack = [];
  }

  create(): void {


    // Set game description UI
    const descriptionElement = document.getElementById("description");
    if (descriptionElement) {
      descriptionElement.innerHTML =
        '<h2>Final Project<br>Arrow keys to move, space to reap, z to undo, y to redo, l to load <br>1 or 2 to save game state in slot 1 or 2</h2>';
    }


    //test
    // Grid dimensions
    const rows = 10;
    const cols = 10;

    // Create the tile grid
    this.grid = new TileGrid(rows, cols);

    // Load tilemap and configure tileset
    this.map = this.add.tilemap("map");
    const tileset = this.map.addTilesetImage("tiny-town-packed", "tiny_town_tiles");
    if (!tileset) {
      throw new Error("Tileset not found");
    }
    this.tileset = tileset;
    this.backgroundLayer = this.map.createLayer("Background", this.tileset, 0, 0)!;
    this.backgroundLayer.setScale(4);
    this.grassLayer = this.map.createLayer("Grass-n-Houses", this.tileset, 0, 0)!;
    this.grassLayer.setScale(4);

    // Randomize tiles
    this.grid.randomizeInnerTiles(this.map, this.grassLayer, {
      species1: 3,
      species2: 4,
      species3: 5,
      default: 26,
    });

    // Player setup
    this.TILE_SIZE = 16 * 4;
    this.player = this.add
      .sprite(
        this.TILE_SIZE * 5 + this.TILE_SIZE / 2,
        this.TILE_SIZE * 5 + this.TILE_SIZE / 2,
        "platformer_characters",
        "tile_0000.png"
      )
      .setScale(2);

    const growthManager = new PlantGrowthManager();
    const flower = growthManager.addPlant("Flower");  // Add a new flower to the manager
    const cactus = growthManager.addPlant("Cactus");  // Add a new cactus to the manager
    const tree = growthManager.addPlant("Tree");      // Add a new tree to the manager


    // Cursor and key setup
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.oneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
      this.twoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
      this.lKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
      this.zKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
      this.yKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y);
      this.nKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
    } else {
      throw new Error("Keyboard input is not available");
    }

    //f3
    this.waterCountText = this.add.text(16, 40, `Water Count: ${this.waterLevel}`, {
      fontSize: "24px",
      color: "#ffffff",
      fontFamily: "Arial",
    });

    
    this.reapedFlowersText = this.add.text(16, 16, `Reaped Flowers: ${this.reapedFlowers}`, {
      fontSize: "24px",
      color: "#ffffff",
      fontFamily: "Arial",
    });


    this.winText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, `You Win!`, {
      fontSize: "64px",
      color: "#ffffff",
    });
    this.winText.setOrigin(0.5);
    this.winText.visible = false;

    this.spaceButton = this.add.image(this.scale.width - 50, this.scale.height - 50, 'scythe')
    .setInteractive()
    .setScrollFactor(0)  // Make it stay fixed on screen
    .setDepth(10);       // Ensure it's above other objects
  
    this.spaceButton.setScale(0.1);


    this.saveSlot1Button = this.add.image(this.scale.width - 150, this.scale.height - 50, 'one')
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(10);

      this.saveSlot1Button.setScale(0.1);

    this.saveSlot2Button = this.add.image(this.scale.width - 100, this.scale.height - 50, 'two')
    .setInteractive()
    .setScrollFactor(0)
    .setDepth(10);

    this.saveSlot2Button.setScale(0.1);

    this.zButton = this.add.image(this.scale.width - 200, this.scale.height - 50, 'z')
    .setInteractive()
    .setScrollFactor(0)
    .setDepth(10);

    this.zButton.setScale(0.09);

    this.yButton = this.add.image(this.scale.width - 250, this.scale.height - 50, 'y')
    .setInteractive()
    .setScrollFactor(0)
    .setDepth(10);

    this.yButton.setScale(0.09);

    this.nButton = this.add.image(this.scale.width - 300, this.scale.height - 50, 'n')
    .setInteractive()
    .setScrollFactor(0)
    .setDepth(10);

    this.nButton.setScale(0.1);

    this.lButton = this.add.image(this.scale.width - 350, this.scale.height - 50, 'l')
    .setInteractive()
    .setScrollFactor(0)
    .setDepth(10);

    this.lButton.setScale(0.09);

    this.upButton = this.add.image(this.scale.width - 550, this.scale.height - 50, 'up')
    .setInteractive()
    .setScrollFactor(0)
    .setDepth(10);

    this.upButton.setScale(0.09);

    this.downButton = this.add.image(this.scale.width - 500, this.scale.height - 50, 'down')
    .setInteractive()
    .setScrollFactor(0)
    .setDepth(10);

    this.downButton.setScale(0.022);

    this.leftButton = this.add.image(this.scale.width - 600, this.scale.height - 50, 'left')
    .setInteractive()
    .setScrollFactor(0)
    .setDepth(10);

    this.leftButton.setScale(0.022);

    this.rightButton = this.add.image(this.scale.width - 450, this.scale.height - 50, 'right')
    .setInteractive()
    .setScrollFactor(0)
    .setDepth(10);

    this.rightButton.setScale(0.022);
    
    // Check for auto-save on game start
    this.checkAutoSave();
  }



  
  refreshText(): void {
    // Dynamically update text content using the current language file
    //console.log(this.langFile['waterCount']); // Example JSON key: "title"
    //console.log(this.langFile['Win']); // Example JSON key: "instructions"
    
    this.waterCountText.visible = false;
    this.waterCountText = this.add.text(16, 40, `${this.langFile['waterCount']} ${this.waterLevel}`, {
      fontSize: "24px",
      color: "#ffffff",
      fontFamily: "Arial",
    });
    this.waterCountText.visible = true;
    
    this.reapedFlowersText.visible = false;
    this.reapedFlowersText = this.add.text(16, 16, `${this.langFile['reapCount']} ${this.reapedFlowers}`, {
      fontSize: "24px",
      color: "#ffffff",
      fontFamily: "Arial",
    });
    this.reapedFlowersText.visible = true;

    if (this.won == true) {
      console.log("hi");
      this.winText.destroy();
      this.winText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, `${this.langFile['Win']}`, {
        fontSize: "64px",
        color: "#ffffff",
      });
      this.winText.setOrigin(0.5);
    }
    

    const descriptionElement = document.getElementById("description");
    if (descriptionElement) {
      descriptionElement.innerHTML =
        `${this.langFile['Desc']}`;
    }

  }

  toggleLanguage(): void {

  // Add Arabic ("ar") support and refactor language cycling
  const supportedLanguages = ['en', 'ch', 'ar'];

  // Initialize the current language (default is English)
  this.currentLang = this.currentLang || 'en';

  // Cycle through all supported languages
  this.currentLang = supportedLanguages[
      (supportedLanguages.indexOf(this.currentLang) + 1) % supportedLanguages.length
  ];

  // Load the appropriate language file dynamically
  this.langFile = this.cache.json.get(`lang_${this.currentLang}`);

  // Update all dynamic game text
  this.refreshText();
  }

  saveGame(saveKey = "gameStateSlot1"): void {
    const gameState = {
      gridState: Array.from(this.grid.stateArray), // Convert Uint8Array to regular array
      playerPosition: {
        x: this.player.x,
        y: this.player.y,
      },
      stepsTaken: this.stepsTaken,
      waterLevel: this.waterLevel,
      reapedFlowers: this.reapedFlowers,
      won: this.won,
    };
    localStorage.setItem(saveKey, JSON.stringify(gameState));
    //console.log(`Game saved to ${saveKey}!`);

    // Push current state to undo stack
    this.undoStack.push(JSON.stringify(gameState));
    //console.log("State pushed to undoStack:", this.undoStack);

    // Clear the redo stack
    this.redoStack = [];
    //console.log("Redo stack cleared");
  }

  autoSaveGame(): void {
    this.saveGame("autoSaveState");
    console.log("Game auto-saved!");
  }

  checkAutoSave(): void {
    const autoSaveState = localStorage.getItem("autoSaveState");
    if (autoSaveState) {

      // f3 
      const continueGame = confirm("Do you want to continue where you left off?");
      if (continueGame) {
        this.loadGame("autoSaveState");
      }
    }
  }

  loadGame(saveKey = "gameStateSlot1"): void {
    const savedGameState = localStorage.getItem(saveKey);
    if (savedGameState) {
      const gameState = JSON.parse(savedGameState);

      this.grid.stateArray = new Uint8Array(gameState.gridState);
      this.player.setPosition(gameState.playerPosition.x, gameState.playerPosition.y);
      this.stepsTaken = gameState.stepsTaken;
      this.waterLevel = gameState.waterLevel;
      this.reapedFlowers = gameState.reapedFlowers;
      this.won = gameState.won;

      this.rebuildTilemap();
      //console.log(`Game loaded from ${saveKey}!`);

      if (this.won) {
        this.showWinScreen();
      }
    } else {
      //console.log(`No save state found for ${saveKey}.`);
    }
  }

  // Display a win screen
  showWinScreen(): void {
    //f3
    const winText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, `${this.langFile['Win']}`, {
      fontSize: "64px",
      color: "#00000",
    });
    winText.setOrigin(0.5); // Center the text
  }

  rebuildTilemap(): void {
    for (let row = 1; row < this.grid.rows - 1; row++) {
      for (let col = 1; col < this.grid.cols - 1; col++) {
        const index = this.grid.getIndex(row, col);
        const savedTile = this.grid.stateArray.slice(index, index + this.grid.tileSize);
        const sunLevel = savedTile[0];
        const waterLevel = savedTile[1];
        const plantTypeIndex = savedTile[2];
        const growthLevel = savedTile[3];

        this.grid.setTile(row, col, sunLevel, waterLevel, this.grid.plantTypes[plantTypeIndex], growthLevel);

        let tileId = this.getTileIdFromGrowth({
          plantType: this.grid.plantTypes[plantTypeIndex],
          growthLevel
        });
        this.map.putTileAt(tileId, col, row, true, this.grassLayer);
      }
    }
  }

  movePlayer(deltaX: number, deltaY: number): void {
    const currentState = {
      gridState: Array.from(this.grid.stateArray),
      playerPosition: {
        x: this.player.x,
        y: this.player.y,
      },
      stepsTaken: this.stepsTaken,
      waterLevel: this.waterLevel,
      reapedFlowers: this.reapedFlowers,
      won: this.won,
    };
    this.undoStack.push(JSON.stringify(currentState));
    //console.log("State pushed to undoStack:", this.undoStack);

    this.redoStack = [];
    //console.log("Redo stack cleared");

    const currentRow = Math.floor(this.player.y / this.TILE_SIZE);
    const currentCol = Math.floor(this.player.x / this.TILE_SIZE);

    const newRow = currentRow + deltaY;
    const newCol = currentCol + deltaX;

    if (newRow >= 0 && newRow < this.grid.rows && newCol >= 0 && newCol < this.grid.cols) {
      const newX = newCol * this.TILE_SIZE + this.TILE_SIZE / 2;
      const newY = newRow * this.TILE_SIZE + this.TILE_SIZE / 2;

      this.tweens.add({
        targets: this.player,
        x: newX,
        y: newY,
        duration: 200,
        onComplete: () => {
          this.isMoving = false;
          this.stepsTaken++;

          if (this.stepsTaken >= 5) {
            this.increaseFlowerGrowth();
            this.generateNewFlower();
            this.stepsTaken = 0;
            this.waterLevel += 2;
          }

          this.updateTiles();

          if (this.stepsTaken % 4 === 0) {
            this.autoSaveGame();
          }
          const tile = this.grid.getTile(newRow, newCol);

          console.log(`Tile at (${newRow}, ${newCol}):
  Sun Level: ${tile.sunLevel}
  Water Level: ${tile.waterLevel}
  Plant Type: ${tile.plantType}
  Growth Level: ${tile.growthLevel}`);
        },
      });
    }
  }

  increaseFlowerGrowth(): void {
    for (let row = 1; row < this.grid.rows - 1; row++) {
      for (let col = 1; col < this.grid.cols - 1; col++) {
        const tile = this.grid.getTile(row, col);
        if (tile.plantType !== "dirt" && tile.growthLevel < 3) {
          const newGrowthLevel = Math.min(tile.growthLevel + 1, 3);
          this.grid.setTile(row, col, tile.sunLevel, tile.waterLevel, tile.plantType, newGrowthLevel);
          const tileId = this.getTileIdFromGrowth(tile);
          this.map.putTileAt(tileId, col, row, true, this.grassLayer);
        }
      }
    }
  }

  getTileIdFromGrowth(tile: { plantType: string; growthLevel: number }): number {
    if (tile.plantType === "species1") {
      return tile.growthLevel > 0 ? 3 : 26;
    } else if (tile.plantType === "species2") {
      return 4;
    } else if (tile.plantType === "species3") {
      return 5;
    } else {
      return 26;
    }
  }

  generateNewFlower(): void {
    let row!: number, col!: number;
    let tile!: { plantType: string };

    do {
      row = Math.floor(Math.random() * this.grid.rows);
      col = Math.floor(Math.random() * this.grid.cols);
      tile = this.grid.getTile(row, col);
    } while (tile.plantType !== "dirt");

    const randomSun = Math.floor(Math.random() * 11);
    const randomWater = Math.floor(Math.random() * 11);
    const randomGrowth = Math.floor(Math.random() * 3) + 1;

    const speciesOptions = ["species1", "species2", "species3"];
    const randomSpecies = speciesOptions[Math.floor(Math.random() * speciesOptions.length)];

    this.grid.setTile(row, col, randomSun, randomWater, randomSpecies, randomGrowth);

    const tileId = this.getTileIdFromGrowth({
      plantType: randomSpecies,
      growthLevel: randomGrowth,
    });

    this.map.putTileAt(tileId, col, row, true, this.grassLayer);
    //console.log(`New flower generated at (${row}, ${col}) with species ${randomSpecies}!`);
  }

  updateTiles(): void {
    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        const neighbors = this.grid.getNeighbors(row, col);
        this.grid.updateTile(row, col, neighbors);
      }
    }
  }

  getPlayerTilePosition(): { row: number; col: number } {
    const row = Math.floor(this.player.y / this.TILE_SIZE);
    const col = Math.floor(this.player.x / this.TILE_SIZE);

    return { row, col };
  }

  undo(): void {
    if (this.undoStack.length > 0) {
      const currentState = {
        gridState: Array.from(this.grid.stateArray),
        playerPosition: {
          x: this.player.x,
          y: this.player.y,
        },
        stepsTaken: this.stepsTaken,
        waterLevel: this.waterLevel,
        reapedFlowers: this.reapedFlowers,
        won: this.won,
      };
      this.redoStack.push(JSON.stringify(currentState));
      //console.log("State pushed to redoStack:", this.redoStack);
      const previousState = JSON.parse(this.undoStack.pop()!);
      this.loadState(previousState);
      //console.log("Undo performed! Current undoStack:", this.undoStack);
    } else {
      //console.log("No more actions to undo.");
    }
  }

  redo(): void {
    if (this.redoStack.length > 0) {
      const currentState = {
        gridState: Array.from(this.grid.stateArray),
        playerPosition: {
          x: this.player.x,
          y: this.player.y,
        },
        stepsTaken: this.stepsTaken,
        waterLevel: this.waterLevel,
        reapedFlowers: this.reapedFlowers,
        won: this.won,
      };
      this.undoStack.push(JSON.stringify(currentState));
      //console.log("State pushed to undoStack:", this.undoStack);
      const nextState = JSON.parse(this.redoStack.pop()!);
      this.loadState(nextState);
      //console.log("Redo performed! Current redoStack:", this.redoStack);
    } else {
      //console.log("No more actions to redo.");
    }
  }

  loadState(state: {
    gridState: number[];
    playerPosition: { x: number; y: number };
    stepsTaken: number;
    waterLevel: number;
    reapedFlowers: number;
    won: boolean;
  }): void {
    this.grid.stateArray = new Uint8Array(state.gridState);
    this.player.setPosition(state.playerPosition.x, state.playerPosition.y);
    this.stepsTaken = state.stepsTaken;
    this.waterLevel = state.waterLevel;
    this.reapedFlowers = state.reapedFlowers;
    this.won = state.won;
    this.rebuildTilemap();
  }

  checkWinCondition(): void {
    if (this.reapedFlowers >= 10 && !this.won) {
      this.won = true;
      this.winText.visible = true;
    }
  }

  update(): void {
    if (!this.isMoving) {
      if (this.cursors.left.isDown) {
        this.isMoving = true;
        this.movePlayer(-1, 0);
        this.player.setFlipX(false);
      } else if (this.cursors.right.isDown) {
        this.isMoving = true;
        this.movePlayer(1, 0);
        this.player.setFlipX(true);
      } else if (this.cursors.up.isDown) {
        this.isMoving = true;
        this.movePlayer(0, -1);
      } else if (this.cursors.down.isDown) {
        this.isMoving = true;
        this.movePlayer(0, 1);
      }
    }

    if (!this.isMoving) {
      this.upButton.on('pointerdown', () => {
        if (this.upButtonDisabled) return; // Ignore the event if the button is disabled
        
        this.isMoving = true;
        this.movePlayer(0, -1);
    
        this.upButtonDisabled = true; // Disable the button
        // Optionally, re-enable the button after some condition or delay
        setTimeout(() => {
            this.upButtonDisabled = false; // Re-enable the button (if needed)
        }, 500); // Adjust delay as necessary
      }); 
      
      this.downButton.on('pointerdown', () => {
        if (this.downButtonDisabled) return; // Ignore the event if the button is disabled
        
        this.isMoving = true;
        this.movePlayer(0, 1);
    
        this.downButtonDisabled = true; // Disable the button
        // Optionally, re-enable the button after some condition or delay
        setTimeout(() => {
            this.downButtonDisabled = false; // Re-enable the button (if needed)
        }, 500); // Adjust delay as necessary
      }); 

      this.leftButton.on('pointerdown', () => {
        if (this.leftButtonDisabled) return; // Ignore the event if the button is disabled
        
        this.isMoving = true;
        this.movePlayer(-1, 0);
        this.player.setFlipX(false);
    
        this.leftButtonDisabled = true; // Disable the button
        // Optionally, re-enable the button after some condition or delay
        setTimeout(() => {
            this.leftButtonDisabled = false; // Re-enable the button (if needed)
        }, 500); // Adjust delay as necessary
      }); 
      
      this.rightButton.on('pointerdown', () => {
        if (this.rightButtonDisabled) return; // Ignore the event if the button is disabled
        
        this.isMoving = true;
        this.movePlayer(1, 0);
        this.player.setFlipX(true);
    
        this.rightButtonDisabled = true; // Disable the button
        // Optionally, re-enable the button after some condition or delay
        setTimeout(() => {
            this.rightButtonDisabled = false; // Re-enable the button (if needed)
        }, 500); // Adjust delay as necessary
      }); 

    }


    if (this.spaceKey.isDown) {
      const { row, col } = this.getPlayerTilePosition();
      const tile = this.grid.getTile(row, col);

      if (tile.growthLevel === 3) {
        this.waterLevel += tile.waterLevel;
        if (this.currentLang === 'en') {
          this.waterCountText.setText(`Water Count:  ${this.waterLevel}`);
        }
        else {
          this.waterCountText.setText(`${this.langFile['waterCount']} ${this.waterLevel}`);
        }
       
        this.map.putTileAt(26, col, row, true, this.grassLayer);
        this.grid.setTile(row, col, tile.sunLevel, tile.waterLevel, "dirt", 0);
        this.reapedFlowers++;
    
        if (this.currentLang === 'en'){
          this.reapedFlowersText.setText(`Reaped Flowers: ${this.reapedFlowers}`);
        }
        else { 
          this.reapedFlowersText.setText(`${this.langFile['reapCount']} ${this.reapedFlowers}`);
        }
        //console.log(`Plant Reaped: ${this.reapedFlowers}, Water Count: ${this.waterLevel}`);
        this.checkWinCondition();
        this.spaceKey.reset();
      }
    }

    this.spaceButton.on('pointerdown', () => {
      if (this.spaceButtonDisabled) return; // Ignore the event if the button is disabled
      
      const { row, col } = this.getPlayerTilePosition();
      const tile = this.grid.getTile(row, col);
    
      if (tile.growthLevel === 3) {
        this.waterLevel += tile.waterLevel;
    
        if (this.currentLang === 'en') {
          this.waterCountText.setText(`Water Count:  ${this.waterLevel}`);
        } else {
          this.waterCountText.setText(`${this.langFile['waterCount']} ${this.waterLevel}`);
        }
    
        this.map.putTileAt(26, col, row, true, this.grassLayer);
        this.grid.setTile(row, col, tile.sunLevel, tile.waterLevel, "dirt", 0);
        this.reapedFlowers++;
    
        if (this.currentLang === 'en') {
          this.reapedFlowersText.setText(`Reaped Flowers: ${this.reapedFlowers}`);
        } else {
          this.reapedFlowersText.setText(`${this.langFile['reapCount']} ${this.reapedFlowers}`);
        }
    
        this.checkWinCondition();
      }
  
      this.spaceButtonDisabled = true; // Disable the button
      // Optionally, re-enable the button after some condition or delay
      setTimeout(() => {
          this.spaceButtonDisabled = false; // Re-enable the button (if needed)
      }, 500); // Adjust delay as necessary
    });     

    if (Phaser.Input.Keyboard.JustDown(this.oneKey)) {
      //console.log("Saving to Slot 1!");
      this.saveGame("gameStateSlot1");
    }

    this.saveSlot1Button.on('pointerdown', () => {
      if (this.saveSlot1ButtonDisabled) return; // Ignore the event if the button is disabled
      
      console.log("Saving to Slot 1!");
      this.saveGame("gameStateSlot1");
  
      this.saveSlot1ButtonDisabled = true; // Disable the button
      // Optionally, re-enable the button after some condition or delay
      setTimeout(() => {
          this.saveSlot1ButtonDisabled = false; // Re-enable the button (if needed)
      }, 500); // Adjust delay as necessary
    });     


    if (Phaser.Input.Keyboard.JustDown(this.twoKey)) {
      //console.log("Saving to Slot 2!");
      this.saveGame("gameStateSlot2");
    }

    this.saveSlot2Button.on('pointerdown', () => {
      //console.log("Saving to Slot 2!");
      this.saveGame("gameStateSlot2");
    });

    this.saveSlot2Button.on('pointerdown', () => {
      if (this.saveSlot2ButtonDisabled) return; // Ignore the event if the button is disabled

      console.log("Saving to Slot 2!");
      this.saveGame("gameStateSlot2");
  
      this.saveSlot2ButtonDisabled = true; // Disable the button
      // Optionally, re-enable the button after some condition or delay
      setTimeout(() => {
          this.saveSlot2ButtonDisabled = false; // Re-enable the button (if needed)
      }, 500); // Adjust delay as necessary
    });     

    if (Phaser.Input.Keyboard.JustDown(this.lKey)) {
      //  f3
      const loadSlot = prompt("Enter save slot to load (1 or 2):");
      const saveKey = loadSlot === "2" ? "gameStateSlot2" : "gameStateSlot1";
      //console.log(`Loading from ${saveKey}!`);
      this.loadGame(saveKey);
    }
  
    this.lButton.on('pointerdown', () => {
      if (this.lButtonDisabled) return; // Ignore the event if the button is disabled
      
      const loadSlot = prompt("Enter save slot to load (1 or 2):");
      const saveKey = loadSlot === "2" ? "gameStateSlot2" : "gameStateSlot1";
      //console.log(`Loading from ${saveKey}!`);
      this.loadGame(saveKey);
  
      this.lButtonDisabled = true; // Disable the button
      // Optionally, re-enable the button after some condition or delay
      setTimeout(() => {
          this.lButtonDisabled = false; // Re-enable the button (if needed)
      }, 500); // Adjust delay as necessary
    }); 

    if (Phaser.Input.Keyboard.JustDown(this.zKey)) {

      this.undo();
    }

    this.zButton.on('pointerdown', () => {
      if (this.zButtonDisabled) return; // Ignore the event if the button is disabled

      this.undo();
  
      this.zButtonDisabled = true; // Disable the button
      // Optionally, re-enable the button after some condition or delay
      setTimeout(() => {
          this.zButtonDisabled = false; // Re-enable the button (if needed)
      }, 500); // Adjust delay as necessary
    }); 

    if (Phaser.Input.Keyboard.JustDown(this.yKey)) {
      this.redo();
    }

    this.yButton.on('pointerdown', () => {
      if (this.yButtonDisabled) return; // Ignore the event if the button is disabled
      
      this.redo();
  
      this.yButtonDisabled = true; // Disable the button
      // Optionally, re-enable the button after some condition or delay
      setTimeout(() => {
          this.yButtonDisabled = false; // Re-enable the button (if needed)
      }, 500); // Adjust delay as necessary
    });
  

    if (Phaser.Input.Keyboard.JustDown(this.nKey)) {

      this.toggleLanguage();
    }
   
    this.nButton.on('pointerdown', () => {
      if (this.nButtonDisabled) return; // Ignore the event if the button is disabled
      

      this.toggleLanguage();
  
      this.nButtonDisabled = true; // Disable the button
      // Optionally, re-enable the button after some condition or delay
      setTimeout(() => {
          this.nButtonDisabled = false; // Re-enable the button (if needed)
      }, 500); // Adjust delay as necessary
    });

  }
}

export default Platformer;