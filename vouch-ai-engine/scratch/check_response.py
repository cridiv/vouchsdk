import requests
import os

url = os.environ.get("AI_ENGINE_URL", "https://vouch-2uoc.onrender.com/identity/verify")

document_path = "dummy.jpg"
selfie_path = "dummy.jpg"

files = [
    ('document_image', ('document.jpg', open(document_path, 'rb'), 'image/jpeg')),
    ('selfie_images', ('selfie.jpg', open(selfie_path, 'rb'), 'image/jpeg'))
]
data = {
    'platform_user_id': 'test_user'
}

try:
    response = requests.post(url, files=files, data=data)
    print(f"Status: {response.status_code}")
    print(f"Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
