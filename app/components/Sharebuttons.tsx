"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Brand icons are inlined as SVG (not pulled from lucide-react) so the exact
 * WhatsApp / Instagram / X / Facebook / LinkedIn / YouTube marks always render
 * correctly regardless of icon-pack version.
 */
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M17.6 6.32A7.85 7.85 0 0 0 12.02 4a7.94 7.94 0 0 0-6.87 11.87L4 20l4.24-1.11a7.9 7.9 0 0 0 3.78.96h.01A7.94 7.94 0 0 0 20 12a7.85 7.85 0 0 0-2.4-5.68ZM12.03 18.4a6.6 6.6 0 0 1-3.36-.92l-.24-.14-2.5.66.67-2.44-.16-.25a6.6 6.6 0 1 1 12.24-3.5 6.56 6.56 0 0 1-6.65 6.59Zm3.6-4.93c-.2-.1-1.16-.57-1.34-.64-.18-.07-.31-.1-.44.1-.13.2-.5.63-.62.77-.11.13-.23.15-.42.05-.2-.1-.83-.3-1.58-.96-.58-.52-.98-1.16-1.09-1.36-.11-.2-.01-.3.09-.4.09-.09.2-.23.3-.35.1-.11.13-.2.2-.32.07-.13.03-.24-.02-.35-.05-.1-.44-1.06-.6-1.45-.16-.38-.32-.33-.44-.34h-.38c-.13 0-.34.05-.52.24-.18.2-.68.67-.68 1.63 0 .96.7 1.9.8 2.03.1.13 1.37 2.1 3.33 2.94.47.2.83.32 1.11.41.47.15.9.13 1.24.08.38-.06 1.16-.47 1.32-.93.16-.46.16-.85.11-.93-.05-.08-.18-.13-.38-.23Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.14 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.91h-2.33V22c4.78-.8 8.44-4.94 8.44-9.94Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2H22l-7.4 8.46L23.3 22h-6.8l-5.32-6.96L5.1 22H2l7.9-9.03L1 2h6.96l4.8 6.4L18.9 2Zm-1.2 18h1.87L7.4 3.9H5.4L17.7 20Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M23 12s0-3.5-.45-5.17a2.9 2.9 0 0 0-2-2C18.88 4.4 12 4.4 12 4.4s-6.88 0-8.55.43a2.9 2.9 0 0 0-2 2C1 8.5 1 12 1 12s0 3.5.45 5.17a2.9 2.9 0 0 0 2 2C5.12 19.6 12 19.6 12 19.6s6.88 0 8.55-.43a2.9 2.9 0 0 0 2-2C23 15.5 23 12 23 12ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.3c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21h-4V9Z" />
    </svg>
  );
}

// --- Config: fill in your real handles once and every share button on the site updates ---
export const SOCIAL_LINKS = {
  youtube: "https://www.youtube.com/channel/UCbE5GKX2KHMJrlRk84L_Frg",
  linkedin: "https://www.linkedin.com/company/quake-hub",
  instagram: "https://www.instagram.com/quakehub",
};

type ShareButtonsProps = {
  /** Optional explicit URL to share (defaults to the current page URL). */
  url?: string;
  /** Optional custom share text (defaults to a generic Quake Hub message). */
  title?: string;
  className?: string;
  /** Show the "follow us" icons (YouTube / LinkedIn) alongside the share icons. */
  showFollowLinks?: boolean;
};

export default function ShareButtons({
  url,
  title = "https://earthwatch-iihz-azure.vercel.app",
  className = "",
  showFollowLinks = false,
}: ShareButtonsProps) {
  const [shareUrl, setShareUrl] = useState(url || "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!url && typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, [url]);

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const handleInstagramShare = useCallback(async () => {
    // Instagram has no public "share this URL" web intent, so we copy the
    // link and let the user paste it into a Story / DM / bio — the accepted
    // workaround used by virtually every site with an Instagram share icon.
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    }
  }, [shareUrl]);
  const handleNativeShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, url: shareUrl });
      } catch {
        /* user cancelled — no-op */
      }
    }
  }, [shareUrl, title]);

  const iconLinks = [
    {
      name: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      icon: <WhatsAppIcon />,
      hover: "hover:text-[#25D366] hover:border-[#25D366]/50",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <FacebookIcon />,
      hover: "hover:text-[#1877F2] hover:border-[#1877F2]/50",
    },
    {
      name: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: <XIcon />,
      hover: "hover:text-white hover:border-white/50",
    },
  ];

  return (
    <nav aria-label="Share this page on social media" className={`flex items-center gap-1.5 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400/50 mr-1 hidden sm:inline">
        Share
      </span>

      {iconLinks.map((item) => (
        <a
          key={item.name}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          aria-label={`Share on ${item.name}`}
          title={`Share on ${item.name}`}
          className={`w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-orange-300/70 transition-colors ${item.hover}`}
        >
          {item.icon}
        </a>
      ))}

      <button
        type="button"
        onClick={handleInstagramShare}
        aria-label="Copy link to share on Instagram"
        title={copied ? "Link copied — paste it into Instagram" : "Share on Instagram"}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-orange-300/70 hover:text-[#E1306C] hover:border-[#E1306C]/50 transition-colors relative"
      >
        <InstagramIcon />
        {copied && (
          <span
            role="status"
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold bg-[#0f0f22] border border-orange-500/30 text-orange-300 px-2 py-1 rounded-md"
          >
            Link copied!
          </span>
        )}
      </button>

      {typeof navigator !== "undefined" && (navigator as any).share && (
        <button
          type="button"
          onClick={handleNativeShare}
          aria-label="More share options"
          title="More share options"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors sm:hidden"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" />
            <line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
          </svg>
        </button>
      )}

      {showFollowLinks && (
        <>
          <span className="w-px h-5 bg-white/10 mx-1" aria-hidden="true" />
          <a
            href={SOCIAL_LINKS.youtube}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Subscribe to Quake Hub on YouTube"
            title="Subscribe on YouTube"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-orange-300/70 hover:text-[#FF0000] hover:border-[#FF0000]/50 transition-colors"
          >
            <YouTubeIcon />
          </a>
          <a
            href={SOCIAL_LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Quake Hub on LinkedIn"
            title="Follow on LinkedIn"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-orange-300/70 hover:text-[#0A66C2] hover:border-[#0A66C2]/50 transition-colors"
          >
            <LinkedInIcon />
          </a>
        </>
      )}
    </nav>
  );
}