import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupManufacturingDom, qs, documentRowFolios } from './support/manufacturing.js';
import { normalizeConfig, manufacturingConfig } from '../../src/module-config.js';
import { initApp, signIn, signOut } from '../../src/app.js';
import * as storage from '../../src/storage.js';

let dom;

beforeEach(async () => {
  dom = setupManufacturingDom();
  await initApp(normalizeConfig(manufacturingConfig));
});

afterEach(() => {
  dom.window.close();
});

function submitLogin() {
  qs('login-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

function loginAs(roleId, secret) {
  qs('login-role').value = roleId;
  qs('login-secret').value = secret;
  submitLogin();
}

function seedQualityOrder() {
  const product = storage.addEntity({
    name: 'Producto QA',
    code: 'QA-001',
    itemType: 'Producto terminado',
    unitOfMeasure: 'Unidad'
  });
  return storage.addDocument({
    entity_id: product.entity_id,
    series: 'OP',
    folio: 4001,
    startDate: '2030-01-01',
    endDate: '2030-01-10',
    quantity: 10,
    processStage: 'Corte',
    status: 'planificada',
    qualityResult: 'Aprobado'
  });
}

describe('Fase 19 - acceso por cargo y permisos por rol', () => {
  it('muestra la pantalla de acceso antes que el Panel cuando no hay sesión', () => {
    expect(qs('view-login').hidden).toBe(false);
    expect(qs('app-shell').hidden).toBe(true);
    expect(qs('view-dashboard').hidden).toBe(true);
    expect([...qs('login-role').options].filter((option) => option.value !== '')).toHaveLength(4);
  });

  it('bloquea el ingreso con mensajes claros ante datos incompletos o clave incorrecta', () => {
    qs('login-secret').value = 'QA-2026';
    submitLogin();
    expect(qs('login-error').textContent).toMatch(/cargo/i);

    qs('login-role').value = 'qualityInspector';
    qs('login-secret').value = '';
    submitLogin();
    expect(qs('login-error').textContent).toMatch(/clave/i);

    qs('login-secret').value = 'incorrecta';
    submitLogin();
    expect(qs('login-error').textContent).toMatch(/clave/i);
    expect(qs('view-login').hidden).toBe(false);
  });

  it('muestra el rol activo y aplica los permisos de QA tras autenticar', () => {
    loginAs('qualityInspector', 'QA-2026');

    expect(qs('view-login').hidden).toBe(true);
    expect(qs('app-shell').hidden).toBe(false);
    expect(qs('active-role').textContent).toContain('Inspector de calidad');
    expect(qs('nav-entities').hidden).toBe(true);
    expect(qs('nav-documents').hidden).toBe(false);
  });

  it('permite a QA editar campos y usar el filtro de calidad, y bloquea lo ajeno a su cargo', () => {
    const order = seedQualityOrder();
    loginAs('qualityInspector', 'QA-2026');
    qs('nav-documents').click();
    document.querySelector(`#document-list .document-row[data-document-id="${order.id}"]`).click();

    const qualityPanel = qs('document-quality-panel');
    const executionPanel = qs('document-execution-panel');
    expect(qualityPanel.hidden).toBe(false);
    expect(executionPanel.hidden).toBe(true);
    expect(qs('document-quality-producedQty').disabled).toBe(false);
    expect(qs('document-quality-qualityResult').disabled).toBe(false);
    expect(qs('document-filters').textContent).toContain('Resultado de calidad');
    expect(qs('document-filters').textContent).not.toContain('Prioridad');

    const detailText = qs('document-detail').textContent;
    expect(detailText).toContain('Calidad QA');
    expect(detailText).not.toContain('Máquina / Recurso');
    expect(document.querySelector('#document-detail .document-actions')).toBeNull();
    expect(documentRowFolios()).toContain('4001');

    const qualityFilter = [...qs('document-filters').querySelectorAll('select')].find((control) =>
      [...control.options].some((option) => option.value === 'Aprobado')
    );
    expect(qualityFilter).toBeDefined();
    qualityFilter.value = 'Aprobado';
    qualityFilter.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    expect(documentRowFolios()).toContain('4001');
    qualityFilter.value = 'Rechazado';
    qualityFilter.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    expect(documentRowFolios()).not.toContain('4001');
  });

  it('rechaza escrituras y transiciones forzadas aunque el control esté deshabilitado', () => {
    const order = seedQualityOrder();
    loginAs('qualityInspector', 'QA-2026');

    expect(() => storage.updateDocument(order.id, { status: 'liberada' })).toThrow(/permisos|rol/i);
    expect(() =>
      storage.addEntity({
        name: 'Producto forzado',
        code: 'FORZADO',
        itemType: 'Producto terminado',
        unitOfMeasure: 'Unidad'
      })
    ).toThrow(/permisos|rol/i);

    expect(storage.loadDocuments()[0].status).toBe('planificada');
    expect(storage.loadEntities()).toHaveLength(1);
  });

  it('cierra sesión sin pérdida de datos y permite entrar con otro cargo', () => {
    seedQualityOrder();
    loginAs('qualityInspector', 'QA-2026');
    expect(qs('active-role').textContent).toContain('Inspector de calidad');

    qs('logout').click();
    expect(qs('view-login').hidden).toBe(false);
    expect(storage.loadEntities()).toHaveLength(1);
    expect(storage.loadDocuments()[0].folio).toBe(4001);

    loginAs('plantManager', 'PLANT-2026');
    expect(qs('active-role').textContent).toContain('Jefe de planta');
    expect(qs('nav-entities').hidden).toBe(false);
    expect(storage.loadDocuments()).toHaveLength(1);
  });

  it('expone una API programática para cambiar de sesión', () => {
    expect(signIn('plantManager', 'PLANT-2026').ok).toBe(true);
    expect(qs('active-role').textContent).toContain('Jefe de planta');
    signOut();
    expect(qs('view-login').hidden).toBe(false);
  });
});
