import type { Meta, StoryObj } from "@storybook/react";
import { ThemeToggle } from "./ThemeToggle";

// States per FRONTEND §2.4 Theme toggle: light, dark, focus, hover. The visible
// glyph follows the live data-theme on <html>; toggle the Storybook theme to see
// both. Crossfade is reduced-motion-safe (§3.3 / §1.3).
const meta: Meta<typeof ThemeToggle> = { title: "ReadPath/ThemeToggle", component: ThemeToggle };
export default meta;
type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {};
