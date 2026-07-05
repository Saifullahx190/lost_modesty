import type { Meta, StoryObj } from "@storybook/react";
import { PostCard } from "./PostCard";
import { POSTS } from "@/lib/content/posts";

// States per FRONTEND §2.4 PostCard: default (with cover), no-image fallback, series
// label. Real Bengali sample content per §5.1 (no Lorem) so line-wrapping is real.
const meta: Meta<typeof PostCard> = { title: "ReadPath/PostCard", component: PostCard };
export default meta;
type Story = StoryObj<typeof PostCard>;

const withCover = POSTS.find((p) => p.cover)!;
const noCover = POSTS.find((p) => !p.cover)!;
const series = POSTS.find((p) => p.series)!;

export const WithCover: Story = { args: { post: withCover, priority: true } };
export const NoCoverFallback: Story = { args: { post: noCover } };
export const SeriesPart: Story = { args: { post: series } };
