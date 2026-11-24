import { expect, test } from "@playwright/test";

// La pantalla de revisión (FDR-005) usada con el teclado de verdad, sobre la story «elementos detectados».
const abrir = async (page, story) => {
  await page.goto(`/iframe.html?id=${encodeURIComponent(`pantalla-de-revisión--${story}`)}&viewMode=story`);
  const panel = page.frameLocator('iframe[title="Panel de Re-track"]');
  await expect(panel.locator('body[data-lista="si"]'), "el panel no terminó de arrancar: mira stories/soporte.js").toBeAttached();
  return panel;
};
const VIOLETA = "rgb(157, 123, 255)"; // el color de bass en el catálogo de panel/revision.js

test("comentar un elemento con # lo regenera como v2 y guarda la v1", async ({ page }) => {
  const panel = await abrir(page, "detectados");
  await expect(panel.locator("#rev-estado")).toHaveText("5 elementos · 46 pasos");
  const barra = panel.getByRole("combobox", { name: "Comentario" });
  await barra.click();

  await page.keyboard.type("#b");
  const opciones = panel.getByRole("option");
  await expect(opciones, "con #b salen todos los elementos y bass el primero").toHaveText(["#bass", "#drums", "#pad", "#lead", "#arreglo"]);
  await page.keyboard.press("Enter");
  await expect(opciones, "al elegir, la lista se cierra").toHaveCount(0);

  await page.keyboard.type("está mal, el ataque es más corto");
  await expect(barra).toHaveValue("#bass está mal, el ataque es más corto");
  await expect(panel.locator("#rev-calco i"), "la mención va en el color de su elemento").toHaveCSS("color", VIOLETA);
  await page.keyboard.press("Enter");

  await expect(panel.locator(".rev-el:has-text('#bass') + .rev-nota"), "el comentario queda pegado bajo #bass, sin la mención").toHaveText("«está mal, el ataque es más corto»");
  await expect(panel.getByRole("button", { name: "#bass, versión 2, generándose" })).toHaveAttribute("aria-pressed", "true");
  await expect(barra, "la barra queda libre para otro comentario").toHaveValue("");

  await panel.getByRole("button", { name: "#bass, versión 1" }).click();
  await expect(panel.getByRole("button", { name: "#bass, versión 1" }), "se puede volver a la v1").toHaveAttribute("aria-pressed", "true");
});

test("un comentario sin # no se envía y dice qué falta", async ({ page }) => {
  const panel = await abrir(page, "detectados");
  await panel.getByRole("combobox", { name: "Comentario" }).click();
  await page.keyboard.type("el ataque es más corto");
  await page.keyboard.press("Enter");
  await expect(panel.getByRole("alert")).toHaveText("▸ No se ha enviado: falta señalar un elemento. Escribir # y elegir uno.");
  await expect(panel.locator(".rev-nota")).toHaveCount(0);
  await expect(panel.getByRole("combobox", { name: "Comentario" })).toHaveValue("el ataque es más corto");
});

test("un elemento de un tipo sin dibujo propio lleva el dibujo y el color por defecto", async ({ page }) => {
  const panel = await abrir(page, "sin-dibujo-propio");
  await expect(panel.locator(".rev-el:has-text('#mezcla') .rev-hex")).toHaveCSS("background-color", "rgb(138, 138, 150)");
  await expect(panel.locator(".rev-el:has-text('#mezcla') svg path")).toHaveAttribute("d", "M12 3l9 9-9 9-9-9z");
});
