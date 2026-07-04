import os
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

B2_ACCOUNT_ID = os.getenv("B2_ACCOUNT_ID")
B2_APPLICATION_KEY = os.getenv("B2_APPLICATION_KEY")
B2_BUCKET_NAME = os.getenv("B2_BUCKET_NAME")
B2_ENDPOINT_URL = os.getenv("B2_ENDPOINT_URL", "https://s3.us-west-005.backblazeb2.com")


def get_b2_client():
    """Create and return a B2 S3-compatible client."""
    return boto3.client(
        "s3",
        endpoint_url=B2_ENDPOINT_URL,
        aws_access_key_id=B2_ACCOUNT_ID,
        aws_secret_access_key=B2_APPLICATION_KEY,
    )


async def upload_file_to_b2(file_path: str, object_name: str, content_type: str = "application/octet-stream") -> str:
    """Upload a file to B2 bucket and return the file key."""
    client = get_b2_client()
    try:
        client.upload_file(
            file_path,
            B2_BUCKET_NAME,
            object_name,
            ExtraArgs={"ContentType": content_type},
        )
        return object_name
    except ClientError as e:
        raise Exception(f"Failed to upload file to B2: {str(e)}")
    finally:
        # Clean up local file after upload
        if os.path.exists(file_path):
            os.remove(file_path)


async def download_file_from_b2(object_name: str, local_file_path: str = None) -> str:
    """Download a file from B2. Returns path to downloaded file."""
    client = get_b2_client()
    if not local_file_path:
        local_file_path = f"/tmp/{os.path.basename(object_name)}"
    try:
        client.download_file(B2_BUCKET_NAME, object_name, local_file_path)
        return local_file_path
    except ClientError as e:
        raise Exception(f"Failed to download file from B2: {str(e)}")


def download_file_from_b2_sync(object_name: str, local_file_path: str = None) -> str:
    """Synchronous download from B2. Returns path to downloaded file."""
    import platform
    client = get_b2_client()
    if not local_file_path:
        # Use appropriate temp directory for the OS
        temp_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "temp_downloads")
        os.makedirs(temp_dir, exist_ok=True)
        local_file_path = os.path.join(temp_dir, os.path.basename(object_name))
    try:
        client.download_file(B2_BUCKET_NAME, object_name, local_file_path)
        return local_file_path
    except ClientError as e:
        raise Exception(f"Failed to download file from B2: {str(e)}")


async def delete_file_from_b2(object_name: str):
    """Delete a file from B2 bucket."""
    client = get_b2_client()
    try:
        client.delete_object(Bucket=B2_BUCKET_NAME, Key=object_name)
    except ClientError as e:
        raise Exception(f"Failed to delete file from B2: {str(e)}")


def generate_presigned_url(object_name: str, expiration: int = 3600) -> str:
    """Generate a download URL for B2 files.
    
    B2 S3-compatible presigned URLs require the bucket to allow S3 operations.
    For private buckets, we use a backend proxy approach instead.
    """
    # Return a backend proxy URL instead of presigned URL to avoid B2 auth issues
    # The backend will handle authentication and stream the file
    return f"/api/documents/proxy-download/{object_name}"
