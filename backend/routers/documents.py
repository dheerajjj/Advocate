import os
import uuid
import tempfile
import io
import mimetypes
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Document, Case, Client
from schemas import DocumentResponse, DocumentCreate, CaseResponse, ClientResponse
from auth import get_current_user
from storage import upload_file_to_b2, delete_file_from_b2, download_file_from_b2_sync
from document_parser import extract_from_text, extract_text_from_file, get_extraction_confidence

router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.get("", response_model=List[DocumentResponse])
def get_documents(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.uploaded_at.desc()).all()


@router.get("/download/{document_id}")
def download_document(document_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Download a document by streaming through backend from B2 storage."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    tmp_path = None
    try:
        # Download from B2 to temp file
        tmp_path = download_file_from_b2_sync(doc.b2_file_key)
        
        # Determine correct MIME type based on file extension
        mime_type, _ = mimetypes.guess_type(doc.file_name)
        if not mime_type:
            mime_type = "application/octet-stream"
        
        # Stream file to client with correct content type
        return StreamingResponse(
            open(tmp_path, "rb"),
            media_type=mime_type,
            headers={"Content-Disposition": f"attachment; filename={doc.file_name}"}
        )
    except Exception as e:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@router.post("", response_model=DocumentResponse)
async def upload_document(
    title: str = Form(...),
    case_id: Optional[int] = Form(None),
    client_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Generate unique B2 object key with user-scoped path using full_name
    ext = os.path.splitext(file.filename)[1] if file.filename else ".bin"
    safe_name = current_user.full_name.replace(" ", "_").lower()
    unique_name = f"{safe_name}/{uuid.uuid4().hex}{ext}"

    # Save to temp file first for B2 upload
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_file_path = tmp.name
        file_size = len(contents)

    try:
        # Upload to B2
        await upload_file_to_b2(tmp_file_path, unique_name, file.content_type or "application/octet-stream")
    except Exception as e:
        # Clean up temp file on failure
        if os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)
        raise HTTPException(status_code=500, detail=f"Failed to upload to cloud storage: {str(e)}")

    db_doc = Document(
        title=title,
        file_name=file.filename,
        b2_file_key=unique_name,
        file_size=file_size,
        case_id=case_id if case_id else None,
        client_id=client_id if client_id else None,
        user_id=current_user.id,
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc


@router.get("/analyze/{document_id}")
async def analyze_document(document_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Analyze a document and extract case/client details using OCR and regex."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    tmp_path = None
    try:
        # Download from B2 to temp file
        tmp_path = download_file_from_b2_sync(doc.b2_file_key)
        
        # Extract text from the file
        extracted_text = extract_text_from_file(tmp_path, doc.file_name)
        
        if not extracted_text or len(extracted_text.strip()) < 50:
            return {
                "success": True,
                "document_id": doc.id,
                "extracted_data": {},
                "confidence": 0,
                "summary": "No text content found in this document. This may be a scanned image or non-text file.",
                "auto_linked": False,
                "linked_case_id": None,
                "linked_client_id": None,
            }
        
        # Extract case details
        extracted_data = extract_from_text(extracted_text)
        confidence = get_extraction_confidence(extracted_data)
        
        # Auto-link to existing case if case_number or cnr_number found
        auto_linked = False
        linked_case_id = None
        linked_client_id = None
        
        if confidence > 20 and (extracted_data.get("case_number") or extracted_data.get("cnr_number")):
            # Try to find existing case by case number or CNR
            search_number = extracted_data.get("cnr_number") or extracted_data.get("case_number")
            if search_number:
                existing_case = db.query(Case).filter(
                    Case.user_id == current_user.id,
                    (Case.case_number == search_number) | (Case.cnr_number == search_number)
                ).first()
                
                if existing_case:
                    # Link document to existing case
                    doc.case_id = existing_case.id
                    linked_case_id = existing_case.id
                    auto_linked = True
                    
                    # Also try to link to client
                    if existing_case.client_id:
                        doc.client_id = existing_case.client_id
                        linked_client_id = existing_case.client_id
                    
                    db.commit()
                    db.refresh(doc)
                else:
                    # Case not found - return extracted data so frontend can offer to create
                    pass
        
        # Generate summary
        from document_parser import generate_summary
        summary = generate_summary(extracted_data)
        
        return {
            "success": True,
            "document_id": doc.id,
            "extracted_data": extracted_data,
            "confidence": confidence,
            "summary": summary,
            "auto_linked": auto_linked,
            "linked_case_id": linked_case_id,
            "linked_client_id": linked_client_id,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        # Clean up temp file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except:
                pass


@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    # Remove file from B2
    try:
        delete_file_from_b2(doc.b2_file_key)
    except Exception as e:
        print(f"Warning: Failed to delete from B2: {str(e)}")
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}
