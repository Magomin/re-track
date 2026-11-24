// Catálogo del panel: las stories montan panel/index.html y panel/panel.js tal cual (stories/soporte.js).
export default {
  framework: "@storybook/html-vite",
  stories: ["../stories/*.stories.js"],
  staticDirs: [{ from: "../panel", to: "/panel" }],
  core: { disableTelemetry: true },
};
