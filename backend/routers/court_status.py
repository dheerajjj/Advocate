import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user

router = APIRouter(prefix="/api/court-status", tags=["Court Status"])

ECOURTS_API_URL = "https://webapi.ecourtsindia.com/api/partner"
ECOURTS_API_KEY = os.environ.get("ECOURTS_API_KEY", "")


def get_headers():
    if not ECOURTS_API_KEY:
        raise HTTPException(status_code=500, detail="eCourts API key not configured")
    return {
        "Authorization": f"Bearer {ECOURTS_API_KEY}",
        "Accept": "application/json",
    }


@router.get("/cnr/{cnr_number}")
async def lookup_by_cnr(cnr_number: str, current_user=Depends(get_current_user)):
    """Look up case details by CNR number from eCourtsIndia API."""
    cnr = cnr_number.strip().upper().replace("-", "").replace(" ", "")
    if len(cnr) < 16:
        raise HTTPException(status_code=400, detail="CNR number must be 16 characters (e.g., TSNG010012342024)")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{ECOURTS_API_URL}/case/{cnr}",
                headers=get_headers(),
            )

        if resp.status_code == 200:
            return {"success": True, "data": resp.json()}
        elif resp.status_code == 404:
            return {"success": False, "error": "Case not found for this CNR number"}
        elif resp.status_code == 401:
            return {"success": False, "error": "API authentication failed. Check API key."}
        elif resp.status_code == 402:
            return {"success": False, "error": "API credits exhausted. Please recharge."}
        else:
            return {"success": False, "error": f"eCourts API returned status {resp.status_code}"}

    except httpx.TimeoutException:
        return {"success": False, "error": "eCourts API request timed out. Please try again."}
    except Exception as e:
        return {"success": False, "error": f"Connection error: {str(e)}"}
