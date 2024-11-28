from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Float, DateTime
import datetime

Base = declarative_base()

class Task(Base):
    __tablename__ = 'Task'

    id = Column(Integer, primary_key=True, autoincrement=True)
    description = Column(String, nullable=False)
    status = Column(String, nullable=False)
    result = Column(String, nullable=True)
    errorLog = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    priority = Column(Integer, default=0)
    assignedTo = Column(String, nullable=True)
    executionTime = Column(Integer, nullable=True)
    notes = Column(String, nullable=True)
    efficiency = Column(Float, nullable=True)
    estimatedTime = Column(Integer, nullable=True)
