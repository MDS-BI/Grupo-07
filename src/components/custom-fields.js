export function renderCustomFields(container, fields) {
  container.innerHTML = '';

  if (!Array.isArray(fields) || fields.length === 0) {
    container.hidden = true;
    return;
  }

  container.hidden = false;

  for (const field of fields) {
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-field';

    const label = document.createElement('label');
    label.htmlFor = `cf-${field.key}`;
    label.textContent = `${field.label}${field.required ? ' *' : ''}`;
    wrapper.appendChild(label);

    let control;
    if (field.type === 'select') {
      control = document.createElement('select');
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = '--';
      control.appendChild(blank);
      for (const optionValue of field.options || []) {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        control.appendChild(option);
      }
    } else {
      control = document.createElement('input');
      control.type = field.type;
    }

    control.id = `cf-${field.key}`;
    wrapper.appendChild(control);

    const error = document.createElement('span');
    error.className = 'error';
    error.id = `error-cf-${field.key}`;
    wrapper.appendChild(error);

    container.appendChild(wrapper);
  }
}

export function collectCustomValues(fields) {
  const values = {};
  if (!Array.isArray(fields)) {
    return values;
  }

  for (const field of fields) {
    const control = document.getElementById(`cf-${field.key}`);
    if (!control) {
      continue;
    }
    const raw = control.value;
    if (raw === '') {
      continue;
    }
    values[field.key] = field.type === 'number' ? Number(raw) : raw;
  }

  return values;
}

export function fillCustomValues(fields, record = {}) {
  if (!Array.isArray(fields)) {
    return;
  }

  for (const field of fields) {
    const control = document.getElementById(`cf-${field.key}`);
    if (!control) {
      continue;
    }
    const value = record[field.key];
    control.value = value === undefined || value === null ? '' : String(value);
  }
}
