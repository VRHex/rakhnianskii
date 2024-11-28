import os
import asyncio
import datetime
import pymysql
pymysql.install_as_MySQLdb()

from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Импорт моделей из models.py
from models import Base, Task

# Загрузка переменных окружения
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

if not DATABASE_URL:
    raise ValueError("Строка подключения к базе данных не найдена. Проверьте файл .env.")

if not TELEGRAM_BOT_TOKEN:
    raise ValueError("Токен бота не найден. Убедитесь, что он указан в .env файле.")

print(f"DATABASE_URL: {DATABASE_URL}")  # Для отладки

# Настройка SQLAlchemy
engine = create_engine(DATABASE_URL, echo=True)
Session = sessionmaker(bind=engine)
session = Session()

# Создание таблиц (если их нет)
Base.metadata.create_all(engine)

# Инициализация бота
bot = Bot(token=TELEGRAM_BOT_TOKEN)
dp = Dispatcher()

# Тестирование подключения к базе данных
def test_db_connection():
    try:
        task = session.query(Task).first()
        if task:
            print(f"Подключение успешно. Первая задача: {task.description}")
        else:
            print("Подключение успешно. Таблица Task пуста.")
    except Exception as e:
        print(f"Ошибка подключения: {e}")

# Хендлер для команды /tasks
@dp.message(Command(commands=["tasks"]))
async def list_tasks(message: types.Message):
    try:
        tasks = session.query(Task).order_by(Task.priority.desc()).all()
        if not tasks:
            await message.reply("❌ Задачи отсутствуют.")
            return

        tasks_text = "📋 **Список задач:**\n\n"
        for task in tasks:
            tasks_text += (
                f"🔹 **Описание:** {task.description}\n"
                f"   🕒 **Статус:** {task.status}\n"
                f"   📌 **Приоритет:** {task.priority}\n"
                f"   💡 **Назначено:** {task.assignedTo or 'Не назначено'}\n"
                f"   ⏱️ **Время выполнения:** {task.executionTime or 'Не указано'} мин\n"
                f"   📈 **Эффективность:** {task.efficiency or 'Не указано'}%\n"
                f"   📝 **Заметки:** {task.notes or 'Нет'}\n\n"
            )

        await message.reply(tasks_text, parse_mode="Markdown")
    except Exception as e:
        await message.reply(f"⚠️ Ошибка: {e}")

# Хендлер для команды /add_task
@dp.message(Command(commands=["add_task"]))
async def add_task(message: types.Message):
    try:
        args = message.get_args().split(',')
        if len(args) < 2:
            await message.reply("⚠️ Пожалуйста, используйте формат: /add_task <описание>,<предполагаемое время>")
            return

        description = args[0].strip()
        estimated_time = int(args[1].strip())

        new_task = Task(
            description=description,
            status="pending",
            estimatedTime=estimated_time
        )
        session.add(new_task)
        session.commit()

        await message.reply("✅ Задача успешно добавлена.")
    except Exception as e:
        await message.reply(f"⚠️ Ошибка при добавлении задачи: {e}")

# Хендлер для команды /start
@dp.message(Command(commands=["start"]))
async def send_welcome(message: types.Message):
    await message.answer("Привет! Бот готов к работе. 🚀")

# Эхо-сообщение для любых других сообщений
@dp.message()
async def echo_message(message: types.Message):
    await message.answer(f"Вы написали: {message.text}")

# Главная функция
async def main():
    print("Бот запущен. 🚀")
    test_db_connection()
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
