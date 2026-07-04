import os
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from models import User, OtpCode, Client, Case, Hearing, Document, Task
from schemas import OtpRequest, OtpVerify, RegisterRequest, TokenResponse, UserResponse
from auth import generate_otp, create_access_token, get_current_user, OTP_EXPIRY_MINUTES
from otp_service import send_otp
from routers import clients, cases, hearings, documents, tasks, court_status

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Advocate's Vault API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients.router)
app.include_router(cases.router)
app.include_router(hearings.router)
app.include_router(documents.router)
app.include_router(tasks.router)
app.include_router(court_status.router)




# --- OTP Auth ---
@app.post("/api/auth/request-otp")
async def request_otp(req: OtpRequest, db: Session = Depends(get_db)):
    mobile = req.mobile_number.strip()
    if len(mobile) < 10:
        raise HTTPException(status_code=400, detail="Invalid mobile number")

    # Check if user exists
    user = db.query(User).filter(User.mobile_number == mobile).first()
    user_exists = user is not None

    # Generate OTP
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    db_otp = OtpCode(mobile_number=mobile, otp_code=otp, expires_at=expires_at)
    db.add(db_otp)
    db.commit()

    # Get user email if exists (for email fallback)
    email = user.email if user else None

    # Send OTP via configured method (SMS/Email)
    otp_results = await send_otp(mobile, otp, email)

    # Print to console for local dev
    print(f"\n{'='*40}")
    print(f"  OTP for {mobile}: {otp}")
    print(f"  Expires at: {expires_at}")
    print(f"  SMS: {otp_results.get('sms')}")
    print(f"  Email: {otp_results.get('email')}")
    print(f"{'='*40}\n")

    return {
        "message": "OTP sent successfully",
        "user_exists": user_exists,
        "otp": otp,  # Returned for local testing only
    }


@app.post("/api/auth/verify-otp", response_model=TokenResponse)
def verify_otp(req: OtpVerify, db: Session = Depends(get_db)):
    mobile = req.mobile_number.strip()
    otp = req.otp_code.strip()

    # Find valid OTP
    db_otp = (
        db.query(OtpCode)
        .filter(
            OtpCode.mobile_number == mobile,
            OtpCode.otp_code == otp,
            OtpCode.is_used == False,
            OtpCode.expires_at > datetime.utcnow(),
        )
        .order_by(OtpCode.created_at.desc())
        .first()
    )
    if not db_otp:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")

    # Mark OTP as used
    db_otp.is_used = True
    db.commit()

    # Find user
    user = db.query(User).filter(User.mobile_number == mobile).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not registered. Please register first.")

    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        full_name=user.full_name,
        mobile_number=user.mobile_number,
    )


@app.post("/api/auth/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    mobile = req.mobile_number.strip()
    if len(mobile) < 10:
        raise HTTPException(status_code=400, detail="Invalid mobile number")

    existing = db.query(User).filter(User.mobile_number == mobile).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mobile number already registered")

    user = User(
        full_name=req.full_name.strip(),
        mobile_number=mobile,
        email=req.email,
        state=req.state,
        district=req.district,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        full_name=user.full_name,
        mobile_number=user.mobile_number,
    )


@app.get("/api/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return current_user


# --- Dashboard stats (filtered by user) ---
@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    uid = current_user.id
    total_cases = db.query(Case).filter(Case.user_id == uid).count()
    active_cases = db.query(Case).filter(Case.user_id == uid, Case.status == "Active").count()
    upcoming_hearings = db.query(Hearing).filter(Hearing.user_id == uid, Hearing.status == "Scheduled").count()
    pending_tasks = db.query(Task).filter(Task.user_id == uid, Task.status == "Pending").count()
    total_clients = db.query(Client).filter(Client.user_id == uid).count()
    total_documents = db.query(Document).filter(Document.user_id == uid).count()

    recent_clients = db.query(Client).filter(Client.user_id == uid).order_by(Client.created_at.desc()).limit(5).all()
    recent_documents = db.query(Document).filter(Document.user_id == uid).order_by(Document.uploaded_at.desc()).limit(5).all()

    return {
        "total_cases": total_cases,
        "active_cases": active_cases,
        "upcoming_hearings": upcoming_hearings,
        "pending_tasks": pending_tasks,
        "total_clients": total_clients,
        "total_documents": total_documents,
        "recent_clients": [
            {"id": c.id, "name": c.name, "phone": c.phone, "email": c.email}
            for c in recent_clients
        ],
        "recent_documents": [
            {"id": d.id, "title": d.title, "file_name": d.file_name, "uploaded_at": str(d.uploaded_at) if d.uploaded_at else None}
            for d in recent_documents
        ],
    }


@app.get("/")
def root():
    return {"message": "Advocate's Vault API is running"}
