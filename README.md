Markdown
# Student Companion — Smart Campus Platform

A mobile-first web application (`390 × 844 px` viewport) developed for the **Human-Computer Interaction (HCI)** semester project. **Student Companion** translates 15 high-fidelity Figma screens and interactive modal overlays into a working, human-coded web application backed by **Firebase Authentication** and **Google Cloud Firestore**.

---

## Live Links & Demo

- **GitHub Repository:** https://github.com/kashafsarfrazcs-dev/student-companion-app
- **Live Hosted Application:** https://student-companion-app-4izx.netlify.app/?_nf_embed=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzaXRlX2lkIjoiNTkxOTA2Y2YtZDRkZC00YmE3LTg5ZDgtNDVjYmU2MzQyODE5IiwicHVycG9zZSI6ImVtYmVkIiwicGFyZW50IjoiaHR0cHM6Ly9hcHAubmV0bGlmeS5jb20iLCJpYXQiOjE3OTUyMzQ5NjYsImV4cCI6MTc5NTIzNTI2Nn0.XK6XFxvACuLDTxVEtci-5CREsygAgBDKhO0RMj4mtPQ
- **3–5 Minute Demo Video:** https://drive.google.com/file/d/1TdwiVBQeAaZuGDc5QoTxTkt-5wQd__FG/view?usp=sharing
- **Demo Student Credentials (Pre-filled on Login):**
  - **Email:** `student@campus.edu`
  - **Password:** `campus1234`

---

## Key Features Implemented

- **Onboarding & Authentication (`00A`–`00C`, `01`):** Interactive multi-step onboarding flow and real student sign-in/sign-out powered by **Firebase Authentication** with field validation and password visibility toggle.
- 
- **Home Dashboard (`02`):** Personalized student greeting, quick-service shortcuts, live Active Request summary card, and upcoming campus event preview.
- 
- **Report a Campus Issue (`03`):** Validated maintenance/IT issue submission form with category selection, sample photo attachment overlay, and live persistence to the `service_requests` collection in **Cloud Firestore**.
- 
- **Request Tracking & Timeline (`04`, `07`):** Real-time search by ticket ID or title, status filter chips (`All`, `Pending`, `In Progress`, `Resolved`), and a four-stage progress timeline (`Submitted` → `Assigned` → `In Progress` → `Resolved`).
- **Lost & Found Directory & Posting (`08`, `09`):** Searchable campus Lost & Found board with category/type filters, item detail modals, and live post creation stored in `lost_found_items`.
- 
- **Campus Services & Events (`05`, `10`, `11`):** Searchable campus services directory (Library, Transport, Dining) and filterable campus events with full schedule details.
- 
- **Notifications, Feedback & Support (`06`, `12`–`14`):** Interactive notification center with *Mark All as Read*, 1–5 service rating form (`feedback_entries`), FAQ accordion, support ticket form (`support_tickets`), and a simulated offline banner state.

---

## Technology Stack

- **Front End:** HTML5, CSS3 (Custom Properties / Design Tokens), Vanilla JavaScript (ES6 Modules)
- **Back End:** Firebase Authentication & Firebase Cloud Firestore Modular SDK (`v10.13.2`)
- **Database:** Google Cloud Firestore (`service_requests`, `lost_found_items`, `feedback_entries`, `support_tickets`)
- **Typography:** Google Fonts (`Inter` — 400, 500, 600, 700)

---

## Project Structure
```text
student-companion-app/
├── index.html                  # All 15 screens, navigation bar, and modal containers
├── style.css                   # Mobile-first design system (390x844px frame, tokens, states)
├── app.js                      # Navigation, validation, UI rendering, and Firebase SDK logic
├── firebase-config.example.js  # Template for Firebase project configuration
├── .gitignore                  # Excludes local firebase-config.js and environment files
└── README.md                   # Project documentation, setup guide, and team roles
```
## How to Install & Run Locally
Clone or download the repository:

Bash
git clone [https://github.com/kashafsarfrazcs-dev/student-companion-app.git](https://github.com/kashafsarfrazcs-dev/student-companion-app.git)
cd student-companion-app

Configure Firebase credentials locally:

Duplicate firebase-config.example.js and rename the copy to firebase-config.js (this file is listed in .gitignore so credentials stay out of version control).

Paste your Firebase web app configuration keys into firebase-config.js.

Launch using a local HTTP server:

Open the folder in Visual Studio Code and click Go Live (using the Live Server extension), or run:

Bash
npx serve
Open http://127.0.0.1:5500/index.html in your browser.(Note: Serving over HTTP/HTTPS is required because app.js uses native ES6 module imports.)

Sign in and test:

Click Get Started → Sign In using the pre-filled demo account (student@campus.edu / campus1234).


### Team Contributions

Member	Role & Responsibilities

Kashaf	Project lead; user research & personas; Figma design system & core screens (00A–04, 07); Firebase Authentication & Cloud Firestore database integration.

Mubashra	Information architecture & user flows; Figma screens (05, 06, 08–11b); HTML5/CSS3 responsive layout implementation; Lost & Found and Campus Events modules.

Aimen	Form validation rules & state matrix; modal overlays (12–14 & confirmation dialogs); usability evaluation; Figma-to-app comparison & final report compilation.

