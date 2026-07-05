import Link from "next/link";
import { NAV } from "@/lib/site";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { T } from "./T";

// Site header (FRONTEND §2.4): logo lockup left; desktop = inline nav + theme
// toggle right; mobile = theme toggle + hamburger. Information architecture is
// preserved exactly from the live site — only spacing and tap targets are refined.
// `relative` anchors the absolutely-positioned mobile disclosure panel.
export function Header() {
  return (
    <header className="relative border-b border-border bg-bg">
      <div className="mx-auto flex max-w-index items-center justify-between gap-4 px-4 py-3">
        <Logo />

        <div className="flex items-center gap-1">
          <nav aria-label="প্রধান মেনু" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-md px-3 py-2 text-meta text-text transition-colors hover:bg-bg-subtle"
                  >
                    <T bn={item.label} en={item.labelEn} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <NotificationBell />
          <UserMenu />
          <LanguageToggle />
          <ThemeToggle />
          <MobileNav items={NAV} />
        </div>
      </div>
    </header>
  );
}
