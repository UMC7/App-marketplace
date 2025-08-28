// src/components/Avatar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Avatar
 * - Si `srcUrl` carga -> muestra foto.
 * - Si no -> muestra SVG con el nickname completo.
 *
 * Props:
 *  - nickname: string
 *  - srcUrl?: string | null
 *  - size?: "sm" | "md" | "lg" | "xl" | number  (default: "md")
 *  - className?: string
 *  - style?: React.CSSProperties
 *  - bgColor?: string
 *  - textColor?: string
 *  - shape?: "circle" | "square" (default: "circle")  ← NUEVO
 *  - radius?: number | string (radio para square, default: 10) ← NUEVO
 */
export default function Avatar({
  nickname = "",
  srcUrl = null,
  size = "md",
  className = "",
  style = {},
  bgColor,
  textColor,
  shape = "circle",
  radius = 10,
}) {
  // --- Size in pixels ---
  const px = useMemo(() => {
    if (typeof size === "number") return size;
    switch (size) {
      case "sm":
        return 32;
      case "lg":
        return 64;
      case "xl":
        return 96;
      case "md":
      default:
        return 48;
    }
  }, [size]);

  // --- Brand palette + deterministic background by nickname hash ---
  const palette = useMemo(
    () => ["#F5C10D", "#3B82F6", "#22C55E", "#F97316", "#06B6D4", "#EC4899"],
    []
  );

  const hash = useMemo(() => {
    let h = 0;
    for (let i = 0; i < nickname.length; i++) {
      h = (h * 31 + nickname.charCodeAt(i)) >>> 0;
    }
    return h;
  }, [nickname]);

  const autoBg = useMemo(() => palette[hash % palette.length], [hash, palette]);
  const chosenBg = bgColor || autoBg;

  const chooseTextColor = (hex) => {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    const a = [r, g, b].map((v) =>
      v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    );
    const L = 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    return L > 0.45 ? "#0b0b0b" : "#ffffff";
  };

  const autoText = useMemo(() => chooseTextColor(chosenBg), [chosenBg]);
  const chosenText = textColor || autoText;

  // --- Hooks at top-level ---
  const [imgOk, setImgOk] = useState(Boolean(srcUrl));
  useEffect(() => {
    setImgOk(Boolean(srcUrl));
  }, [srcUrl]);

  const [fontSize, setFontSize] = useState(Math.floor(px * 0.42));
  const [twoLines, setTwoLines] = useState(null); // { line1, line2 } | null
  const textRef1 = useRef(null);
  const textRef2 = useRef(null);

  // --- Helper: split nickname in two lines near the middle (space or hyphen) ---
  const computeSplit = (s) => {
    const mid = Math.floor(s.length / 2);
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === " " || s[i] === "-") {
        const d = Math.abs(i - mid);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
    }
    if (bestIdx === -1) return null;
    const l1 = s.slice(0, bestIdx).trim();
    const l2 = s.slice(bestIdx + 1).trim();
    if (!l1 || !l2) return null;
    return { line1: l1, line2: l2 };
  };

  // --- Decide if we show photo or fallback SVG ---
  const showPhoto = Boolean(srcUrl) && imgOk;

  // --- Measurement + fitting for SVG text (skip if showing photo) ---
  useEffect(() => {
    if (showPhoto) return;

    const D = px;
    const maxWidth = D * 0.8; // inner width allowance
    const maxHeightSingle = D * 0.6; // single line vertical allowance
    const maxHeightDouble = D * 0.8; // two lines total allowance
    const minFont = Math.max(10, Math.floor(px * 0.22));
    const startFont = Math.floor(px * 0.42);

    let cancelled = false;

    const split = computeSplit(nickname);

    const stepTwo = (f) => {
      if (cancelled) return;
      setTwoLines(split || null);
      setFontSize(f);
      requestAnimationFrame(() => {
        if (cancelled) return;
        const a = textRef1.current;
        const b = textRef2.current;
        const w1 = a?.getComputedTextLength ? a.getComputedTextLength() : 0;
        const w2 = b?.getComputedTextLength ? b.getComputedTextLength() : 0;
        const hTotal = f * 2 * 1.05;
        if (
          (w1 <= maxWidth && w2 <= maxWidth && hTotal <= maxHeightDouble) ||
          f <= minFont
        ) {
          if (w1 > maxWidth || w2 > maxWidth || hTotal > maxHeightDouble) {
            setFontSize(minFont);
          }
          return;
        }
        const next = Math.max(minFont, f - Math.max(1, Math.ceil(f * 0.08)));
        stepTwo(next);
      });
    };

    const stepSingle = (f) => {
      if (cancelled) return;
      setTwoLines(null);
      setFontSize(f);
      requestAnimationFrame(() => {
        if (cancelled) return;
        const t = textRef1.current;
        const w = t?.getComputedTextLength ? t.getComputedTextLength() : 0;
        const h = f;
        if ((w <= maxWidth && h <= maxHeightSingle) || f <= minFont) {
          if (w > maxWidth || h > maxHeightSingle) {
            if (split) {
              stepTwo(startFont);
            } else {
              setFontSize(minFont);
            }
          }
          return;
        }
        const next = Math.max(minFont, f - Math.max(1, Math.ceil(f * 0.08)));
        stepSingle(next);
      });
    };

    stepSingle(startFont);

    return () => {
      cancelled = true;
    };
  }, [nickname, px, showPhoto]);

  // --- Border radius helper for container (img/svg) ---
  const containerBorderRadius =
    shape === "circle"
      ? "50%"
      : typeof radius === "number"
      ? `${radius}px`
      : radius || 0;

  // --- Render ---
  return showPhoto ? (
    <img
      src={srcUrl}
      alt={`Avatar of ${nickname}`}
      width={px}
      height={px}
      onError={() => setImgOk(false)}
      className={className}
      style={{
        width: px,
        height: px,
        borderRadius: containerBorderRadius,
        objectFit: "cover",
        display: "inline-block",
        ...style,
      }}
    />
  ) : (
    <svg
      width={px}
      height={px}
      role="img"
      aria-label={`Avatar of ${nickname}`}
      className={className}
      style={{ display: "inline-block", borderRadius: containerBorderRadius, ...style }}
      viewBox={`0 0 ${px} ${px}`}
    >
      {shape === "circle" ? (
        <circle cx={px / 2} cy={px / 2} r={px / 2} fill={chosenBg} />
      ) : (
        <rect
          x="0"
          y="0"
          width={px}
          height={px}
          rx={typeof radius === "number" ? radius : 10}
          ry={typeof radius === "number" ? radius : 10}
          fill={chosenBg}
        />
      )}

      {twoLines ? (
        <>
          <text
            ref={textRef1}
            x={px / 2}
            y={px / 2 - fontSize * 0.55}
            textAnchor="middle"
            fontSize={fontSize}
            fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, 'Helvetica Neue', Arial, 'Apple Color Emoji','Segoe UI Emoji'"
            fill={chosenText}
            style={{ pointerEvents: "none", userSelect: "none", fontWeight: 600 }}
          >
            {twoLines.line1}
          </text>
          <text
            ref={textRef2}
            x={px / 2}
            y={px / 2 + fontSize * 0.95}
            textAnchor="middle"
            fontSize={fontSize}
            fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, 'Helvetica Neue', Arial, 'Apple Color Emoji','Segoe UI Emoji'"
            fill={chosenText}
            style={{ pointerEvents: "none", userSelect: "none", fontWeight: 600 }}
          >
            {twoLines.line2}
          </text>
        </>
      ) : (
        <text
          ref={textRef1}
          x={px / 2}
          y={px / 2 + fontSize * 0.35 /* optical center */}
          textAnchor="middle"
          fontSize={fontSize}
          fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, 'Helvetica Neue', Arial, 'Apple Color Emoji','Segoe UI Emoji'"
          fill={chosenText}
          style={{ pointerEvents: "none", userSelect: "none", fontWeight: 600 }}
        >
          {nickname}
        </text>
      )}
    </svg>
  );
}