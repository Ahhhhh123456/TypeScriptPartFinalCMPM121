class Load extends Phaser.Scene {
  constructor() {
    super("loadScene");
  }

  preload() {
    this.load.setPath("./assets/");

    // Load tileset image and map data
    this.load.image("tiny_town_tiles", "kenny-tiny-town-tilemap-packed.png");
    this.load.tilemapTiledJSON("map", "TinyTownMap.json");

    // Loads the character spritesheet
    this.load.atlas(
      "platformer_characters",
      "tilemap-characters-packed.png",
      "tilemap-characters-packed.json",
    );
  }

  create() {
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

    this.anims.create({
      key: "idle",
      defaultTextureKey: "platformer_characters",
      frames: [
        { frame: "tile_0000.png" },
      ],
      repeat: -1,
    });

    this.anims.create({
      key: "jump",
      defaultTextureKey: "platformer_characters",
      frames: [
        { frame: "tile_0001.png" },
      ],
    });

    this.scene.start("platformerScene");
  }

  // Never get here since a new scene is started in create()
  update() {
  }
}
