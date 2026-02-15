// src/components/cv/candidate/sectionscomponents/documents/documentssectioncontroller/docmanager/DocumentTitleField.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import DocumentTitleSelect from "./DocumentTitleSelect";

export default function DocumentTitleField({
  value = "",
  onChange,
  defaultMode = "select",
  allowSwitch = true,
  placeholder = "Document title",
  disabled = false,
  name,
  autoFocus = false,
  isMissing = false,
  isRequired = false,
}) {
  const [mode, setMode] = useState(defaultMode === "manual" ? "manual" : "select");
  const [manual, setManual] = useState(value || "");
  const manualRef = useRef(null);

  useEffect(() => {
    setManual(value || "");
  }, [value]);

  useEffect(() => {
    if (mode === "manual" && autoFocus && manualRef.current) {
      manualRef.current.focus();
    }
  }, [mode, autoFocus]);

  const desc = useMemo(
    () =>
      mode === "select"
        ? "Pick one title from the list."
        : "Type a custom title.",
    [mode]
  );

  return (
    <div className="doc-title-field" style={wrapStyle}>
      <div style={labelRowStyle}>
        {allowSwitch ? (
          <div style={switchStyle} role="group" aria-label="Title input mode">
            <button
              type="button"
              onClick={() => setMode("select")}
              disabled={disabled}
              aria-pressed={mode === "select"}
              title="Choose from list"
              style={{
                ...chipStyle,
                ...(mode === "select" ? chipActiveStyle : null),
              }}
            >
              From list
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              disabled={disabled}
              aria-pressed={mode === "manual"}
              title="Type manually"
              style={{
                ...chipStyle,
                ...(mode === "manual" ? chipActiveStyle : null),
              }}
            >
              Manual
            </button>
          </div>
        ) : null}
      </div>

      <p style={helpStyle}>{desc}</p>

      {mode === "select" ? (
        <DocumentTitleSelect
          value={value}
          onChange={(v) => typeof onChange === "function" && onChange(v)}
          placeholder="Search a title…"
          isMissing={isMissing}
          isRequired={isRequired}
          allowCustom={true}
          disabled={disabled}
          autoFocus={autoFocus}
          name={name}
        />
      ) : (
        <div style={manualWrapStyle}>
          <input
            ref={manualRef}
            type="text"
            name={name}
            value={manual}
            onChange={(e) => {
              const v = e.target.value;
              setManual(v);
              if (typeof onChange === "function") onChange(v);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`doc-input${isRequired ? " cp-required" : ""}${isMissing ? " cp-missing-input" : ""}`}
            style={manualInputStyle}
          />
        </div>
      )}
    </div>
  );
}

const wrapStyle = { width: "100%" };

const labelRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const switchStyle = {
  display: "inline-flex",
  gap: 6,
};

const chipStyle = {
  border: "1px solid rgba(0,0,0,.2)",
  borderRadius: 999,
  padding: "4px 10px",
  background: "#fff",
  cursor: "pointer",
  fontSize: 12,
};

const chipActiveStyle = {
  background: "rgba(0,120,255,0.08)",
  borderColor: "rgba(0,120,255,0.35)",
};

const helpStyle = {
  margin: "6px 0 10px",
  fontSize: 12,
  color: "var(--muted, #475569)",
};

const manualWrapStyle = {
  display: "flex",
  alignItems: "center",
};

const manualInputStyle = {
  width: "100%",
};


