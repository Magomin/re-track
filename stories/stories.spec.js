import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// La lista sale del catálogo construido: una story nueva queda cubierta sin tocar este fichero.
const indice = JSON.parse(readFileSync("storybook-static/index.json", "utf8"));
const stories = Object.values(indice.entries).filter((e) => e.type === "story");

test("el catálogo tiene stories", () => {
  expect(stories.length, "storybook-static/index.json no lista ninguna story: ¿falta `npm run build-storybook`?").toBeGreaterThan(0);
});

for (const story of stories) {
  test(`${story.title} · ${story.name}`, async ({ page }) => {
    const errores = [];
    page.on("pageerror", (e) => errores.push(String(e)));
    page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
    const panel = page.frameLocator('iframe[title="Panel de Re-track"]');
    // soporte.js marca el body cuando el panel ha cargado y contestado a la story.
    await expect(panel.locator('body[data-lista="si"]'), "el panel no terminó de arrancar: mira stories/soporte.js").toBeAttached();
    await expect(panel.locator(".logo")).toHaveText("RE-TRACK");
    expect(errores, "la story escribe errores en la consola").toEqual([]);
  });
}

// La demo del device (#43): el bucle dura 6 s y el device se suelta en el 80 % (4800 ms). Se para la animación en un
// instante dado y se mira dónde está el device respecto a su hueco.
test("Espejo · el device viaja hasta su hueco y desaparece sin pausa", async ({ page }) => {
  const story = stories.find((s) => s.name === "falta el device");
  expect(story, "no existe la story «falta el device»: este test la necesita (stories/espejo.stories.js)").toBeTruthy();
  await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
  const panel = page.frameLocator('iframe[title="Panel de Re-track"]');
  await expect(panel.locator('body[data-lista="si"]')).toBeAttached();
  const en = (ms) => panel.locator(".fantasma span").evaluate((device, ms) => {
    for (const el of [device, device.parentElement]) for (const a of el.getAnimations()) { a.pause(); a.currentTime = ms; }
    const centro = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
    const [x, y] = centro(device), [hx, hy] = centro(document.querySelector(".cadena .falta"));
    return { lejos: Math.round(Math.hypot(x - hx, y - hy)), opacidad: Number(getComputedStyle(device.parentElement).opacity) };
  }, ms);
  expect((await en(3900)).lejos, "al empezar el tercer gesto el device tiene que estar en el navegador, lejos de su hueco").toBeGreaterThan(40);
  const alSoltar = await en(4790);
  expect(alSoltar.opacidad, "justo antes de soltarlo el device tiene que verse").toBe(1);
  expect(alSoltar.lejos, "el device no llega a su hueco: ¿`--dx`/`--dy` se ponen antes de la clase `demo`? (dibujarEspejo, panel.js)").toBeLessThan(12);
  expect((await en(5100)).opacidad, "300 ms después de soltarlo el device sigue a la vista: la pausa ha vuelto (demo-x, panel.css)").toBe(0);
});
