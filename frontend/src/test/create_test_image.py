from PIL import Image, ImageDraw, ImageFont
import os

# Create image with text
text = '''Blood Test Results
=================

Test Date: 2025-06-21

Parameters:
- Hemoglobin: 14.5 g/dL
- Glucose: 95 mg/dL
- Cholesterol: 180 mg/dL
- HDL: 55 mg/dL
- LDL: 100 mg/dL'''

# Create image
img = Image.new('RGB', (400, 400), color = (255, 255, 255))
d = ImageDraw.Draw(img)

# Try to use Arial font, fallback to default if not found
try:
    font = ImageFont.truetype("Arial.ttf", 12)
except:
    font = ImageFont.load_default()

# Draw text
d.text((10,10), text, fill=(0,0,0), font=font)

# Save image
img.save('test-image.png')
