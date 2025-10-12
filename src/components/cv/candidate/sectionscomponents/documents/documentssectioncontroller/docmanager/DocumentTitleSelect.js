// src/components/cv/candidate/sectionscomponents/documents/documentssectioncontroller/docmanager/DocumentTitleSelect.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import TITLE_CATALOG from "./titleCatalog";

export default function DocumentTitleSelect({
  value = "",
  onChange,
  placeholder = "Search a title…",
  allowCustom = true,
  disabled = false,
  autoFocus = false,
  name,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const options = useMemo(() => {
    // Flatten groups → [{ id, label, group, search, gi, ii }]
    const out = [];
    TITLE_CATALOG.forEach((g, gi) => {
      g.items.forEach((it, ii) => {
        const labels = [it.label, ...(it.aliases || [])]
          .filter(Boolean)
          .map((s) => String(s).toLowerCase());
        out.push({
          id: it.id,
          label: it.label,
          group: g.group,
          search: labels.join(" "),
          gi,
          ii,
        });
      });
    });
    return out;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    // split by spaces and AND-match
    const tokens = q.split(/\s+/).filter(Boolean);
    return options.filter((opt) =>
      tokens.every((t) => opt.search.includes(t) || opt.label.toLowerCase().includes(t))
    );
  }, [query, options]);

  // Group back filtered options for rendering
  const grouped = useMemo(() => {
    const map = new Map(); // group -> items[]
    for (const opt of filtered) {
      if (!map.has(opt.group)) map.set(opt.group, []);
      map.get(opt.group).push(opt);
    }
    return Array.from(map.entries()); // [ [groupName, items[]], ... ]
  }, [filtered]);

  // Prepare optional "custom" option when typing something not in list
  const customOption = useMemo(() => {
    if (!allowCustom) return null;
    const q = query.trim();
    if (!q) return null;
    const hasExact = options.some((o) => o.label.toLowerCase() === q.toLowerCase());
    if (hasExact) return null;
    return {
      id: "__custom__",
      label: `Use “${q}”`,
      group: "Custom",
      isCustom: true,
    };
  }, [allowCustom, query, options]);

  const renderGroups = useMemo(() => {
    if (!customOption) return grouped;
    return [["Custom", [customOption]], ...grouped];
  }, [grouped, customOption]);

  const flatFiltered = useMemo(() => {
    const base = grouped.flatMap(([_, arr]) => arr);
    return customOption ? [customOption, ...base] : base;
  }, [grouped, customOption]);

  // Open/close handlers
  const openDropdown = () => {
    if (disabled) return;
    setOpen(true);
    setHighlight(0);
  };
  const closeDropdown = () => setOpen(false);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) closeDropdown();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // AutoFocus support
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      openDropdown();
      return;
    }

    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // If there is a highlighted item, pick it; else commit custom input (if allowed)
      if (flatFiltered[highlight]) {
        const sel = flatFiltered[highlight];
        if (sel.isCustom) {
          const next = query.trim();
          if (next && typeof onChange === "function") onChange(next);
        } else {
          if (typeof onChange === "function") onChange(sel.label);
          setQuery(sel.label);
        }
        closeDropdown();
      } else if (allowCustom) {
        const next = query.trim();
        if (next && typeof onChange === "function") onChange(next);
        closeDropdown();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeDropdown();
    }
  };

  const handleSelect = (opt) => {
    if (opt.isCustom) {
      const next = query.trim();
      if (next && typeof onChange === "function") onChange(next);
    } else {
      if (typeof onChange === "function") onChange(opt.label);
      setQuery(opt.label);
    }
    closeDropdown();
  };

  const showValue = useMemo(() => {
    // If the controlled `value` is a non-empty string and differs from the query while closed, show `value`.
    // When user is editing (open), we show the query.
    if (open) return query;
    return value || "";
  }, [value, query, open]);

  const onInputChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    if (!open) setOpen(true);
    setHighlight(0);
    // If clearing the field, also clear parent value (so doc.title becomes "")
    if (!v && typeof onChange === "function") onChange("");
  };

  return (
    <div ref={rootRef} className="doc-title-select" style={wrapStyle}>
      <div
        className={`dts-input-wrap${disabled ? " is-disabled" : ""}`}
        style={inputWrapStyle}
        onClick={openDropdown}
      >
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={showValue}
          onChange={onInputChange}
          onFocus={openDropdown}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          style={inputStyle}
        />
        <div style={rightIconsStyle}>
          {value ? (
            <button
              type="button"
              title="Clear"
              aria-label="Clear"
              onClick={(e) => {
                e.stopPropagation();
                setQuery("");
                if (typeof onChange === "function") onChange("");
                if (inputRef.current) inputRef.current.focus();
                setOpen(true);
              }}
              style={iconBtnStyle}
            >
              ×
            </button>
          ) : null}
          <span aria-hidden="true" style={chevStyle}>▾</span>
        </div>
      </div>

      {open && (
        <div className="dts-dropdown" role="listbox" style={dropdownStyle}>
          {flatFiltered.length === 0 ? (
            <div style={emptyStyle}>
              {allowCustom
                ? "No matches. Press Enter to use your text."
                : "No matches."}
            </div>
          ) : (
            renderGroups.map(([groupName, items]) => (
              <div key={groupName} className="dts-group" style={groupStyle}>
                <div className="dts-group-title" style={groupTitleStyle}>
                  {groupName}
                </div>
                <ul className="dts-options" style={ulStyle}>
                  {items.map((opt) => {
                    const idx = flatFiltered.indexOf(opt);
                    const isHi = idx === highlight;
                    return (
                      <li
                        key={`${opt.id}-${opt.label}`}
                        role="option"
                        aria-selected={isHi}
                        className={`dts-option${isHi ? " is-active" : ""}`}
                        onMouseEnter={() => setHighlight(idx)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelect(opt)}
                        style={{
                          ...liStyle,
                          ...(isHi ? liActiveStyle : null),
                        }}
                        title={opt.label}
                      >
                        {opt.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------- minimal inline styles ---------------------- */

const wrapStyle = {
  position: "relative",
  width: "100%",
  maxWidth: "640px",
};

const inputWrapStyle = {
  display: "flex",
  alignItems: "center",
  border: "1px solid var(--input-bd, rgba(0,0,0,.15))",
  borderRadius: 8,
  padding: "6px 8px",
  background: "var(--input-bg, #fff)",
  color: "var(--text-color, #111827)",
};

const inputStyle = {
  flex: 1,
  border: "none",
  outline: "none",
  fontSize: 14,
  padding: "4px 6px",
  background: "transparent",
  color: "inherit",
};

const rightIconsStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const iconBtnStyle = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 18,
  lineHeight: 1,
  padding: "0 4px",
  color: "inherit",
};

const chevStyle = { fontSize: 12, opacity: 0.7 };

const dropdownStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  zIndex: 1000,
  marginTop: 6,
  maxHeight: 320,
  overflow: "auto",
  background: "var(--card-bg, #fff)",
  color: "var(--text-color, #0b1220)",
  border: "1px solid var(--input-bd, rgba(0,0,0,.15))",
  borderRadius: 8,
  boxShadow: "0 10px 30px rgba(0,0,0,.15)",
};

const emptyStyle = {
  padding: "10px 12px",
  fontSize: 13,
  color: "var(--muted-color, #6b7280)",
};

const groupStyle = {
  padding: "6px 0",
};

const groupTitleStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--muted-color, #6b7280)",
  textTransform: "uppercase",
  padding: "8px 12px 4px",
};

const ulStyle = {
  listStyle: "none",
  margin: 0,
  padding: 0,
};

const liStyle = {
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: 14,
  color: "var(--text-color, #0b1220)",
};

const liActiveStyle = {
  background: "var(--chip-bg, rgba(37,99,235,.12))",
};