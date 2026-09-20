import type { ReactNode } from "react";

export interface SocialItem {
  name: string;
  bg: string;
  /** Optional icon color override (e.g. dark glyph on a bright brand bg). */
  fg?: string;
  icon: ReactNode;
}

export const SOCIAL_ICONS: SocialItem[] = [
  {
    name: "Instagram",
    bg: "#E1306C",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    bg: "#0A66C2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.5 8.8v10.4H3.4V8.8h3.1zM4.9 3.6a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8zM9.8 8.8h2.9v1.4c.5-.8 1.6-1.7 3.2-1.7 3.1 0 4.1 2 4.1 4.7v6h-3.1v-5.4c0-1.3-.5-2.3-1.8-2.3-1.3 0-2 .9-2.3 1.8-.1.3-.2.7-.2 1.1v4.8H9.8V8.8z" />
      </svg>
    ),
  },
  {
    name: "X",
    bg: "#000000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 3.5h3.7l4.4 6L17.2 3.5H20l-6.6 8 7 9.5h-3.7l-4.8-6.4-5.5 6.4H4l7-8.6-7-8.9z" />
      </svg>
    ),
  },
  {
    name: "Telegram",
    bg: "#229ED9",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.5 4.5L3.2 11.3c-.8.3-.8 1.4.1 1.6l4.6 1.5 1.7 5.2c.3.8 1.3.9 1.8.2l2.4-2.9 4.6 3.4c.6.5 1.6.1 1.7-.7l2.4-13.6c.1-1-.8-1.8-1.7-1.5z" />
      </svg>
    ),
  },
  {
    name: "WhatsApp",
    bg: "#25D366",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3zm4.4 12.1c-.2.6-1.1 1.1-1.6 1.1-.4 0-.9.2-3-.6-2.5-1-4.1-3.6-4.2-3.8-.1-.2-1-1.4-1-2.6 0-1.2.6-1.8.9-2 .2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.8 2c.1.2.1.4 0 .6l-.4.6c-.2.2-.4.4-.2.8.2.4 1 1.6 2.1 2.6 1.4 1.3 2.6 1.6 3 1.8.4.2.6.2.8-.1l1-1.2c.2-.3.4-.2.7-.1l1.9.9c.3.2.5.2.6.4 0 .1 0 .6-.2 1.2z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    bg: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5z" />
      </svg>
    ),
  },
  {
    name: "Snapchat",
    bg: "#F7F400",
    fg: "#000000",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3.5c2.8 0 4.6 2.1 4.6 4.9v2.4c.5.3 1.2.3 1.7.2.4-.1.8.3.5.7-.5.7-1.4 1-2.2 1.3.3.9 1.3 2.3 3 2.6.4.1.5.6.1.8-1 .5-2.1.7-3.1.8-.2.6-.5 1.1-1 1.4-.8.4-2.3.5-3.6.5s-2.8-.1-3.6-.5c-.5-.3-.8-.8-1-1.4-1-.1-2.1-.3-3.1-.8-.4-.2-.3-.7.1-.8 1.7-.3 2.7-1.7 3-2.6-.8-.3-1.7-.6-2.2-1.3-.3-.4.1-.8.5-.7.5.1 1.2.1 1.7-.2V8.4c0-2.8 1.8-4.9 4.6-4.9z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    bg: "#000000",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M9.5 12.5a4 4 0 1 0 4 4V3.5c.6 2.6 2.2 4.2 4.8 4.5" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    bg: "#FF0000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" />
      </svg>
    ),
  },
];
