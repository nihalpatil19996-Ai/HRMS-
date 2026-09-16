import math
import struct
import zlib
import os

def create_png(width, height, is_maskable=False):
    raw = bytearray()
    cx, cy = width / 2.0, height / 2.0
    scale = width / 512.0

    # Colors
    bg_top = (30, 27, 75)      # Indigo 950
    bg_bottom = (2, 6, 23)     # Slate 950
    badge_col1 = (99, 102, 241) # Indigo 500
    badge_col2 = (59, 130, 246) # Blue 500
    gold = (251, 191, 36)      # Amber 400
    cyan = (56, 189, 248)      # Sky 400
    emerald = (52, 211, 153)   # Emerald 400
    white = (255, 255, 255)

    for y in range(height):
        raw.append(0) # Filter byte: None
        t_y = y / float(height)
        for x in range(width):
            # Coordinates relative to center normalized to 512x512
            nx = (x - cx) / scale
            ny = (y - cy) / scale
            dist_c = math.sqrt(nx * nx + ny * ny)

            # Squircle distance for background if not maskable
            # |nx|^4 + |ny|^4 <= r^4 approx squircle
            if not is_maskable:
                rx, ry = abs(nx), abs(ny)
                squircle_dist = (rx ** 3.5 + ry ** 3.5) ** (1.0 / 3.5)
                if squircle_dist > 235:
                    # Outside rounded app squircle
                    raw.extend([0, 0, 0, 0])
                    continue

            # Base gradient
            r = int(bg_top[0] * (1 - t_y) + bg_bottom[0] * t_y)
            g = int(bg_top[1] * (1 - t_y) + bg_bottom[1] * t_y)
            b = int(bg_top[2] * (1 - t_y) + bg_bottom[2] * t_y)
            a = 255

            # Outer subtle radar rings
            for ring_r in (170, 125, 85):
                diff = abs(dist_c - ring_r)
                if diff < 2.5:
                    alpha_factor = max(0.0, 1.0 - diff / 2.5) * 0.35
                    r = int(r * (1 - alpha_factor) + cyan[0] * alpha_factor)
                    g = int(g * (1 - alpha_factor) + cyan[1] * alpha_factor)
                    b = int(b * (1 - alpha_factor) + cyan[2] * alpha_factor)

            # Center rounded square badge (|nx| < 80 and |ny| < 80)
            badge_r = 85 if not is_maskable else 75
            corner_r = 24
            dx = max(0, abs(nx) - (badge_r - corner_r))
            dy = max(0, abs(ny) - (badge_r - corner_r))
            b_dist = math.sqrt(dx * dx + dy * dy)
            if (abs(nx) <= badge_r and abs(ny) <= badge_r and b_dist <= corner_r):
                t_badge = (ny + badge_r) / (badge_r * 2.0)
                br = int(badge_col1[0] * (1 - t_badge) + badge_col2[0] * t_badge)
                bg = int(badge_col1[1] * (1 - t_badge) + badge_col2[1] * t_badge)
                bb = int(badge_col1[2] * (1 - t_badge) + badge_col2[2] * t_badge)

                # Telephone icon silhouette (simplification: receiver shape)
                # Upper earpiece around (nx: -20, ny: -35)
                # Lower mouthpiece around (nx: 30, ny: 35)
                # Curved handle connecting them
                in_phone = False
                # Earpiece circle
                if math.hypot(nx + 22, ny + 32) < 18:
                    in_phone = True
                # Mouthpiece circle
                elif math.hypot(nx + 28, ny - 28) < 18:
                    in_phone = True
                # Connecting arc / pill
                elif -15 < (nx - ny * 0.7) < 25 and math.hypot(nx, ny) < 48 and nx > -30:
                    in_phone = True

                if in_phone:
                    r, g, b = white
                else:
                    r, g, b = br, bg, bb

            # Gold target accent dot at top-right
            dot_dist = math.hypot(nx - 110, ny + 110)
            if dot_dist < 22:
                r, g, b = gold
            elif dot_dist < 28:
                factor = (28 - dot_dist) / 6.0 * 0.5
                r = int(r * (1 - factor) + gold[0] * factor)
                g = int(g * (1 - factor) + gold[1] * factor)
                b = int(b * (1 - factor) + gold[2] * factor)

            # Emerald call status dot at bottom-left
            status_dist = math.hypot(nx + 110, ny - 110)
            if status_dist < 16:
                r, g, b = emerald
            elif status_dist < 22:
                factor = (22 - status_dist) / 6.0 * 0.4
                r = int(r * (1 - factor) + emerald[0] * factor)
                g = int(g * (1 - factor) + emerald[1] * factor)
                b = int(b * (1 - factor) + emerald[2] * factor)

            raw.extend([r, g, b, a])

    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        crc = zlib.crc32(tag + data) & 0xffffffff
        return c + struct.pack('>I', crc)

    png = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png += chunk(b'IHDR', ihdr)
    png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    png += chunk(b'IEND', b'')
    return png

os.makedirs('public', exist_ok=True)

print("Generating pwa-192x192.png...")
with open('public/pwa-192x192.png', 'wb') as f:
    f.write(create_png(192, 192, is_maskable=False))

print("Generating pwa-512x512.png...")
with open('public/pwa-512x512.png', 'wb') as f:
    f.write(create_png(512, 512, is_maskable=False))

print("Generating pwa-maskable-512x512.png...")
with open('public/pwa-maskable-512x512.png', 'wb') as f:
    f.write(create_png(512, 512, is_maskable=True))

print("Generating apple-touch-icon.png...")
with open('public/apple-touch-icon.png', 'wb') as f:
    f.write(create_png(180, 180, is_maskable=False))

print("Generating favicon.ico...")
with open('public/favicon.ico', 'wb') as f:
    f.write(create_png(64, 64, is_maskable=False))

print("All PWA icons generated successfully!")
