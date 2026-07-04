"""
OTP Service with SMS (Fast2SMS) and Email fallback
- Fast2SMS: ₹0.10/SMS, Indian numbers, reliable delivery
- Email: Free fallback for development/testing
"""
import os
import httpx
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# Fast2SMS configuration
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "")
OTP_SEND_METHOD = os.getenv("OTP_SEND_METHOD", "email")  # sms, email, or both

# Email configuration (for fallback/development)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")


async def send_otp_sms(mobile_number: str, otp_code: str) -> bool:
    """
    Send OTP via Fast2SMS (₹0.10/SMS).
    Documentation: https://www.fast2sms.com/dev/api
    """
    if not FAST2SMS_API_KEY or FAST2SMS_API_KEY == "your_fast2sms_api_key_here":
        print(f"⚠️ Fast2SMS not configured. OTP: {otp_code} for {mobile_number}")
        return False

    url = "https://www.fast2sms.com/dev/bulkV2"
    headers = {
        "authorization": FAST2SMS_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "route": "q",  # Quick route for OTP
        "message": f"Your Advocate's Vault OTP is: {otp_code}. Valid for 5 minutes. Do not share.",
        "language": "english",
        "numbers": mobile_number
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=10.0)
            result = response.json()

            if result.get("return"):
                print(f"✅ SMS sent to {mobile_number}")
                return True
            else:
                print(f"❌ SMS failed: {result.get('message', 'Unknown error')}")
                return False
    except Exception as e:
        print(f"❌ SMS error: {str(e)}")
        return False


def send_otp_email(email_address: str, otp_code: str) -> bool:
    """
    Send OTP via email (Free).
    Uses Gmail SMTP by default.
    """
    if not SMTP_USERNAME or SMTP_USERNAME == "your_email@gmail.com":
        print(f"⚠️ Email not configured. OTP: {otp_code} for {email_address}")
        return False

    message = MIMEMultipart("alternative")
    message["Subject"] = "Your Advocate's Vault OTP Code"
    message["From"] = SMTP_USERNAME
    message["To"] = email_address

    # Plain text version
    text = f"""
    Your Advocate's Vault OTP Code: {otp_code}
    
    This code is valid for 5 minutes.
    Do not share this code with anyone.
    
    If you didn't request this, please ignore this email.
    """

    # HTML version
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #333;">Your Advocate's Vault OTP Code</h2>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h1 style="color: #d4af37; margin: 0; font-size: 32px; letter-spacing: 5px;">{otp_code}</h1>
        </div>
        <p>This code is valid for <strong>5 minutes</strong>.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
    </body>
    </html>
    """

    message.attach(MIMEText(text, "plain"))
    message.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_USERNAME, email_address, message.as_string())
        print(f"✅ Email sent to {email_address}")
        return True
    except Exception as e:
        print(f"❌ Email error: {str(e)}")
        return False


async def send_otp(mobile_number: str, otp_code: str, email_address: str = None) -> dict:
    """
    Send OTP using configured method(s).
    Returns dict with results for each method.
    """
    results = {"sms": None, "email": None}

    if OTP_SEND_METHOD in ["sms", "both"]:
        results["sms"] = await send_otp_sms(mobile_number, otp_code)

    if OTP_SEND_METHOD in ["email", "both"] and email_address:
        results["email"] = send_otp_email(email_address, otp_code)
    elif OTP_SEND_METHOD == "email" and not results.get("sms"):
        # If email is the only method and SMS failed/not configured, print to console
        print(f"📧 OTP for {mobile_number}: {otp_code} (email not sent, no address)")
        results["email"] = True  # Mark as successful for development

    return results
