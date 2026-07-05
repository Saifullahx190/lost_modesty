import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

// M0 story — every state per FRONTEND §5.3 #4/#5 (focus, disabled, loading).
const meta: Meta<typeof Button> = { title: "Primitives/Button", component: Button };
export default meta;
type Story = StoryObj<typeof Button>;

export const Neutral: Story = { args: { children: "সংরক্ষণ করুন" } };
export const Danger: Story = { args: { tone: "danger", children: "মুছে ফেলুন" } };
export const Loading: Story = { args: { loading: true, loadingLabel: "সংরক্ষণ হচ্ছে…", children: "সংরক্ষণ করুন" } };
export const Disabled: Story = { args: { disabled: true, children: "সংরক্ষণ করুন" } };
