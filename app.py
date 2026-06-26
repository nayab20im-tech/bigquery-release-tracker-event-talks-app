import re
import html
import requests
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def clean_html_tags(raw_html):
    """Converts HTML to clean, plain text for tweet summaries."""
    # Unescape HTML entities
    unescaped = html.unescape(raw_html)
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', unescaped)
    # Replace multiple spaces/newlines with a single space
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_release_notes():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching feed: {e}")
        return {"error": f"Failed to fetch release notes: {str(e)}"}

    try:
        # Parse Atom XML
        root = ET.fromstring(response.content)
        # Atom namespace
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        
        updates = []
        entries = root.findall("atom:entry", ns)
        
        for entry in entries:
            # Extract basic entry metadata
            date_title = entry.find("atom:title", ns).text
            entry_id = entry.find("atom:id", ns).text
            updated_time = entry.find("atom:updated", ns).text
            
            # Find the link
            link_elem = entry.find("atom:link[@rel='alternate']", ns)
            link_href = link_elem.attrib.get("href") if link_elem is not None else ""
            if not link_href:
                link_elem = entry.find("atom:link", ns)
                link_href = link_elem.attrib.get("href") if link_elem is not None else ""

            # Extract and parse content
            content_elem = entry.find("atom:content", ns)
            if content_elem is None or content_elem.text is None:
                continue
                
            content_html = content_elem.text
            
            # Split the content by <h3> headers
            # E.g. <h3>Feature</h3><p>...</p><h3>Change</h3><p>...</p>
            parts = re.split(r'(<h3>.*?</h3>)', content_html)
            
            # If the content doesn't start with <h3>, parts[0] has general content
            if parts[0].strip():
                clean_text = clean_html_tags(parts[0])
                updates.append({
                    "id": f"{entry_id}_general",
                    "date": date_title,
                    "timestamp": updated_time,
                    "type": "General",
                    "content": parts[0].strip(),
                    "text_content": clean_text,
                    "link": link_href
                })
            
            # Iterate through the matched header/body pairs
            for i in range(1, len(parts) - 1, 2):
                header_html = parts[i]
                body_html = parts[i+1].strip()
                
                # Extract type name from header (e.g. <h3>Feature</h3> -> Feature)
                type_name = re.sub(r'<[^>]+>', '', header_html).strip()
                
                # Check for empty body
                if not body_html:
                    continue
                
                clean_text = clean_html_tags(body_html)
                
                # Generate a unique ID for this specific update
                update_id = f"{entry_id}_{type_name}_{i}"
                
                updates.append({
                    "id": update_id,
                    "date": date_title,
                    "timestamp": updated_time,
                    "type": type_name,
                    "content": body_html,
                    "text_content": clean_text,
                    "link": link_href
                })
                
        return {"updates": updates}
    except Exception as e:
        print(f"Error parsing feed: {e}")
        return {"error": f"Failed to parse release notes: {str(e)}"}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/releases")
def get_releases():
    data = parse_release_notes()
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
