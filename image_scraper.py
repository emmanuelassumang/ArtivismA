from pymongo import MongoClient
import requests
from bs4 import BeautifulSoup
import time
import re

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

docs = collection.find({"artwork_url": {"$exists": False}})

for doc in docs:
    image_page_url = doc["image_url"]
    print(f"Processing: {image_page_url}")
    artwork_url = get_image_url(image_page_url)
    print(artwork_url)

    if artwork_url:
        collection.update_one(
            {"_id": doc["_id"]},
            {"$set": {"artwork_url": artwork_url}}
        )
        print(f"Updated artwork URL: {artwork_url} with {image_page_url}")
    time.sleep(1)  

# Standalone test
if __name__ == "__main__":
    test_url = "https://streetartcities.com/markers/302f303d-b5cd-4061-9712-a517a3a2af5b"
    artwork_url = get_image_url(test_url)
    print("Extracted artwork URL:", artwork_url)
