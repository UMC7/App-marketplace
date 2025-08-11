import React, { useEffect, useState } from "react";
import "./ThemeToggle.css";
import "../styles/darkmode.css";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      document.documentElement.setAttribute("data-theme", "dark");
      setDarkMode(true);
    } else {
      document.body.classList.remove("dark-mode");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.body.classList.remove("dark-mode");
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      document.body.classList.add("dark-mode");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
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