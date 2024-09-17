const express = require('express');
const request = require('request');
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
            return res.status(200).send(challenge);
        } else {
            return res.sendStatus(403);
        }
    }
});

// Обработка входящих данных от Facebook и Instagram
app.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(entry => {
            const messagingEvents = entry.messaging || [];
            messagingEvents.forEach(event => {
                handleEvent(event);
            });
        });
        return res.status(200).send('EVENT_RECEIVED');
    } else if (body.object === 'instagram') {
        body.entry.forEach(entry => {
            entry.changes.forEach(change => {
                if (change.field === 'messages') {
                    const event = change.value;
                    handleEvent(event);
                }
            });
        });
        return res.status(200).send('EVENT_RECEIVED');
    } else {
        return res.sendStatus(404);
    }
});

// Функция для обработки событий
function handleEvent(event) {
    const senderId = event.sender.id;

    // Обработка реферальной информации
    let referral = event.referral || 
                   (event.postback && event.postback.referral) || 
                   (event.message && event.message.quick_reply && event.message.quick_reply.payload && { ref: event.message.quick_reply.payload });

    if (referral && referral.ref) {
        const ref = referral.ref;
        console.log(`Получен ref: ${ref}`);
        saveUserReferral(senderId, ref);
    }

    // Обработка сообщения
    if (event.message) {
        handleMessage(senderId, event.message);
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

// Функция для обработки сообщений
function handleMessage(senderId, message) {
    if (message.text) {
        console.log(`Получено сообщение от пользователя ${senderId}: ${message.text}`);
        sendMessage(senderId, { text: `Вы сказали: ${message.text}` });
    }

    if (message.attachments) {
        message.attachments.forEach(attachment => {
            console.log(`Получено вложение от пользователя ${senderId}:`, attachment);
            // Логика обработки вложений
        });
    }

    if (message.quick_reply) {
        console.log(`Получен быстрый ответ от пользователя ${senderId}: ${message.quick_reply.payload}`);
        // Логика обработки быстрого ответа
    }
}

// Функция для отправки сообщений через Facebook Graph API
function sendMessage(recipientId, message) {
    const requestBody = {
        recipient: { id: recipientId },
        message: message
    };

    request({
        uri: 'https://graph.facebook.com/v17.0/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: requestBody
    }, (err, res, body) => {
        if (!err && res.statusCode === 200) {
            console.log('Сообщение отправлено пользователю', recipientId);
        } else {
            console.error('Не удалось отправить сообщение:', err || body.error);
        }
    });
}

// Функция для сохранения UTM-меток
function saveUserReferral(userId, ref) {
    console.log(`Сохраняем UTM-метку для пользователя ${userId}: ${ref}`);
    // Здесь можно добавить логику сохранения в базу данных
}

// Запуск сервера
const port = process.env.PORT || 3002;
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});