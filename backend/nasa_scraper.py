"""
NASA Mission Data Scraper

Scrapes NASA blog posts for spacecraft mission information.
Extracts URLs from visiting vehicles page, scrapes text, and uses LLM to parse into JSON.

Usage:
    python nasa_scraper.py
"""

import os
import json
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
from playwright.async_api import async_playwright
from browserbase import Browserbase

# Load environment variables
load_dotenv()

# Configuration
MAX_URLS_TO_SCRAPE = 4  # Limit number of URLs to scrape


async def scroll_page(page, num_scrolls=3):
    """Scroll page to load dynamic content."""
    for _ in range(num_scrolls):
        await page.evaluate("window.scrollBy(0, window.innerHeight)")
        await asyncio.sleep(1)


def parse_with_llm(page_text):
    """Use OpenAI to extract structured mission data from text."""
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    prompt = f"""
Extract spacecraft mission information from this NASA blog post text.

Return JSON with:
- spacecraft_name: Name of the spacecraft
- launch_date: Launch date with time if available
- docking_date: Installation/docking date
- undocking_date: Departure date
- cargo_details: Details about cargo (weight, type)
- personnel_onboard: List of crew members (empty array if none)
- mission_description: Brief 1-2 sentence description

Text:
{page_text}

Return ONLY valid JSON.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a data extraction assistant that returns only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error parsing with LLM: {e}")
        return {}


async def get_blog_urls():
    """Scrape visiting vehicles page for blog post URLs."""
    print("\n" + "="*60)
    print("EXTRACTING BLOG POST URLs")
    print("="*60 + "\n")

    # Initialize Browserbase
    bb = Browserbase(api_key=os.getenv("BROWSERBASE_API_KEY"))
    session = bb.sessions.create(project_id=os.getenv("BROWSERBASE_PROJECT_ID"))

    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(session.connect_url)
        context = browser.contexts[0]
        page = context.pages[0]

        # Navigate to visiting vehicles page
        url = "https://www.nasa.gov/international-space-station/space-station-visiting-vehicles/"
        print(f"Navigating to {url}...")
        await page.goto(url, wait_until="domcontentloaded")
        await asyncio.sleep(2)

        # Scroll to load all links
        print("Scrolling to load all links...")
        await scroll_page(page, num_scrolls=5)

        # Extract blog post URLs
        print("Extracting blog post URLs...")
        urls = await page.evaluate("""
            () => {
                const links = Array.from(document.querySelectorAll('a[href*="/blogs/spacestation/"]'));
                const urls = links
                    .map(a => a.href)
                    .filter((url, index, self) => self.indexOf(url) === index);
                return urls;
            }
        """)

        print(f"Found {len(urls)} blog post URLs\n")
        await browser.close()

        return urls


async def scrape_mission(url):
    """Scrape text from a single blog post URL and parse with LLM."""
    print(f"\nScraping: {url}")

    # Initialize Browserbase
    bb = Browserbase(api_key=os.getenv("BROWSERBASE_API_KEY"))
    session = bb.sessions.create(project_id=os.getenv("BROWSERBASE_PROJECT_ID"))

    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(session.connect_url)
        context = browser.contexts[0]
        page = context.pages[0]

        # Navigate to blog post
        await page.goto(url, wait_until="domcontentloaded")
        await asyncio.sleep(2)

        # Scroll to load content
        await scroll_page(page, num_scrolls=3)

        # Extract text from article
        page_text = await page.evaluate("""
            () => {
                const article = document.querySelector('article') ||
                               document.querySelector('.single-blog-content') ||
                               document.querySelector('main');

                if (article) {
                    const elements = article.querySelectorAll('p, h1, h2, h3, h4, time, figcaption');
                    const texts = Array.from(elements).map(el => el.textContent.trim()).filter(t => t);
                    return texts.join('\\n\\n');
                }

                return document.body.innerText;
            }
        """)

        await browser.close()

        # Parse with LLM
        print("Parsing with OpenAI...")
        result = parse_with_llm(page_text)

        return result


async def main():
    """Main scraper function."""
    # Check environment variables
    if not os.getenv("OPENAI_API_KEY") or not os.getenv("BROWSERBASE_API_KEY"):
        print("Error: Missing OPENAI_API_KEY or BROWSERBASE_API_KEY in .env")
        return

    try:
        # Step 1: Get all blog URLs
        all_urls = await get_blog_urls()

        # Step 2: Limit URLs
        urls_to_scrape = all_urls[:MAX_URLS_TO_SCRAPE]
        print(f"\nScraping {len(urls_to_scrape)} of {len(all_urls)} URLs\n")

        # Step 3: Scrape each URL
        all_mission_data = []
        for i, url in enumerate(urls_to_scrape, 1):
            print(f"\n{'='*60}")
            print(f"URL {i}/{len(urls_to_scrape)}")
            print(f"{'='*60}")

            try:
                mission_data = await scrape_mission(url)
                if mission_data:
                    all_mission_data.append(mission_data)
                    print("✓ Mission data extracted")
            except Exception as e:
                print(f"✗ Error scraping {url}: {e}")
                continue

        # Step 4: Save to JSON
        output_dir = Path(__file__).parent / "output"
        output_dir.mkdir(exist_ok=True)
        output_file = output_dir / "nasa_mission_data.json"

        with open(output_file, 'w') as f:
            json.dump(all_mission_data, f, indent=2)

        print(f"\n{'='*60}")
        print(f"COMPLETE")
        print(f"{'='*60}")
        print(f"Missions scraped: {len(all_mission_data)}")
        print(f"Saved to: {output_file}\n")

    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
