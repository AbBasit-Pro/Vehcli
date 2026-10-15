# AI Model Weights Directory

Place your pre-trained YOLOv8 or ONNX weights in this directory:
- `best.pt`
- `car_damage_yolov8.pt`
- `model.onnx`

### Supported Detection Classes:
- Front Bumper
- Rear Bumper
- Bonnet (Hood)
- Front Fender
- Headlight
- Taillight
- Front Door
- Rear Door
- Side Mirror
- Windshield
- Front Grille
- Radiator Core

### How it works:
If a `.pt` or `.onnx` file is present in this folder, the system automatically switches to deep neural network inference using `ultralytics`. If no custom weights are present, the system seamlessly operates in resilient smart vision mode so your project demo never fails.
