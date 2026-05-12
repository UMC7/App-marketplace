const pad2 = (n) => String(n).padStart(2, '0');

export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function setViewportContent(content) {
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return { restore: () => {} };
  const prev = meta.getAttribute('content') || '';
  meta.setAttribute('content', content);
  return {
    restore: () => meta.setAttribute('content', prev),
  };
}

export function calcAge(month, year) {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (!y || Number.isNaN(y) || !m || Number.isNaN(m) || m < 1 || m > 12) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  const currentMonth = now.getMonth() + 1;
  if (currentMonth < m) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

export function fmtYM(y, m) {
  if (!y) return '';
  if (!m) return String(y);
  const d = new Date(`${y}-${pad2(m)}-01T00:00:00Z`);
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short' });
}

export function dateRange(aY, aM, bY, bM, isCurrent) {
  const a = fmtYM(aY, aM);
  const b = isCurrent ? 'Present' : fmtYM(bY, bM);
  return a ? (b ? `${a} â€” ${b}` : a) : '';
}

export function inferTypeByName(nameOrPath = '') {
  return /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(nameOrPath) ? 'video' : 'image';
}

export function mapDbVisToUi(v) {
  const s = (v || '').toString().toLowerCase();
  if (s === 'public') return 'public';
  if (s === 'private') return 'private';
  return 'unlisted';
}

export function canonicalTypeFromText(type = '', title = '') {
  const text = `${type} ${title}`.toLowerCase().replace(/[\u2019\u2018]/g, "'");
  const has = (re) => re.test(text);

  if (has(/\bpassport\b/)) return 'passport';
  if (has(/\bvisa\b|residen/)) return 'visa';
  if (has(/\b(seaman'?s|seafarer)\b.*\bbook\b|\bdischarge\s*book\b/)) return 'seamanbook';
  if (has(/\bstcw\b|a-?vi\/?1|\bbst\b|basic\s*safety|pssr|pbst|crowd|fire\s*fighting|survival|proficiency|pdsd/)) return 'stcw';
  if (has(/\beng\s*1\b|eng1/)) return 'eng1';
  if (has(/\bcoc\b|certificate of competency/)) return 'coc';
  if (has(/\bgoc\b|general operator/)) return 'goc';
  if (has(/yacht\s*master|yachtmaster/)) return 'yachtmaster';
  return 'other';
}

export function mmToPt(mm) {
  return (mm * 72) / 25.4;
}

export function dataUrlToUint8Array(dataUrl) {
  const base64 = String(dataUrl || '').split(',')[1] || '';
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function triggerBlobDownload(blob, filename) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1500);
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(blob);
  });
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('Missing image source.'));
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}

export function drawRoundRect(ctx, x, y, width, height, radius) {
  const radii = typeof radius === 'number'
    ? { tl: radius, tr: radius, br: radius, bl: radius }
    : {
        tl: radius?.tl || 0,
        tr: radius?.tr || 0,
        br: radius?.br || 0,
        bl: radius?.bl || 0,
      };
  const tl = Math.min(radii.tl, width / 2, height / 2);
  const tr = Math.min(radii.tr, width / 2, height / 2);
  const br = Math.min(radii.br, width / 2, height / 2);
  const bl = Math.min(radii.bl, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + width - tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + tr);
  ctx.lineTo(x + width, y + height - br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - br, y + height);
  ctx.lineTo(x + bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

export function clipRoundRect(ctx, x, y, width, height, radius) {
  drawRoundRect(ctx, x, y, width, height, radius);
  ctx.clip();
}

export function drawCoverImage(ctx, img, x, y, width, height, objectPosition = '50% 50%') {
  const [xPosRaw, yPosRaw] = String(objectPosition || '50% 50%').split(' ');
  const xPos = Number.parseFloat(xPosRaw) / 100 || 0.5;
  const yPos = Number.parseFloat(yPosRaw) / 100 || 0.5;
  const imgRatio = img.width / img.height;
  const boxRatio = width / height;
  let drawWidth;
  let drawHeight;

  if (imgRatio > boxRatio) {
    drawHeight = height;
    drawWidth = height * imgRatio;
  } else {
    drawWidth = width;
    drawHeight = width / imgRatio;
  }

  const overflowX = Math.max(0, drawWidth - width);
  const overflowY = Math.max(0, drawHeight - height);
  const drawX = x - overflowX * xPos;
  const drawY = y - overflowY * yPos;
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

export function fitFont(ctx, text, maxWidth, startSize, weight = 700, family = 'Arial') {
  let size = startSize;
  while (size > 12) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 1;
  }
  return size;
}

export function truncateText(ctx, text, maxWidth) {
  const value = String(text || '');
  if (!value) return '';
  if (ctx.measureText(value).width <= maxWidth) return value;
  let next = value;
  while (next.length > 1 && ctx.measureText(`${next}...`).width > maxWidth) {
    next = next.slice(0, -1);
  }
  return `${next}...`;
}

export function drawMetaIcon(ctx, kind, x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, size * 0.12);
  if (kind === 'location') {
    ctx.beginPath();
    ctx.arc(x, y - size * 0.12, size * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.48);
    ctx.lineTo(x - size * 0.18, y + size * 0.08);
    ctx.lineTo(x + size * 0.18, y + size * 0.08);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'phone') {
    ctx.strokeRect(x - size * 0.22, y - size * 0.34, size * 0.44, size * 0.68);
    ctx.beginPath();
    ctx.arc(x, y + size * 0.22, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'email') {
    ctx.strokeRect(x - size * 0.28, y - size * 0.18, size * 0.56, size * 0.36);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.28, y - size * 0.18);
    ctx.lineTo(x, y + size * 0.02);
    ctx.lineTo(x + size * 0.28, y - size * 0.18);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawFillRoundRect(ctx, x, y, width, height, radius, fillStyle) {
  ctx.save();
  ctx.fillStyle = fillStyle;
  drawRoundRect(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.restore();
}

export function createPdfBlobFromJpegDataUrl(
  jpegDataUrl,
  imageWidthPx,
  imageHeightPx,
  widthMm = 85,
  heightMm = 55
) {
  const imageBytes = dataUrlToUint8Array(jpegDataUrl);
  const trimWidthPt = mmToPt(widthMm);
  const trimHeightPt = mmToPt(heightMm);
  const outerMarginMm = 3;
  const cropOffsetMm = 1.5;
  const cropLengthMm = 3;
  const pageWidthPt = trimWidthPt + mmToPt(outerMarginMm * 2);
  const pageHeightPt = trimHeightPt + mmToPt(outerMarginMm * 2);
  const imageXPt = mmToPt(outerMarginMm);
  const imageYPt = mmToPt(outerMarginMm);
  const cropOffsetPt = mmToPt(cropOffsetMm);
  const cropLengthPt = mmToPt(cropLengthMm);
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  let totalLength = 0;

  const pushBytes = (bytes) => {
    chunks.push(bytes);
    totalLength += bytes.length;
  };
  const pushText = (text) => pushBytes(encoder.encode(text));
  const openObject = (id) => {
    offsets[id] = totalLength;
    pushText(`${id} 0 obj\n`);
  };
  const closeObject = () => pushText('endobj\n');

  pushBytes(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xff, 0xff, 0xff, 0xff, 0x0a]));

  openObject(1);
  pushText('<< /Type /Catalog /Pages 2 0 R >>\n');
  closeObject();

  openObject(2);
  pushText('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n');
  closeObject();

  openObject(3);
  pushText(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPt} ${pageHeightPt}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>\n`);
  closeObject();

  const left = imageXPt;
  const right = imageXPt + trimWidthPt;
  const bottom = imageYPt;
  const top = imageYPt + trimHeightPt;
  const contentStream = [
    'q',
    `${trimWidthPt} 0 0 ${trimHeightPt} ${imageXPt} ${imageYPt} cm`,
    '/Im0 Do',
    'Q',
    'q',
    '0.6 w',
    '0 G',
    `${left} ${top + cropOffsetPt} m ${left} ${top + cropOffsetPt + cropLengthPt} l S`,
    `${left - cropOffsetPt - cropLengthPt} ${top} m ${left - cropOffsetPt} ${top} l S`,
    `${right} ${top + cropOffsetPt} m ${right} ${top + cropOffsetPt + cropLengthPt} l S`,
    `${right + cropOffsetPt} ${top} m ${right + cropOffsetPt + cropLengthPt} ${top} l S`,
    `${left} ${bottom - cropOffsetPt} m ${left} ${bottom - cropOffsetPt - cropLengthPt} l S`,
    `${left - cropOffsetPt - cropLengthPt} ${bottom} m ${left - cropOffsetPt} ${bottom} l S`,
    `${right} ${bottom - cropOffsetPt} m ${right} ${bottom - cropOffsetPt - cropLengthPt} l S`,
    `${right + cropOffsetPt} ${bottom} m ${right + cropOffsetPt + cropLengthPt} ${bottom} l S`,
    'Q',
    '',
  ].join('\n');
  openObject(4);
  pushText(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\n`);
  closeObject();

  openObject(5);
  pushText(`<< /Type /XObject /Subtype /Image /Width ${imageWidthPx} /Height ${imageHeightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`);
  pushBytes(imageBytes);
  pushText('\nendstream\n');
  closeObject();

  const xrefOffset = totalLength;
  pushText('xref\n0 6\n');
  pushText('0000000000 65535 f \n');
  for (let i = 1; i <= 5; i += 1) {
    pushText(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  pushText(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(chunks, { type: 'application/pdf' });
}

export function parseMaybeJson(s) {
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

export function normalizeLanguages(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => {
      if (!item) return null;

      if (typeof item === 'object') {
        const lang = item.lang || item.language || item.name || '';
        const level = item.level || item.proficiency || '';
        return [lang, level && `(${level})`].filter(Boolean).join(' ').trim() || null;
      }

      const s = String(item).trim();
      if (!s) return null;

      if (s.startsWith('{') || (s.includes('lang') && s.includes(':'))) {
        const obj = parseMaybeJson(s);
        if (obj && (obj.lang || obj.language)) {
          const lang = obj.lang || obj.language || '';
          const level = obj.level || obj.proficiency || '';
          return [lang, level && `(${level})`].filter(Boolean).join(' ');
        }
      }

      if (s.includes(':')) {
        const [lang, level] = s.split(':');
        return [lang?.trim(), level && `(${level.trim()})`].filter(Boolean).join(' ');
      }

      return s;
    })
    .filter(Boolean);
}

export function formatYachtingExperienceLabel(totalMonths) {
  const m = Number(totalMonths || 0);
  if (!Number.isFinite(m) || m <= 0) return 'â€”';
  if (m < 24) return `${m} month${m === 1 ? '' : 's'}`;
  const years = m / 12;
  return `${(Math.round(years * 10) / 10).toFixed(1)} years`;
}

export function hasLanguagesWithLevel(list) {
  if (!Array.isArray(list)) return false;
  return list.some((item) => {
    if (!item) return false;
    if (typeof item === 'object') {
      const lang = item.lang || item.language || item.name || '';
      const level = item.level || item.proficiency || '';
      return String(lang || '').trim() && String(level || '').trim();
    }
    const s = String(item).trim();
    if (!s) return false;
    if (s.includes(':')) {
      const [lang, level] = s.split(':');
      return String(lang || '').trim() && String(level || '').trim();
    }
    return false;
  });
}

export function hasDeptSkills(list) {
  if (!Array.isArray(list)) return false;
  return list.some((it) => {
    if (!it) return false;
    if (typeof it === 'string') return String(it).trim().length > 0;
    const deptOk = !!(it.department || it.dept || it.name);
    const skillsArr = it.skills || it.items || it.list || [];
    const skillsOk = Array.isArray(skillsArr) ? skillsArr.length > 0 : false;
    return deptOk && skillsOk;
  });
}

export function allDocFlagsSelected(docFlags) {
  if (!docFlags || typeof docFlags !== 'object') return false;
  const keys = [
    'passport6m', 'schengenVisa', 'stcwBasic', 'seamansBook', 'eng1',
    'usVisa', 'drivingLicense', 'pdsd', 'covidVaccine',
  ];
  return keys.every((k) => {
    if (k === 'schengenVisa') {
      return docFlags[k] === true || docFlags[k] === false || docFlags[k] === 'resident';
    }
    if (k === 'usVisa') {
      return docFlags[k] === true || docFlags[k] === false || docFlags[k] === 'green_card';
    }
    return typeof docFlags[k] === 'boolean';
  });
}

export function docsMeetMin(docs) {
  if (!Array.isArray(docs) || docs.length < 3) return false;
  let valid = 0;
  for (const d of docs) {
    const titleOk = !!String(d?.title || '').trim();
    const issued = d?.issuedOn ?? d?.issued_on ?? d?.issued_at ?? null;
    const issuedOk = !!String(issued || '').trim();
    const visOk = !!String(d?.visibility || 'unlisted').trim();
    if (titleOk && issuedOk && visOk) valid += 1;
    if (valid >= 3) return true;
  }
  return false;
}

export function personalMeetsMin(p) {
  if (!p) return false;
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(p.email_public || '').trim());
  const phoneCcOk = String(p.phone_cc || '').replace(/\D/g, '').length > 0;
  const phoneNumOk = String(p.phone_number || '').trim().length > 0;
  const natsOk = Array.isArray(p.nationalities) && p.nationalities.length > 0;
  return Boolean(
    String(p.first_name || '').trim() &&
    String(p.last_name || '').trim() &&
    emailOk &&
    phoneCcOk && phoneNumOk &&
    p.country &&
    String(p.city_port || '').trim() &&
    p.birth_month &&
    p.birth_year &&
    natsOk
  );
}
