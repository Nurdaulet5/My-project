// Silk Way Cargo24 - Отслеживание грузов

// Функция для получения данных груза с бэкенда
async function fetchShipmentFromBackend(trackNumber) {
    try {
        const apiBaseUrl = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${apiBaseUrl}/api/shipments/${trackNumber}`);
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Not found');
        }
    } catch (error) {
        console.log('Не удалось получить данные с бэкенда:', error);
        return null;
    }
}

// Поиск груза на бэкенде
async function searchShipment(trackNumber) {
    const result = document.getElementById('trackResult');
    const error = document.getElementById('trackError');
    
    let shipment = null;

    const backendData = await fetchShipmentFromBackend(trackNumber);
    if (backendData) {
        shipment = backendData;
    }
    
    if (shipment) {
        document.getElementById('displayTrackNumber').textContent = trackNumber;
        document.getElementById('displayFrom').textContent = shipment.from;
        document.getElementById('displayTo').textContent = shipment.to;
        document.getElementById('displayDate').textContent = formatDate(shipment.date);
        
        const statusEl = document.getElementById('displayStatus');
        statusEl.textContent = shipment.status;
        if (shipment.status === 'Доставлено') {
            statusEl.style.color = '#27ae60';
        } else if (shipment.status === 'На таможне') {
            statusEl.style.color = '#f39c12';
        } else {
            statusEl.style.color = 'var(--primary-color)';
        }
        
        const historyHtml = shipment.history.map(h => 
            `<div style="margin-bottom: 15px;">
                <p style="color: var(--dark-text); margin: 0;"><strong>${h.status} ${h.location}</strong></p>
                <p style="color: var(--light-text); margin: 5px 0 0 0;">${formatDate(h.date)}</p>
            </div>`
        ).join('');
        document.getElementById('displayHistory').innerHTML = historyHtml;
        
        result.style.display = 'block';
        error.style.display = 'none';
        
        addToSearchHistory(trackNumber);
    } else {
        result.style.display = 'none';
        error.style.display = 'block';
    }
}

// Форматирование даты
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU');
}

// Сброс формы поиска
function resetTrack() {
    document.getElementById('trackForm').reset();
    document.getElementById('trackResult').style.display = 'none';
    document.getElementById('trackError').style.display = 'none';
    document.getElementById('trackNumber').focus();
}

// История поиска
function getSearchHistory() {
    const stored = localStorage.getItem('silkway_search_history');
    return stored ? JSON.parse(stored) : [];
}

function addToSearchHistory(trackNumber) {
    let history = getSearchHistory();
    // Удалить если уже есть
    history = history.filter(n => n !== trackNumber);
    // Добавить в начало
    history.unshift(trackNumber);
    // Ограничить 10 записями
    history = history.slice(0, 10);
    localStorage.setItem('silkway_search_history', JSON.stringify(history));
    updateSearchHistoryUI();
}

function updateSearchHistoryUI() {
    const historyContainer = document.getElementById('searchHistory');
    if (!historyContainer) return;
    
    const history = getSearchHistory();
    if (history.length === 0) {
        historyContainer.innerHTML = '<p style="color: var(--light-text); text-align: center;">История поиска пуста</p>';
        return;
    }
    
    const historyHtml = history.map(num => 
        `<button type="button" onclick="quickSearch('${num}')" 
            style="background: var(--light-bg); border: none; padding: 8px 15px; margin: 5px; 
            border-radius: 20px; cursor: pointer; color: var(--primary-color); font-size: 0.9rem;">
            ${num}
        </button>`
    ).join('');
    historyContainer.innerHTML = historyHtml;
}

async function quickSearch(trackNumber) {
    document.getElementById('trackNumber').value = trackNumber;
    await searchShipment(trackNumber);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Обработчик формы поиска
    const trackForm = document.getElementById('trackForm');
    if (trackForm) {
        trackForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const trackNumber = document.getElementById('trackNumber').value.toUpperCase();
            await searchShipment(trackNumber);
        });
    }
    
    // Обновить историю поиска
    updateSearchHistoryUI();
    
});
