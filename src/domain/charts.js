import { computeIndicator } from './metrics.js';
import { isBlankValue } from './views.js';

function toFiniteNumber(value) {
  if (isBlankValue(value)) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function categoryLabel(chart, value) {
  const key = String(value);
  const labels = chart.valueLabels || {};
  return Object.prototype.hasOwnProperty.call(labels, key) ? labels[key] : key;
}

function magnitude(category) {
  if (Array.isArray(category.series)) {
    return category.series.reduce((max, item) => Math.max(max, item.value), 0);
  }
  return category.value;
}

function sortCategories(categories) {
  return categories
    .slice()
    .sort((left, right) => magnitude(right) - magnitude(left) || left.label.localeCompare(right.label, 'es'));
}

function limitCategories(categories, chart) {
  const limit = chart.limit;
  if (!Number.isInteger(limit) || limit <= 0 || categories.length <= limit) {
    return categories;
  }

  const rest = categories.slice(limit - 1);
  const other = { label: chart.otherLabel, value: 0, series: null };

  if (Array.isArray(rest[0].series)) {
    other.series = rest[0].series.map((item, index) => ({
      key: item.key,
      label: item.label,
      value: rest.reduce(
        (sum, category) => sum + (category.series && category.series[index] ? category.series[index].value : 0),
        0
      ),
      hasData: rest.some((category) => category.series && category.series[index] && category.series[index].hasData)
    }));
  } else {
    other.value = rest.reduce((sum, category) => sum + category.value, 0);
  }

  return [...categories.slice(0, limit - 1), other];
}

function countCategories(chart, records) {
  const computed = computeIndicator(
    { id: chart.id, type: 'countByField', field: chart.field, label: chart.label },
    records
  );

  return computed.groups.map((group) => ({
    label: categoryLabel(chart, group.value),
    value: group.count,
    series: null
  }));
}

function sumCategories(chart, records) {
  const totals = new Map();

  for (const record of records) {
    const rawGroup = record ? record[chart.field] : undefined;
    if (isBlankValue(rawGroup)) {
      continue;
    }
    const value = toFiniteNumber(record[chart.valueField]);
    if (value === undefined) {
      continue;
    }
    const key = String(rawGroup);
    totals.set(key, (totals.get(key) || 0) + value);
  }

  return [...totals.entries()].map(([key, value]) => ({
    label: categoryLabel(chart, key),
    value,
    series: null
  }));
}

function compareCategories(chart, records) {
  const groups = new Map();

  for (const record of records) {
    const rawLabel = record ? record[chart.labelField] : undefined;
    if (isBlankValue(rawLabel)) {
      continue;
    }

    const label = String(rawLabel);
    if (!groups.has(label)) {
      groups.set(
        label,
        chart.series.map((item) => ({ key: item.key, label: item.label, value: 0, hasData: false }))
      );
    }

    const series = groups.get(label);
    chart.series.forEach((item, index) => {
      const value = toFiniteNumber(record[item.key]);
      if (value !== undefined) {
        series[index].value += value;
        series[index].hasData = true;
      }
    });
  }

  return [...groups.entries()].map(([label, series]) => ({ label, value: undefined, series }));
}

/** Calcula los datos de un gráfico declarado sin conocer el dominio concreto. */
export function computeChart(chart, records = {}, _context = {}) {
  if (!chart) {
    return null;
  }

  const list = Array.isArray(records[chart.source]) ? records[chart.source] : [];
  let categories = [];

  if (chart.type === 'countByField') {
    categories = countCategories(chart, list);
  } else if (chart.type === 'sumByField') {
    categories = sumCategories(chart, list);
  } else if (chart.type === 'compareFields') {
    categories = compareCategories(chart, list);
  }

  categories = limitCategories(sortCategories(categories), chart);

  const total = categories.reduce((sum, category) => sum + (Array.isArray(category.series) ? 0 : category.value), 0);
  const hasData = categories.some((category) =>
    Array.isArray(category.series)
      ? category.series.some((item) => item.hasData)
      : Number.isFinite(category.value) && category.value > 0
  );

  return {
    id: chart.id,
    label: chart.label,
    type: chart.type,
    display: chart.display,
    source: chart.source,
    unit: chart.unit,
    categories,
    total,
    hasData
  };
}

export function computeCharts(charts, records = {}, context = {}) {
  if (!Array.isArray(charts)) {
    return [];
  }
  return charts.map((chart) => computeChart(chart, records, context)).filter(Boolean);
}
