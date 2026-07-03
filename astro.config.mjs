// @ts-check
import { defineConfig } from 'astro/config';

// Salida 100 % estática, sin integraciones: contenido + islas de TS plano.
// site + base para GitHub Pages como project page
// (https://alexsaiz222.github.io/WebK-means/); si el repo cambia de nombre,
// actualiza `base`.
export default defineConfig({
  site: 'https://alexsaiz222.github.io',
  base: '/WebK-means',
});
