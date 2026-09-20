"use strict";

try {
  document.documentElement.dataset.theme = localStorage.getItem("chris-desk-theme") || "light";
} catch {}
