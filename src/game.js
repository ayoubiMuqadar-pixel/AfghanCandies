import { MenuScene } from "./scenes/MenuScene.js";
import { MainScene } from "./scenes/MainScene.js";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#111111",

  scale: {
    mode: Phaser.Scale.FIT, // ✅ IMPORTANT (no clipping)
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 800,
  },

  dom: {
    createContainer: true,
  },

  scene: [MenuScene, MainScene],
});
