import { UI } from "./config.js";

export function ensureGradientTexture(scene, key, w = 512, h = 512) {
  if (scene.textures.exists(key)) return;

  const canvasTex = scene.textures.createCanvas(key, w, h);
  const ctx = canvasTex.getContext();

  const cx = w * 0.5;
  const cy = h * 0.35;
  const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(w, h) * 0.8);
  g.addColorStop(0, "#2b2f3a");
  g.addColorStop(0.45, "#141721");
  g.addColorStop(1, "#0b0d12");

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 120; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 1.6 + 0.2;
    const a = Math.random() * 0.25 + 0.05;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  canvasTex.refresh();
}

export function addFullScreenBackground(scene) {
  ensureGradientTexture(scene, "__bgGrad");
  const { width, height } = scene.scale.gameSize;
  const bg = scene.add.image(width / 2, height / 2, "__bgGrad").setDisplaySize(width, height);
  bg.setDepth(-1000);

  scene.scale.on("resize", (gs) => {
    bg.setPosition(gs.width / 2, gs.height / 2);
    bg.setDisplaySize(gs.width, gs.height);
  });

  return bg;
}

export function drawRoundedPanel(scene, x, y, w, h, radius = 18, fill = UI.panel, stroke = UI.stroke, alpha = 1) {
  const g = scene.add.graphics();

  g.fillStyle(0x000000, 0.25);
  g.fillRoundedRect(x - w / 2 + 6, y - h / 2 + 8, w, h, radius);

  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, radius);

  g.fillStyle(UI.panel2, 0.35);
  g.fillRoundedRect(x - w / 2 + 8, y - h / 2 + 8, w - 16, h - 16, Math.max(10, radius - 6));

  g.lineStyle(2, stroke, 1);
  g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, radius);

  return g;
}

export function makeFancyButton(scene, x, y, label, onClick, w = 240, h = 58) {
  const container = scene.add.container(x, y);

  const shadow = scene.add.rectangle(0, 6, w, h, 0x000000, 0.25).setOrigin(0.5);
  const bg = scene.add.rectangle(0, 0, w, h, 0x20232c, 1).setOrigin(0.5);
  const stroke = scene.add.rectangle(0, 0, w, h, 0x000000, 0).setOrigin(0.5);
  stroke.setStrokeStyle(2, 0x3a3f4c, 1);

  const glow = scene.add.rectangle(0, 0, w + 10, h + 10, 0x000000, 0).setOrigin(0.5);
  glow.setStrokeStyle(2, UI.glow, 0.0);

  const txt = scene.add.text(0, 0, label, {
    fontSize: "20px",
    color: "#ffffff",
    fontStyle: "bold",
  }).setOrigin(0.5);

  container.add([shadow, bg, stroke, glow, txt]);
  container.setSize(w, h);

  container.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
  container.input.cursor = "pointer";

  const setGlow = (a) => glow.setStrokeStyle(2, UI.glow, a);

  container.on("pointerover", () => {
    scene.tweens.killTweensOf(container);
    bg.setFillStyle(0x252a35, 1);
    setGlow(0.55);
    scene.tweens.add({ targets: container, scaleX: 1.02, scaleY: 1.02, duration: 120, ease: "Sine.easeOut" });
  });

  container.on("pointerout", () => {
    scene.tweens.killTweensOf(container);
    bg.setFillStyle(0x20232c, 1);
    setGlow(0.0);
    scene.tweens.add({ targets: container, scaleX: 1.0, scaleY: 1.0, duration: 120, ease: "Sine.easeOut" });
  });

  container.on("pointerdown", () => {
    scene.tweens.killTweensOf(container);
    scene.tweens.add({
      targets: container,
      scaleX: 0.98,
      scaleY: 0.98,
      yoyo: true,
      duration: 90,
      ease: "Sine.easeInOut",
    });
    onClick?.();
  });

  return container;
}

export function showConfirm(scene, message, onYes) {
  scene.dialogOpen = true;

  const { width, height } = scene.scale.gameSize;

  const overlay = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
    .setDepth(5000)
    .setInteractive();

  const panelG = drawRoundedPanel(scene, width / 2, height / 2, 420, 240, 18);
  panelG.setDepth(5001);

  const txt = scene.add
    .text(width / 2, height / 2 - 55, message, {
      fontSize: "16px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: 360 },
    })
    .setOrigin(0.5)
    .setDepth(5002);

  const yes = makeFancyButton(
    scene,
    width / 2 - 95,
    height / 2 + 55,
    "YES",
    () => {
      cleanup();
      onYes?.();
    },
    150,
    52
  ).setDepth(5003);

  const no = makeFancyButton(scene, width / 2 + 95, height / 2 + 55, "NO", () => cleanup(), 150, 52).setDepth(5003);

  function cleanup() {
    overlay.destroy();
    panelG.destroy();
    txt.destroy();
    yes.destroy();
    no.destroy();
    scene.dialogOpen = false;
  }
}
