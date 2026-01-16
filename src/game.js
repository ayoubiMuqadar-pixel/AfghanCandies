import { MenuScene } from "./scenes/MenuScene.js";
import { MainScene } from "./scenes/MainScene.js";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#111111",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },

  // ✅ Enable DOM Elements (needed for name input)
  dom: { createContainer: true },

  scene: [MenuScene, MainScene],
});
