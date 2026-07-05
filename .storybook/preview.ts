import type { Preview } from "@storybook/react";
import "../app/globals.css";

// Light/dark backgrounds wired to the real token bg values so stories render on the
// actual surfaces (FRONTEND §5.3 #3 — dark mode designed, not "figure out later").
const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#FFFFFF" },
        { name: "dark", value: "#0B0B0C" },
      ],
    },
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] } },
  },
  globalTypes: {
    theme: {
      description: "Token theme",
      defaultValue: "light",
      toolbar: { icon: "circlehollow", items: ["light", "dark"] },
    },
  },
  decorators: [
    (Story, ctx) => {
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", ctx.globals.theme);
      }
      return Story();
    },
  ],
};
export default preview;
