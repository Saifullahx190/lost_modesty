import { SITE, SOCIAL } from "@/lib/site";
import { MarigoldMark } from "./Logo";

// Footer (FRONTEND §2.4): logo + name, copyright, email + Facebook — "keep minimal,
// this is already correctly restrained". No theme/credit line to a starter theme
// (the rebuild removes the default-template footer credit; FRONTEND §0).
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-border bg-bg">
      <div className="mx-auto flex max-w-index flex-col items-center gap-4 px-4 py-12 text-center">
        <div className="flex items-center gap-2 text-muted">
          <MarigoldMark className="h-6 w-6 text-accent" />
          <span className="font-display text-meta text-text">{SITE.name}</span>
        </div>

        <nav aria-label="সামাজিক যোগাযোগ" className="flex items-center gap-2">
          <a
            href={SOCIAL.email}
            aria-label="ইমেইল"
            className="grid h-11 w-11 place-items-center rounded-md text-muted transition-colors hover:bg-bg-subtle hover:text-text"
          >
            <EmailIcon />
          </a>
          <a
            href={SOCIAL.facebook}
            aria-label="ফেসবুক"
            rel="me noopener noreferrer"
            target="_blank"
            className="grid h-11 w-11 place-items-center rounded-md text-muted transition-colors hover:bg-bg-subtle hover:text-text"
          >
            <FacebookIcon />
          </a>
        </nav>

        <p className="text-caption text-muted">
          © {year} {SITE.name} · <span lang="en">{SITE.nameLatin}</span>
        </p>
      </div>
    </footer>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M14 9h3l.5-3H14V4.3c0-.9.3-1.5 1.6-1.5H17V.1C16.7 0 15.8 0 14.8 0 12.6 0 11 1.3 11 3.9V6H8v3h3v9h3V9Z" />
    </svg>
  );
}
