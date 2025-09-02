import os
import requests
from PIL import Image
from io import BytesIO

ASSETS_DIR = "assets"
if not os.path.exists(ASSETS_DIR):
    os.makedirs(ASSETS_DIR)

# Asset URLs
ASSETS = {
    "app_icon_sidebar.png": "https://img.icons8.com/nolan/64/stocks.png",
    "app_icon_main.png": "https://img.icons8.com/nolan/128/stocks.png",
    "newsapi_logo.png": "https://newsapi.org/images/n-logo-border.png",
    "google_news_logo.png": "https://upload.wikimedia.org/wikipedia/commons/0/0b/Google_News_icon.png",
    "yahoo_finance_logo.png": "https://s.yimg.com/cv/apiv2/default/20201027/logo.png",
    "default_company_icon.png": "https://img.icons8.com/nolan/64/company.png",
    "loader_orb.json": "https://assets5.lottiefiles.com/packages/lf20_b88nh30c.json"
}

def download_and_save_asset(url, filename):
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        filepath = os.path.join(ASSETS_DIR, filename)
        
        if filename.endswith('.json'):
            # Save JSON file directly
            with open(filepath, 'wb') as f:
                f.write(response.content)
        else:
            # Process and save image
            img = Image.open(BytesIO(response.content))
            img.save(filepath)
            
        print(f"Successfully downloaded: {filename}")
        
    except Exception as e:
        print(f"Error downloading {filename}: {str(e)}")

def main():
    print("Starting asset downloads...")
    for filename, url in ASSETS.items():
        download_and_save_asset(url, filename)
    print("Asset downloads completed!")

if __name__ == "__main__":
    main()
