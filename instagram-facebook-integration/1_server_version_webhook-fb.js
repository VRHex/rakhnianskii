const express = require('express');
const axios = require('axios');
require('dotenv').config(); // Подключаем dotenv для работы с переменными окружения

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // Получаем VERIFY_TOKEN из .env
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN; // Получаем PAGE_ACCESS_TOKEN из .env

// Обработка запроса подтверждения от Facebook
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(404);
    }
});

// Обработка входящих данных от Facebook и Instagram
app.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object === 'page' || body.object === 'instagram') {
        body.entry.forEach(function(entry) {
            const messagingEvents = entry.messaging || [];
            messagingEvents.forEach(function(event) {
                // Проверка и обработка сообщения
                handleEvent(event);
            });
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Функция для обработки событий
function handleEvent(event) {
    const senderId = event.sender.id;

    // Обработка реферальной информации
    let referral = null;

    if (event.referral) {
        referral = event.referral;
    } else if (event.postback && event.postback.referral) {
        referral = event.postback.referral;
    } else if (event.message && event.message.quick_reply && event.message.quick_reply.payload) {
        referral = { ref: event.message.quick_reply.payload };
    }

    if (referral && referral.ref) {
        const ref = referral.ref;
        console.log(`Получен ref: ${ref}`);
        // Сохранение или обработка UTM-метки
        saveUserReferral(senderId, ref);
    }

    // Обработка сообщения
    if (event.message) {
        const message = event.message;

        // Обработка текста сообщения
        if (message.text) {
            console.log(`Получено сообщение от пользователя ${senderId}: ${message.text}`);
            // Логика обработки сообщения
            // Например, отправка ответа пользователю
            sendMessage(senderId, { text: `Вы сказали: ${message.text}` });
        }

        // Обработка вложений
        if (message.attachments) {
            message.attachments.forEach(attachment => {
                console.log(`Получено вложение от пользователя ${senderId}:`, attachment);
                // Логика обработки вложений
            });
        }

        // Обработка быстрых ответов
        if (message.quick_reply) {
            console.log(`Получен быстрый ответ от пользователя ${senderId}: ${message.quick_reply.payload}`);
            // Логика обработки быстрого ответа
        }
    }

    // Обработка постбэков
    if (event.postback) {
        console.log(`Получен постбэк от пользователя ${senderId}: ${event.postback.payload}`);
        // Логика обработки постбэка
    }

    // Обработка реакций
    if (event.reaction) {
        console.log(`Получена реакция от пользователя ${senderId}:`, event.reaction);
        // Логика обработки реакции
    }
}

// Функция для отправки сообщений через Facebook Graph API с использованием axios
async function sendMessage(recipientId, message) {
    const requestBody = {
        recipient: {
            id: recipientId
        },
        message: message
    };

    try {
        const response = await axios.post(
            'https://graph.facebook.com/v17.0/me/messages',
            requestBody,
            {
                params: { access_token: PAGE_ACCESS_TOKEN }
            }
        );
        console.log('Сообщение отправлено пользователю', recipientId);
    } catch (error) {
        console.error('Не удалось отправить сообщение:', error.response ? error.response.data : error.message);
    }
}

function saveUserReferral(userId, ref) {
    // Логика сохранения UTM-метки и связывания с пользователем
    // Например, сохранение в базу данных
    console.log(`Сохраняем UTM-метку для пользователя ${userId}: ${ref}`);
}

// Запуск сервера
const port = process.env.PORT || 3002;
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
