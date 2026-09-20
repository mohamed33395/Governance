import type { ReactNode } from "react";

const ICON_PATHS: Record<string, ReactNode> = {
  newJoinRequests: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </>
  ),
  activeConsultations: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="1" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  currentClients: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.5 2.7-5.5 6-5.5s6 2 6 5.5" />
    </>
  ),
  acceptanceRate: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="8,12 11,15 16,9" />
    </>
  ),
};

export function StatIcon({ statKey }: { statKey: string }) {
  const path = ICON_PATHS[statKey];
  if (!path) return null;
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.7}>
      {path}
    </svg>
  );
}
