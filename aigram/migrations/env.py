from logging.config import fileConfig
import os
import sys

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# Это объект конфигурации Alembic
config = context.config

# Настройка логирования
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Добавляем путь к проекту
sys.path.append(os.path.abspath('.'))

# Импортируем Base из моделей
from models import Base

# Устанавливаем target_metadata
target_metadata = Base.metadata

def get_url():
    from dotenv import load_dotenv
    load_dotenv()
    return os.getenv("DATABASE_URL")

def run_migrations_offline():
    """Запуск миграций в оффлайн-режиме."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Запуск миграций в онлайн-режиме."""
    connectable = engine_from_config(
        configuration={},
        url=get_url(),
        prefix='',
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
