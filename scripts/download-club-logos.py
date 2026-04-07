#!/usr/bin/env python3
"""Download logos for Associazioni Specializzate ENCI clubs."""

import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE_DIR = Path(__file__).resolve().parent.parent
JSON_PATH = BASE_DIR / "src" / "data" / "associazioni-specializzate.json"
LOGOS_DIR = BASE_DIR / "public" / "images" / "club-logos"
ENCI_BASE = "https://www.enci.it"

TIMEOUT = 15
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8",
}

LOGOS_DIR.mkdir(parents=True, exist_ok=True)


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[àáâãäå]", "a", text)
    text = re.sub(r"[èéêë]", "e", text)
    text = re.sub(r"[ìíîï]", "i", text)
    text = re.sub(r"[òóôõö]", "o", text)
    text = re.sub(r"[ùúûü]", "u", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = text.strip("-")
    return text


def get_extension(url: str, content_type: str = "") -> str:
    path = urlparse(url).path.lower()
    for ext in [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico"]:
        if path.endswith(ext):
            return ".jpg" if ext == ".jpeg" else ext

    if "png" in content_type:
        return ".png"
    if "svg" in content_type:
        return ".svg"
    if "gif" in content_type:
        return ".gif"
    if "webp" in content_type:
        return ".webp"
    if "jpeg" in content_type or "jpg" in content_type:
        return ".jpg"
    if "ico" in content_type:
        return ".ico"
    return ".png"


def download_image(url: str, slug: str) -> str | None:
    """Download image from URL, return local path or None."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT, stream=True, allow_redirects=True)
        resp.raise_for_status()

        ct = resp.headers.get("content-type", "")
        if "text/html" in ct:
            return None

        ext = get_extension(url, ct)
        filename = f"{slug}{ext}"
        filepath = LOGOS_DIR / filename

        with open(filepath, "wb") as f:
            for chunk in resp.iter_content(8192):
                f.write(chunk)

        size = filepath.stat().st_size
        if size < 100:
            filepath.unlink()
            return None

        return f"/images/club-logos/{filename}"
    except Exception:
        return None


def find_logo_in_html(html: str, base_url: str) -> str | None:
    """Parse HTML and find the most likely logo image URL."""
    soup = BeautifulSoup(html, "html.parser")
    candidates = []

    # Strategy 1: <img> inside header/nav with logo-related class/id/src/alt
    for container in soup.select("header, nav, .header, .navbar, #header, #nav, .top-bar, .site-header"):
        for img in container.find_all("img"):
            src = img.get("src", "")
            alt = img.get("alt", "")
            cls = " ".join(img.get("class", []))
            parent_cls = " ".join(img.parent.get("class", [])) if img.parent else ""
            gparent_cls = ""
            if img.parent and img.parent.parent:
                gparent_cls = " ".join(img.parent.parent.get("class", []))

            text = f"{src} {alt} {cls} {parent_cls} {gparent_cls}".lower()
            if any(kw in text for kw in ["logo", "brand", "site-logo"]):
                candidates.append((1, src))
            elif src:
                candidates.append((3, src))

    # Strategy 2: any <img> with logo in class, id, alt, or src
    for img in soup.find_all("img"):
        src = img.get("src", "")
        if not src:
            continue
        alt = img.get("alt", "")
        cls = " ".join(img.get("class", []))
        img_id = img.get("id", "")
        parent_cls = " ".join(img.parent.get("class", [])) if img.parent else ""
        gparent_cls = ""
        if img.parent and img.parent.parent:
            gparent_cls = " ".join(img.parent.parent.get("class", []))

        text = f"{src} {alt} {cls} {img_id} {parent_cls} {gparent_cls}".lower()
        if any(kw in text for kw in ["logo", "brand", "site-logo"]):
            candidates.append((2, src))

    # Strategy 3: <a> with class containing logo that has an <img>
    for a_tag in soup.find_all("a"):
        cls = " ".join(a_tag.get("class", [])).lower()
        a_id = (a_tag.get("id") or "").lower()
        if "logo" in cls or "logo" in a_id or "brand" in cls:
            img = a_tag.find("img")
            if img and img.get("src"):
                candidates.append((2, img["src"]))

    # Strategy 4: og:image meta tag
    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        candidates.append((5, og["content"]))

    # Strategy 5: apple-touch-icon or large favicon
    for link in soup.find_all("link"):
        rel = " ".join(link.get("rel", [])).lower()
        href = link.get("href", "")
        if not href:
            continue
        if "apple-touch-icon" in rel:
            candidates.append((4, href))
        elif "icon" in rel and "shortcut" not in rel:
            sizes = link.get("sizes", "")
            if sizes and any(int(s) >= 64 for s in re.findall(r"\d+", sizes)):
                candidates.append((6, href))

    if not candidates:
        return None

    # Sort by priority (lower = better) and return the best
    candidates.sort(key=lambda x: x[0])
    best_src = candidates[0][1]

    # Make absolute URL
    if best_src.startswith("//"):
        best_src = "https:" + best_src
    elif best_src.startswith("/"):
        best_src = urljoin(base_url, best_src)
    elif not best_src.startswith("http"):
        best_src = urljoin(base_url, best_src)

    # Filter out data URIs, tracking pixels, etc.
    if best_src.startswith("data:"):
        return None
    if "1x1" in best_src or "pixel" in best_src or "spacer" in best_src:
        return None

    return best_src


def main():
    with open(JSON_PATH) as f:
        clubs = json.load(f)

    downloaded = 0
    failed = 0
    skipped = 0
    already_local = 0

    for club in clubs:
        name = club["name"]
        slug = slugify(name)
        logo = club.get("logo")
        website = club.get("website")

        # Case 1: Already has a local path (already processed)
        if logo and logo.startswith("/images/club-logos/"):
            already_local += 1
            continue

        # Case 2: Has an ENCI logo path — download from enci.it
        if logo and logo.startswith("/media/"):
            enci_url = ENCI_BASE + logo
            local_path = download_image(enci_url, slug)
            if local_path:
                club["logo"] = local_path
                downloaded += 1
                print(f"  \u2713 {name} \u2014 downloaded ENCI logo")
            else:
                failed += 1
                print(f"  \u2717 {name} \u2014 failed to download ENCI logo from {enci_url}")
            continue

        # Case 3: No website — skip
        if not website:
            skipped += 1
            print(f"  - {name} \u2014 skipped (no website)")
            continue

        # Case 4: No logo, has website — scrape it
        try:
            resp = requests.get(website, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
            resp.raise_for_status()
            logo_url = find_logo_in_html(resp.text, resp.url)

            if not logo_url:
                failed += 1
                print(f"  \u2717 {name} \u2014 no logo found on {website}")
                continue

            local_path = download_image(logo_url, slug)
            if local_path:
                club["logo"] = local_path
                downloaded += 1
                domain = urlparse(website).netloc
                print(f"  \u2713 {name} \u2014 downloaded logo from {domain}")
            else:
                failed += 1
                print(f"  \u2717 {name} \u2014 found logo URL but download failed: {logo_url}")

        except requests.exceptions.Timeout:
            failed += 1
            print(f"  \u2717 {name} \u2014 timeout connecting to {website}")
        except requests.exceptions.ConnectionError:
            failed += 1
            print(f"  \u2717 {name} \u2014 connection error for {website}")
        except requests.exceptions.SSLError:
            failed += 1
            print(f"  \u2717 {name} \u2014 SSL error for {website}")
        except Exception as e:
            failed += 1
            print(f"  \u2717 {name} \u2014 error: {type(e).__name__}: {e}")

    # Save updated JSON
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(clubs, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print()
    print("=" * 50)
    print(f"  Downloaded: {downloaded}")
    print(f"  Failed:     {failed}")
    print(f"  Skipped:    {skipped}")
    if already_local:
        print(f"  Already local: {already_local}")
    print(f"  Total:      {len(clubs)}")
    print("=" * 50)


if __name__ == "__main__":
    main()
