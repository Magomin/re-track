import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Lo que se ve en cada estado de la carátula: la foto o la inicial. Los estados salen de stories/caratula.stories.js.
const indice = JSON.parse(readFileSync("storybook-static/index.json", "utf8"));
const abrir = async (page, nombre) => {
  const story = Object.values(indice.entries).find((e) => e.title === "Carátula" && e.name === nombre);
  expect(story, `no existe la story «${nombre}» de Carátula: ¿cambió de nombre en stories/caratula.stories.js?`).toBeTruthy();
  await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
  const panel = page.frameLocator('iframe[title="Panel de Re-track"]');
  await expect(panel.locator('body[data-lista="si"]')).toBeAttached();
  return panel.locator(".car");
};

for (const nombre of ["con foto", "sin conexión, con la foto ya guardada"]) {
  test(`${nombre}: sale la foto y no la inicial`, async ({ page }) => {
    const caratulas = await abrir(page, nombre);
    await expect(caratulas).toHaveCount(3);
    for (const c of await caratulas.all()) {
      await expect(c, "la foto no se ha puesto de fondo: mira buscarFoto en panel/caratula.js").toHaveCSS("background-image", /^url\("blob:/);
      await expect(c).toHaveText("");
      await expect(c).not.toHaveClass(/sin/);
    }
  });
}

for (const nombre of ["canción que no se encuentra", "sin conexión"]) {
  test(`${nombre}: sale la inicial`, async ({ page }) => {
    const caratulas = await abrir(page, nombre);
    await expect(caratulas, "sin foto tiene que quedarse la inicial de la lección: mira caratula() en panel/caratula.js").toHaveText(["J", "J", "J"]);
    await expect(caratulas.first()).toHaveClass("car sin");
  });
}
