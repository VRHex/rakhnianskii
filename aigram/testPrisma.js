// Загружаем переменные окружения из .env
require('dotenv').config({ path: '../.env' });

// Импортируем Prisma Client
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Получение всех задач из таблицы Task
    const tasks = await prisma.task.findMany();
    console.log('Задачи из базы данных:', tasks);
}

// Выполняем основную функцию
main()
    .catch((e) => {
        console.error('Ошибка:', e.message);
    })
    .finally(async () => {
        // Закрываем подключение к базе данных
        await prisma.$disconnect();
    });