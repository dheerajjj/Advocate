"""
Document Parser for Indian Legal Documents
Extracts case details, client info, and metadata from uploaded documents.
Supports: PDF, JPEG, PNG, DOCX, TXT
Uses OCR for images and regex patterns for text — no AI required.
"""
import re
import os
from typing import Dict, List, Optional

# OCR support
try:
    import pytesseract
    from PIL import Image
    HAS_OCR = True
except ImportError:
    HAS_OCR = False

# PDF support
try:
    import PyPDF2
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

# DOCX support
try:
    import docx
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False


# --- Indian Legal Document Patterns ---

# CNR Number
CNR_PATTERNS = [
    r"CNR\s*[:\-]?\s*([A-Z]{2,4}\d{12,16})",
    r"CNR\s+Number\s*[:\-]?\s*([A-Z]{2,4}\d{12,16})",
    r"([A-Z]{2,4}\d{12,16})",
]

# Case Number
CASE_NUMBER_PATTERNS = [
    r"(Case|C\.R\.|O\.P\.|W\.P\.|C\.C\.|M\.C\.?|S\.C\.?|L\.P\.A\.|R\.F\.A\.|I\.A\.?)\s*(No\.|No|Number|#)\s*[:\-]?\s*([A-Z0-9\-\/]+)",
    r"(Case|C\.R\.|O\.P\.|W\.P\.|C\.C\.|M\.C\.?)\s*[:\-]?\s*([A-Z0-9\-\/]+\/\d{4})",
    r"Case\s*Number\s*[:\-]?\s*([A-Z0-9\-\/]+)",
    r"Crl\.?\s*(?:P|MC|OP)\s*(?:No\.?|Number)\s*[:\-]?\s*([A-Z0-9\-\/]+\/?\d{4})",
    r"W\.?P\.?\s*(?:No\.?|Number)\s*[:\-]?\s*([A-Z0-9\-\/]+\/?\d{4})",
]

# Court Names
COURT_PATTERNS = [
    r"(?:Hon'?ble\s+)?(?:the\s+)?(?:Principal\s+(?:District\s+)?|Senior\s+(?:Civil\s+)?|Additional\s+(?:District\s+)?|District\s+|High\s+Court\s+of\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Court|Bench|District|High\s+Court)))",
    r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:District\s+)?(?:Sessions\s+)?Court(?:\s+[A-Z][a-z]+)?)",
    r"(?:Court\s+at\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
    r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+High\s+Court)",
    r"(?:High\s+Court\s+of\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
]

# Parties
PARTY_PATTERNS = {
    "petitioner": [
        r"(?:Petitioner|Plaintiff|Appellant|Complainant)\s*[:\-]?\s*(.+?)(?:\n|$)",
        r"(?:Petitioner|Plaintiff|Appellant)\s*[:\-]?\s*(.+?)(?:\n|vs\.|Vs\.|versus)",
    ],
    "respondent": [
        r"(?:Respondent|Defendant|Accused|Opposite\s+Party)\s*[:\-]?\s*(.+?)(?:\n|$)",
        r"(?:Respondent|Defendant|Accused)\s*[:\-]?\s*(.+?)(?:\n|vs\.|Vs\.|versus)",
    ],
}

# Dates
DATE_PATTERNS = [
    r"(\d{1,2}[\-\/.](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\-\s,]+\d{4})",
    r"((?:\d{1,2}[\-\/]\d{1,2}[\-\/]\d{4}|\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2}))",
    r"(Date\s+of\s+Filing\s*[:\-]?\s*(\d{1,2}[\-\/]\d{1,2}[\-\/]\d{4}))",
]

# Case Type
CASE_TYPE_KEYWORDS = {
    "Writ Petition": [r"writ\s+petition", r"w\.p\."],
    "Civil Case": [r"civil\s+(?:case|suit)", r"c\.s\."],
    "Criminal Case": [r"criminal\s+(?:case|complaint)", r"c\.c\."],
    "Appeal": [r"(?:civil|criminal)\s+appeal", r"c\.r\.p\."],
    "OP Case": [r"original\s+petition", r"o\.p\."],
    "MC Case": [r"magistrate\s+case", r"m\.c\."],
    "Review": [r"review\s+petition", r"r\.p\."],
}

# Hearing Date
HEARING_DATE_PATTERNS = [
    r"(?:Next\s+Date\s+of\s+Hearing|Next\s+Hearing|Date\s+of\s+Next\s+Hearing)\s*[:\-]?\s*(\d{1,2}[\-\/.](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\-\s,]+\d{4})",
    r"(?:Next\s+Date\s+of\s+Hearing|Next\s+Hearing|Date\s+of\s+Next\s+Hearing)\s*[:\-]?\s*(\d{1,2}[\-\/]\d{1,2}[\-\/]\d{4})",
    r"(?:Hearing\s+Date|Date\s+of\s+Hearing)\s*[:\-]?\s*(\d{1,2}[\-\/.](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\-\s,]+\d{4})",
]

# Judge Name
JUDGE_PATTERNS = [
    r"(?:Hon'?ble\s+(?:Mr\.|Mrs\.|Ms\.|Dr\.)?\s+)?(Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
    r"(?:Coram|Before)\s*[:\-]?\s*(.+?)(?:\n|$)",
    r"(?:Judge|J\.|JJ\.)\s*[:\-]?\s*(.+?)(?:\n|$)",
]

# Advocate
ADVOCATE_PATTERNS = [
    r"(?:Advocate|Counsel|Lawyer|Appearing\s+for)\s*(?:for\s+(?:Petitioner|Respondent|Accused))?\s*[:\-]?\s*(.+?)(?:\n|$)",
    r"(?:for\s+(?:Petitioner|Respondent|Appellant|Accused))\s*[:\-]?\s*(.+?)(?:\n|$)",
]

# Document Type
DOCUMENT_TYPE_PATTERNS = [
    r"(Order|Judgment|Decree|Notice|Summons|Petition|Complaint|Affidavit|FIR|Charge\s+Sheet|Bail\s+Order|Interim\s+Order|Final\s+Order)",
]


def extract_text_from_file(file_path: str, file_name: str) -> str:
    """Extract text from a file based on its extension."""
    ext = os.path.splitext(file_name)[1].lower()
    
    if ext in [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"]:
        return _extract_text_from_image(file_path)
    elif ext == ".pdf":
        return _extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return _extract_text_from_docx(file_path)
    elif ext == ".txt":
        return _extract_text_from_txt(file_path)
    else:
        # Try as image first, then text
        text = _extract_text_from_image(file_path)
        if not text.strip():
            text = _extract_text_from_txt(file_path)
        return text


def _extract_text_from_image(file_path: str) -> str:
    """Extract text from image using Tesseract OCR."""
    if not HAS_OCR:
        return ""
    
    try:
        if os.name == "nt":
            import shutil
            tesseract_path = shutil.which("tesseract")
            if not tesseract_path:
                common_paths = [
                    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
                ]
                for path in common_paths:
                    if os.path.exists(path):
                        tesseract_path = path
                        break
            
            if tesseract_path:
                pytesseract.pytesseract.tesseract_cmd = tesseract_path
        
        image = Image.open(file_path)
        
        try:
            text = pytesseract.image_to_string(image, lang="eng+hin")
        except:
            text = pytesseract.image_to_string(image, lang="eng")
        
        return text
    except Exception as e:
        print(f"OCR extraction failed: {str(e)}")
        return ""


def _extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file."""
    if not HAS_PYPDF2:
        return ""
    
    try:
        text = ""
        with open(file_path, "rb") as pdf:
            reader = PyPDF2.PdfReader(pdf)
            for page_num in range(min(len(reader.pages), 10)):
                page_text = reader.pages[page_num].extract_text()
                if page_text:
                    text += page_text + "\n"
        return text
    except Exception as e:
        print(f"PDF extraction failed: {str(e)}")
        return ""


def _extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file."""
    if not HAS_DOCX:
        return ""
    
    try:
        doc = docx.Document(file_path)
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    except Exception as e:
        print(f"DOCX extraction failed: {str(e)}")
        return ""


def _extract_text_from_txt(file_path: str) -> str:
    """Extract text from TXT file."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception as e:
        print(f"TXT extraction failed: {str(e)}")
        return ""


def extract_from_text(text: str) -> Dict[str, Optional[str]]:
    """Extract case details from document text using regex patterns."""
    result = {
        "cnr_number": None,
        "case_number": None,
        "court_name": None,
        "case_type": None,
        "petitioner": None,
        "respondent": None,
        "filing_date": None,
        "hearing_date": None,
        "judge_name": None,
        "advocate_name": None,
        "document_type": None,
    }

    if not text or len(text.strip()) < 50:
        return result

    text = text.replace("\r\n", "\n").replace("\r", "\n")
    
    # Extract CNR Number
    for pattern in CNR_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result["cnr_number"] = match.group(1).strip().upper()
            break

    # Extract Case Number
    for pattern in CASE_NUMBER_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result["case_number"] = match.group(match.lastindex).strip()
            break

    # Extract Court Name
    for pattern in COURT_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            court = match.group(1).strip()
            if len(court) > 5 and any(kw in court.lower() for kw in ["court", "bench", "district"]):
                result["court_name"] = court
                break

    # Extract Case Type
    for case_type, patterns in CASE_TYPE_KEYWORDS.items():
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                result["case_type"] = case_type
                break
        if result["case_type"]:
            break

    # Extract Petitioner
    for pattern in PARTY_PATTERNS["petitioner"]:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            petitioner = match.group(1).strip()
            if len(petitioner) > 2 and len(petitioner) < 100:
                result["petitioner"] = petitioner
                break

    # Extract Respondent
    for pattern in PARTY_PATTERNS["respondent"]:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            respondent = match.group(1).strip()
            if len(respondent) > 2 and len(respondent) < 100:
                result["respondent"] = respondent
                break

    # Extract Filing Date
    for pattern in DATE_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result["filing_date"] = match.group(1).strip()
            break

    # Extract Hearing Date
    for pattern in HEARING_DATE_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result["hearing_date"] = match.group(1).strip()
            break

    # Extract Judge Name
    for pattern in JUDGE_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            judge = match.group(1).strip()
            if len(judge) > 3 and len(judge) < 60:
                result["judge_name"] = judge
                break

    # Extract Advocate Name
    for pattern in ADVOCATE_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            advocate = match.group(1).strip()
            if len(advocate) > 3 and len(advocate) < 60:
                result["advocate_name"] = advocate
                break

    # Extract Document Type
    for pattern in DOCUMENT_TYPE_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result["document_type"] = match.group(1).strip()
            break

    return result


def generate_summary(extracted: Dict[str, Optional[str]]) -> str:
    """Generate a human-readable summary from extracted data."""
    lines = []
    
    if extracted.get("cnr_number"):
        lines.append(f"**CNR Number:** {extracted['cnr_number']}")
    if extracted.get("case_number"):
        lines.append(f"**Case Number:** {extracted['case_number']}")
    if extracted.get("court_name"):
        lines.append(f"**Court:** {extracted['court_name']}")
    if extracted.get("case_type"):
        lines.append(f"**Case Type:** {extracted['case_type']}")
    if extracted.get("petitioner"):
        lines.append(f"**Petitioner:** {extracted['petitioner']}")
    if extracted.get("respondent"):
        lines.append(f"**Respondent:** {extracted['respondent']}")
    if extracted.get("filing_date"):
        lines.append(f"**Filing Date:** {extracted['filing_date']}")
    if extracted.get("hearing_date"):
        lines.append(f"**Next Hearing:** {extracted['hearing_date']}")
    if extracted.get("judge_name"):
        lines.append(f"**Judge:** {extracted['judge_name']}")
    if extracted.get("advocate_name"):
        lines.append(f"**Advocate:** {extracted['advocate_name']}")
    if extracted.get("document_type"):
        lines.append(f"**Document Type:** {extracted['document_type']}")
    
    if not lines:
        return "No case details could be automatically extracted from this document. You may need to enter details manually."
    
    return "\n".join(lines)


def get_extraction_confidence(result: Dict[str, Optional[str]]) -> float:
    """Calculate confidence score based on how many fields were extracted."""
    total_fields = len(result)
    found_fields = sum(1 for v in result.values() if v is not None)
    return (found_fields / total_fields) * 100
