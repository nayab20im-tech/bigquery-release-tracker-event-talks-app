# BigQuery Release Insights 🚀

A sleek, lightweight web application built with **Python Flask** and plain **HTML5, CSS3, and JavaScript** that fetches, parses, and displays the latest Google Cloud BigQuery release notes. It allows developers to browse updates by category, search details in real-time, and instantly compose and share updates on X (formerly Twitter).

---

## 🎨 Features

- **⚡ Real-Time RSS Parsing:** Pulls live release updates directly from the official Google Cloud BigQuery Atom feed.
- **🏷️ Automated Categorization:** Intelligently splits and tags updates by type (e.g., `Feature`, `Change`, `Deprecation`, or `General`).
- **🔍 Advanced Search & Filters:** Instantly search through updates or filter by category using interactive metric cards.
- **🐦 Built-in Tweet Composer Modal:** Formats updates into tweets with a simulated post preview layout. Includes a character counter (out of 280) and circular progress indicator.
- **📱 Responsive & Premium Dark Theme:** Glassmorphism card elements, ambient backdrop glows, smooth transitions, and fully responsive layouts.

---

## 🏗️ Project Structure

```text
bigquery-release-viewer/
│
├── app.py                 # Flask server & XML parsing engine
├── templates/
│   └── index.html         # Frontend HTML structure
├── static/
│   ├── style.css          # Dark-mode styles, glows, & animations
│   └── app.js             # API calls, state management, & UI logic
├── .gitignore             # Files and folders to ignore in Git
└── README.md              # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have **Python 3** installed on your system.

### Installation

1. **Download/Clone the project files:**
   Save all the files into a directory (e.g., `bigquery-release-viewer`).

2. **Install Required Packages:**
   This project uses Python's standard libraries for XML parsing, but requires `requests` and `Flask`:
   ```bash
   pip install flask requests
   ```

3. **Run the Application:**
   Start the Flask development server:
   ```bash
   python app.py
   ```

4. **Open in Browser:**
   Navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your web browser.

---

## 💻 Tech Stack

- **Backend:** Python 3, Flask, XML ElementTree (for parsing Atom/RSS)
- **Frontend:** Vanilla HTML5, Vanilla CSS3 (Custom Variables, Flexbox/Grid, Keyframe Animations), Vanilla JavaScript (ES6+, Fetch API)
- **Icons:** FontAwesome v6
- **Typography:** Google Fonts (Outfit & Inter)
