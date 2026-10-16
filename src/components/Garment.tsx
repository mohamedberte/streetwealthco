import type { GarmentKind, Tone } from "@/lib/products";

type GarmentProps = {
  kind: GarmentKind;
  tone: Tone;
  className?: string;
};

/**
 * Silhouettes vectorielles éditoriales. Remplaçables par de vraies photos
 * via le champ `image` des produits.
 */
export function Garment({ kind, tone, className }: GarmentProps) {
  const { fill, line, accent } = tone;
  const stroke = {
    stroke: line,
    strokeWidth: 2.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      viewBox="0 0 400 480"
      className={className}
      role="img"
      aria-hidden
      focusable="false"
    >
      <ellipse cx="200" cy="466" rx="130" ry="7" fill="#000" opacity="0.16" />

      {(kind === "hoodie-cropped" ||
        kind === "hoodie-oversized" ||
        kind === "crewneck") && (
        <Sweatshirt
          fill={fill}
          stroke={stroke}
          hood={kind !== "crewneck"}
          hem={kind === "hoodie-cropped" ? 360 : 440}
          wide={kind === "hoodie-oversized"}
        />
      )}

      {kind === "tee" && (
        <g>
          <path
            d="M146 92 Q200 126 254 92 L352 138 L318 214 L286 196 L292 432 Q200 446 108 432 L114 196 L82 214 L48 138 Z"
            fill={fill}
            {...stroke}
          />
          <path d="M146 92 Q200 132 254 92" fill="none" {...stroke} strokeWidth={7} />
          <path d="M111 410 Q200 424 289 410" fill="none" {...stroke} />
        </g>
      )}

      {kind === "pants" && (
        <g>
          <path
            d="M118 56 L282 56 L298 150 L326 440 L240 446 L200 196 L160 446 L74 440 L102 150 Z"
            fill={fill}
            {...stroke}
          />
          <path d="M110 92 L290 92" fill="none" {...stroke} />
          <path d="M200 92 L200 196" fill="none" {...stroke} />
          <path d="M120 100 Q146 150 130 180" fill="none" {...stroke} />
          <path d="M280 100 Q254 150 270 180" fill="none" {...stroke} />
          <path d="M78 416 L160 422" fill="none" {...stroke} />
          <path d="M322 416 L240 422" fill="none" {...stroke} />
        </g>
      )}

      {kind === "cap" && (
        <g transform="translate(-14 30)">
          <path
            d="M80 300 C70 160 200 110 296 190 C318 210 322 260 320 300 Z"
            fill={fill}
            {...stroke}
          />
          <path
            d="M316 282 C352 276 394 292 402 318 C360 334 318 324 312 304 Z"
            fill={fill}
            {...stroke}
          />
          <path d="M82 296 L320 302 L320 316 L84 310 Z" fill={fill} {...stroke} />
          <path d="M188 142 C150 190 140 250 146 298" fill="none" {...stroke} />
          <path d="M188 142 C230 182 262 232 280 300" fill="none" {...stroke} />
          <circle cx="188" cy="138" r="8" fill={fill} {...stroke} />
          <path d="M283 212 L301 252 L265 252 Z" fill={accent ?? line} />
        </g>
      )}
    </svg>
  );
}

type SweatshirtProps = {
  fill: string;
  stroke: {
    stroke: string;
    strokeWidth: number;
    strokeLinecap: "round";
    strokeLinejoin: "round";
  };
  hood: boolean;
  hem: number;
  wide: boolean;
};

function Sweatshirt({ fill, stroke, hood, hem, wide }: SweatshirtProps) {
  return (
    <g transform={wide ? "translate(200 0) scale(1.12 1) translate(-200 0)" : undefined}>
      {hood && (
        <path d="M138 132 C128 34 272 34 262 132 Z" fill={fill} {...stroke} />
      )}

      <path
        d="M124 116 C92 124 68 142 60 170 L32 396 L90 406 L122 252 Z"
        fill={fill}
        {...stroke}
      />
      <path
        d="M276 116 C308 124 332 142 340 170 L368 396 L310 406 L278 252 Z"
        fill={fill}
        {...stroke}
      />
      <path d="M36 370 L94 381" fill="none" {...stroke} />
      <path d="M364 370 L306 381" fill="none" {...stroke} />

      <path
        d={`M122 116 L278 116 L290 ${hem} Q200 ${hem + 14} 110 ${hem} Z`}
        fill={fill}
        {...stroke}
      />
      <path
        d={`M111 ${hem - 26} Q200 ${hem - 12} 289 ${hem - 26}`}
        fill="none"
        {...stroke}
      />

      {hood ? (
        <>
          <path
            d="M154 122 C150 84 250 84 246 122 C240 152 160 152 154 122 Z"
            fill={stroke.stroke}
            opacity="0.9"
          />
          <path d="M184 144 L182 206" fill="none" {...stroke} strokeWidth={3.5} />
          <path d="M216 144 L218 206" fill="none" {...stroke} strokeWidth={3.5} />
          <path
            d={`M142 ${hem - 112} L258 ${hem - 112} L274 ${hem - 44} L126 ${hem - 44} Z`}
            fill="none"
            {...stroke}
          />
        </>
      ) : (
        <path d="M156 116 Q200 156 244 116" fill="none" {...stroke} strokeWidth={8} />
      )}
    </g>
  );
}
