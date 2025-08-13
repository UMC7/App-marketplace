// src/components/ThemeLogo.jsx
import React from "react";

/**
 * ThemeLogo
 * Muestra una imagen distinta según el tema:
 * - Usa el atributo `data-theme` del <html> si existe.
 * - Si no existe, cae al esquema del sistema (`prefers-color-scheme`).
 * - Observa cambios en `data-theme` (MutationObserver) y en el media query.
 * - Si falla la carga de la versión oscura, cae a la clara como respaldo.
 */
export default function ThemeLogo({ light, dark, alt = "", onError, ...imgProps }) {
  const [src, setSrc] = React.useState(light);
  const triedFallbackRef = React.useRef(false);

  const getTheme = React.useCallback(() => {
    // 1) data-theme explícito en el <html>
    if (typeof document !== "undefined") {
      const t = document.documentElement.getAttribute("data-theme");
      if (t === "dark" || t === "light") return t;
    }
    // 2) preferencia del sistema
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    // 3) por defecto
    return "light";
  }, []);

  const applyTheme = React.useCallback(
    (theme) => {
      setSrc(theme === "dark" ? dark : light);
      // resetear el flag de fallback al cambiar de tema
      triedFallbackRef.current = false;
    },
    [light, dark]
  );

  React.useEffect(() => {
    // Inicial
    applyTheme(getTheme());

    const root = typeof document !== "undefined" ? document.documentElement : null;

    // Observa cambios en data-theme
    let observer;
    if (root && typeof MutationObserver !== "undefined") {
      const updateFromAttr = () => applyTheme(getTheme());
      observer = new MutationObserver(updateFromAttr);
      observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    }

    // Observa cambios del esquema del sistema si no se usa data-theme
    let mql;
    if (typeof window !== "undefined" && window.matchMedia) {
      mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => applyTheme(getTheme());
      if (mql.addEventListener) mql.addEventListener("change", onChange);
      else if (mql.addListener) mql.addListener(onChange); // compatibilidad
      // cleanup media query
      return () => {
        if (observer) observer.disconnect();
        if (mql.removeEventListener) mql.removeEventListener("change", onChange);
        else if (mql.removeListener) mql.removeListener(onChange);
      };
    }

    // cleanup observer
    return () => {
      if (observer) observer.disconnect();
    };
  }, [applyTheme, getTheme]);

  const handleError = React.useCallback(
    (e) => {
      // Si está intentando cargar el dark y falla, cambia a la clara una sola vez
      if (!triedFallbackRef.current && src === dark) {
        triedFallbackRef.current = true;
        setSrc(light);
      }
      if (typeof onError === "function") onError(e);
    },
    [dark, light, onError, src]
  );

  return <img src={src} alt={alt} onError={handleError} {...imgProps} />;
}