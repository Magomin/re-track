import { expect, test } from "@playwright/test";

// Lo que hace la pantalla de inicio, sobre la story «una lección a medias» (Jungle 23/52, va por el paso 7 de Bass).
const abrir = async (page) => {
  await page.goto("/iframe.html?id=pantalla-de-inicio--a-medias&viewMode=story");
  const panel = page.frameLocator('iframe[title="Panel de Re-track"]');
  await expect(panel.locator('body[data-lista="si"]')).toBeAttached();
  return panel;
};

test("el cartel dice la lección en curso y el paso que toca, y «Continuar» lo abre", async ({ page }) => {
  const panel = await abrir(page);
  await expect(panel.locator("#cartel")).toContainText("Jungle");
  await expect(panel.locator("#cartel")).toContainText("44 % · Bass · paso 7 de 8");
  await panel.getByRole("button", { name: "Continuar" }).click();
  await expect(panel.locator("#vista-paso")).toBeVisible();
  await expect(panel.locator("#vista-inicio")).toBeHidden();
  await expect(panel.locator("#progreso-modulo")).toHaveText("Bass 6/8");
});

test("las demás lecciones van en filas, sin repetir la del cartel; una fila abre su pantalla de lecciones y «← Inicio» vuelve", async ({ page }) => {
  const panel = await abrir(page);
  await expect(panel.locator("#filas .lec")).toHaveText(["Around the WorldDaft Punk0 %", "Primera lecciónRe-track■ OK", "+Nueva lecciónPróximamente"]);
  await panel.getByRole("button", { name: "Around the World" }).click();
  await expect(panel.locator("#vista-modulos")).toBeVisible();
  await expect(panel.locator("#avance-de")).toHaveText("around");
  await panel.getByRole("button", { name: "← Inicio" }).click();
  await expect(panel.locator("#cartel")).toBeVisible();
});
