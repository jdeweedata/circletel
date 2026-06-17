#!/usr/bin/env python3
"""
Generate a branded "what to expect" WhatsApp header card for the DebiCheck
mandate heads-up: CircleTel logo + a clean (production) SMS example + a
"this is legit" reassurance caption, at a proper 1.91:1 header ratio.

The SMS example is rendered synthetically (not a screenshot) so it shows
production text — "requested by Circle Tel SA" with an illustrative link/code,
no "Test account" suffix and no real staging token.

Output: public/images/onboarding/debicheck-whatsapp-header.png
"""
from PIL import Image, ImageDraw, ImageFont

ROOT = "/home/circletel"
LOGO_WHITE = f"{ROOT}/public/images/circletel-logo-white.png"
OUT = f"{ROOT}/public/images/onboarding/debicheck-whatsapp-header.png"

NAVY = (27, 42, 74)
ORANGE = (232, 122, 30)
WHITE = (255, 255, 255)
GREEN = (34, 170, 94)
MUTED = (197, 208, 224)
BUBBLE = (33, 35, 40)
SMS_TXT = (224, 226, 230)
SMS_LINK = (240, 241, 245)

W, H = 1200, 628
FB = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
FD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def font(p, s):
    return ImageFont.truetype(p, s)


def wrap(draw, text, fnt, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=fnt) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def draw_rich_sms(draw, x, y, max_w, fnt, line_h, tokens, underline):
    """Lay out tokens word-by-word with wrapping; underline flagged tokens."""
    space = draw.textlength(" ", font=fnt)
    cx, cy = x, y
    for tok in tokens:
        tw = draw.textlength(tok, font=fnt)
        if cx + tw > x + max_w:
            cx = x
            cy += line_h
        col = SMS_LINK if tok in underline else SMS_TXT
        draw.text((cx, cy), tok, font=fnt, fill=col)
        if tok in underline:
            uy = cy + fnt.size + 2
            draw.line([(cx, uy), (cx + tw, uy)], fill=col, width=2)
        cx += tw + space
    return cy + line_h


img = Image.new("RGB", (W, H), NAVY)
d = ImageDraw.Draw(img)
d.rectangle([0, 0, 12, H], fill=ORANGE)

LX, LW = 60, 540

# logo + wordmark
logo = Image.open(LOGO_WHITE).convert("RGBA")
lh = 110
logo = logo.resize((int(logo.width * (lh / logo.height)), lh), Image.LANCZOS)
img.paste(logo, (LX, 46), logo)
d.text((LX + logo.width + 22, 78), "CircleTel", font=font(FB, 40), fill=WHITE)

# legit pill
py = 190
pf, cf = font(FB, 26), font(FD, 30)
check = "✓"
cw = d.textlength(check, font=cf)
tw = d.textlength("THIS IS LEGIT", font=pf)
pill_w = int(24 + cw + 12 + tw + 24)
d.rounded_rectangle([LX, py, LX + pill_w, py + 52], radius=26, fill=GREEN)
d.text((LX + 24, py + 9), check, font=cf, fill=WHITE)
d.text((LX + 24 + cw + 12, py + 12), "THIS IS LEGIT", font=pf, fill=WHITE)

# headline
hy = py + 80
hf = font(FB, 40)
for i, line in enumerate(["Your debit-order", "signing SMS"]):
    d.text((LX, hy + i * 50), line, font=hf, fill=WHITE)

# body
by = hy + 120
bf = font(FR, 25)
body = ("You'll get an SMS from an unknown number with a link and a "
        "6-digit code to sign your debit order. It's the official step "
        "— it says “requested by Circle Tel SA”. Open it and enter the code.")
for i, line in enumerate(wrap(d, body, bf, LW)):
    d.text((LX, by + i * 36), line, font=bf, fill=MUTED)

# ---- right: synthetic SMS bubble inside a white card ----
card_x, card_w = 624, 516
pad, bub_pad = 24, 26
inner_w = card_w - pad * 2
bub_inner = inner_w - bub_pad * 2
sf = font(FR, 26)
sms = ("Click https://short.surf/Ab3xY9 and enter 482915 to sign the "
       "mandate requested by Circle Tel SA")
tokens = sms.split()
# pre-measure wrapped height
space = d.textlength(" ", font=sf)
cx, lines = 0, 1
for tok in tokens:
    twk = d.textlength(tok, font=sf)
    if cx + twk > bub_inner:
        cx = 0
        lines += 1
    cx += twk + space
line_h = 38
bub_h = lines * line_h + bub_pad * 2 - 6
card_h = bub_h + pad * 2
card_y = (H - card_h) // 2

# shadow + card
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(shadow).rounded_rectangle(
    [card_x + 6, card_y + 8, card_x + card_w + 6, card_y + card_h + 8], radius=24, fill=(0, 0, 0, 90))
img = Image.alpha_composite(img.convert("RGBA"), shadow).convert("RGB")
d = ImageDraw.Draw(img)
d.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], radius=24, fill=WHITE)

# dark bubble
bx, byy = card_x + pad, card_y + pad
d.rounded_rectangle([bx, byy, bx + inner_w, byy + bub_h], radius=20, fill=BUBBLE)
draw_rich_sms(d, bx + bub_pad, byy + bub_pad, bub_inner, sf, line_h, tokens,
              underline={"https://short.surf/Ab3xY9", "482915"})

# example tag
tag, tf = "Example", font(FB, 20)
tw2 = d.textlength(tag, font=tf)
d.rounded_rectangle([card_x + card_w - tw2 - 60, card_y - 16, card_x + card_w - 8, card_y + 18],
                    radius=17, fill=ORANGE)
d.text((card_x + card_w - tw2 - 34, card_y - 13), tag, font=tf, fill=WHITE)

img.save(OUT, "PNG")
print("Saved", OUT, img.size)
