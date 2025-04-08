from pymongo import MongoClient
import requests
from bs4 import BeautifulSoup
import time

client = MongoClient("mongodb+srv://robin:robin@artivism.ofccb.mongodb.net/?retryWrites=true&w=majority&appName=Artivism")  # change this if needed
db = client["artivism"]
collection = db["arts"]

def get_image_url(artwork_page_url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(artwork_page_url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')

        # 1. Try meta tag first
        og_image = soup.find("meta", property="og:image")
        if og_image:
            return og_image['content']

        # 2. Try <img> tag
        img_tag = soup.find("img")
        if img_tag and img_tag.get('src'):
            return img_tag['src']

        # 3. Try header tag with background-image in style attribute
        header_tag = soup.find("header", class_=re.compile("bg-cover"))
        if header_tag:
            style_attr = header_tag.get("style", "")
            match = re.search(r'background-image:url\((.*?)\)', style_attr)
            if match:
                return match.group(1)

        return None
    except Exception as e:
        print(f"Failed to fetch {artwork_page_url}: {e}")
        return None

# Query documents missing image_url
docs = collection.find({"image_url": None})

for doc in docs:
    artwork_url = doc["artwork_url"]
    print(f"Processing: {artwork_url}")
    image_url = get_image_url(artwork_url)

    if image_url:
        collection.update_one(
            {"_id": doc["_id"]},
            {"$set": {"image_url": image_url}}
        )
        print(f"Updated image URL: {image_url}")

    time.sleep(1)  # Be polite

test_url = "https://streetartcities.com/markers/88cbed63-27d6-404e-a1d7-cbf2b094d4b6"  # replace with any real artwork URL
result = get_image_url(test_url)
print("Extracted image URL:", result)
