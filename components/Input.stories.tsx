import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";

const meta: Meta<typeof Input> = { title: "Primitives/Input", component: Input };
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = { args: { label: "অনুসন্ধান", placeholder: "শিরোনাম লিখুন…" } };
export const HiddenLabel: Story = { args: { label: "অনুসন্ধান", hideLabel: true, placeholder: "অনুসন্ধান করুন…" } };
export const WithError: Story = {
  args: { label: "ইমেইল", defaultValue: "not-an-email", error: "সঠিক ইমেইল ঠিকানা দিন।" },
};
