import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

PROMPT = """A high-end studio product visual for CircleTel, a South African internet
and entertainment brand, advertising the Mecool Entertainment Bundle.

Concept: two hero Mecool products presented as a matched pair on a deep navy
(#1B2A4A) background — a Mecool KM7 Plus Google TV Box (compact square set-top
box, matte black with subtle ventilation slots) positioned on the right, and a
Mecool KS3 soundbar (slim horizontal bar design with visible speaker grille) in
the foreground-left. Both devices are lit with soft volumetric orange (#F5831F)
light from below, casting a warm glow pool beneath each unit.

Surface: both products rest on a dark glass surface with a soft orange reflection
below each device.

Negative space: the left 40% of the frame transitions to a deep navy gradient —
flat and dark enough for white headline text and an orange price badge overlay.

Colour palette: deep navy (#1B2A4A) background, vibrant orange (#F5831F) light
sources, white/dark-grey product surfaces, soft white highlights on device edges.
No cyan, no blue accents — strictly navy, orange, and white.

Style: cinematic CGI product photography, three-point studio lighting,
ultra-sharp detail, shallow depth of field with subtle bokeh behind devices,
4K render quality. The mood is premium, modern, and inviting — home entertainment
aspirational.

NOT generic tech stock photography.
NOT cold blue lighting — all light sources must be warm orange.
NOT cluttered — only the two hero devices.
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
        part.as_image().save("public/images/entertainment/entertainment-hero.jpg")
        print("Saved: public/images/entertainment/entertainment-hero.jpg")
    elif part.text:
        print(part.text)
