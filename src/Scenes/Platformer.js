class TileGrid {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.totalTiles = rows * cols;


    // Byte array format: [sunLevel, waterLevel, plantType, growthLevel] per tile
    this.tileSize = 4; // Number of attributes per tile
    this.stateArray = new Uint8Array(this.totalTiles * this.tileSize);

    // Plant types are stored as indices
    this.plantTypes = ["species1", "species2", "species3", "dirt"]; // Add "dirt" as the last entry
  }

  getIndex(row, col) {
    return (row * this.cols + col) * this.tileSize;
  }

  getTile(row, col) {
    const index = this.getIndex(row, col);
    const plantTypeIndex = this.stateArray[index + 2];
    return {
      sunLevel: this.stateArray[index],
      waterLevel: this.stateArray[index + 1],
      plantType: this.plantTypes[plantTypeIndex], // Get plant type from the index
      growthLevel: plantTypeIndex !== 3 ? this.stateArray[index + 3] : 0, // If not dirt, return growth level
    };
  }

  setTile(row, col, sunLevel, waterLevel, plantType, growthLevel) {
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

  
  randomizeInnerTiles(tilemap, layer, flowerTileIds) {
    for (let row = 1; row < this.rows - 1; row++) {
      for (let col = 1; col < this.cols - 1; col++) {
        const isFlower = Math.random() < 0.3; // 30% chance to generate a flower
        if (isFlower) {
          const randomSun = Math.floor(Math.random() * 11); // Random sun level (0-10)
          const randomWater = Math.floor(Math.random() * 11); // Random water level (0-10)
          const randomGrowth = Math.floor(Math.random() * 3) + 1; // Growth levels 1 to 3
  
          // Randomly pick a species
          const speciesOptions = ["species1", "species2", "species3"];
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
  
  

  updateTile(row, col, neighbors) {
    const tile = this.getTile(row, col);

    if (tile.plantType !== "dirt") { // Only update non-dirt tiles (flowers)
      const neighboringPlants = neighbors.filter((neighbor) => neighbor.plantType !== "dirt").length;

      if (tile.sunLevel > 5 && tile.waterLevel > 5 && neighboringPlants >= 2) {
        tile.growthLevel = Math.min(tile.growthLevel + 1, 3); // Max growth level 3
        this.setTile(row, col, tile.sunLevel, tile.waterLevel, tile.plantType, tile.growthLevel);
      }
    }
  }

  getNeighbors(row, col) {
    const directions = [
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
      .filter((tile) => tile !== null);
  }
}


class Platformer extends Phaser.Scene {
  constructor() {
    super("platformerScene");
    this.reapedFlowers = 0;
    this.waterLevel = 0;
    this.grid = null;
    this.stepsTaken = 0; // Step counter
    this.won = false; // To track if the player has won

    //undo and redo stacks
    this.undoStack = [];
    this.redoStack = [];

  }

  create() {
    document.getElementById('description').innerHTML = '<h2>Final Project<br>Arrow keys to move, space to reap, z to undo, y to redo, l to load <br>1 or 2 to save game state in slot 1 or 2</h2>'
    // Grid dimensions
    const rows = 10;
    const cols = 10;

    // Create and initialize the tile grid
    this.grid = new TileGrid(rows, cols);

    // Load tilemap and configure tileset
    this.map = this.add.tilemap("map");
    this.tileset = this.map.addTilesetImage("tiny-town-packed", "tiny_town_tiles");

    this.backgroundLayer = this.map.createLayer("Background", this.tileset, 0, 0);
    this.backgroundLayer.setScale(4);

    this.grassLayer = this.map.createLayer("Grass-n-Houses", this.tileset, 0, 0);
    this.grassLayer.setScale(4);

    // Randomize tiles, including flowers
    this.grid.randomizeInnerTiles(this.map, this.grassLayer, {
      species1: 3,
      species2: 4,
      species3: 5,
      default: 26,
    });

      // Player setup
      this.TILE_SIZE = 16 * 4,
      this.player = this.add.sprite(
     
        this.TILE_SIZE * 5 + this.TILE_SIZE / 2,
        this.TILE_SIZE * 5 + this.TILE_SIZE / 2,
        "platformer_characters",
        "tile_0000.png"
      ).setScale(2);
  
      // Movement state
      this.isMoving = false;
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      //save keys
      this.oneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
      this.twoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);

      // load keys
      this.lKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);

      //undo and redo keys
      this.zKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
      this.yKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y);


  
      // Check for auto-save on game start
      this.checkAutoSave();
      //this.startAutoSave();
    }

    /*startAutoSave() {
      console.log("Game saved Automatically!");
      this.autoSaveInterval = setInterval(() => {
        this.autoSaveGame();
      }, 30000);
    }
  
    shutdown() {
      clearInterval(this.autoSaveInterval); // Clear the auto-save interval when the scene is shut down
    }
    */
    saveGame(saveKey = "gameStateSlot1") {
      const gameState = {
        gridState: Array.from(this.grid.stateArray), // Convert to regular array to store in localStorage
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
      console.log(`Game saved to ${saveKey}!`);
    

      
      // Save current state to undo stack
      this.undoStack.push(JSON.stringify(gameState));
      console.log("State pushed to undoStack:", this.undoStack);
      // Clear redo stack on new save
      this.redoStack = [];
      console.log("Redo stack cleared");
    }
  
    autoSaveGame() {
      this.saveGame('autoSaveState');
      console.log("Game auto-saved!");
    }
  

  checkAutoSave() {
    const autoSaveState = localStorage.getItem('autoSaveState');
    if (autoSaveState) {
      const continueGame = confirm("Do you want to continue where you left off?");
      if (continueGame) {
        this.loadGame('autoSaveState');
      }
    }
  }



  loadGame(saveKey = "gameStateSlot1") {
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
      console.log(`Game loaded from ${saveKey}!`);
      
      if (this.won) {
        this.showWinScreen();
      }
    } else {
      console.log(`No save state found for ${saveKey}.`);
    }
  }
  
  // Text to say you won after loading a state.
  showWinScreen() {
    const winText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, "You Win!", {
      fontSize: "64px",
      fill: "#00000",
    });
    winText.setOrigin(0.5); // Center the text
  }


  // Update the `rebuildTilemap` method
  rebuildTilemap() {
    for (let row = 1; row < this.grid.rows - 1; row++) {
        for (let col = 1; col < this.grid.cols - 1; col++) {
            const index = this.grid.getIndex(row, col);

            // Reapply the saved tile state to the grid
            const savedTile = this.grid.stateArray.slice(index, index + this.grid.tileSize);
            const sunLevel = savedTile[0];
            const waterLevel = savedTile[1];
            const plantTypeIndex = savedTile[2];
            const growthLevel = savedTile[3];

            // Update grid state
            this.grid.setTile(row, col, sunLevel, waterLevel, this.grid.plantTypes[plantTypeIndex], growthLevel);

            let tileId = 26; // Default ID for empty/regular ground tile

            // Map plant types to tile IDs based on growth level or other conditions
            if (this.grid.plantTypes[plantTypeIndex] === "species1") {
                if (growthLevel > 0) {
                    tileId = 3; // Flower tile (species1) with growth
                } else {
                    tileId = 26; // Placeholder for no growth (or reaped flower)
                }
            } else if (this.grid.plantTypes[plantTypeIndex] === "species2") {
                tileId = 4; // Tile ID for species2
            } else if (this.grid.plantTypes[plantTypeIndex] === "species3") {
                tileId = 5; // Tile ID for species3
            } else if (this.grid.plantTypes[plantTypeIndex] === "dirt") {
                tileId = 26; // Tile ID for dirt (no plant)
            }

            // Apply the tile ID to the map for the inner tiles
            this.map.putTileAt(tileId, col, row, true, this.grassLayer);
        }
    }
  }

  movePlayer(deltaX, deltaY) {
    // Save current state to undo stack before moving
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
    console.log("State pushed to undoStack:", this.undoStack);
    // Clear redo stack on new action
    this.redoStack = [];
    console.log("Redo stack cleared");
  
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
  
          // Every 5 steps, increase the growth level of all flower tiles (if < 3)
          if (this.stepsTaken >= 5) {
            this.increaseFlowerGrowth();
            this.generateNewFlower();
            this.stepsTaken = 0; // Reset step counter
            this.waterLevel += 2; // Adds 2 water every turn
            

          }
  
          this.updateTiles();
  
          // Auto-save every 4 steps
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
  
  
  increaseFlowerGrowth() {
    for (let row = 1; row < this.grid.rows - 1; row++) {
      for (let col = 1; col < this.grid.cols - 1; col++) {
        const tile = this.grid.getTile(row, col);
        if (tile.plantType !== "dirt" && tile.growthLevel < 3) {
          // Increase growth level by 1, but not exceeding level 3
          const newGrowthLevel = Math.min(tile.growthLevel + 1, 3);
          this.grid.setTile(row, col, tile.sunLevel, tile.waterLevel, tile.plantType, newGrowthLevel);
          // Update the tile on the map
          let tileId = this.getTileIdFromGrowth(tile);
          this.map.putTileAt(tileId, col, row, true, this.grassLayer);
        }
      }
    }
  }


  
  getTileIdFromGrowth(tile) {
    if (tile.plantType === "species1") {
      return tile.growthLevel > 0 ? 3 : 26; // Flower tile (species1) with growth or dirt
    } else if (tile.plantType === "species2") {
      return 4; // Tile ID for species2
    } else if (tile.plantType === "species3") {
      return 5; // Tile ID for species3
    } else {
      return 26; // Tile ID for dirt
    }
  }
  
  generateNewFlower() {
    let row, col;
    let tile;
    
    // Loop until we find a valid empty tile (no flower) to place the new flower
    do {
      row = Math.floor(Math.random() * this.grid.rows);
      col = Math.floor(Math.random() * this.grid.cols);
      tile = this.grid.getTile(row, col);
    } while (tile.plantType !== "dirt"); // Ensure the tile is "dirt"
    
    // Generate random properties for the new flower
      const randomSun = Math.floor(Math.random() * 11); // Random sun level (0-10)
      const randomWater = Math.floor(Math.random() * 11); // Random water level (0-10)
      const randomGrowth = Math.floor(Math.random() * 3) + 1; // Growth levels 1 to 3
      
      // Randomly pick a species
      const speciesOptions = ["species1", "species2", "species3"];
      const randomSpecies = speciesOptions[Math.floor(Math.random() * speciesOptions.length)];
      
      // Set the tile in the grid with the random values
      this.grid.setTile(row, col, randomSun, randomWater, randomSpecies, randomGrowth);
      
      // Use the getTileIdFromGrowth function to get the correct tile ID for the species and growth level
      const tileId = this.getTileIdFromGrowth(tile);
      
      // Update the tilemap with the correct tile ID
      this.map.putTileAt(tileId, col, row, true, this.grassLayer);
      console.log(`New flower generated at (${row}, ${col}) with species ${randomSpecies}!`);
  }
  
  
  

  updateTiles() {
    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        const neighbors = this.grid.getNeighbors(row, col);
        this.grid.updateTile(row, col, neighbors);
      }
    }
  }

  getPlayerTilePosition() {
    const playerX = this.player.x;
    const playerY = this.player.y;
  
    const row = Math.floor(playerY / this.TILE_SIZE);
    const col = Math.floor(playerX / this.TILE_SIZE);
  
    return { row, col };
  }

  undo() {
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
      console.log("State pushed to redoStack:", this.redoStack);

      const previousState = JSON.parse(this.undoStack.pop());
      this.loadState(previousState);
      console.log("Undo performed! Current undoStack:", this.undoStack);
    } else {
      console.log("No more actions to undo.");
    }
  }
  
  redo() {
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
      console.log("State pushed to undoStack:", this.undoStack);

      const nextState = JSON.parse(this.redoStack.pop());
      this.loadState(nextState);
      console.log("Redo performed! Current redoStack:", this.redoStack);
    } else {
      console.log("No more actions to redo.");
    }
  }
  
  loadState(state) {
    this.grid.stateArray = new Uint8Array(state.gridState);
    this.player.setPosition(state.playerPosition.x, state.playerPosition.y);
    this.stepsTaken = state.stepsTaken;
    this.waterLevel = state.waterLevel;
    this.reapedFlowers = state.reapedFlowers;
    this.won = state.won;
    this.rebuildTilemap();
  }

  checkWinCondition() {
    if (this.reapedFlowers >= 5 && !this.won) { // Temperary 3 reaped.
      this.won = true; // Set the won flag to true
      console.log("You win!");
      // Display win message
      const winText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, "You Win!", {
        fontSize: "64px",
        fill: "#00000",
      });
      winText.setOrigin(0.5); // Center the text
    }
  }

  update() {
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

    if (this.spaceKey.isDown) {
      const { row, col } = this.getPlayerTilePosition();
      const tile = this.grid.getTile(row, col);
    
      if (tile.growthLevel === 3) { // Flower is ready to be reaped
        this.waterLevel += tile.waterLevel;
        this.map.putTileAt(26, col, row, true, this.grassLayer); // Update tilemap to show the flower has been reaped

        // Update grid to reflect reaped state
        this.grid.setTile(row, col, tile.sunLevel, tile.waterLevel, "dirt", 0); // Set to a "reaped" state (growthLevel 0)
        this.reapedFlowers++; // Increment reaped flowers count
        console.log(`Plant Reaped: ${this.reapedFlowers}, Water Count: ${this.waterLevel}`);

        this.checkWinCondition(); // Check win condition after each reap

        this.spaceKey.reset(); // Reset the spacebar input
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.oneKey)) {
      console.log("Saving to Slot 1!");
      this.saveGame("gameStateSlot1");
    }
    
    if (Phaser.Input.Keyboard.JustDown(this.twoKey)) {
      console.log("Saving to Slot 2!");
      this.saveGame("gameStateSlot2");
    }
    
    if (Phaser.Input.Keyboard.JustDown(this.lKey)) {
      const loadSlot = prompt("Enter save slot to load (1 or 2):");
      const saveKey = loadSlot === "2" ? "gameStateSlot2" : "gameStateSlot1";
      console.log(`Loading from ${saveKey}!`);
      this.loadGame(saveKey);
    }

    if (Phaser.Input.Keyboard.JustDown(this.zKey)) {
      this.undo();
    }

    if (Phaser.Input.Keyboard.JustDown(this.yKey)) {
      this.redo();
    }
  }
}

