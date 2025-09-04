// src/components/MatchBorder.jsx
import React from "react";
import "../styles/MatchBorder.css";

export default function MatchBorder({ score, children }) {
  // tolera "85" o "85%"
  const n = Number(String(score ?? 0).replace("%", ""));
  const high = n >= 80;

  // inline styles como respaldo por si el CSS no carga / es pisado
  const fallbackStyle = high
    ? { border: "2px solid #28a745", boxShadow: "0 0 8px rgba(40,167,69,.6)", borderRadius: 12, padding: 4, boxSizing: "border-box" }
    : { borderRadius: 12, padding: 4, boxSizing: "border-box" };

  return (
    <div className={`match-border${high ? " high-match" : ""}`} style={fallbackStyle}>
      {children}
    </div>
  );
}