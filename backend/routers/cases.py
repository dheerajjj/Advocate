from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from database import get_db
from models import Case
from schemas import CaseCreate, CaseUpdate, CaseResponse
from auth import get_current_user

router = APIRouter(prefix="/api/cases", tags=["Cases"])


@router.get("", response_model=List[CaseResponse])
def get_cases(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Case).options(joinedload(Case.client)).filter(Case.user_id == current_user.id)
    if search:
        query = query.filter(
            Case.case_number.ilike(f"%{search}%")
            | Case.cnr_number.ilike(f"%{search}%")
            | Case.court_name.ilike(f"%{search}%")
        )
    if status:
        query = query.filter(Case.status == status)
    return query.order_by(Case.created_at.desc()).all()


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    case = db.query(Case).options(joinedload(Case.client)).filter(Case.id == case_id, Case.user_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.post("", response_model=CaseResponse)
def create_case(case: CaseCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_case = Case(**case.model_dump(), user_id=current_user.id)
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    return db_case


@router.put("/{case_id}", response_model=CaseResponse)
def update_case(case_id: int, case: CaseUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_case = db.query(Case).filter(Case.id == case_id, Case.user_id == current_user.id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
    update_data = case.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_case, key, value)
    db.commit()
    db.refresh(db_case)
    return db_case


@router.delete("/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_case = db.query(Case).filter(Case.id == case_id, Case.user_id == current_user.id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(db_case)
    db.commit()
    return {"message": "Case deleted successfully"}
