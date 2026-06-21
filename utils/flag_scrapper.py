import os
import requests
import time
import random

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

OUTPUT_DIR = "worldcup_2026_flags"
URL = "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup"

os.makedirs(OUTPUT_DIR, exist_ok=True)

chrome_options = Options()
chrome_options.add_argument("--start-maximized")

driver = webdriver.Chrome(options=chrome_options)

try:
    print("Opening page...")
    driver.get(URL)

    time.sleep(3)

    # Locate the "List of team base camps" table
    table = driver.find_element(
        By.XPATH, "//caption[contains(., 'List of team base camps')]/parent::table"
    )

    rows = table.find_elements(By.CSS_SELECTOR, "tbody tr")

    print(f"Found {len(rows)} rows")

    downloaded = 0

    for row in rows:

        try:
            first_td = row.find_element(By.TAG_NAME, "td")

            team_name = first_td.find_element(By.CSS_SELECTOR, "a[title]").text.strip()

            flag_img = first_td.find_element(By.TAG_NAME, "img")

            flag_url = flag_img.get_attribute("src")

            if not flag_url:
                continue

            print(f"Downloading {team_name}")

            safe_name = "".join(
                c for c in team_name if c.isalnum() or c in (" ", "-", "_")
            ).rstrip()

            filepath = os.path.join(OUTPUT_DIR, f"{safe_name}.png")

            success = False

            for attempt in range(5):
                try:
                    response = requests.get(
                        flag_url,
                        headers={"User-Agent": "Mozilla/5.0"},
                        timeout=20,
                    )

                    response.raise_for_status()

                    with open(filepath, "wb") as f:
                        f.write(response.content)

                    downloaded += 1
                    success = True

                    print(f"Downloaded: {team_name}")
                    break

                except Exception as e:
                    print(f"Failed {team_name} " f"(attempt {attempt + 1}/5): {e}")

                    if attempt < 4:
                        print(f"Retrying {team_name} in 2 seconds...")
                        time.sleep(2)

            if not success:
                print(f"Giving up on {team_name}")

        except Exception as e:
            print("Skipped row:", e)

    print(f"\nFinished.")
    print(f"Downloaded {downloaded} flags.")
    print(f"Saved to: {os.path.abspath(OUTPUT_DIR)}")

finally:
    driver.quit()
