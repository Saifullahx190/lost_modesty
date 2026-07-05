import type { StorybookConfig } from "@storybook/nextjs";

// Design-system-only dev dependency (FRONTEND §1.2 / §5.1) — NOT shipped to prod.
// Add Storybook at M0 build time: `npm i -D storybook @storybook/nextjs`.
const config: StorybookConfig = {
  stories: ["../components/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-a11y"],
  framework: { name: "@storybook/nextjs", options: {} },
};
export default config;
