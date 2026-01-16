import { TILE_TYPES, BGM_KEY, BGM_PATH, BGM_VOL_MENU } from "../config.js";
import { addFullScreenBackground, drawRoundedPanel, makeFancyButton, showConfirm } from "../ui.js";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
    this.dialogOpen = false;
    this.floaters = [];
    this.tip = null;
    this.panel = null;
  }

  preload() {
    this.load.audio(BGM_KEY, BGM_PATH);
    for (let i = 1; i <= TILE_TYPES; i++) {
      this.load.image(`tile${i}`, `assets/tiles/tile${i}.png`);
    }
  }

  create() {
    addFullScreenBackground(this);

    const { width, height } = this.scale.gameSize;

    this.createFloatingCandies();

    this.add
      .text(width / 2, height * 0.18, "AFGHAN CANDIES", {
        fontSize: "46px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.25, "Match 3 Afghan sweets — juicy & fun!", {
        fontSize: "16px",
        color: "#b9bcc7",
      })
      .setOrigin(0.5);

    this.panel = drawRoundedPanel(this, width / 2, height * 0.56, 360, 380, 22);
    this.panel.setDepth(10);

    makeFancyButton(this, width / 2, height * 0.49, "PLAY", () => {
      if (this.dialogOpen) return;
      this.askPlayerNameAndStart();
    }).setDepth(20);

    makeFancyButton(this, width / 2, height * 0.60, "HOME", () => {
      if (this.dialogOpen) return;
      window.location.reload();
    }).setDepth(20);

    makeFancyButton(this, width / 2, height * 0.71, "LEAVE", () => {
      if (this.dialogOpen) return;
      showConfirm(this, "Are you sure you want to leave?", () => {
        if (this.game.bgm) this.game.bgm.stop();
        try {
          window.close();
        } catch (e) {}
      });
    }).setDepth(20);

    this.tip = this.add
      .text(width / 2, height * 0.86, "Tap once anywhere to enable sound 🎵", {
        fontSize: "14px",
        color: "#9a9a9a",
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.game.bgm = this.game.bgm || null;
    this.game.audioUnlocked = this.game.audioUnlocked || false;

    // If audio already unlocked, start menu music immediately
    if (this.game.audioUnlocked) {
      this.tip.setText("Sound enabled ✅");

      if (!this.game.bgm) {
        this.game.bgm = this.sound.add(BGM_KEY, { loop: true, volume: BGM_VOL_MENU });
      }
      if (!this.game.bgm.isPlaying) this.game.bgm.play();
      this.game.bgm.setVolume(BGM_VOL_MENU);
    }

    // First-ever user interaction unlock
    this.input.once("pointerdown", () => {
      this.game.audioUnlocked = true;
      this.tip.setText("Sound enabled ✅");

      if (!this.game.bgm) {
        this.game.bgm = this.sound.add(BGM_KEY, { loop: true, volume: BGM_VOL_MENU });
      }
      if (!this.game.bgm.isPlaying) this.game.bgm.play();
      this.game.bgm.setVolume(BGM_VOL_MENU);
    });
  }

  askPlayerNameAndStart() {
    this.dialogOpen = true;

    const { width, height } = this.scale.gameSize;

    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.65)
      .setDepth(7000)
      .setInteractive();

    const panelG = drawRoundedPanel(this, width / 2, height / 2, 460, 280, 18);
    panelG.setDepth(7001);

    const title = this.add
      .text(width / 2, height / 2 - 95, "Enter your name", {
        fontSize: "22px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(7002);

    const hint = this.add
      .text(width / 2, height / 2 - 60, "This will show in the game.", {
        fontSize: "14px",
        color: "#b9bcc7",
      })
      .setOrigin(0.5)
      .setDepth(7002);

    // DOM input (requires dom: { createContainer: true } in game.js)
    const inputHtml = `
      <div style="width:320px;">
        <input id="pname" type="text" maxlength="16"
          style="
            width: 320px;
            padding: 12px 14px;
            border-radius: 10px;
            border: 2px solid #3a3f4c;
            outline: none;
            font-size: 18px;
            background: #20232c;
            color: #ffffff;
            box-sizing: border-box;
          "
          placeholder="Your name..."
        />
      </div>
    `;

    const dom = this.add.dom(width / 2, height / 2 - 10).createFromHTML(inputHtml);
    dom.setDepth(7002);

    const getInputEl = () => dom.getChildByID("pname");

    // Pre-fill if already set
    const el = getInputEl();
    if (el) {
      el.value = this.game.playerName || "";
      setTimeout(() => el.focus(), 60);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") onOk();
      });
    }

    const okBtn = makeFancyButton(this, width / 2 - 95, height / 2 + 90, "OK", () => onOk(), 150, 52).setDepth(7003);
    const cancelBtn = makeFancyButton(this, width / 2 + 95, height / 2 + 90, "CANCEL", () => cleanup(), 150, 52).setDepth(7003);

    const onResize = (gs) => {
      overlay.setPosition(gs.width / 2, gs.height / 2).setSize(gs.width, gs.height);
      panelG.setPosition(gs.width / 2, gs.height / 2);
      title.setPosition(gs.width / 2, gs.height / 2 - 95);
      hint.setPosition(gs.width / 2, gs.height / 2 - 60);
      dom.setPosition(gs.width / 2, gs.height / 2 - 10);
      okBtn.setPosition(gs.width / 2 - 95, gs.height / 2 + 90);
      cancelBtn.setPosition(gs.width / 2 + 95, gs.height / 2 + 90);
    };

    this.scale.on("resize", onResize);

    const cleanup = () => {
      this.scale.off("resize", onResize);
      overlay.destroy();
      panelG.destroy();
      title.destroy();
      hint.destroy();
      dom.destroy();
      okBtn.destroy();
      cancelBtn.destroy();
      this.dialogOpen = false;
    };

    const onOk = () => {
      const input = getInputEl();
      const name = (input?.value || "").trim();

      if (!name) {
        // simple shake feedback
        this.tweens.add({
          targets: panelG,
          x: panelG.x + 6,
          duration: 60,
          yoyo: true,
          repeat: 2,
        });
        return;
      }

      this.game.playerName = name; // ✅ saved globally
      cleanup();
      this.scene.start("MainScene");
    };
  }

  createFloatingCandies() {
    const { width, height } = this.scale.gameSize;
    this.floaters = [];

    const count = 10;
    for (let i = 0; i < count; i++) {
      const t = Phaser.Math.Between(1, TILE_TYPES);
      const img = this.add.image(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), `tile${t}`);

      const s = Phaser.Math.FloatBetween(0.45, 0.75);
      img.setScale(s);
      img.setAlpha(0.10);
      img.setDepth(-200);

      img.setData("vx", Phaser.Math.FloatBetween(-12, 12));
      img.setData("vy", Phaser.Math.FloatBetween(8, 18));
      img.setData("wobble", Phaser.Math.FloatBetween(0, Math.PI * 2));
      img.setData("wspd", Phaser.Math.FloatBetween(0.6, 1.2));

      this.floaters.push(img);
    }
  }

  update(_, dt) {
    const { width, height } = this.scale.gameSize;
    const d = dt / 1000;

    for (const f of this.floaters) {
      const wob = f.getData("wobble") + f.getData("wspd") * d;
      f.setData("wobble", wob);

      f.x += f.getData("vx") * d + Math.sin(wob) * 8 * d;
      f.y += f.getData("vy") * d;

      f.rotation = Math.sin(wob) * 0.08;

      if (f.y > height + 80) {
        f.y = -80;
        f.x = Phaser.Math.Between(0, width);
      }
      if (f.x < -80) f.x = width + 80;
      if (f.x > width + 80) f.x = -80;
    }
  }
}
