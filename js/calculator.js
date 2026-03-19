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
        tr: 1.2,
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

// Курс доллара к рублю
const USD_TO_RUB = 92;

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

// Минимальная стоимость
const MIN_PRICE = 1500;

document.getElementById('cargoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Получаем данные формы
    const transportType = document.getElementById('transportType').value;
    const fromCountry = document.getElementById('fromCountry').value;
    const toCountry = document.getElementById('toCountry').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const volume = parseFloat(document.getElementById('volume').value) || 0;
    const cargoType = document.getElementById('cargoType').value;
    const urgency = document.getElementById('urgency').value;
    const hasInsurance = document.getElementById('insurance').checked;
    const hasDoorToDoor = document.getElementById('doorToDoor').checked;
    
    // Проверяем доступность направления
    const rate = baseRates[transportType][fromCountry];
    
    if (!rate) {
        alert('К сожалению, доставка из выбранной страны данным видом транспорта недоступна.');
        return;
    }
    
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
    if (priceUSD < MIN_PRICE / USD_TO_RUB) {
        priceUSD = MIN_PRICE / USD_TO_RUB;
    }
    
    // Конвертируем в рубли
    const priceRUB = Math.round(priceUSD * USD_TO_RUB);
    
    // Форматируем цену
    const formattedPrice = priceRUB.toLocaleString('ru-RU');
    
    // Показываем результат
    document.getElementById('totalPrice').textContent = formattedPrice + ' ₽';
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
