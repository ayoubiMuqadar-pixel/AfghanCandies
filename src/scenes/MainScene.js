// MainScene.js (FULL) — music DISABLED in gameplay

import {
  GRID_SIZE,
  TILE_TYPES,
  TILE_SIZE,
  TILE_GAP,
  VOICE_COUNT,
  LEVELS,
  BGM_KEY,
  BGM_PATH,
  BGM_VOL_MENU,
  BGM_VOL_GAME,
  UI,
} from "../config.js";

import { TILE_NAMES } from "../config.js";

import { addFullScreenBackground, drawRoundedPanel, makeFancyButton, showConfirm } from "../ui.js";

export class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");

    this.grid = [];
    this.isBusy = false;
    this.dialogOpen = false;

    this.voices = [];

    this.boardW = 0;
    this.boardH = 0;
    this.boardX = 0;
    this.boardY = 0;

    this.dragStart = null;
    this.dragUsed = false;

    this.highlightRect = null;

    // Score + combo
    this.score = 0;
    this.combo = 0;

    // Level system
    this.levelIndex = 0;
    this.level = null;
    this.movesLeft = 0;
    this.goalsLeft = {};

    // HUD texts
    this.scoreText = null;
    this.movesText = null;
    this.comboText = null;
    this.levelText = null;
    this.goalText = null;

    this.boardPanelG = null;
  }

  showLevelLoading(nextIndex, seconds = 10) {
    this.dialogOpen = true; // block input during loading
    this.isBusy = true;

    // stop any playing tile voices
    this.stopAllVoices();

    const { width, height } = this.scale.gameSize;

    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
      .setDepth(6000);

    const panel = this.add
      .rectangle(width / 2, height / 2, 420, 220, 0x17181c, 1)
      .setDepth(6001)
      .setStrokeStyle(2, 0x2e313a, 1);

    const title = this.add
      .text(width / 2, height / 2 - 55, "Loading next level…", {
        fontSize: "22px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(6002);

    const sub = this.add
      .text(width / 2, height / 2 - 20, `Starting in ${seconds}s`, {
        fontSize: "16px",
        color: "#b9bcc7",
      })
      .setOrigin(0.5)
      .setDepth(6002);

    const barW = 320;
    const barH = 16;

    const barBg = this.add
      .rectangle(width / 2, height / 2 + 30, barW, barH, 0x2e313a, 1)
      .setOrigin(0.5)
      .setDepth(6002);

    const barFill = this.add
      .rectangle(width / 2 - barW / 2, height / 2 + 30, 0, barH, 0x6ee7ff, 1)
      .setOrigin(0, 0.5)
      .setDepth(6003);

    let left = seconds;

    const tick = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        left -= 1;
        sub.setText(`Starting in ${left}s`);

        const p = (seconds - left) / seconds;
        barFill.width = Math.floor(barW * p);

        if (left <= 0) {
          tick.remove(false);
          cleanup();
          this.startLevel(nextIndex); // ✅ go to next level after loading
          this.isBusy = false;
          this.dialogOpen = false;
        }
      },
    });

    // in case the scene resizes while loading
    const onResize = (gs) => {
      overlay.setPosition(gs.width / 2, gs.height / 2).setSize(gs.width, gs.height);
      panel.setPosition(gs.width / 2, gs.height / 2);
      title.setPosition(gs.width / 2, gs.height / 2 - 55);
      sub.setPosition(gs.width / 2, gs.height / 2 - 20);
      barBg.setPosition(gs.width / 2, gs.height / 2 + 30);
      barFill.setPosition(gs.width / 2 - barW / 2, gs.height / 2 + 30);
    };

    this.scale.on("resize", onResize);

    const cleanup = () => {
      this.scale.off("resize", onResize);
      overlay.destroy();
      panel.destroy();
      title.destroy();
      sub.destroy();
      barBg.destroy();
      barFill.destroy();
    };
  }

  preload() {
    for (let i = 1; i <= TILE_TYPES; i++) {
      this.load.image(`tile${i}`, `assets/tiles/tile${i}.png`);
    }

    for (let t = 1; t <= TILE_TYPES; t++) {
      const count = VOICE_COUNT[t] || 1;
      for (let v = 1; v <= count; v++) {
        this.load.audio(`voice${t}_${v}`, `assets/sfx/voice${t}_${v}.mp3`);
      }
    }

    this.load.audio(BGM_KEY, BGM_PATH);
  }

  create() {
    addFullScreenBackground(this);

    // ✅ Gameplay: music OFF
    if (this.game.bgm) {
      this.game.bgm.stop();
    }

    // HUD
    const hud = drawRoundedPanel(this, 170, 110, 320, 150, 18, UI.panel, UI.stroke, 0.95);

    hud.setDepth(100);

    this.add
      .text(30, 18 + 30, "AFGHAN CANDIES", { fontSize: "20px", color: "#fff", fontStyle: "bold" })
      .setDepth(110);

    this.scoreText = this.add.text(30, 48 + 30, "Score: 0", { fontSize: "16px", color: "#fff" }).setDepth(110);
    this.movesText = this.add.text(30, 70 + 30, "Moves: 15", { fontSize: "16px", color: "#fff" }).setDepth(110);

    this.levelText = this.add.text(30, 92 + 30, "", { fontSize: "16px", color: "#fff" }).setDepth(110);
    this.goalText = this.add.text(30, 114 + 30, "", { fontSize: "14px", color: "#b9bcc7" }).setDepth(110);

    this.comboText = this.add
      .text(250, 70, "", { fontSize: "16px", color: "#ffd166", fontStyle: "bold" })
      .setDepth(110)
      .setOrigin(0, 0);

    // Menu button
    const menuBtn = makeFancyButton(
      this,
      320,
      75,
      "MENU",
      () => {
        if (this.isBusy || this.dialogOpen) return;
        showConfirm(this, "Go back to menu?", () => {
          this.stopAllVoices();
          if (this.game.bgm) this.game.bgm.setVolume(BGM_VOL_MENU); // (menu will re-start it)
          this.scene.start("MenuScene");
        });
      },
      140,
      50
    );
    menuBtn.setDepth(120);

    this.input.mouse.disableContextMenu();
    this.input.setTopOnly(true);

    // Voices
    this.voices = Array.from({ length: TILE_TYPES + 1 }, () => []);
    for (let t = 1; t <= TILE_TYPES; t++) {
      const count = VOICE_COUNT[t] || 1;
      for (let v = 1; v <= count; v++) {
        this.voices[t].push(this.sound.add(`voice${t}_${v}`));
      }
    }

    // NOTE: Music setup removed from MainScene on purpose

    // Board size
    this.boardW = GRID_SIZE * (TILE_SIZE + TILE_GAP) - TILE_GAP;
    this.boardH = GRID_SIZE * (TILE_SIZE + TILE_GAP) - TILE_GAP;

    // Highlight
    this.highlightRect = this.add
      .rectangle(0, 0, TILE_SIZE + 8, TILE_SIZE + 8)
      .setStrokeStyle(3, UI.glow, 0.85)
      .setVisible(false)
      .setDepth(200);

    // Resize
    this.scale.on("resize", this.onResize, this);
    this.onResize(this.scale.gameSize);

    // Start level 1
    this.startLevel(0);

    // Input
    this.setupDragControls();
  }

  stopAllVoices() {
    for (let t = 1; t <= TILE_TYPES; t++) {
      for (const snd of this.voices[t]) {
        try {
          snd.stop();
        } catch (e) {}
      }
    }
  }

  startLevel(index) {
    this.levelIndex = index;
    this.level = LEVELS[this.levelIndex];

    this.stopAllVoices();

    this.movesLeft = this.level.moves;
    this.goalsLeft = { ...this.level.goals };
    this.combo = 0;
    this.comboText.setText("");

    // Destroy old sprites
    if (this.grid?.length) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const t = this.grid[r]?.[c];
          if (t?.sprite) t.sprite.destroy();
        }
      }
    }

    this.createGridNoMatches();
    this.updateLevelUI();
  }

  updateLevelUI() {
  this.movesText.setText(`Moves: ${this.movesLeft}`);
  this.levelText.setText(`${this.level.title}  (${this.levelIndex + 1}/${LEVELS.length})`);

  const parts = Object.entries(this.goalsLeft).map(([type, left]) => {
    const name = TILE_NAMES[type] || `Tile ${type}`;
    return `${name}: ${Math.max(0, left)}`;
  });

  this.goalText.setText("Goals: " + parts.join("   "));
}


  isLevelComplete() {
    return Object.values(this.goalsLeft).every((v) => v <= 0);
  }

  onResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    this.boardX = Math.floor((width - this.boardW) / 2);
    this.boardY = Math.floor((height - this.boardH) / 2) + 90;


    if (this.boardPanelG) this.boardPanelG.destroy();
    this.boardPanelG = drawRoundedPanel(
      this,
      width / 2,
      this.boardY + this.boardH / 2,
      this.boardW + 40,
      this.boardH + 40,
      22,
      UI.panel,
      UI.stroke,
      0.96
    );
    this.boardPanelG.setDepth(-5);
    this.boardPanelG.disableInteractive?.();


    if (this.grid?.length) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const tile = this.grid[r][c];
          if (!tile) continue;
          const p = this.worldPosFor(r, c);
          tile.sprite.setPosition(p.x, p.y);
        }
      }
    }
  }

  createGridNoMatches() {
    this.grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        let type;
        do type = Phaser.Math.Between(1, this.level.maxTypes);
        while (this.wouldCreateMatch(r, c, type));
        this.spawnTile(r, c, type, false);
      }
    }
  }

  wouldCreateMatch(r, c, type) {
    if (c >= 2) {
      const t1 = this.grid[r][c - 1]?.type;
      const t2 = this.grid[r][c - 2]?.type;
      if (t1 === type && t2 === type) return true;
    }
    if (r >= 2) {
      const t1 = this.grid[r - 1][c]?.type;
      const t2 = this.grid[r - 2][c]?.type;
      if (t1 === type && t2 === type) return true;
    }
    return false;
  }

  worldPosFor(r, c) {
    return {
      x: this.boardX + c * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2,
      y: this.boardY + r * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2,
    };
  }

  spawnTile(r, c, type, fromTop = true) {
    const { x, y } = this.worldPosFor(r, c);
    const startY = fromTop ? this.boardY - TILE_SIZE : y;

    const sprite = this.add.image(x, startY, `tile${type}`).setDisplaySize(TILE_SIZE, TILE_SIZE).setInteractive().setDepth(50);

    const tile = { type, sprite, r, c };
    this.grid[r][c] = tile;

    if (fromTop) {
      this.tweens.add({ targets: sprite, y, duration: 180, ease: "Sine.easeOut" });
    } else {
      sprite.y = y;
    }
    return tile;
  }

  pointerToRC(pointer) {
    const c = Math.floor((pointer.x - this.boardX) / (TILE_SIZE + TILE_GAP));
    const r = Math.floor((pointer.y - this.boardY) / (TILE_SIZE + TILE_GAP));
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return null;
    return { r, c };
  }

  setupDragControls() {
    this.dragStart = null;
    this.dragUsed = false;

    this.input.on("pointerdown", (pointer) => {
      if (this.isBusy || this.dialogOpen) return;

      const rc = this.pointerToRC(pointer);
      if (!rc) return;

      this.dragStart = { x: pointer.x, y: pointer.y, r: rc.r, c: rc.c };
      this.dragUsed = false;

      this.highlight(rc.r, rc.c, true);
    });

    this.input.on("pointermove", (pointer) => {
      if (this.isBusy || this.dialogOpen) return;
      if (!this.dragStart) return;
      if (this.dragUsed) return;

      const dx = pointer.x - this.dragStart.x;
      const dy = pointer.y - this.dragStart.y;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

      const dir =
        Math.abs(dx) > Math.abs(dy)
          ? { dr: 0, dc: dx > 0 ? 1 : -1 }
          : { dr: dy > 0 ? 1 : -1, dc: 0 };

      const r1 = this.dragStart.r;
      const c1 = this.dragStart.c;
      const r2 = r1 + dir.dr;
      const c2 = c1 + dir.dc;

      if (r2 < 0 || r2 >= GRID_SIZE || c2 < 0 || c2 >= GRID_SIZE) return;

      this.dragUsed = true;
      this.highlightRect.setVisible(false);

      this.trySwap(r1, c1, r2, c2);
      this.dragStart = null;
    });

    this.input.on("pointerup", () => {
      if (this.dialogOpen) return;
      this.highlightRect.setVisible(false);
      this.dragStart = null;
    });
  }

  highlight(r, c, on) {
    if (!on) {
      this.highlightRect.setVisible(false);
      return;
    }
    const tile = this.grid[r][c];
    if (!tile) return;
    this.highlightRect.setPosition(tile.sprite.x, tile.sprite.y).setVisible(true);
  }

  async trySwap(r1, c1, r2, c2) {
    if (this.isBusy || this.dialogOpen) return;
    if (this.movesLeft <= 0) return;

    this.isBusy = true;

    await this.animateSwap(r1, c1, r2, c2, "Sine.easeInOut", 140);
    this.swapTilesInGrid(r1, c1, r2, c2);

    if (this.findAllMatches().size === 0) {
      await this.animateSwap(r1, c1, r2, c2, "Back.easeOut", 220);
      this.swapTilesInGrid(r1, c1, r2, c2);
      this.isBusy = false;
      return;
    }

    this.movesLeft--;
    this.updateLevelUI();

    this.combo = 0;

    while (true) {
      const matches = this.findAllMatches();
      if (matches.size === 0) break;

      this.combo++;
      this.comboText.setText(this.combo >= 2 ? `COMBO x${this.combo}!` : "");

      const matchedCount = matches.size;
      const base = matchedCount * 10;
      const comboBonus = (this.combo - 1) * 15;
      this.score += base + comboBonus;
      this.scoreText.setText(`Score: ${this.score}`);

      const types = this.getMatchedTypes(matches);
      this.playVoiceForTypes(types);

      await this.clearMatches(matches);
      await this.dropTiles();
      await this.refillTiles();
    }

    this.comboText.setText("");

    if (this.isLevelComplete()) {
      // ✅ stop any currently-playing tile voice immediately
      this.stopAllVoices();

      this.isBusy = false;

      if (this.levelIndex >= LEVELS.length - 1) {
        showConfirm(this, "🎉 You finished all 5 levels! Play again?", () => this.startLevel(0));
      } else {
        showConfirm(this, `✅ ${this.level.title} complete! Next level?`, () => {
          this.showLevelLoading(this.levelIndex + 1, 10);
        });
      }
      return;
    }

    if (this.movesLeft <= 0) {
      this.isBusy = false;
      showConfirm(this, "❌ Out of moves! Retry this level?", () => this.startLevel(this.levelIndex));
      return;
    }

    this.isBusy = false;
  }

  animateSwap(r1, c1, r2, c2, ease = "Sine.easeInOut", duration = 140) {
    const t1 = this.grid[r1][c1];
    const t2 = this.grid[r2][c2];
    const p1 = this.worldPosFor(r1, c1);
    const p2 = this.worldPosFor(r2, c2);

    return new Promise((resolve) => {
      let done = 0;
      const finish = () => (++done === 2 ? resolve() : null);

      this.tweens.add({ targets: t1.sprite, x: p2.x, y: p2.y, duration, ease, onComplete: finish });
      this.tweens.add({ targets: t2.sprite, x: p1.x, y: p1.y, duration, ease, onComplete: finish });
    });
  }

  swapTilesInGrid(r1, c1, r2, c2) {
    const a = this.grid[r1][c1];
    const b = this.grid[r2][c2];
    this.grid[r1][c1] = b;
    this.grid[r2][c2] = a;

    a.r = r2;
    a.c = c2;
    b.r = r1;
    b.c = c1;
  }

  findAllMatches() {
    const toClear = new Set();

    for (let r = 0; r < GRID_SIZE; r++) {
      let runType = null,
        runStart = 0,
        runLen = 0;
      for (let c = 0; c <= GRID_SIZE; c++) {
        const t = c < GRID_SIZE ? this.grid[r][c]?.type : null;
        if (t && t === runType) runLen++;
        else {
          if (runType && runLen >= 3) {
            for (let k = 0; k < runLen; k++) toClear.add(`${r},${runStart + k}`);
          }
          runType = t;
          runStart = c;
          runLen = t ? 1 : 0;
        }
      }
    }

    for (let c = 0; c < GRID_SIZE; c++) {
      let runType = null,
        runStart = 0,
        runLen = 0;
      for (let r = 0; r <= GRID_SIZE; r++) {
        const t = r < GRID_SIZE ? this.grid[r][c]?.type : null;
        if (t && t === runType) runLen++;
        else {
          if (runType && runLen >= 3) {
            for (let k = 0; k < runLen; k++) toClear.add(`${runStart + k},${c}`);
          }
          runType = t;
          runStart = r;
          runLen = t ? 1 : 0;
        }
      }
    }

    return toClear;
  }

  getMatchedTypes(matchesSet) {
    const types = new Set();
    matchesSet.forEach((key) => {
      const [rs, cs] = key.split(",");
      const r = parseInt(rs, 10);
      const c = parseInt(cs, 10);
      const tile = this.grid[r][c];
      if (tile) types.add(tile.type);
    });
    return types;
  }

  playVoiceForTypes(typesSet) {
    if (!this.game.audioUnlocked) return;

    this.stopAllVoices();

    const arr = Array.from(typesSet);
    if (arr.length === 0) return;

    const t = arr[0];
    const options = this.voices[t];
    if (!options || options.length === 0) return;

    Phaser.Utils.Array.GetRandom(options).play({ volume: 0.9 });
  }

  clearMatches(matchesSet) {
    return new Promise((resolve) => {
      const tiles = [];
      matchesSet.forEach((key) => {
        const [rs, cs] = key.split(",");
        const r = parseInt(rs, 10);
        const c = parseInt(cs, 10);
        const tile = this.grid[r][c];
        if (tile) tiles.push(tile);
      });

      if (tiles.length === 0) return resolve();

      for (const tile of tiles) {
        const t = tile.type;
        if (this.goalsLeft[t] != null) this.goalsLeft[t] -= 1;
      }
      this.updateLevelUI();

      let done = 0;
      const finish = () => {
        done++;
        if (done === tiles.length) resolve();
      };

      tiles.forEach((tile) => {
        this.grid[tile.r][tile.c] = null;

        this.tweens.add({
          targets: tile.sprite,
          alpha: 0,
          duration: 140,
          ease: "Sine.easeIn",
          onComplete: () => {
            tile.sprite.destroy();
            finish();
          },
        });
      });
    });
  }

  dropTiles() {
    const moves = [];

    for (let c = 0; c < GRID_SIZE; c++) {
      let writeRow = GRID_SIZE - 1;

      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        const tile = this.grid[r][c];
        if (tile) {
          if (r !== writeRow) {
            this.grid[writeRow][c] = tile;
            this.grid[r][c] = null;

            tile.r = writeRow;
            tile.c = c;

            moves.push(tile);
          }
          writeRow--;
        }
      }
    }

    if (moves.length === 0) return Promise.resolve();

    return new Promise((resolve) => {
      let done = 0;
      const finish = () => {
        done++;
        if (done === moves.length) resolve();
      };

      moves.forEach((tile) => {
        const { x, y } = this.worldPosFor(tile.r, tile.c);
        this.tweens.add({
          targets: tile.sprite,
          x,
          y,
          duration: 180,
          ease: "Sine.easeIn",
          onComplete: finish,
        });
      });
    });
  }

  refillTiles() {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!this.grid[r][c]) {
          const type = Phaser.Math.Between(1, this.level.maxTypes);
          this.spawnTile(r, c, type, true);
        }
      }
    }
    return new Promise((resolve) => this.time.delayedCall(220, resolve));
  }
}
