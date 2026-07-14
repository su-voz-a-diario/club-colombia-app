from PIL import Image

# Open the original image
img_path = "/Users/ricardogarcia/.gemini/antigravity/brain/65d02a4f-3a60-4aa9-b5f8-851487639873/landing_hero_premium_mockup_1783905858492.jpg"
img = Image.open(img_path)

# Get dimensions
width, height = img.size

# The user cropped the right side, approximately from the center to the right edge
# Let's crop from x=width*0.5 to width, and y=height*0.2 to height*0.85
left = int(width * 0.45)
top = int(height * 0.20)
right = int(width * 0.95)
bottom = int(height * 0.85)

cropped_img = img.crop((left, top, right, bottom))
cropped_img.save("public/hero_graphic.jpg")
print("Image cropped and saved to public/hero_graphic.jpg")
