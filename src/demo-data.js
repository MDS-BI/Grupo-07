import { loadModuleConfig, setActiveConfig } from './module-config.js';
import { addDocument, addEntity, loadDocuments, loadEntities, saveDocuments } from './storage.js';

const demoNote = 'Orden ficticia para la demostración.';

const products = [
  { code: 'DEMO-EST', name: 'Estante industrial', currentStock: 5, minStock: 12, address: 'Bodega A' },
  { code: 'DEMO-MES', name: 'Mesa de trabajo', currentStock: 24, minStock: 10, address: 'Bodega B' },
  { code: 'DEMO-CAR', name: 'Carro de traslado', currentStock: 8, address: 'Bodega C' },
  { code: 'DEMO-GUA', name: 'Guantes de protección', currentStock: 32, minStock: 20, address: 'Bodega D' },
  { code: 'DEMO-LEN', name: 'Lentes de seguridad', currentStock: 9, minStock: 15, address: 'Bodega D' },
  { code: 'DEMO-CAS', name: 'Casco de seguridad', currentStock: 18, minStock: 10, address: 'Bodega E' }
];

const orders = [
  { folio: 9001, product: 0, priority: 'Urgente', status: 'planificada', endDate: '2025-01-10' },
  { folio: 9002, product: 1, priority: 'Urgente', status: 'en control de calidad', qualityResult: 'Corrección' },
  { folio: 9003, product: 2, priority: 'Alta', status: 'en control de calidad', qualityResult: 'Corrección' },
  { folio: 9004, product: 3, quantity: 40, priority: 'Alta', status: 'terminada', qualityResult: 'Aprobado' },
  { folio: 9005, product: 4, quantity: 25, priority: 'Media', status: 'cancelada', qualityResult: 'Rechazado' },
  { folio: 9006, product: 5, quantity: 16, status: 'liberada' }
];

export async function loadDemoData() {
  const { config, errors } = await loadModuleConfig();
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }
  setActiveConfig(config);
  const existingProducts = loadEntities();
  const demoProducts = products.map(
    (product) =>
      existingProducts.find((existing) => existing.code === product.code) ??
      addEntity({ itemType: 'Producto terminado', unitOfMeasure: 'Unidad', ...product })
  );

  const existingOrders = loadDocuments();
  const seen = new Set();
  const reconciledOrders = [];
  let changed = false;
  for (const record of existingOrders) {
    const order = orders.find((entry) => entry.folio === Number(record.folio));
    if (record.series !== 'DEMO' || record.notes !== demoNote || !order) {
      reconciledOrders.push(record);
      continue;
    }

    if (seen.has(order.folio)) {
      changed = true;
      continue;
    }
    seen.add(order.folio);

    const legacyProductIndex = [1, 0, 2][order.folio - 9004];
    if (legacyProductIndex !== undefined && record.entity_id === demoProducts[legacyProductIndex].entity_id) {
      reconciledOrders.push({
        ...record,
        entity_id: demoProducts[order.product].entity_id,
        quantity: record.quantity === 10 ? order.quantity : record.quantity
      });
      changed = true;
    } else {
      reconciledOrders.push(record);
    }
  }
  if (changed) {
    saveDocuments(reconciledOrders);
  }
  for (const { product, ...order } of orders) {
    const entity_id = demoProducts[product].entity_id;
    if (reconciledOrders.some((record) => record.series === 'DEMO' && Number(record.folio) === order.folio)) {
      continue;
    }

    addDocument({
      entity_id,
      series: 'DEMO',
      startDate: '2025-01-06',
      endDate: '2099-01-10',
      processStage: 'Ensamblaje',
      quantity: 10,
      subtotal: 100000,
      discount: 0,
      taxAmount: 19000,
      totalAmount: 119000,
      currency: 'CLP',
      notes: demoNote,
      ...order
    });
  }
}
