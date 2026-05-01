import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

PROMPT = """A photorealistic CGI product image of a Samsung Galaxy A37 5G smartphone,
front-facing, portrait orientation, centred on a pure white background.

The phone has slim bezels, a centred punch-hole front camera at the top, and a
flat display. The screen is ON and shows the phone's own marketing content:

Screen content (top to bottom):
- Top section background: soft lilac/purple gradient
- Bold white text: "SAMSUNG" (smaller, top)
- Bold white text: "Galaxy A37 5G" (large, prominent)
- Below the headline: a glamour shot of three Galaxy A37 5G phones arranged
  in a fan layout — one in black, one in silver/white, one in lavender purple —
  shown from a 3/4 rear angle, stylishly arranged
- A young South Asian woman in a lavender outfit posed dynamically beside the
  fan of phones, creating a lifestyle energy
- Lower screen section: white rounded pill cards listing 4 key features with
  small icons on the left:
  1. Camera icon + "Triple AI camera" bold / "50MP (OIS) wider view" small grey
  2. Circle icon + "Massive storage" bold / "8+8GB RAM | 256GB" small grey
  3. Lightning bolt icon + "Superfast charge" bold / "45W, 65% charge in 30mins" small grey
  4. Sparkle/star icon + "AI creator suite" bold / "AI select | AI object eraser" small grey

The cards have a very subtle frosted white background with soft shadow.

Phone body: black/dark graphite frame and back visible along the edges.
Screen colours: lilac purple gradient (top), merging into a lighter lavender
where the feature cards sit. The cards are white with soft grey text.

Photography style: commercial product photography, clean white studio background,
soft box lighting from upper left, ultra-sharp screen detail, realistic glass
reflection on the display. High-end Samsung marketing material quality.

All on-screen text must be fully legible and crisp. 4K resolution.
Aspect ratio: 2:3 (portrait).
No external text, logos, or watermarks outside the phone screen."""

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=[PROMPT],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(
            aspect_ratio="2:3",
            image_size="4K"
        ),
    ),
)

for part in response.parts:
    if part.inline_data:
        part.as_image().save("public/images/samsung-galaxy-a37-5g-product.jpg")
        print("Saved: public/images/samsung-galaxy-a37-5g-product.jpg")
    elif part.text:
        print(part.text)
