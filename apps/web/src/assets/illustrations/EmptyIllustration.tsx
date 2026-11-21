/** Placeholder illustration — replace with an unDraw SVG recoloured to `primary` (UI.md 4.6). */
// biome-ignore lint/style/noDefaultExport: lazy() requires a default export
export default function EmptyIllustration(props: React.SVGProps<SVGSVGElement>) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: always rendered with aria-hidden — the parent sets aria-hidden="true"
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="none" {...props}>
      <rect x="100" y="60" width="200" height="150" rx="12" fill="currentColor" opacity="0.12" />
      <rect x="140" y="100" width="120" height="12" rx="6" fill="currentColor" opacity="0.5" />
      <rect x="160" y="124" width="80" height="8" rx="4" fill="currentColor" opacity="0.3" />
      <circle cx="200" cy="230" r="24" fill="currentColor" opacity="0.15" />
      <path
        d="M192 230 L200 222 L208 230 M200 222 L200 238"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}
