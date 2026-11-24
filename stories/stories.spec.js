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

// #61: el mapa sigue el alto de la ventana (262 px a 460, el diseño; más a 700).
test("el mapa crece con la ventana", async ({ page }) => {
  const alto = async (id) => {
    await page.goto(`/iframe.html?id=${id}&viewMode=story`);
    const panel = page.frameLocator('iframe[title="Panel de Re-track"]');
    await expect(panel.locator('body[data-lista="si"]')).toBeAttached();
    return (await panel.locator("#mapa").boundingBox()).height;
  };
  expect(await alto("pantalla-de-lecciones--empezada"), "a 460 de alto el mapa debe medir 262 px, como en docs/design").toBe(262);
  expect(await alto("pantalla-de-lecciones--ventana-grande"), "el mapa no crece con la ventana: mira #mapa en panel/panel.css").toBe(502);
});
