const fs = require('fs');

const colors = {
        "tertiary": "#ffb95f",
        "surface-container-low": "#0d1c2d",
        "on-surface-variant": "#c6c6cd",
        "secondary": "#4edea3",
        "error-container": "#93000a",
        "secondary-fixed-dim": "#4edea3",
        "primary-container": "#0f172a",
        "on-primary-container": "#798098",
        "on-secondary-container": "#00311f",
        "on-secondary-fixed": "#002113",
        "surface-tint": "#bec6e0",
        "on-primary-fixed-variant": "#3f465c",
        "tertiary-container": "#251400",
        "on-secondary-fixed-variant": "#005236",
        "on-error-container": "#ffdad6",
        "tertiary-fixed-dim": "#ffb95f",
        "on-surface": "#d4e4fa",
        "on-secondary": "#003824",
        "primary-fixed": "#dae2fd",
        "surface-container-lowest": "#010f1f",
        "background": "#051424",
        "inverse-on-surface": "#233143",
        "on-tertiary-container": "#b47300",
        "surface": "#051424",
        "surface-bright": "#2c3a4c",
        "on-background": "#d4e4fa",
        "outline-variant": "#45464d",
        "on-primary": "#283044",
        "surface-container-high": "#1c2b3c",
        "primary-fixed-dim": "#bec6e0",
        "inverse-primary": "#565e74",
        "surface-dim": "#051424",
        "on-error": "#690005",
        "inverse-surface": "#d4e4fa",
        "outline": "#909097",
        "on-tertiary": "#472a00",
        "on-tertiary-fixed": "#2a1700",
        "secondary-container": "#00a572",
        "surface-container": "#122131",
        "surface-container-highest": "#273647",
        "error": "#ffb4ab",
        "primary": "#bec6e0",
        "secondary-fixed": "#6ffbbe",
        "on-tertiary-fixed-variant": "#653e00",
        "surface-variant": "#273647",
        "on-primary-fixed": "#131b2e",
        "tertiary-fixed": "#ffddb8"
};

const hexToRgb = (hex) => {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    return `${r} ${g} ${b}`;
};

// Simple Light theme approximation mapping
// For Backgrounds: crisp white / light gray
// For Surfaces: pure white or tinted grays
// For On-* (Text): dark slate
// Primaries stay generally similar but adjusted for contrast
const lightColors = {
  ...colors,
  "background": "#f8fafc",
  "on-background": "#0f172a",
  "surface": "#ffffff",
  "surface-dim": "#e2e8f0",
  "surface-bright": "#f8fafc",
  "surface-container-lowest": "#ffffff",
  "surface-container-low": "#f1f5f9",
  "surface-container": "#e2e8f0",
  "surface-container-high": "#cbd5e1",
  "surface-container-highest": "#94a3b8",
  "surface-variant": "#e2e8f0",
  "on-surface": "#0f172a",
  "on-surface-variant": "#475569",
  "outline": "#94a3b8",
  "outline-variant": "#cbd5e1",
  "primary-container": "#dbeafe",
  "on-primary-container": "#1e3a8a",
  "secondary-container": "#d1fae5",
  "on-secondary-container": "#064e3b",
  "tertiary-container": "#fef3c7",
  "on-tertiary-container": "#78350f",
  "inverse-surface": "#0f172a",
  "inverse-on-surface": "#f8fafc"
};

let cssDark = "  .dark {\n";
let cssLight = "  :root {\n";
let tailwindColors = "";

for (const [key, val] of Object.entries(colors)) {
    cssDark += `    --color-${key}: ${hexToRgb(val)};\n`;
    cssLight += `    --color-${key}: ${hexToRgb(lightColors[key])};\n`;
    tailwindColors += `        "${key}": "rgb(var(--color-${key}) / <alpha-value>)",\n`;
}
cssDark += "  }\n";
cssLight += "  }\n";

let indexCss = fs.readFileSync('src/index.css', 'utf-8');
indexCss = indexCss.replace('@layer base {', `@layer base {\n${cssLight}\n${cssDark}`);

// update glass-card in index.css
indexCss = indexCss.replace('background: rgba(255, 255, 255, 0.05);', 'background: rgba(var(--color-on-surface) / 0.05);');
indexCss = indexCss.replace('border: 1px solid rgba(255, 255, 255, 0.08);', 'border: 1px solid rgba(var(--color-on-surface) / 0.08);');

fs.writeFileSync('src/index.css', indexCss);

let tailwindConfig = fs.readFileSync('tailwind.config.js', 'utf-8');
tailwindConfig = tailwindConfig.replace(/colors:\s*\{[\s\S]*?\},/, `colors: {\n${tailwindColors}      },`);
fs.writeFileSync('tailwind.config.js', tailwindConfig);

console.log("Migration complete!");
