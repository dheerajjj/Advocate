from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    mobile_number = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class OtpCode(Base):
    __tablename__ = "otp_codes"
    id = Column(Integer, primary_key=True, index=True)
    mobile_number = Column(String(20), nullable=False, index=True)
    otp_code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    cases = relationship("Case", back_populates="client")
    documents = relationship("Document", back_populates="client")
    tasks = relationship("Task", back_populates="client")


class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    case_number = Column(String(50), nullable=False)
    cnr_number = Column(String(50), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    court_name = Column(String(100), nullable=True)
    case_type = Column(String(50), nullable=True)
    filing_date = Column(String(20), nullable=True)
    next_hearing_date = Column(String(20), nullable=True)
    status = Column(String(20), default="Active")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    client = relationship("Client", back_populates="cases")
    hearings = relationship("Hearing", back_populates="case")
    documents = relationship("Document", back_populates="case")
    tasks = relationship("Task", back_populates="case")


class Hearing(Base):
    __tablename__ = "hearings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    hearing_date = Column(String(20), nullable=False)
    court_room = Column(String(50), nullable=True)
    judge_name = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(20), default="Scheduled")
    created_at = Column(DateTime, server_default=func.now())

    case = relationship("Case", back_populates="hearings")


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    file_name = Column(String(255), nullable=False)
    b2_file_key = Column(String(500), nullable=False)  # B2 object key
    file_size = Column(Integer, nullable=True)  # File size in bytes
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    uploaded_at = Column(DateTime, server_default=func.now())

    case = relationship("Case", back_populates="documents")
    client = relationship("Client", back_populates="documents")


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    due_date = Column(String(20), nullable=True)
    priority = Column(String(20), default="Medium")
    status = Column(String(20), default="Pending")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    case = relationship("Case", back_populates="tasks")
    client = relationship("Client", back_populates="tasks")
