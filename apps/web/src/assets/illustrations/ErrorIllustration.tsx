/** Placeholder illustration — replace with an unDraw SVG recoloured to `primary` (UI.md 4.6). */
// biome-ignore lint/style/noDefaultExport: lazy() requires a default export
export default function ErrorIllustration(props: React.SVGProps<SVGSVGElement>) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: always rendered with aria-hidden — the parent sets aria-hidden="true"
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="none" {...props}>
      <circle cx="200" cy="140" r="70" fill="currentColor" opacity="0.1" />
      <path
        d="M200 110 L200 150"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="200" cy="168" r="4" fill="currentColor" opacity="0.7" />
      <rect x="120" y="220" width="160" height="10" rx="5" fill="currentColor" opacity="0.2" />
    </svg>
  );
}
