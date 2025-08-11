// src/components/ThemeToggle.js
import React, { useEffect, useState } from "react";
import "./ThemeToggle.css";
import "../styles/darkmode.css";
import { getThemePreference, saveThemePreference } from "./cookies/cookiesConfig";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = getThemePreference(); // 🔹 Lee la preferencia guardada
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      document.documentElement.setAttribute("data-theme", "dark");
      setDarkMode(true);
    } else {
      document.body.classList.remove("dark-mode");
      document.documentElement.setAttribute("data-theme", "light");
      setDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.body.classList.remove("dark-mode");
      document.documentElement.setAttribute("data-theme", "light");
      saveThemePreference("light"); // 🔹 Guarda en cookiesConfig
      setDarkMode(false);
    } else {
      document.body.classList.add("dark-mode");
      document.documentElement.setAttribute("data-theme", "dark");
      saveThemePreference("dark"); // 🔹 Guarda en cookiesConfig
      setDarkMode(true);
    }
  };

  return (
    <div
      className={`theme-switch-vertical ${darkMode ? "dark" : "light"}`}
      onClick={toggleTheme}
    >
      <div className="switch-handle">
        {darkMode ? "🌙" : "☀️"}
      </div>
    </div>
  );
}