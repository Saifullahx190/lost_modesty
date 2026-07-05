import { type AnchorHTMLAttributes, forwardRef } from "react";

// M0 primitive (FRONTEND §5.2). Token-only; focus handled globally (globals.css).
// B1 resolved (token split): an emphasized link uses --color-link (#8B6914 light /
// #E3B24F dark, both ≥4.5:1), NOT the marigold --color-accent, which is a
// decorative/logotype mark and fails text contrast. See design/CHANGELOG.md.

type Emphasis = "default" | "accent";

interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  emphasis?: Emphasis;
}

export const TextLink = forwardRef<HTMLAnchorElement, TextLinkProps>(
  function TextLink({ emphasis = "default", className = "", ...props }, ref) {
    const base = "underline underline-offset-2 decoration-1 hover:decoration-2";
    const color = emphasis === "accent" ? "text-link" : "text-text";
    return <a ref={ref} className={`${base} ${color} ${className}`.trim()} {...props} />;
  },
);
