"""
Generates dedicated categorized car damage images in three distinct folders:
1. sample_images/minor/     - Minor damages (scratches, scuffs, light dents)
2. sample_images/moderate/  - Moderate damages (deep dents, bent panels, cracked bumper/lights)
3. sample_images/severe/    - Severe damages (heavy collision, crushed radiator/chassis, crumpled doors)
"""

try:
    from PIL import Image, ImageDraw
except ImportError:
    Image, ImageDraw = None, None

def generate_car_samples(base_dir="sample_images"):
    dirs = {
        "minor": os.path.join(base_dir, "minor"),
        "moderate": os.path.join(base_dir, "moderate"),
        "severe": os.path.join(base_dir, "severe")
    }

    for d in dirs.values():
        os.makedirs(d, exist_ok=True)

    # -------------------------------------------------------------
    # 1. MINOR DAMAGES FOLDER (Surface scratches, scuffs, small dings)
    # -------------------------------------------------------------
    # Sample 1A: Toyota Corolla Front Bumper Minor Scuff
    img = Image.new("RGB", (800, 500), color=(235, 238, 242))
    d = ImageDraw.Draw(img)
    # Silver Corolla front profile
    d.polygon([(110, 360), (150, 240), (280, 160), (560, 160), (690, 240), (720, 360)], fill=(185, 192, 200), outline=(100, 105, 115), width=3)
    d.polygon([(290, 170), (550, 170), (650, 235), (200, 235)], fill=(195, 220, 235), outline=(90, 95, 105), width=2)
    d.rectangle([110, 330, 720, 420], fill=(160, 168, 178), outline=(80, 85, 95), width=3) # Bumper
    d.polygon([(140, 320), (240, 320), (220, 280), (160, 280)], fill=(255, 255, 240), outline=(120, 120, 130), width=2)
    d.polygon([(590, 320), (690, 320), (670, 280), (610, 280)], fill=(255, 255, 240), outline=(120, 120, 130), width=2)
    # Minor surface scuff & scratch on bottom bumper edge (Yellow severity)
    for i in range(12):
        d.line([(180 + i*6, 375 + (i%3)*3), (210 + i*5, 385 - (i%2)*2)], fill=(70, 75, 85), width=2)
    img.save(os.path.join(dirs["minor"], "minor_corolla_bumper_scuff.jpg"))

    # Sample 1B: Suzuki Alto Door Minor Scratch
    img = Image.new("RGB", (800, 500), color=(240, 242, 245))
    d = ImageDraw.Draw(img)
    # White Alto side profile
    d.rectangle([140, 200, 680, 380], fill=(245, 245, 245), outline=(120, 120, 120), width=3)
    d.line([(400, 200), (400, 380)], fill=(120, 120, 120), width=2) # Door split
    # Surface key scratch on front door
    for i in range(15):
        d.line([(240 + i*8, 280 + (i%2)*2), (250 + i*8, 282 - (i%2)*2)], fill=(100, 100, 100), width=2)
    img.save(os.path.join(dirs["minor"], "minor_alto_door_scratch.jpg"))

    # Sample 1C: Suzuki Mehran Side Mirror Scuff
    img = Image.new("RGB", (800, 500), color=(242, 244, 246))
    d = ImageDraw.Draw(img)
    d.rectangle([130, 220, 690, 380], fill=(230, 230, 230), outline=(110, 110, 110), width=3)
    # Side mirror
    d.polygon([(240, 210), (290, 210), (280, 245), (230, 245)], fill=(60, 60, 60), outline=(30, 30, 30), width=2)
    # Minor mirror scuff
    d.line([(245, 220), (275, 235)], fill=(160, 160, 160), width=2)
    img.save(os.path.join(dirs["minor"], "minor_mehran_mirror_scuff.jpg"))

    # -------------------------------------------------------------
    # 2. MODERATE DAMAGES FOLDER (Dents, bent panels, cracked plastic)
    # -------------------------------------------------------------
    # Sample 2A: Suzuki Mehran Fender Dent & Bumper Crack
    img = Image.new("RGB", (800, 500), color=(235, 240, 245))
    d = ImageDraw.Draw(img)
    d.polygon([(120, 370), (150, 250), (260, 150), (600, 150), (710, 250), (740, 370)], fill=(240, 240, 240), outline=(100, 100, 100), width=3)
    d.rectangle([130, 340, 730, 420], fill=(60, 60, 60), outline=(30, 30, 30), width=3)
    d.rectangle([150, 280, 240, 335], fill=(255, 250, 210), outline=(80, 80, 80), width=2)
    # Deep moderate dent on front fender
    d.ellipse([140, 280, 230, 350], fill=(210, 210, 210), outline=(70, 70, 70), width=3)
    for i in range(8):
        d.line([(150 + i*9, 290 + i*4), (190 + i*6, 340 - i*2)], fill=(90, 90, 90), width=3)
    img.save(os.path.join(dirs["moderate"], "moderate_mehran_fender_dent.jpg"))

    # Sample 2B: Suzuki Cultus Bonnet Bend
    img = Image.new("RGB", (800, 500), color=(230, 235, 240))
    d = ImageDraw.Draw(img)
    d.polygon([(130, 360), (170, 240), (290, 160), (550, 160), (670, 240), (710, 360)], fill=(30, 64, 175), outline=(15, 23, 42), width=3)
    # Bent Bonnet panel (Orange severity)
    d.polygon([(210, 240), (630, 240), (660, 320), (180, 320)], fill=(25, 50, 140), outline=(15, 23, 42), width=3)
    d.arc([260, 250, 580, 320], start=10, end=170, fill=(245, 158, 11), width=4)
    img.save(os.path.join(dirs["moderate"], "moderate_cultus_bonnet_bend.jpg"))

    # Sample 2C: Honda City Door Dent & Crease
    img = Image.new("RGB", (800, 500), color=(235, 238, 242))
    d = ImageDraw.Draw(img)
    d.rectangle([130, 210, 690, 380], fill=(100, 116, 139), outline=(51, 65, 85), width=3)
    d.line([(410, 210), (410, 380)], fill=(51, 65, 85), width=2)
    # Deep Door Crease / Dent
    d.ellipse([270, 250, 390, 340], fill=(71, 85, 105), outline=(30, 41, 59), width=3)
    for i in range(6):
        d.line([(290 + i*14, 260 + i*5), (350 + i*8, 330 - i*3)], fill=(30, 41, 59), width=3)
    img.save(os.path.join(dirs["moderate"], "moderate_city_door_crease.jpg"))

    # -------------------------------------------------------------
    # 3. SEVERE DAMAGES FOLDER (Major structural smash, crushed frame)
    # -------------------------------------------------------------
    # Sample 3A: Toyota Corolla Front Heavy Crash
    img = Image.new("RGB", (800, 500), color=(220, 225, 230))
    d = ImageDraw.Draw(img)
    d.polygon([(100, 360), (140, 240), (280, 160), (560, 160), (700, 240), (730, 360)], fill=(120, 128, 138), outline=(60, 65, 70), width=4)
    # Windshield shattered lines
    d.polygon([(290, 170), (550, 170), (660, 235), (200, 235)], fill=(180, 210, 230), outline=(50, 60, 70), width=3)
    for i in range(12):
        d.line([(300 + i*20, 175), (420 - i*10, 230)], fill=(255, 255, 255), width=2)
    # Crushed bumper, deformed bonnet & pierced radiator (Red severity)
    d.rectangle([110, 330, 720, 420], fill=(70, 75, 85), outline=(30, 35, 40), width=4)
    for i in range(25):
        d.line([(240 + i*14, 320 + (i%6)*12), (300 + i*10, 410 - (i%4)*8)], fill=(15, 15, 20), width=4)
        d.line([(160 + i*8, 310 + (i%5)*12), (230 + i*6, 400 - (i%3)*10)], fill=(200, 30, 30), width=3)
    d.ellipse([220, 310, 550, 420], outline=(180, 20, 20), width=4)
    img.save(os.path.join(dirs["severe"], "severe_corolla_front_crash.jpg"))

    # Sample 3B: Honda Civic Side Impact & Crushed Door
    img = Image.new("RGB", (800, 500), color=(225, 230, 235))
    d = ImageDraw.Draw(img)
    # Crimson Red Civic Body
    d.rectangle([120, 220, 700, 380], fill=(185, 28, 28), outline=(100, 10, 10), width=4)
    # Deep collision intrusion
    d.ellipse([260, 230, 520, 370], fill=(110, 10, 10), outline=(20, 0, 0), width=4)
    for i in range(20):
        d.line([(280 + i*10, 240 + (i%4)*10), (360 + i*7, 360 - (i%3)*8)], fill=(20, 0, 0), width=4)
    # Broken ripped mirror
    d.polygon([(260, 210), (300, 210), (270, 250)], fill=(60, 0, 0), outline=(0, 0, 0), width=3)
    img.save(os.path.join(dirs["severe"], "severe_civic_side_collision.jpg"))

    # Sample 3C: Toyota Hilux Revo Heavy Front Crush
    img = Image.new("RGB", (800, 500), color=(220, 222, 225))
    d = ImageDraw.Draw(img)
    # Big rugged Hilux pickup front
    d.polygon([(90, 370), (130, 220), (270, 140), (570, 140), (710, 220), (750, 370)], fill=(51, 65, 85), outline=(15, 23, 42), width=5)
    # Heavy crumpled steel bull-bar and hood
    d.rectangle([100, 320, 740, 430], fill=(30, 41, 59), outline=(10, 15, 25), width=5)
    for i in range(30):
        d.line([(200 + i*16, 310 + (i%7)*15), (280 + i*12, 425 - (i%5)*10)], fill=(185, 28, 28), width=5)
        d.line([(150 + i*12, 330 + (i%4)*12), (220 + i*10, 415 - (i%3)*10)], fill=(10, 15, 25), width=4)
    img.save(os.path.join(dirs["severe"], "severe_hilux_front_crush.jpg"))

    print("Created 3 distinct folders:")
    print(" - sample_images/minor/    (3 images)")
    print(" - sample_images/moderate/ (3 images)")
    print(" - sample_images/severe/   (3 images)")

if __name__ == "__main__":
    generate_car_samples()
