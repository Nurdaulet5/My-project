const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов. Попробуйте позже.' },
});

app.use('/api', apiLimiter);

const shipmentsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Превышен лимит запросов на отслеживание. Повторите позже.' },
});

const TRACK_NUMBER_PATTERN = /^[A-Z]{2}-\d{4}-\d{6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMIN_API_KEY = String(process.env.ADMIN_API_KEY || '').trim();
const LOCAL_LEADS = [];
let localLeadId = 1;
const FALLBACK_SHIPMENTS = {
  'MV-2026-001234': {
    trackNumber: 'MV-2026-001234',
    from: 'Алматы, Казахстан',
    to: 'Москва, Россия',
    date: new Date().toISOString(),
    status: 'В пути',
    history: [{ date: new Date().toISOString(), location: 'Алматы', status: '✓' }],
  },
};

// Настройки подключения к БД из переменных окружения
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT) || 5432,
});

const createLeadPayload = (body = {}) => ({
  name: String(body.name || '').trim(),
  email: String(body.email || '').trim().toLowerCase(),
  phone: String(body.phone || '').trim(),
  service: String(body.service || '').trim(),
  message: String(body.message || '').trim(),
});

const isLeadPayloadValid = (payload) => {
  if (!payload.name || payload.name.length < 2) return false;
  if (!EMAIL_PATTERN.test(payload.email)) return false;
  if (!payload.message || payload.message.length < 5) return false;
  return true;
};

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/leads', async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  try {
    if (ADMIN_API_KEY) {
      const requestApiKey = String(req.header('x-admin-key') || '').trim();
      if (!requestApiKey || requestApiKey !== ADMIN_API_KEY) {
        return res.status(401).json({ error: 'Неавторизованный доступ' });
      }
    }

    const listQuery = `
      SELECT id, name, email, phone, service, message, created_at
      FROM public.leads
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const countQuery = 'SELECT COUNT(*)::int AS total FROM public.leads';

    const [listResult, countResult] = await Promise.all([
      pool.query(listQuery, [limit, offset]),
      pool.query(countQuery),
    ]);

    return res.json({
      total: countResult.rows[0].total,
      limit,
      offset,
      items: listResult.rows,
    });
  } catch (err) {
    console.error(err);
    const items = LOCAL_LEADS.slice(offset, offset + limit);
    return res.json({
      total: LOCAL_LEADS.length,
      limit,
      offset,
      items,
    });
  }
});

app.post('/api/leads', async (req, res) => {
  const lead = createLeadPayload(req.body);
  try {
    if (!isLeadPayloadValid(lead)) {
      return res.status(400).json({ error: 'Проверьте корректность полей формы' });
    }

    const insertQuery = `
      INSERT INTO public.leads (name, email, phone, service, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `;
    const values = [lead.name, lead.email, lead.phone || null, lead.service || null, lead.message];
    const { rows } = await pool.query(insertQuery, values);

    return res.status(201).json({
      id: rows[0].id,
      createdAt: rows[0].created_at,
      message: 'Заявка успешно отправлена',
    });
  } catch (err) {
    console.error(err);
    const createdAt = new Date().toISOString();
    const localLead = {
      id: localLeadId++,
      name: lead.name,
      email: lead.email,
      phone: lead.phone || null,
      service: lead.service || null,
      message: lead.message,
      created_at: createdAt,
    };
    LOCAL_LEADS.unshift(localLead);

    return res.status(201).json({
      id: localLead.id,
      createdAt,
      message: 'Заявка успешно отправлена',
    });
  }
});
// Маршрут для получения данных груза
app.get('/api/shipments/:trackNumber', shipmentsLimiter, async (req, res) => {
    const normalizedTrackNumber = String(req.params.trackNumber || '').trim().toUpperCase();
    try {
        if (!TRACK_NUMBER_PATTERN.test(normalizedTrackNumber)) {
            return res.status(400).json({ error: 'Некорректный формат трек-номера' });
        }

        const result = await pool.query('SELECT * FROM public.shipments WHERE tracking_number = $1', [normalizedTrackNumber]);
        if (result.rows.length > 0) {
            const dbRow = result.rows[0];
            // Собираем объект, который ожидает твой фронтенд
            const shipment = {
                trackNumber: dbRow.tracking_number,
                from: dbRow.location || 'Склад отправки',
                to: 'Пункт назначения',
                date: dbRow.updated_at,
                status: dbRow.current_status,
                history: [
                    { date: dbRow.updated_at, location: dbRow.location, status: '✓' }
                ]
            };
            res.json(shipment);
        } else {
            res.status(404).json({ error: "Груз не найден" });
        }
    } catch (err) {
        console.error(err);
        const fallback = FALLBACK_SHIPMENTS[normalizedTrackNumber];
        if (fallback) {
          return res.json(fallback);
        }
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server Silk Way started on port ${PORT}`);
});