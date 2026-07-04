from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Auth - OTP
class OtpRequest(BaseModel):
    mobile_number: str


class OtpVerify(BaseModel):
    mobile_number: str
    otp_code: str


class RegisterRequest(BaseModel):
    full_name: str
    mobile_number: str
    email: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    mobile_number: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    mobile_number: str
    email: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Client
class ClientCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class ClientResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Case
class CaseCreate(BaseModel):
    case_number: str
    cnr_number: Optional[str] = None
    client_id: int
    court_name: Optional[str] = None
    case_type: Optional[str] = None
    filing_date: Optional[str] = None
    next_hearing_date: Optional[str] = None
    status: Optional[str] = "Active"
    description: Optional[str] = None


class CaseUpdate(BaseModel):
    case_number: Optional[str] = None
    cnr_number: Optional[str] = None
    client_id: Optional[int] = None
    court_name: Optional[str] = None
    case_type: Optional[str] = None
    filing_date: Optional[str] = None
    next_hearing_date: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None


class CaseResponse(BaseModel):
    id: int
    case_number: str
    cnr_number: Optional[str] = None
    client_id: int
    court_name: Optional[str] = None
    case_type: Optional[str] = None
    filing_date: Optional[str] = None
    next_hearing_date: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    client: Optional[ClientResponse] = None

    class Config:
        from_attributes = True


# Hearing
class HearingCreate(BaseModel):
    case_id: int
    hearing_date: str
    court_room: Optional[str] = None
    judge_name: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = "Scheduled"


class HearingUpdate(BaseModel):
    case_id: Optional[int] = None
    hearing_date: Optional[str] = None
    court_room: Optional[str] = None
    judge_name: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class HearingResponse(BaseModel):
    id: int
    case_id: int
    hearing_date: str
    court_room: Optional[str] = None
    judge_name: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[datetime] = None
    case: Optional[CaseResponse] = None

    class Config:
        from_attributes = True


# Document
class DocumentCreate(BaseModel):
    title: str
    case_id: Optional[int] = None
    client_id: Optional[int] = None


class DocumentResponse(BaseModel):
    id: int
    title: str
    file_name: str
    b2_file_key: str
    file_size: Optional[int] = None
    case_id: Optional[int] = None
    client_id: Optional[int] = None
    uploaded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Task
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    case_id: Optional[int] = None
    client_id: Optional[int] = None
    due_date: Optional[str] = None
    priority: Optional[str] = "Medium"
    status: Optional[str] = "Pending"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    case_id: Optional[int] = None
    client_id: Optional[int] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    case_id: Optional[int] = None
    client_id: Optional[int] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
