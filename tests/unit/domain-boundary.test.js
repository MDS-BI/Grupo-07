import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

// Claves técnicas del perfil de manufactura. Deben vivir solo en la configuración
// declarativa y en los datos de demostración, nunca en el motor genérico.
const domainKeys = [
  'itemType',
  'unitOfMeasure',
  'currentStock',
  'minStock',
  'processStage',
  'producedQty',
  'scrapQty',
  'qualityResult',
  'batchCode'
];

// US16: los cargos y sus claves ficticias también son datos del perfil,
// nunca constants en el motor genérico (XR-007).
const accessKeys = [
  'plantManager',
  'warehouseLead',
  'productionSupervisor',
  'qualityInspector',
  'PLANT-2026',
  'WH-2026',
  'PROD-2026',
  'QA-2026'
];

const configurationFiles = new Set(['module-config.js', 'demo-data.js']);

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(fullPath);
    }
    return entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

const coreFiles = sourceFiles(path.join(root, 'src')).filter((file) => !configurationFiles.has(path.basename(file)));

describe('SC-008 / XR-006 - declarative domain boundary', () => {
  it('keeps manufacturing field keys out of the generic engine and UI files', () => {
    expect(coreFiles.length).toBeGreaterThan(0);

    const offenders = [];
    for (const file of coreFiles) {
      const source = fs.readFileSync(file, 'utf8');
      for (const key of [...domainKeys, ...accessKeys]) {
        if (new RegExp(`\\b${key}\\b`).test(source)) {
          offenders.push(`${path.relative(root, file)}: ${key}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('declares every manufacturing field key in the configuration profile', () => {
    const config = fs.readFileSync(path.join(root, 'src', 'module-config.js'), 'utf8');
    for (const key of domainKeys) {
      expect(config).toMatch(new RegExp(`\\b${key}\\b`));
    }
  });

  it('declares every US16 role id and secret only in the configuration profile', () => {
    const config = fs.readFileSync(path.join(root, 'src', 'module-config.js'), 'utf8');
    for (const key of accessKeys) {
      expect(config).toMatch(new RegExp(`\\b${key}\\b`));
    }
  });
});
