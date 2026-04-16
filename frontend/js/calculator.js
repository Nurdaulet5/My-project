// Silk Way Cargo24 - Калькулятор стоимости доставки

// Базовые тарифы (в долларах за кг)
const baseRates = {
    air: {
        cn: 4.5,    // Китай
        de: 5.0,    // Германия
        tr: 3.8,    // Турция
        us: 6.0,    // США
        ae: 4.2,    // ОАЭ
        kr: 4.8,    // Корея
        it: 4.5,    // Италия
        ru: 2.0     // Россия
    },
    sea: {
        cn: 0.6,
        de: 1.2,
        tr: 0.9,
        us: 1.5,
        ae: 1.3,
        kr: 0.7,
        it: 1.0,
        ru: 0.4
    },
    auto: {
        cn: 1.8,
        de: 1.4,
        tr: 1.1,
        us: null,
        ae: null,
        kr: 2.0,
        it: 1.3,
        ru: 0.8
    },
    rail: {
        cn: 1.2,
        de: 0.9,
        tr: null,
        us: null,
        ae: null,
        kr: 1.4,
        it: 0.8,
        ru: 0.5
    }
};

// Коэффициенты направления (from -> to)
const routeMultipliers = {
    cn: { kz: 1.0, ru: 1.15, by: 1.2, kg: 1.1 },
    de: { kz: 1.0, ru: 1.12, by: 1.18, kg: 1.08 },
    tr: { kz: 1.0, ru: 1.1, by: 1.16, kg: 1.07 },
    us: { kz: 1.0, ru: 1.2, by: 1.25, kg: 1.12 },
    ae: { kz: 1.0, ru: 1.14, by: 1.2, kg: 1.09 },
    kr: { kz: 1.0, ru: 1.16, by: 1.22, kg: 1.11 },
    it: { kz: 1.0, ru: 1.13, by: 1.19, kg: 1.09 },
    ru: { kz: 0.95, by: 1.05, kg: 1.0 }
};

// Курс доллара к тенге
const USD_TO_KZT = 500;

// Коэффициенты
const coefficients = {
    cargoType: {
        general: 1.0,
        fragile: 1.3,
        hazardous: 1.8,
        perishable: 1.5,
        valuable: 2.0
    },
    urgency: {
        standard: 1.0,
        express: 1.5,
        urgent: 2.5
    }
};

// Минимальная стоимость отключена, чтобы калькулятор соответствовал тарифам на странице
const MIN_PRICE = 0;

function parsePositiveNumber(value) {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
}

document.getElementById('cargoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Получаем данные формы
    const transportType = document.getElementById('transportType').value;
    const fromCountry = document.getElementById('fromCountry').value;
    const toCountry = document.getElementById('toCountry').value;
    const weight = parsePositiveNumber(document.getElementById('weight').value);
    const volumeInput = document.getElementById('volume').value;
    const volume = volumeInput ? Number.parseFloat(volumeInput) : 0;
    const cargoType = document.getElementById('cargoType').value;
    const urgency = document.getElementById('urgency').value;
    const hasInsurance = document.getElementById('insurance').checked;
    const hasDoorToDoor = document.getElementById('doorToDoor').checked;
    
    if (!transportType || !fromCountry || !toCountry) {
        alert('Заполните вид транспорта и маршрут доставки.');
        return;
    }

    if (!weight) {
        alert('Введите корректный вес груза (больше 0).');
        return;
    }

    if (volumeInput && (!Number.isFinite(volume) || volume < 0)) {
        alert('Введите корректный объём груза.');
        return;
    }

    if (fromCountry === toCountry) {
        alert('Страна отправления и назначения не должны совпадать.');
        return;
    }

    const transportRates = baseRates[transportType];
    const baseRate = transportRates ? transportRates[fromCountry] : null;
    const routeMultiplier = routeMultipliers[fromCountry]?.[toCountry];
    
    // Проверяем доступность направления
    if (baseRate == null) {
        alert('К сожалению, доставка из выбранной страны этим видом транспорта недоступна.');
        return;
    }

    if (routeMultiplier == null) {
        alert('К сожалению, выбранное направление пока недоступно.');
        return;
    }

    const rate = baseRate * routeMultiplier;
    
    // Рассчитываем стоимость
    let priceUSD = weight * rate;
    
    // Применяем коэффициент типа груза
    priceUSD *= coefficients.cargoType[cargoType];
    
    // Применяем коэффициент срочности
    priceUSD *= coefficients.urgency[urgency];
    
    // Учитываем объём (для объёмных грузов)
    if (volume > 0) {
        const volumetricWeight = volume * 167; // стандартный коэффициент
        if (volumetricWeight > weight) {
            priceUSD = volumetricWeight * rate * coefficients.cargoType[cargoType] * coefficients.urgency[urgency];
        }
    }
    
    // Добавляем страховку
    if (hasInsurance) {
        priceUSD *= 1.02; // +2%
    }
    
    // Добавляем доставку "от двери до двери"
    if (hasDoorToDoor) {
        priceUSD += 50; // базовая наценка заdoor-to-door
    }
    
    // Применяем минимальную стоимость
    if (priceUSD < MIN_PRICE / USD_TO_KZT) {
        priceUSD = MIN_PRICE / USD_TO_KZT;
    }
    
    // Конвертируем в тенге
    const priceKZT = Math.round(priceUSD * USD_TO_KZT);
    
    // Форматируем цену
    const formattedPrice = priceKZT.toLocaleString('ru-RU');
    
    // Показываем результат
    document.getElementById('totalPrice').textContent = formattedPrice + ' ₸';
    document.getElementById('result').style.display = 'block';
    
    // Прокрутка к результату
    document.getElementById('result').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// Валидация формы
document.getElementById('weight').addEventListener('input', function() {
    if (this.value < 0) this.value = 0;
});

document.getElementById('volume').addEventListener('input', function() {
    if (this.value < 0) this.value = 0;
});
