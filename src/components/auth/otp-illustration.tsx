export function OtpIllustration() {
  return (
    <svg
      viewBox="0 0 120 100"
      className="mx-auto h-24 w-28 text-aac-primary"
      aria-hidden
    >
      <rect
        x="28"
        y="8"
        width="52"
        height="84"
        rx="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle cx="54" cy="18" r="2" fill="currentColor" />
      <path
        d="M80 28c12 0 22 10 22 22s-10 22-22 22H68l-10 10v-10H58c-12 0-22-10-22-22s10-22 22-22h22Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M62 38h20M62 46h16M62 54h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
