import base64

# Read the image file
with open('test-image.png', 'rb') as image_file:
    # Convert to base64
    base64_string = base64.b64encode(image_file.read()).decode('utf-8')
    
    # Print the base64 string
    print(f'data:image/png;base64,{base64_string}')
