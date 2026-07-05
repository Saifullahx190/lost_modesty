import type { Meta, StoryObj } from "@storybook/react";
import { Pagination } from "./Pagination";

// States per FRONTEND §2.4 Pagination: middle (both edges enabled), first page
// (Previous disabled), last page (Next disabled). Single-page returns null.
const meta: Meta<typeof Pagination> = { title: "ReadPath/Pagination", component: Pagination };
export default meta;
type Story = StoryObj<typeof Pagination>;

export const Middle: Story = { args: { basePath: "/category/golpo", page: 3, totalPages: 25 } };
export const FirstPage: Story = { args: { basePath: "/", page: 1, totalPages: 25 } };
export const LastPage: Story = { args: { basePath: "/", page: 25, totalPages: 25 } };
