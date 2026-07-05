import type { Meta, StoryObj } from "@storybook/react";
import { TextLink } from "./TextLink";

const meta: Meta<typeof TextLink> = { title: "Primitives/TextLink", component: TextLink };
export default meta;
type Story = StoryObj<typeof TextLink>;

export const Default: Story = { args: { href: "#", children: "এই গল্পটি পড়ুন" } };
export const Accent: Story = { args: { href: "#", emphasis: "accent", children: "অ্যাকসেন্ট লিংক" } };
