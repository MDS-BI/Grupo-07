import { computeIndicators, summarizeCosts } from '../domain/metrics.js';
import { formatValue } from '../domain/views.js';

function appendText(container, tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  container.appendChild(element);
  return element;
}

function formatRatio(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'sin dato';
  }
  return `${(value * 100).toFixed(1)} %`;
}

/** Renderiza las tarjetas de indicadores declaradas en la configuración. */
export function renderIndicators(container, options = {}) {
  const { indicators = [], records = [], context = {}, emptyLabel = 'Sin indicadores configurados.' } = options;

  if (!container) {
    return;
  }

  container.innerHTML = '';
  const computed = computeIndicators(indicators, records, context);

  if (computed.length === 0) {
    container.hidden = true;
    return;
  }

  container.hidden = false;

  if (records.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.id = 'indicators-empty';
    empty.textContent = emptyLabel;
    container.appendChild(empty);
    return;
  }

  for (const indicator of computed) {
    const card = document.createElement('article');
    card.className = 'indicator-card';
    card.dataset.indicatorId = indicator.id;

    appendText(card, 'h4', 'indicator-title', indicator.label);

    if (indicator.type === 'countByField') {
      appendText(card, 'strong', 'indicator-value', String(indicator.total));
      if (indicator.groups.length === 0) {
        appendText(card, 'p', 'indicator-note', 'sin dato');
      } else {
        const list = document.createElement('ul');
        list.className = 'indicator-groups';
        for (const group of indicator.groups) {
          const item = document.createElement('li');
          const label = document.createElement('span');
          label.textContent = group.value;
          const value = document.createElement('strong');
          value.textContent = String(group.count);
          item.appendChild(label);
          item.appendChild(value);
          list.appendChild(item);
        }
        card.appendChild(list);
      }
    } else if (indicator.type === 'countWhere') {
      appendText(card, 'strong', 'indicator-value', String(indicator.count));
    } else if (indicator.type === 'ratio') {
      appendText(card, 'strong', 'indicator-value', formatRatio(indicator.ratio));
      const note =
        indicator.entries.length === 0
          ? `${formatValue(undefined)} / ${formatValue(undefined)}`
          : `${formatValue(indicator.numerator)} / ${formatValue(indicator.denominator)}`;
      appendText(card, 'p', 'indicator-note', note);
    }

    container.appendChild(card);
  }
}

/** Renderiza el resumen de costos agrupado por moneda. */
export function renderCostSummary(container, options = {}) {
  const { costSummary = null, records = [], emptyLabel = 'Sin costos registrados.' } = options;

  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (!costSummary) {
    container.hidden = true;
    return;
  }

  container.hidden = false;

  const summary = summarizeCosts(records, costSummary);

  if (summary.groups.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.id = 'costs-empty';
    empty.textContent = emptyLabel;
    container.appendChild(empty);
    return;
  }

  const heading = document.createElement('h3');
  heading.textContent = 'Resumen de costos por moneda';
  container.appendChild(heading);

  for (const group of summary.groups) {
    const card = document.createElement('article');
    card.className = 'cost-card';
    card.dataset.costGroup = group.key;
    appendText(card, 'h4', 'cost-title', `Moneda: ${group.key}`);

    const list = document.createElement('dl');
    list.className = 'cost-list';

    for (const field of group.fields) {
      const term = document.createElement('dt');
      term.textContent = field.label;
      const value = document.createElement('dd');
      value.textContent = formatValue(field.total);
      list.appendChild(term);
      list.appendChild(value);
    }

    card.appendChild(list);
    container.appendChild(card);
  }
}
