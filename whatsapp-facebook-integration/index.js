// Импорт необходимых модулей
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto');

// Создание приложения Express
const app = express();
app.use(bodyParser.json());

// Переменные окружения
const accessToken = process.env.ACCESS_TOKEN;
const pixelId = process.env.PIXEL_ID;
const dataSetId = process.env.DATA_SET_ID;
const verifyToken = process.env.VERIFY_TOKEN;
const PORT = process.env.PORT || 3000;

// URL для отправки событий в Facebook Conversions API
const url = `https://graph.facebook.com/v14.0/${pixelId}/events?access_token=${accessToken}&data_set_id=${dataSetId}`;

// Функция для хеширования данных (SHA256)
function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Функция для отправки события в Facebook
async function sendEvent(eventName, userData, customData = {}) {
  const eventData = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'system_generated',
        user_data: userData,
        custom_data: customData,
      },
    ],
  };

  try {
    const response = await axios.post(url, eventData);
    console.log(`Событие ${eventName} отправлено успешно:`, response.data);
  } catch (error) {
    console.error(
      `Ошибка при отправке события ${eventName}:`,
      error.response ? error.response.data : error.message
    );
  }
}

// Эндпоинт для верификации вебхука WhatsApp
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(404);
  }
});

// Эндпоинт для обработки входящих вебхуков от WhatsApp
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object) {
    body.entry.forEach((entry) => {
      const changes = entry.changes || [];

      changes.forEach((change) => {
        if (change.value && change.value.messages) {
          const messages = change.value.messages;

          messages.forEach((message) => {
            const phoneNumber = message.from;
            const userData = {
              ph: hashData(phoneNumber),
            };

            // Определение типа события на основе содержимого сообщения
            determineAndSendEvent(message, userData);
          });
        }
      });
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Функция для определения типа события и его отправки
function determineAndSendEvent(message, userData) {
  let eventName = 'Contact'; // Событие по умолчанию

  if (message.type === 'text') {
    const messageText = message.text.body.toLowerCase();

    if (messageText.includes('лид')) {
      eventName = 'Lead';
    } else if (messageText.includes('заявка')) {
      eventName = 'SubmitApplication';
    } else if (messageText.includes('просмотр')) {
      eventName = 'ViewContent';
    } else if (messageText.includes('отправленный лид')) {
      eventName = 'CompleteRegistration';
    }
  }

  // Дополнительные параметры custom_data при необходимости
  const customData = {
    // Добавьте необходимые параметры custom_data здесь
  };

  sendEvent(eventName, userData, customData);
}

// Запуск сервера на указанном порту
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
