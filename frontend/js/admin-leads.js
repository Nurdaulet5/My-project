function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString('ru-RU');
  } catch (error) {
    return value;
  }
}

let currentItems = [];
const ADMIN_KEY_STORAGE_KEY = 'silkway_admin_key';

function toCsvValue(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function exportCurrentLeadsToCsv() {
  if (!currentItems.length) {
    alert('Нет данных для экспорта');
    return;
  }

  const header = ['id', 'name', 'email', 'phone', 'service', 'message', 'created_at'];
  const rows = currentItems.map((lead) => [
    toCsvValue(lead.id),
    toCsvValue(lead.name),
    toCsvValue(lead.email),
    toCsvValue(lead.phone || ''),
    toCsvValue(lead.service || ''),
    toCsvValue(lead.message || ''),
    toCsvValue(lead.created_at || ''),
  ]);

  const csvContent = [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `leads-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function renderLeads(items) {
  const container = document.getElementById('leadsContainer');
  container.innerHTML = '';

  if (!items.length) {
    container.innerHTML = '<p style="color: var(--light-text);">Заявок пока нет.</p>';
    return;
  }

  for (const lead of items) {
    const card = document.createElement('div');
    card.style.background = 'var(--white)';
    card.style.padding = '20px';
    card.style.borderRadius = '10px';
    card.style.boxShadow = 'var(--shadow)';

    card.innerHTML = `
      <h3 style="margin-bottom: 10px; color: var(--primary-color);">#${lead.id} - ${lead.name}</h3>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${lead.email}</p>
      <p style="margin: 5px 0;"><strong>Телефон:</strong> ${lead.phone || '-'}</p>
      <p style="margin: 5px 0;"><strong>Услуга:</strong> ${lead.service || '-'}</p>
      <p style="margin: 5px 0;"><strong>Сообщение:</strong> ${lead.message}</p>
      <p style="margin: 10px 0 0; color: var(--light-text);"><strong>Создано:</strong> ${formatDateTime(lead.created_at)}</p>
    `;

    container.appendChild(card);
  }
}

async function loadLeads(event) {
  if (event) event.preventDefault();

  const statusEl = document.getElementById('adminStatus');
  const adminKey = document.getElementById('adminKey').value.trim();
  const limit = Number(document.getElementById('limit').value || 20);
  const offset = Number(document.getElementById('offset').value || 0);
  const apiBaseUrl = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3000';

  if (!adminKey) {
    statusEl.textContent = 'Введите Admin key для доступа к заявкам.';
    renderLeads([]);
    return;
  }

  statusEl.textContent = 'Загрузка...';

  try {
    const headers = {};
    if (adminKey) headers['x-admin-key'] = adminKey;

    const response = await fetch(`${apiBaseUrl}/api/leads?limit=${limit}&offset=${offset}`, {
      headers,
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Не удалось загрузить заявки');
    }

    currentItems = data.items || [];
    statusEl.textContent = `Найдено: ${data.total}. Показано: ${data.items.length}.`;
    renderLeads(currentItems);
  } catch (error) {
    currentItems = [];
    statusEl.textContent = error.message || 'Ошибка загрузки заявок';
    renderLeads([]);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('adminFilterForm');
  const adminKeyInput = document.getElementById('adminKey');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const offsetInput = document.getElementById('offset');
  const limitInput = document.getElementById('limit');
  const savedKey = sessionStorage.getItem(ADMIN_KEY_STORAGE_KEY);

  if (savedKey) {
    adminKeyInput.value = savedKey;
  }

  adminKeyInput.addEventListener('input', () => {
    const value = adminKeyInput.value.trim();
    if (value) {
      sessionStorage.setItem(ADMIN_KEY_STORAGE_KEY, value);
    } else {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE_KEY);
    }
  });

  form.addEventListener('submit', loadLeads);

  prevPageBtn.addEventListener('click', async () => {
    const offset = Math.max(Number(offsetInput.value || 0) - Number(limitInput.value || 20), 0);
    offsetInput.value = String(offset);
    await loadLeads();
  });

  nextPageBtn.addEventListener('click', async () => {
    const offset = Number(offsetInput.value || 0) + Number(limitInput.value || 20);
    offsetInput.value = String(offset);
    await loadLeads();
  });

  exportCsvBtn.addEventListener('click', exportCurrentLeadsToCsv);
});
