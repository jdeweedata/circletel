import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

PROMPT = """A high-end studio product visual for CircleTel, a South African business
connectivity brand, advertising the WorkConnect + Mobile bundle.

Concept: two hero products presented as a matched pair on a deep navy
(#1B2A4A) background — a compact white fixed-wireless router (Tarana G1
form factor: low-profile rectangular unit with a single glowing orange LED
ring on the top face) positioned on the left, and a Samsung Galaxy S26
Ultra smartphone standing upright on the right, its screen displaying a
subtle abstract connectivity graphic in orange. Both devices are lit with
soft volumetric orange (#F5831F) light from below, casting a warm glow pool
beneath each unit. A thin glowing orange arc connects the two products at
mid-height, suggesting the unified bundle.

Surface: both products rest on a black glass surface with a soft orange
reflection below each device.

Negative space: the left third of the frame transitions to a deep navy
gradient — flat and dark enough for white headline text and an orange price
badge overlay.

Colour palette: deep navy (#1B2A4A) background, vibrant orange (#F5831F)
light sources and arc, white product surfaces, soft white highlights on
device edges. No cyan, no blue accents — strictly navy, orange, and white.

Style: cinematic CGI product photography, three-point studio lighting,
ultra-sharp detail, shallow depth of field with subtle bokeh behind devices,
4K render quality. The mood is premium, modern, and confident — Apple
keynote product reveal aesthetic.

NOT generic tech stock photography.
NOT cold blue lighting — all light sources must be warm orange.
NOT cluttered — only the two hero devices plus the connecting arc.
No text, logos, UI overlays, or watermarks in the image.

Aspect ratio: 16:9. Resolution: 4K."""

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=[PROMPT],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(
            aspect_ratio="16:9",
            image_size="4K"
        ),
    ),
)

for part in response.parts:
    if part.inline_data:
        part.as_image().save("public/images/workconnect/workconnect-mobile-bundle-hero.jpg")
        print("Saved: public/images/workconnect/workconnect-mobile-bundle-hero.jpg")
    elif part.text:
        print(part.text)
