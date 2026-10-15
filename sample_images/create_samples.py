"""
Helper script to generate high-resolution demo car images with simulated damage
for immediate 1-click testing in the Streamlit app.
"""

import os
try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    Image, ImageDraw, ImageFilter = None, None, None

def create_demo_car_samples(output_dir: str = "sample_images"):
    os.makedirs(output_dir, exist_ok=True)

    # 1. Toyota Corolla Front Collision
    img1 = Image.new("RGB", (800, 500), color=(220, 225, 230))
    d1 = ImageDraw.Draw(img1)
    # Car body (Metallic Grey)
    d1.polygon([(100, 360), (140, 240), (280, 160), (560, 160), (700, 240), (730, 360)], fill=(120, 128, 138), outline=(60, 65, 70), width=4)
    # Windshield
    d1.polygon([(290, 170), (550, 170), (660, 235), (200, 235)], fill=(180, 210, 230), outline=(50, 60, 70), width=3)
    # Bonnet / Hood
    d1.polygon([(200, 240), (660, 240), (700, 330), (140, 330)], fill=(105, 115, 125), outline=(50, 55, 60), width=3)
    # Front Bumper
    d1.rectangle([110, 330, 720, 420], fill=(90, 98, 108), outline=(40, 45, 50), width=4)
    # Headlights
    d1.polygon([(140, 320), (240, 320), (220, 280), (160, 280)], fill=(245, 245, 255), outline=(100, 100, 120), width=2)
    d1.polygon([(590, 320), (690, 320), (670, 280), (610, 280)], fill=(245, 245, 255), outline=(100, 100, 120), width=2)
    # Front Grille & Radiator
    d1.rectangle([300, 330, 530, 380], fill=(30, 30, 30), outline=(150, 150, 150), width=2)
    # Simulated Impact / Cracks on Bumper & Radiator (Severe damage)
    for i in range(15):
        d1.line([(280 + i*15, 340 + (i%5)*8), (320 + i*12, 380 - (i%3)*6)], fill=(20, 20, 20), width=4)
        d1.line([(180 + i*8, 320 + (i%4)*10), (240 + i*6, 390 - (i%3)*8)], fill=(40, 20, 20), width=3)
    # Dent shading
    d1.ellipse([250, 330, 500, 410], outline=(20, 20, 20), width=3)
    img1.save(os.path.join(output_dir, "toyota_corolla_front_crash.jpg"))

    # 2. Suzuki Mehran Fender & Bumper Dent
    img2 = Image.new("RGB", (800, 500), color=(235, 240, 245))
    d2 = ImageDraw.Draw(img2)
    # White boxy Mehran profile
    d2.polygon([(120, 370), (150, 250), (260, 150), (600, 150), (710, 250), (740, 370)], fill=(240, 240, 240), outline=(100, 100, 100), width=3)
    d2.rectangle([130, 340, 730, 420], fill=(50, 50, 50), outline=(20, 20, 20), width=3) # Black plastic bumper
    # Headlight
    d2.rectangle([150, 280, 240, 335], fill=(255, 250, 210), outline=(80, 80, 80), width=2)
    # Scratch & Dent on Left Fender (Minor / Moderate)
    for i in range(8):
        d2.line([(160 + i*10, 280 + i*5), (200 + i*8, 340 + i*3)], fill=(80, 80, 80), width=2)
    d2.ellipse([140, 290, 230, 360], outline=(70, 70, 70), width=2)
    img2.save(os.path.join(output_dir, "suzuki_mehran_fender_dent.jpg"))

    # 3. Honda Civic Side Impact / Door & Mirror Damage
    img3 = Image.new("RGB", (800, 500), color=(225, 230, 235))
    d3 = ImageDraw.Draw(img3)
    # Red Civic Side Body
    d3.rectangle([120, 220, 700, 380], fill=(185, 28, 28), outline=(100, 10, 10), width=4)
    # Front and Rear Door lines
    d3.line([(380, 220), (380, 380)], fill=(80, 10, 10), width=3)
    d3.line([(550, 220), (550, 380)], fill=(80, 10, 10), width=3)
    # Broken Side Mirror
    d3.polygon([(260, 210), (310, 210), (300, 240), (250, 240)], fill=(120, 20, 20), outline=(40, 0, 0), width=3)
    # Deep Door Dent
    d3.ellipse([320, 250, 480, 360], fill=(130, 15, 15), outline=(50, 5, 5), width=3)
    for i in range(10):
        d3.line([(330 + i*12, 260 + i*6), (400 + i*8, 350 - i*4)], fill=(40, 0, 0), width=3)
    img3.save(os.path.join(output_dir, "honda_civic_door_damage.jpg"))

    print(f"Generated demo images in {output_dir}")

if __name__ == "__main__":
    create_demo_car_samples()
