import { useId } from "react";

/** Official Wikimedia Commons logo mark (text omitted). */
export function CommonsLogoMark({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const boundaryId = `commons-boundary-${uid}`;
  const arrowId = `commons-arrow-${uid}`;

  return (
    <svg
      viewBox="-400 -540 800 850"
      aria-hidden
      className={className}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={boundaryId}>
          <circle r="298" />
        </clipPath>
        <g id={arrowId}>
          <line strokeWidth="22" x1="0" y1="300" x2="0" y2="180" />
          <path stroke="none" d="M -43,185 L 0,110 L 43,185 Z" />
        </g>
      </defs>
      <circle r="100" fill="#970000" />
      <g fill="#006499" stroke="#006499">
        <g clipPath={`url(#${boundaryId})`}>
          <use href={`#${arrowId}`} transform="rotate(45)" />
          <use href={`#${arrowId}`} transform="rotate(90)" />
          <use href={`#${arrowId}`} transform="rotate(135)" />
          <g transform="scale(-1 1)">
            <use href={`#${arrowId}`} transform="rotate(45)" />
            <use href={`#${arrowId}`} transform="rotate(90)" />
            <use href={`#${arrowId}`} transform="rotate(135)" />
          </g>
        </g>
        <path
          transform="rotate(-45)"
          strokeWidth="84"
          fill="none"
          d="M 0,-256 A 256 256 0 1 0 256,0 C 256,-100 155,-150 250,-275"
        />
        <path
          stroke="none"
          d="M -23,-515 C -23,-515 -59,-380 -103,-330 S 13,-392 67,-335 S -23,-515 -23,-515 Z"
        />
      </g>
    </svg>
  );
}
