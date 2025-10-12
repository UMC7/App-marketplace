/// src/components/cv/candidate/sectionscomponents/documents/documentssectioncontroller/docmanager/pdfText.js

let _pdfjsLib = null;
let _tessPromise = null;

/* --------------------------- pdf.js loader --------------------------- */

async function loadPdfJs() {
  if (_pdfjsLib) return _pdfjsLib;

  let mod = null;

  // Preferimos el build "legacy" porque es el que CRA/Webpack suele cargar mejor.
  try {
    mod = await import("pdfjs-dist/legacy/build/pdf");
  } catch {
    try {
      mod = await import("pdfjs-dist/build/pdf");
    } catch (e) {
      console.warn("[pdfText] Unable to import pdfjs-dist:", e);
      return null;
    }
  }

  const pdfjs = mod.default || mod;

  // Alinear *worker* con la MISMA versión y el MISMO tipo de build.
  try {
    const { GlobalWorkerOptions } = pdfjs;
    // pdfjs.version viene en todas las versiones modernas (v3+)
    const ver = (pdfjs.version || "").trim();
    // Si importamos del path "legacy/build/...", usa worker del mismo subdirectorio.
    const usedLegacyBuild = !!mod && /legacy\/build\/pdf$/i.test(mod?.__esModule ? "" : "");
    // No tenemos forma fiable de ver el path del import en runtime; asumimos legacy
    // porque arriba intentamos primero "legacy".
    const subdir = "legacy/build";

    // Candidatos por si algún CDN no tiene el minificado
    const base = ver
      ? `https://cdn.jsdelivr.net/npm/pdfjs-dist@${ver}/${subdir}/`
      : `https://cdn.jsdelivr.net/npm/pdfjs-dist/${subdir}/`;

    const candidates = [
      `${base}pdf.worker.min.mjs`,
      `${base}pdf.worker.mjs`,
      `${base}pdf.worker.min.js`,
      `${base}pdf.worker.js`,
    ];

    // Elegimos el primero (la gran mayoría de versiones lo publican)
    GlobalWorkerOptions.workerSrc = candidates[0];

    // Log útil en desarrollo
    if (typeof window !== "undefined" && window?.location?.host?.includes("localhost")) {
      // eslint-disable-next-line no-console
      console.debug(
        `[pdfText] pdf.js API v${ver || "unknown"} → worker: ${GlobalWorkerOptions.workerSrc}`
      );
    }
  } catch (e) {
    console.warn("[pdfText] Could not set workerSrc dynamically:", e);
  }

  _pdfjsLib = pdfjs;
  return pdfjs;
}

/* --------------------------- API pública --------------------------- */

/**
 * Extrae texto desde un File (string concatenado).
 * opts:
 *  - maxPages (default 40)
 *  - maxChars (default 2_000_000)
 *  - ocr (default true)
 */
export async function extractPdfTextFromFile(file, opts = {}) {
  if (!file) return "";
  const buf = await fileToArrayBuffer(file);
  return extractPdfTextFromArrayBuffer(buf, opts);
}

/** Extrae texto desde ArrayBuffer / Uint8Array. */
export async function extractPdfTextFromArrayBuffer(buffer, opts = {}) {
  const pdfjs = await loadPdfJs();
  if (!pdfjs) return "";

  try {
    const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const loadingTask = pdfjs.getDocument({ data: uint8 });
    const pdf = await loadingTask.promise;

    const numPages = pdf.numPages || 0;
    const maxPages = Math.max(1, Math.min(Number(opts.maxPages ?? 40), numPages || 40));
    let out = "";

    for (let i = 1; i <= Math.min(numPages, maxPages); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = (content.items || [])
        .map((it) => (typeof it.str === "string" ? it.str : ""))
        .join(" ")
        .replace(/\s{2,}/g, " ")
        .trim();
      if (pageText) out += (out ? "\n\n" : "") + pageText;

      const maxChars = Number.isFinite(opts.maxChars) ? Number(opts.maxChars) : 2_000_000;
      if (out.length > maxChars) {
        out = out.slice(0, maxChars);
        break;
      }
    }

    // Fallback OCR si no hay texto (o es sospechosamente poco)
    if ((opts.ocr ?? true) && (isLikelyScanned(out) || out.length < 50) && numPages >= 1) {
      const ocrText = await ocrFirstPage(pdf);
      if (ocrText) out = (out ? out + "\n\n" : "") + ocrText;
    }

    try {
      await pdf.destroy();
    } catch {}
    return out;
  } catch (e) {
    console.warn("[pdfText] Failed to read PDF:", e);
    return "";
  }
}

/* --------------------------- OCR fallback --------------------------- */

/**
 * Renderiza 1ª página en canvas y ejecuta OCR con Tesseract UMD (CDN).
 * NO usa el paquete npm ni pasa funciones al worker (evita errores).
 */
async function ocrFirstPage(pdf) {
  try {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const renderTask = page.render({ canvasContext: ctx, viewport });
    await renderTask.promise;

    const dataUrl = canvas.toDataURL("image/png");
    const T = await loadTesseractFromCdn();
    if (!T || typeof T.recognize !== "function") return "";

    const result = await T.recognize(dataUrl, "eng", {
      workerPath: "https://unpkg.com/tesseract.js@5.0.2/dist/worker.min.js",
      corePath: "https://unpkg.com/tesseract.js-core@5.0.0/tesseract-core.wasm.js",
      langPath: "https://tessdata.projectnaptha.com/4.0.0",
      // ¡No pasar logger ni otras funciones!
    });

    const text = result?.data?.text ? String(result.data.text) : "";
    return text.replace(/\s{2,}/g, " ").trim();
  } catch (e) {
    console.warn("[pdfText] OCR fallback failed:", e);
    return "";
  }
}

/**
 * Carga Tesseract UMD desde CDN y expone window.Tesseract.
 * No hay fallback a import('tesseract.js') para evitar bundles/errores.
 */
function loadTesseractFromCdn() {
  if (_tessPromise) return _tessPromise;
  _tessPromise = new Promise((resolve) => {
    if (window.Tesseract && typeof window.Tesseract.recognize === "function") {
      resolve(window.Tesseract);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/tesseract.js@5.0.2/dist/tesseract.min.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve(window.Tesseract);
    s.onerror = (e) => {
      console.warn("[pdfText] Failed to load Tesseract from CDN.", e);
      resolve(null); // no reventar el flujo
    };
    document.head.appendChild(s);
  });
  return _tessPromise;
}

/* --------------------------- utilidades --------------------------- */

async function fileToArrayBuffer(file) {
  if (file?.arrayBuffer) return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.onload = () => resolve(reader.result);
    reader.readAsArrayBuffer(file);
  });
}

// Heurística: no hay texto o contiene pistas de captura/escaneo.
function isLikelyScanned(text) {
  const t = String(text || "").toLowerCase();
  if (!t) return true;
  if (/scanned\s+by\s+taps?canner/.test(t)) return true;
  const letters = t.replace(/[^a-z]/g, "");
  return letters.length < 15; // muy poco contenido "legible"
}

/** Detecta PDFs por MIME o extensión del nombre. */
export function isPdfFile(file) {
  if (!file) return false;
  const t = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  return (
    t === "application/pdf" ||
    t === "application/x-pdf" ||
    t.includes("pdf") ||
    /\.pdf(\?.*)?$/.test(name)
  );
}

/** Si es PDF, intenta extracción; si no, devuelve "" (para caer a filename). */
export async function safeExtractIfPdf(file, opts = {}) {
  if (!isPdfFile(file)) return "";
  return extractPdfTextFromFile(file, opts);
}