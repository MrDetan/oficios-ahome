import os
import base64
from PIL import Image
import numpy as np

img_light_path = r'C:\Users\detan\.gemini\antigravity-ide\brain\a90c9d70-e20d-47e1-8f9d-c4fd1075ea11\.user_uploaded\media_1791611955973.jpg'
img_dark_path = r'C:\Users\detan\.gemini\antigravity-ide\brain\a90c9d70-e20d-47e1-8f9d-c4fd1075ea11\.user_uploaded\media_1791611972993.jpg'

im_l = Image.open(img_light_path).convert('RGB')
im_d = Image.open(img_dark_path).convert('RGB')

# Crop symbol with 1px margin
crop_box = (390, 18, 621, 235)
crop_l = im_l.crop(crop_box)
crop_d = im_d.crop(crop_box)

# 1. Generate transparent Black logo (for light backgrounds)
gray_l = np.array(crop_l.convert('L'), dtype=float)
alpha_black = np.clip((255.0 - gray_l) / (255.0 - 40.0) * 255.0, 0, 255).astype(np.uint8)
black_rgba = np.zeros((crop_l.height, crop_l.width, 4), dtype=np.uint8)
black_rgba[:, :, 0] = 9   # #09090B
black_rgba[:, :, 1] = 9
black_rgba[:, :, 2] = 11
black_rgba[:, :, 3] = alpha_black
logo_dark_trans = Image.fromarray(black_rgba, 'RGBA')

# 2. Generate transparent White logo (for dark backgrounds)
gray_d = np.array(crop_d.convert('L'), dtype=float)
alpha_white = np.clip((gray_d - 15.0) / (240.0 - 15.0) * 255.0, 0, 255).astype(np.uint8)
white_rgba = np.zeros((crop_d.height, crop_d.width, 4), dtype=np.uint8)
white_rgba[:, :, 0] = 255
white_rgba[:, :, 1] = 255
white_rgba[:, :, 2] = 255
white_rgba[:, :, 3] = alpha_white
logo_light_trans = Image.fromarray(white_rgba, 'RGBA')

# Save transparent logo files
os.makedirs('icons', exist_ok=True)
os.makedirs('images', exist_ok=True)

logo_dark_trans.save('icons/logo-dark.png', 'PNG')
logo_light_trans.save('icons/logo-light.png', 'PNG')
logo_dark_trans.save('images/logo-dark.png', 'PNG')
logo_light_trans.save('images/logo-light.png', 'PNG')

# Helper to create square icon with custom bg and symbol
def create_app_icon(size, bg_color, is_white_symbol, padding_pct=0.15):
    icon = Image.new('RGBA', (size, size), bg_color)
    sym = logo_light_trans if is_white_symbol else logo_dark_trans
    
    target_max = int(size * (1 - 2 * padding_pct))
    w, h = sym.size
    ratio = min(target_max / w, target_max / h)
    new_w, new_h = int(w * ratio), int(h * ratio)
    
    sym_resized = sym.resize((new_w, new_h), Image.Resampling.LANCZOS)
    pos = ((size - new_w) // 2, (size - new_h) // 2)
    icon.paste(sym_resized, pos, sym_resized)
    return icon

# 3. Create icon-512.png (High-contrast dark theme icon for PWA splash / Android / OpenGraph)
icon_512 = create_app_icon(512, (9, 9, 11, 255), is_white_symbol=True, padding_pct=0.14)
icon_512.save('icons/icon-512.png', 'PNG')

# 4. Create icon-192.png (192x192)
icon_192 = create_app_icon(192, (9, 9, 11, 255), is_white_symbol=True, padding_pct=0.14)
icon_192.save('icons/icon-192.png', 'PNG')

# 5. Create apple-touch-icon.png (180x180)
icon_apple = create_app_icon(180, (9, 9, 11, 255), is_white_symbol=True, padding_pct=0.14)
icon_apple.save('icons/apple-touch-icon.png', 'PNG')

# 6. Create icon.svg (Embeds crisp high-res 512 squircle icon)
with open('icons/icon-512.png', 'rb') as f:
    b64_data = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="120" fill="#09090B" />
  <image href="data:image/png;base64,{b64_data}" width="512" height="512" />
</svg>
'''
with open('icons/icon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print('All icons generated successfully!')
