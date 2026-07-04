from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
from models import Hearing
from schemas import HearingCreate, HearingUpdate, HearingResponse
from auth import get_current_user

router = APIRouter(prefix="/api/hearings", tags=["Hearings"])


@router.get("", response_model=List[HearingResponse])
def get_hearings(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return (
        db.query(Hearing)
        .options(joinedload(Hearing.case))
        .filter(Hearing.user_id == current_user.id)
        .order_by(Hearing.hearing_date.asc())
        .all()
    )


@router.get("/{hearing_id}", response_model=HearingResponse)
def get_hearing(hearing_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    hearing = db.query(Hearing).options(joinedload(Hearing.case)).filter(Hearing.id == hearing_id, Hearing.user_id == current_user.id).first()
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    return hearing


@router.post("", response_model=HearingResponse)
def create_hearing(hearing: HearingCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_hearing = Hearing(**hearing.model_dump(), user_id=current_user.id)
    db.add(db_hearing)
    db.commit()
    db.refresh(db_hearing)
    return db_hearing


@router.put("/{hearing_id}", response_model=HearingResponse)
def update_hearing(hearing_id: int, hearing: HearingUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_hearing = db.query(Hearing).filter(Hearing.id == hearing_id, Hearing.user_id == current_user.id).first()
    if not db_hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    update_data = hearing.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_hearing, key, value)
    db.commit()
    db.refresh(db_hearing)
    return db_hearing


@router.delete("/{hearing_id}")
def delete_hearing(hearing_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_hearing = db.query(Hearing).filter(Hearing.id == hearing_id, Hearing.user_id == current_user.id).first()
    if not db_hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    db.delete(db_hearing)
    db.commit()
    return {"message": "Hearing deleted successfully"}
