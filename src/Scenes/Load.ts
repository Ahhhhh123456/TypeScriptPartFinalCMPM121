interface LanguageData {
  waterCount: string;
  reapCount: string;
  Win: string;
  continue: string;
  saveSlot: string;
}

class Load extends Phaser.Scene {
  private langData: LanguageData | null = null;

  // Constructor defining the scene key
  constructor() {
    super("loadScene");
    
  }

  // Preload method to load assets
  preload(): void {
    this.load.setPath("./assets/");

    this.load.json('lang_en', "en.json");
    this.load.json('lang_ch', "ch.json");
    this.load.json("lang_ar", "ar.json");

    // Load tileset image and map data
    this.load.image("tiny_town_tiles", "kenny-tiny-town-tilemap-packed.png");
    this.load.tilemapTiledJSON("map", "TinyTownMap.json");


    this.load.image("scythe", "scythe.png");
    this.load.image("one", "one.png");
    this.load.image("two", "two.png");
    this.load.image("z", "z.png");
    this.load.image("y", "y.png");
    this.load.image("n", "n.png");
    this.load.image("l", "L.png");

    this.load.image("up", "up.png");
    this.load.image("down", "down.png");
    this.load.image("left", "left.png");
    this.load.image("right", "right.png");

    // Load the character spritesheet and associated JSON atlas
    this.load.atlas(
      "platformer_characters",
      "tilemap-characters-packed.png",
      "tilemap-characters-packed.json"
    );
  }

  // Create method to define animation and transition to the next scene
  create(): void {
    this.langData = this.cache.json.get('language');

    // Define the walking animation
    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNames("platformer_characters", {
        prefix: "tile_",
        start: 0,
        end: 1,
        suffix: ".png",
        zeroPad: 4,
      }),
      frameRate: 15,
      repeat: -1,
    });

    // Define the idle animation
    this.anims.create({
      key: "idle",
      defaultTextureKey: "platformer_characters",
      frames: [{ frame: "tile_0000.png" }],
      repeat: -1,
    });

    // Define the jump animation
    this.anims.create({
      key: "jump",
      defaultTextureKey: "platformer_characters",
      frames: [{ frame: "tile_0001.png" }],
    });

    // Transition to the "platformerScene"
    this.scene.start("platformerScene");
  }

  // Update is empty in this case as the logic transitions to another scene
  update(): void {}
}

export default Load;