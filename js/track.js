// Silk Way Cargo24 - Отслеживание грузов
// Демо-данные грузов (встроенные)
const demoShipments = {
    'MV-2026-001234': {
        from: 'Шанхай, Китай',
        to: 'Алматы, Казахстан',
        date: '2026-02-10',
        status: 'В пути',
        history: [
            { date: '2026-02-10', location: 'Отправлено из Шанхая', status: '✓' },
            { date: '2026-02-12', location: 'Таможенное оформление (Китай)', status: '✓' },
            { date: '2026-02-14', location: 'В пути (воздушный транспорт)', status: '✓' },
            { date: '2026-02-16', location: 'Прибыло в Москву', status: '◈' },
            { date: '2026-02-17', location: 'Доставка адресату (ожидается)', status: '○' }
        ]
    },
    'MV-2026-005678': {
        from: 'Дубай, ОАЭ',
        to: 'Санкт-Петербург, Россия',
        date: '2026-02-08',
        status: 'Доставлено',
        history: [
            { date: '2026-02-08', location: 'Отправлено из Дубая', status: '✓' },
            { date: '2026-02-10', location: 'Таможенное оформление', status: '✓' },
            { date: '2026-02-12', location: 'В пути (море)', status: '✓' },
            { date: '2026-02-15', location: 'Прибыло в СПб', status: '✓' },
            { date: '2026-02-16', location: 'Доставлено адресату', status: '✓' }
        ]
    },
    'MV-2026-009999': {
        from: 'Берлин, Германия',
        to: 'Екатеринбург, Россия',
        date: '2026-02-12',
        status: 'На таможне',
        history: [
            { date: '2026-02-12', location: 'Отправлено из Берлина', status: '✓' },
            { date: '2026-02-13', location: 'Прибыло на границу', status: '✓' },
            { date: '2026-02-15', location: 'Таможенное оформление', status: '◈' },
            { date: '2026-02-16', location: 'В пути', status: '○' },
            { date: '2026-02-18', location: 'Доставка адресату (ожидается)', status: '○' }
        ]
    }
};

// Генератор трек-номеров
function generateTrackNumber() {
    const prefix = 'MV';
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${year}-${random}`;
}

// Получить все грузы (демо + пользовательские)
function getAllShipments() {
    const userShipments = getUserShipments();
    return { ...demoShipments, ...userShipments };
}

// Получить пользовательские грузы из localStorage
function getUserShipments() {
    const stored = localStorage.getItem('silkway_user_shipments');
    return stored ? JSON.parse(stored) : {};
}

// Сохранить пользовательский груз
function saveUserShipment(shipment) {
    const shipments = getUserShipments();
    shipments[shipment.trackNumber] = shipment;
    localStorage.setItem('silkway_user_shipments', JSON.stringify(shipments));
}

// Удалить пользовательский груз
function deleteUserShipment(trackNumber) {
    const shipments = getUserShipments();
    if (shipments[trackNumber]) {
        delete shipments[trackNumber];
        localStorage.setItem('silkway_user_shipments', JSON.stringify(shipments));
        return true;
    }
    return false;
}

// Проверить, является ли груз пользовательским
function isUserShipment(trackNumber) {
    const userShipments = getUserShipments();
    return !!userShipments[trackNumber];
}

// Поиск груза
function searchShipment(trackNumber) {
    const result = document.getElementById('trackResult');
    const error = document.getElementById('trackError');
    const allShipments = getAllShipments();
    
    if (allShipments[trackNumber]) {
        const shipment = allShipments[trackNumber];
        
        document.getElementById('displayTrackNumber').textContent = trackNumber;
        document.getElementById('displayFrom').textContent = shipment.from;
        document.getElementById('displayTo').textContent = shipment.to;
        document.getElementById('displayDate').textContent = formatDate(shipment.date);
        
        // Статус с цветом
        const statusEl = document.getElementById('displayStatus');
        statusEl.textContent = shipment.status;
        if (shipment.status === 'Доставлено') {
            statusEl.style.color = '#27ae60';
        } else if (shipment.status === 'На таможне') {
            statusEl.style.color = '#f39c12';
        } else {
            statusEl.style.color = 'var(--primary-color)';
        }
        
        // Показать/скрыть кнопку удаления
        const deleteBtn = document.getElementById('deleteShipmentBtn');
        if (deleteBtn) {
            deleteBtn.style.display = isUserShipment(trackNumber) ? 'inline-block' : 'none';
            deleteBtn.onclick = () => deleteShipmentAndReset(trackNumber);
        }
        
        // История
        const historyHtml = shipment.history.map(h => 
            `<div style="margin-bottom: 15px;">
                <p style="color: var(--dark-text); margin: 0;"><strong>${h.status} ${h.location}</strong></p>
                <p style="color: var(--light-text); margin: 5px 0 0 0;">${formatDate(h.date)}</p>
            </div>`
        ).join('');
        document.getElementById('displayHistory').innerHTML = historyHtml;
        
        result.style.display = 'block';
        error.style.display = 'none';
        
        // Сохранить в историю поиска
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

function quickSearch(trackNumber) {
    document.getElementById('trackNumber').value = trackNumber;
    searchShipment(trackNumber);
}

// Форма добавления груза
function showAddShipmentForm() {
    document.getElementById('addShipmentForm').style.display = 'block';
    document.getElementById('addShipmentBtn').style.display = 'none';
    document.getElementById('newTrackNumber').value = generateTrackNumber();
}

function hideAddShipmentForm() {
    document.getElementById('addShipmentForm').style.display = 'none';
    document.getElementById('addShipmentBtn').style.display = 'inline-block';
}

function createShipment() {
    const trackNumber = document.getElementById('newTrackNumber').value.toUpperCase();
    const from = document.getElementById('newFrom').value;
    const to = document.getElementById('newTo').value;
    const status = document.getElementById('newStatus').value;
    
    if (!trackNumber || !from || !to || !status) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    // Проверить, не существует ли уже
    const allShipments = getAllShipments();
    if (allShipments[trackNumber]) {
        alert('Груз с таким номером уже существует! Используйте другой номер.');
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    const newShipment = {
        from: from,
        to: to,
        date: today,
        status: status,
        history: [
            { date: today, location: `Груз создан: ${from} → ${to}`, status: '✓' }
        ]
    };
    
    saveUserShipment(newShipment);
    
    // Показать сообщение об успехе
    alert(`Груз успешно создан!\nТрек-номер: ${trackNumber}\n\nСохраните этот номер для отслеживания!`);
    
    // Очистить форму
    document.getElementById('addShipmentForm').reset();
    hideAddShipmentForm();
    
    // Обновить список пользовательских грузов
    updateMyShipmentsList();
}

function deleteShipmentAndReset(trackNumber) {
    if (confirm(`Вы уверены, что хотите удалить груз ${trackNumber}?`)) {
        deleteUserShipment(trackNumber);
        resetTrack();
        updateMyShipmentsList();
    }
}

// Список моих грузов
function updateMyShipmentsList() {
    const listContainer = document.getElementById('myShipmentsList');
    if (!listContainer) return;
    
    const userShipments = getUserShipments();
    const keys = Object.keys(userShipments);
    
    if (keys.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--light-text); text-align: center;">У вас пока нет грузов</p>';
        return;
    }
    
    const listHtml = keys.map(num => {
        const s = userShipments[num];
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; 
                background: var(--light-bg); padding: 15px; margin-bottom: 10px; border-radius: 8px;">
                <div>
                    <strong style="color: var(--primary-color);">${num}</strong>
                    <p style="margin: 5px 0 0 0; color: var(--light-text); font-size: 0.9rem;">
                        ${s.from} → ${s.to}
                    </p>
                    <p style="margin: 3px 0 0 0; color: var(--light-text); font-size: 0.8rem;">
                        Статус: ${s.status}
                    </p>
                </div>
                <div>
                    <button type="button" onclick="quickSearch('${num}')" 
                        style="background: var(--primary-color); color: white; border: none; 
                        padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-right: 5px;">
                        Найти
                    </button>
                    <button type="button" onclick="deleteUserShipmentConfirm('${num}')" 
                        style="background: #e74c3c; color: white; border: none; 
                        padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                        Удалить
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    listContainer.innerHTML = listHtml;
}

function deleteUserShipmentConfirm(trackNumber) {
    if (confirm(`Вы уверены, что хотите удалить груз ${trackNumber}?`)) {
        deleteUserShipment(trackNumber);
        updateMyShipmentsList();
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Обработчик формы поиска
    const trackForm = document.getElementById('trackForm');
    if (trackForm) {
        trackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const trackNumber = document.getElementById('trackNumber').value.toUpperCase();
            searchShipment(trackNumber);
        });
    }
    
    // Обновить историю поиска
    updateSearchHistoryUI();
    
    // Обновить список моих грузов
    updateMyShipmentsList();
});
