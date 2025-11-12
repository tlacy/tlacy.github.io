# tools/annotate_banner.py
from PIL import Image, ImageDraw, ImageFont
img = Image.open("img/banner-final.png").convert("RGBA")
draw = ImageDraw.Draw(img)
try:
    font = ImageFont.truetype("/Library/Fonts/Arial.ttf", 26)
except:
    font = ImageFont.load_default()
text = "Open to engineering leadership — Austin / Remote"
w,h = draw.textsize(text, font=font)
padding = 20
x = img.width - w - padding - 60
y = 40
# semi-transparent rectangle
draw.rectangle([x-padding, y-padding//2, img.width-40, y+h+padding//2], fill=(0,0,0,120))
draw.text((x, y), text, font=font, fill=(255,255,255,255))
img.save("img/banner-final-text.png")