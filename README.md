# 🚗 AutoDamage AI Pakistan — Vehicle Damage Detection & Repair Cost Estimator

An end-to-end Python Full-Stack Final Year Project (FYP) engineered specifically for the **Pakistani Automotive Market**.

---

## 📌 Project Highlights & Capabilities

1. **AI-Based Car Damage Detection & Localization**:
   - Detects external and visible internal damaged components: **Front/Rear Bumpers, Bonnet (Hood), Fenders, Headlights, Taillights, Doors, Side Mirrors, Windshields, Front Grille, and Radiator Core**.
   - Classifies damage into **Minor**, **Moderate**, or **Severe** with damage ratio scores and confidence ratings.
   - Dual-mode inference: Works seamlessly out of the box with the built-in intelligent vision engine, and supports custom trained **YOLOv8** (`.pt` or `.onnx`) weights by dropping them into `models/`.

2. **Pakistani Automotive Market Intelligence**:
   - Calibrated for vehicles most prevalent on Pakistani roads:
     - **Toyota**: Corolla (GLi/Altis/Grande), Yaris, Vitz, Hilux (Revo/Vigo)
     - **Suzuki**: Alto (660cc), Mehran, Cultus, Wagon R, Swift
     - **Honda**: Civic (Reborn/Rebirth/Turbo/Oriel), City (i-DSI/i-VTEC)
   - Real-world 3-tier spare-parts pricing in Pakistani Rupees (PKR):
     - **OEM Genuine** (Indus Motor, Pak Suzuki, Honda Atlas)
     - **Kabli / Scrap Genuine** (Shershah Karachi, Sultan Ka Khoo Rawalpindi, Bilal Gunj Lahore)
     - **Aftermarket / Replacement** (Chinese & Taiwanese Depo/TYC)

3. **Web Scraping Engine (PakWheels & OLX Pakistan)**:
   - Queries live spare-parts listings on **PakWheels** and **OLX Pakistan**.
   - Displays real-time prices, seller locations, condition, and clickable links.
   - Built-in resilient caching ensures your university presentation / viva never stalls due to internet connectivity or anti-bot CAPTCHAs.

4. **Labor & Repair Bill Estimator**:
   - Calculates itemized denting, panel beating, oven painting, and fitting labor costs based on Pakistani workshop standards.
   - Offers 3 repair packages: **Budget**, **Recommended (Mid-Range)**, and **Authorized 3S Dealership**.

5. **Location-Based Workshop & Mechanic Finder**:
   - Interactive map and directory of certified 3S Dealerships (Toyota, Suzuki, Honda), collision centers, and trusted local body shops across **Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, and Peshawar**.
   - Direct Google Maps navigation links, phone numbers, and ratings.

6. **Formal Inspection Quotation & Report**:
   - Exportable, professional HTML & PDF damage survey quotation ready for insurance claims, repair workshops, or car owners.

---

## 📂 Project Structure

```
car_damage_ai/
│
├── ai_engine/                    # Computer Vision & Detection Pipeline
│   ├── __init__.py
│   ├── detector.py               # YOLOv8 loader + smart vision fallback
│   ├── severity.py               # Minor / Moderate / Severe classification
│   └── visualizer.py             # Bounding box & severity tag renderer
│
├── scraper/                      # Pakistani Marketplace Scraping & Data
│   ├── __init__.py
│   ├── market_data.py            # Verified PKR price catalog for Toyota/Suzuki/Honda
│   ├── pakwheels_scraper.py      # PakWheels Auto Parts crawler
│   └── olx_scraper.py            # OLX Pakistan Spare Parts crawler
│
├── estimator/                    # Repair Cost & Invoice Engine
│   ├── __init__.py
│   └── cost_calculator.py        # Itemized labor (denting/painting) & parts calculator
│
├── workshops/                    # Mechanic & Workshop Recommender
│   ├── __init__.py
│   └── workshop_locator.py       # Geo-database of 3S dealerships & workshops
│
├── report_generator/             # Exportable Quotation Generator
│   ├── __init__.py
│   └── report.py                 # Clean HTML & PDF report generator
│
├── models/                       # Drop your custom trained YOLOv8 weights here (.pt / .onnx)
│   └── README.md
│
├── sample_images/                # Sample crashed car images for instant 1-click testing
│   ├── toyota_corolla_front_crash.jpg
│   ├── suzuki_mehran_fender_dent.jpg
│   └── honda_civic_door_damage.jpg
│
├── tests/
│   └── test_pipeline.py          # End-to-end automated unit test suite
│
├── app.py                        # Streamlit Full-Stack Dashboard
├── requirements.txt              # Project dependencies
├── run.bat                       # Windows 1-click launcher
└── README.md                     # Project manual & FYP viva documentation
```

---

## 🚀 Quick Start Guide

### 1. Launch with One Click (Windows)
Double-click `run.bat` in the project folder.

### 2. Manual Terminal Run
Open PowerShell or Command Prompt in `car_damage_ai`:
```bash
python -m streamlit run app.py
```
The application will launch automatically in your browser at `http://localhost:8501`.

---

## 🎓 University Viva / Presentation Walkthrough

When presenting to your FYP supervisor or internal/external examiner:

1. **Demonstrate Image Upload & Detection**:
   - In the sidebar, select **Toyota Corolla (GLi/Altis/Grande)**.
   - Click the quick test sample: `Toyota Corolla Front Collision` (or upload your own photo).
   - In **Tab 1 (Damage Assessment)**, show the side-by-side original vs detected image:
     - Point out the bounding boxes and severity color tags (Yellow: Minor, Orange: Moderate, Red: Severe).
     - Show the detected parts: Front Bumper, Bonnet, Headlight, Radiator Core.

2. **Showcase Cost Estimation in PKR**:
   - Switch to **Tab 2 (Repair Cost Invoice)**.
   - Highlight how the system separates **Parts Replacement Cost** from **Denting Labor** and **Oven-Bake Paint**.
   - Explain the 3 Pakistani market repair packages (Budget vs Mid-Range Kabli vs 3S Dealership).

3. **Demonstrate Web Scraping**:
   - Switch to **Tab 3 (PakWheels & OLX Market)**.
   - Show how the system queries actual market prices for the detected parts from Pakistani platforms.

4. **Showcase Workshop Locator & Navigation**:
   - Switch to **Tab 4 (Nearby Workshops & Map)**.
   - Select your city (e.g. Lahore, Karachi, Islamabad).
   - Show the interactive map and click **"Open in Google Maps"** to show real-time navigation.

5. **Download the Official Report**:
   - Switch to **Tab 5 (Download Report)**.
   - Click **Download Printable HTML Quotation** to demonstrate the formal survey receipt.

---

## ⚙️ Adding Your Custom Trained Weights

To use your own fine-tuned YOLO model:
1. Place your weights file (e.g. `car_damage_yolov8.pt` or `best.onnx`) inside the `models/` directory.
2. The `CarDamageDetector` will automatically detect and load your weights on startup!
