import type { Meta, StoryObj } from "@storybook/react";
import { SearchInput } from "./SearchInput";
import { buildSearchIndex } from "@/lib/content/repo";

// States per FRONTEND §2.4 Search input: empty, typing→results, no-results. The
// results/empty UI renders on type; this story ships the real client index (§3.3).
const meta: Meta<typeof SearchInput> = { title: "ReadPath/SearchInput", component: SearchInput };
export default meta;
type Story = StoryObj<typeof SearchInput>;

export const Empty: Story = { args: { index: buildSearchIndex() } };
