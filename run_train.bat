@echo off
echo ===================================================================
echo   AutoDamage AI Pakistan - Low-Memory YOLO11 Model Trainer
echo ===================================================================
call .venv\Scripts\activate.bat

echo.
echo [Step 1/2] Processing Custom Images & Preserving Negative Clean Samples...
echo Note: Place your custom car photos in folder: custom_dataset\raw_images
python auto_dataset_builder.py

echo.
echo [Step 2/2] Training YOLO11 with Low-Memory Point Fine-Tuning...
echo Flags: AMP=True (FP16), Batch=4, Workers=2, FreezeBackbone=10
python train_custom_model.py --epochs 25 --batch 4 --freeze 10

echo.
echo ===================================================================
echo   Training Completed! New model deployed to models\yolov11n-car-damage.pt
echo ===================================================================
pause
