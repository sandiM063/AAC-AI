import type { ComponentType, ReactNode } from "react";

type IconProps = { className?: string };

function IconBase({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      {children}
    </svg>
  );
}

export function HelloIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path
        d="M7 8.5h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H11l-3.5 2.5V17.5H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function YesIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m8.5 12 2.25 2.25L15.5 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function NoIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m9 9 6 6M15 9l-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function HelpIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9.5 9.25a2.75 2.75 0 0 1 4.35 2.25c0 1.75-2.35 2-2.35 3.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17.25" r="0.75" fill="currentColor" />
    </IconBase>
  );
}

export function WaterIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path
        d="M12 3.5c2.5 4 5 6.75 5 10a5 5 0 1 1-10 0c0-3.25 2.5-6 5-10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function ThankYouIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path
        d="M12 20s-6.5-4.35-6.5-9.5A4.5 4.5 0 0 1 12 7.5a4.5 4.5 0 0 1 6.5 3A4.5 4.5 0 0 1 12 20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function MoreIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 8.5v7M8.5 12h7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function StopIcon({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path
        d="M8 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export type BoardTileIconId =
  | "hello"
  | "yes"
  | "no"
  | "help"
  | "water"
  | "thank-you"
  | "more"
  | "stop";

const BOARD_TILE_ICONS: Record<BoardTileIconId, ComponentType<IconProps>> = {
  hello: HelloIcon,
  yes: YesIcon,
  no: NoIcon,
  help: HelpIcon,
  water: WaterIcon,
  "thank-you": ThankYouIcon,
  more: MoreIcon,
  stop: StopIcon,
};

export function BoardTileIcon({
  id,
  className,
}: {
  id: BoardTileIconId;
  className?: string;
}) {
  const Icon = BOARD_TILE_ICONS[id];
  return <Icon className={className} />;
}
