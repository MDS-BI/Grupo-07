import { computeChart } from '../domain/charts.js';
import { formatValue } from '../domain/views.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function appendText(container, tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  element.textContent = text;
  container.appendChild(element);
  return element;
}

function displayValue(chart, value) {
  const text = formatValue(value);
  return chart.unit ? `${text} ${chart.unit}` : text;
}

function ariaSafe(text) {
  return String(text).replace(/[<>]/g, '');
}

function svgElement(tag, attributes) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
  return element;
}

function colorClass(index) {
  return `chart-color-${(index % 6) + 1}`;
}

function renderDonut(card, chart, computed) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const figure = svgElement('svg', {
    class: 'chart-donut',
    viewBox: '0 0 120 120',
    role: 'img',
    'aria-label': ariaSafe(
      `${computed.label}: ${computed.categories
        .map((category) => `${category.label}, ${displayValue(chart, category.value)}`)
        .join('; ')}`
    )
  });

  figure.appendChild(
    svgElement('circle', { class: 'chart-donut-track', cx: 60, cy: 60, r: radius, 'stroke-width': 15, fill: 'none' })
  );

  let offset = 0;
  computed.categories.forEach((category, index) => {
    if (!(category.value > 0) || !(computed.total > 0)) {
      return;
    }
    const length = (category.value / computed.total) * circumference;
    figure.appendChild(
      svgElement('circle', {
        class: `chart-segment ${colorClass(index)}`,
        cx: 60,
        cy: 60,
        r: radius,
        fill: 'none',
        'stroke-width': 15,
        'stroke-dasharray': `${length} ${circumference - length}`,
        'stroke-dashoffset': -offset,
        transform: 'rotate(-90 60 60)'
      })
    );
    offset += length;
  });

  const totalLabel = svgElement('text', {
    class: 'chart-donut-value',
    x: 60,
    y: 66,
    'text-anchor': 'middle'
  });
  totalLabel.textContent = String(computed.total);
  figure.appendChild(totalLabel);
  card.appendChild(figure);
}

function renderBars(card, chart, computed) {
  const grouped = Array.isArray(computed.categories[0] && computed.categories[0].series);
  const maximum = computed.categories.reduce((max, category) => {
    if (Array.isArray(category.series)) {
      return category.series.reduce((inner, item) => Math.max(inner, item.value), max);
    }
    return Math.max(max, category.value);
  }, 0);
  const ceiling = maximum > 0 ? maximum : 1;
  const rows = document.createElement('div');
  rows.className = 'chart-bars';
  rows.setAttribute('role', 'img');
  rows.setAttribute(
    'aria-label',
    ariaSafe(
      `${computed.label}: ${computed.categories
        .map((category) =>
          Array.isArray(category.series)
            ? `${category.label}, ${category.series.map((item) => `${item.label} ${displayValue(chart, item.value)}`).join('; ')}`
            : `${category.label}, ${displayValue(chart, category.value)}`
        )
        .join('; ')}`
    )
  );

  for (const [index, category] of computed.categories.entries()) {
    const row = document.createElement('div');
    row.className = 'chart-bar-row';
    appendText(row, 'span', 'chart-bar-label', category.label);

    const track = document.createElement('div');
    track.className = grouped ? 'chart-bar-track chart-bar-track-group' : 'chart-bar-track';

    if (Array.isArray(category.series)) {
      category.series.forEach((item, seriesIndex) => {
        const fill = document.createElement('div');
        fill.className = `chart-bar-fill chart-series-${seriesIndex === 0 ? 'a' : 'b'}`;
        fill.style.width = `${Math.max(0, (item.value / ceiling) * 100).toFixed(1)}%`;
        track.appendChild(fill);
      });
    } else {
      const fill = document.createElement('div');
      fill.className = `chart-bar-fill ${colorClass(index)}`;
      fill.style.width = `${Math.max(0, (category.value / ceiling) * 100).toFixed(1)}%`;
      track.appendChild(fill);
    }
    row.appendChild(track);

    if (Array.isArray(category.series)) {
      const values = document.createElement('div');
      values.className = 'chart-bar-values';
      for (const item of category.series) {
        appendText(values, 'span', '', `${item.label}: ${displayValue(chart, item.hasData ? item.value : undefined)}`);
      }
      row.appendChild(values);
    } else {
      appendText(row, 'strong', 'chart-bar-value', displayValue(chart, category.value));
    }

    rows.appendChild(row);
  }

  card.appendChild(rows);
}

function renderLegend(card, chart, computed) {
  const legend = document.createElement('ul');
  legend.className = 'chart-legend';

  if (Array.isArray(computed.categories[0] && computed.categories[0].series)) {
    chart.series.forEach((item, index) => {
      const entry = document.createElement('li');
      appendText(entry, 'span', `chart-swatch chart-series-${index === 0 ? 'a' : 'b'}`, '');
      appendText(entry, 'span', 'chart-legend-label', item.label);
      legend.appendChild(entry);
    });
  } else {
    computed.categories.forEach((category, index) => {
      const entry = document.createElement('li');
      appendText(entry, 'span', `chart-swatch ${colorClass(index)}`, '');
      appendText(entry, 'span', 'chart-legend-label', category.label);
      appendText(entry, 'strong', 'chart-legend-value', displayValue(chart, category.value));
      legend.appendChild(entry);
    });
  }

  card.appendChild(legend);
}

/** Renderiza los gráficos declarados como SVG/CSS accesibles, sin librerías externas. */
export function renderCharts(container, options = {}) {
  const {
    charts = [],
    records = {},
    allowed = () => true,
    emptyLabel = 'Sin gráficos configurados.',
    noDataLabel = 'Sin datos para mostrar.'
  } = options;

  if (!container) {
    return;
  }

  container.innerHTML = '';
  const visible = charts.filter((chart) => allowed(chart));

  if (visible.length === 0) {
    container.hidden = true;
    const message = document.createElement('p');
    message.className = 'empty-state';
    message.id = 'charts-empty';
    message.textContent = emptyLabel;
    container.appendChild(message);
    return;
  }

  container.hidden = false;

  for (const chart of visible) {
    const computed = computeChart(chart, records);
    const card = document.createElement('article');
    card.className = 'chart-card';
    card.dataset.chartId = chart.id;

    appendText(card, 'h3', 'chart-title', computed.label);

    if (!computed.hasData) {
      appendText(card, 'p', 'empty-state', chart.emptyLabel || noDataLabel);
      container.appendChild(card);
      continue;
    }

    if (chart.description) {
      appendText(card, 'p', 'chart-description', chart.description);
    }

    if (computed.display === 'donut') {
      renderDonut(card, chart, computed);
    } else {
      renderBars(card, chart, computed);
    }
    renderLegend(card, chart, computed);
    container.appendChild(card);
  }
}
