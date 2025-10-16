// src/pages/cv/sections/langskills/PublicLanguagesSkillsSection.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './langskills.css';
import { DEPT_SPECIALTIES_SUGGESTIONS } from '../../../../components/cv/candidate/sectionscomponents/preferencesskills/catalogs';

/* ============================
   Helpers de normalización
============================ */
function cap(s) {
  const t = String(s || '').trim();
  if (!t) return '';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function parseMaybeJson(s) {
  let t = String(s || '').trim();
  if (!t) return null;
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1);
  }
  if (t.includes(':') && t.includes("'") && !t.includes('"')) {
    t = t.replace(/'/g, '"');
  }
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

/** Normaliza entrada de idiomas a objetos { lang, level, label } */
function normalizeLanguages(input, profile) {
  const raw = input ?? profile?.languages ?? [];
  if (!Array.isArray(raw)) return [];

  const out = raw
    .map((item) => {
      if (!item) return null;

      if (typeof item === 'object') {
        const lang =
          item.lang || item.language || item.name || item.label || item.value || '';
        const level =
          item.level || item.proficiency || item.fluency || item.score || '';
        const label = [lang, level && `— ${cap(level)}`].filter(Boolean).join(' ');
        return lang ? { lang, level, label } : null;
      }

      const s = String(item).trim();
      if (!s) return null;

      if (s.startsWith('{') || (s.includes('lang') && s.includes(':'))) {
        const obj = parseMaybeJson(s);
        if (obj) {
          const lang = obj.lang || obj.language || '';
          const level = obj.level || obj.proficiency || '';
          const label = [lang, level && `— ${cap(level)}`].filter(Boolean).join(' ');
          return lang ? { lang, level, label } : null;
        }
      }

      if (s.includes(':') || s.includes('-')) {
        const sep = s.includes(':') ? ':' : '-';
        const [lang, lvl] = s.split(sep);
        const label = [lang?.trim(), lvl && `— ${cap(lvl.trim())}`]
          .filter(Boolean)
          .join(' ');
        return lang ? { lang: lang.trim(), level: (lvl || '').trim(), label } : null;
      }

      return { lang: s, level: '', label: s };
    })
    .filter(Boolean);

  const seen = new Set();
  return out.filter((o) => {
    const key = `${o.lang}|${o.level}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ============================
   Fluencyómetro visual
============================ */
function levelToPct(level) {
  const s = String(level || '').toLowerCase();
  if (s.includes('native')) return 100;
  if (s.includes('fluent')) return 80;
  if (s.includes('convers')) return 40;
  return 60;
}

function LanguageBar({ lang, level }) {
  const pct = levelToPct(level);
  const pretty = level ? cap(level) : '—';

  const trackStyle = {
    position: 'relative',
    width: '100%',
    height: 18,
    borderRadius: 999,
    border: '2px solid #000',
    background: 'linear-gradient(90deg, #c8f2f4 0%, #8be3e9 40%, #18a7b5 100%)',
    overflow: 'hidden',
  };

  const maskStyle = {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: `${100 - pct}%`,
    background: '#e5e7eb',
  };

  return (
    <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{lang}</div>
      <div style={trackStyle}>
        <div style={maskStyle} />
      </div>
      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700 }}>{pretty}</div>
    </div>
  );
}

/* ============================
   Índice skill → departamento
============================ */
function buildSkillToDeptIndex() {
  const index = new Map();
  const norm = (s) => String(s || '').trim().toLowerCase();
  for (const [dept, raw] of Object.entries(DEPT_SPECIALTIES_SUGGESTIONS || {})) {
    if (!Array.isArray(raw)) continue;
    if (raw.length && typeof raw[0] === 'string') {
      for (const it of raw) index.set(norm(it), dept);
    } else {
      for (const group of raw) {
        for (const it of group?.items || []) index.set(norm(it), dept);
      }
    }
  }
  return index;
}
const SKILL_TO_DEPT = buildSkillToDeptIndex();

/** Normaliza "skills por dept" */
function normalizeSkillsByDept(input, profile) {
  const raw =
    input ??
    profile?.skills_by_dept ??
    profile?.specific_skills ??
    profile?.skillsDept ??
    profile?.skills ??
    [];

  const map = new Map();
  const push = (dept, skill) => {
    const d = cap(dept || 'Other');
    const s = String(skill || '').trim();
    if (!s) return;
    if (!map.has(d)) map.set(d, []);
    const arr = map.get(d);
    if (!arr.includes(s)) arr.push(s);
  };

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [dept, list] of Object.entries(raw)) {
      if (Array.isArray(list)) {
        list.forEach((sk) => push(dept, typeof sk === 'string' ? sk : sk?.name || sk?.label));
      } else if (typeof list === 'string') {
        list.split(',').forEach((sk) => push(dept, sk));
      }
    }
  }

  if (Array.isArray(raw)) {
    for (const it of raw) {
      if (!it) continue;

      if (typeof it === 'object') {
        const dept = it.department || it.dept || it.group || it.category || '';
        const skill = it.skill || it.name || it.label || it.title || '';
        if (dept && skill) push(dept, skill);
        if (dept && Array.isArray(it.items)) {
          for (const s of it.items)
            push(dept, typeof s === 'string' ? s : s?.name || s?.label);
        }
        continue;
      }

      const s = String(it).trim();
      const deptFromCatalog = SKILL_TO_DEPT.get(s.toLowerCase()) || null;
      if (deptFromCatalog) {
        push(deptFromCatalog, s);
      } else if (s.includes(':')) {
        const [dept, skill] = s.split(':');
        push(dept, skill);
      } else {
        push('Other', s);
      }
    }
  }

  const order = ['Deck', 'Engine', 'Interior', 'Galley'];
  const result = {};
  for (const key of order) {
    const arr = map.get(key);
    if (arr && arr.length) result[key] = arr;
    map.delete(key);
  }
  for (const key of Array.from(map.keys()).sort()) {
    const arr = map.get(key);
    if (arr && arr.length) result[key] = arr;
  }
  return result;
}

/* ============================
   Grupo colapsable
============================ */
function CollapsibleSkillsGroup({ title, items }) {
  const gridRef = useRef(null);
  const [firstRowCount, setFirstRowCount] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const measure = () => {
      const chips = Array.from(el.querySelectorAll('[data-chip="1"]'));
      if (!chips.length) {
        setFirstRowCount(0);
        return;
      }
      const top0 = chips[0].offsetTop;
      let count = 0;
      for (const c of chips) {
        if (c.offsetTop !== top0) break;
        count += 1;
      }
      setFirstRowCount(count);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    requestAnimationFrame(measure);
    return () => ro.disconnect();
  }, [items]);

  const needsToggle = firstRowCount > 0 && items.length > firstRowCount;
  const visibleItems = expanded || !needsToggle ? items : items.slice(0, firstRowCount);

  return (
    <div className="pls-dept">
      <div className="pls-deptHdr">
        <div className="pls-deptTitle">{title}</div>
        {needsToggle && (
          <button
            type="button"
            className="ppv-btn sm"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? 'Hide details' : 'Show All'}
          </button>
        )}
      </div>

      <div
        ref={gridRef}
        className={`pls-grid ${expanded ? 'is-open' : 'is-closed'}`}
      >
        {visibleItems.map((sk, i) => (
          <div key={`${title}-${i}`} className="pls-skill" data-chip="1">
            {sk}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================
   Principal
============================ */
export default function PublicLanguagesSkillsSection({
  languages,
  skills,
  profile,
  title = 'Languages & Skills',
}) {
  const langList = useMemo(() => normalizeLanguages(languages, profile), [languages, profile]);
  const skillsByDept = useMemo(() => normalizeSkillsByDept(skills, profile), [skills, profile]);

  // Altura fija (≈354 px) con scroll interno
  const scrollStyle = {
    maxHeight: '354px',
    overflowY: 'auto',
  };

  const langGridStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
    margin: '6px 0 10px',
  };
  const langItemWrapStyle = {
    flex: '0 1 30%',
    minWidth: 240,
    maxWidth: 360,
    display: 'flex',
    justifyContent: 'center',
  };

  return (
    <section className="pls" aria-label="Languages and skills" style={scrollStyle}>
      <div className="pls-titleRow">
        <h2 className="pls-title">{title.toUpperCase()}</h2>
      </div>

      {langList.length > 0 ? (
        <div style={langGridStyle}>
          {langList.map((l, idx) => (
            <div key={`${l.lang}-${l.level}-${idx}`} style={langItemWrapStyle}>
              <LanguageBar lang={l.lang} level={l.level} />
            </div>
          ))}
        </div>
      ) : (
        <div className="pls-muted">No languages provided.</div>
      )}

      {Object.keys(skillsByDept).length ? (
        Object.entries(skillsByDept).map(([dept, list]) => (
          <CollapsibleSkillsGroup key={dept} title={dept} items={list} />
        ))
      ) : (
        <div className="pls-muted">No skills listed.</div>
      )}
    </section>
  );
}