import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setupManufacturingDom,
  bootManufacturing,
  qs,
  submit,
  searchFor,
  seedProduct,
  seedOrder,
  openDocuments,
  selectFirstRow,
  storage
} from './support/manufacturing.js';

let dom;

beforeEach(async () => {
  dom = setupManufacturingDom();
  await bootManufacturing();
});

afterEach(() => {
  dom.window.close();
});

describe('User Story 7 - declared custom fields', () => {
  it('renders the manufacturing custom fields with the declared control types', () => {
    qs('nav-entities').click();

    expect(qs('cf-itemType').tagName).toBe('SELECT');
    expect([...qs('cf-itemType').options].map((option) => option.value)).toEqual([
      '',
      'Producto terminado',
      'Materia prima',
      'Insumo'
    ]);
    expect(qs('cf-unitOfMeasure').tagName).toBe('SELECT');
    expect(qs('cf-currentStock').getAttribute('type')).toBe('number');
    expect(qs('cf-minStock').getAttribute('type')).toBe('number');
    expect(qs('cf-leadTimeDays').getAttribute('type')).toBe('number');
    expect(qs('cf-supplier').getAttribute('type')).toBe('text');
    expect(qs('cf-itemType').closest('.custom-field').querySelector('label').textContent).toBe('Tipo de ítem *');
  });

  it('shows the custom values in the order detail sections', () => {
    const product = seedProduct({
      itemType: 'Materia prima',
      unitOfMeasure: 'Kg',
      currentStock: 40,
      minStock: 10,
      supplier: 'Aceros del Bajío',
      leadTimeDays: 14
    });
    seedOrder(product);
    openDocuments();
    selectFirstRow();

    const productSection = [...document.querySelectorAll('#document-detail .detail-section')].find((section) =>
      section.textContent.startsWith('Producto')
    );
    expect(productSection.textContent).toContain('Tipo de ítemMateria prima');
    expect(productSection.textContent).toContain('Unidad de medidaKg');
    expect(productSection.textContent).toContain('Stock actual40');
    expect(productSection.textContent).toContain('Stock mínimo10');
    expect(productSection.textContent).toContain('ProveedorAceros del Bajío');
    expect(productSection.textContent).toContain('Plazo de reposición (días)14');
  });

  it('finds products by custom field values', () => {
    seedProduct({ supplier: 'Aceros del Bajío' });
    searchFor('aceros del bajío', dom);

    const result = document.querySelector('#search-results-list .entity-item');
    expect(result).not.toBeNull();
    expect(result.textContent).toContain('Proveedor: Aceros del Bajío');
  });

  it('requires and persists a declared numeric custom field', async () => {
    dom.window.close();
    dom = setupManufacturingDom();
    await bootManufacturing({
      customFields: [
        {
          target: 'entity',
          key: 'batchWeight',
          label: 'Peso del lote',
          type: 'number',
          required: true,
          nonNegative: true
        }
      ]
    });

    qs('nav-entities').click();
    qs('name').value = 'Mesa de roble';
    qs('code').value = 'SKU-001';
    submit(qs('entity-form'), dom);

    expect(storage.loadEntities()).toHaveLength(0);
    expect(qs('error-cf-batchWeight').textContent).toContain('obligatorio');
    expect(qs('cf-batchWeight').getAttribute('type')).toBe('number');

    qs('cf-batchWeight').value = '12.5';
    submit(qs('entity-form'), dom);

    expect(storage.loadEntities()[0].batchWeight).toBe(12.5);
  });
});
