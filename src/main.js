import { boot } from './app.js';

async function start() {
  if (new URLSearchParams(window.location.search).get('demo') === '1') {
    const { loadDemoData } = await import('./demo-data.js');
    await loadDemoData();
  }
  await boot();
}

start().catch((error) => {
  console.error('No se pudo iniciar el módulo base.', error);
});
