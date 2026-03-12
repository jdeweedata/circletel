#!/usr/bin/env python3
"""Generate hero images for CircleTel product pages using Gemini API."""

import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# Product image prompts - photorealistic style for professional B2B look
products = [
    {
        "name": "business-complete",
        "prompt": """A photorealistic wide-angle photograph of a modern South African SME office space,
        featuring 5-8 diverse professionals (mix of ethnicities reflecting South African demographics)
        working at desks with laptops and monitors. Clean contemporary interior with glass partitions,
        a visible network equipment rack in the background subtly showing enterprise-grade connectivity.
        Natural light streaming through large windows, warm color grading. The scene conveys reliability,
        productivity, and professional connectivity. Shot with 24mm f/2.8 lens, shallow depth of field
        on foreground workers. No text or logos in the image."""
    },
    {
        "name": "remote-plus",
        "prompt": """A photorealistic photograph of a professional home office setup in a modern South African
        residence. A focused professional (30s, business casual attire) on a video conference call,
        visible on their 27-inch monitor showing multiple participants. Clean desk with laptop, good lighting
        from a window. A subtle router with green status lights visible on a shelf. The scene conveys
        professional reliability and seamless video conferencing from home. Warm, inviting color palette.
        Shot with 50mm f/1.8 lens, eye-level angle. No text or logos in the image."""
    },
    {
        "name": "venue-plus",
        "prompt": """A photorealistic photograph of an upscale South African restaurant or boutique hotel lobby
        during golden hour. Several guests visible - some using smartphones, a barista at a counter using
        a tablet POS system, digital menu boards in soft focus background. Modern interior design with
        warm wood tones and contemporary furniture. WiFi access point subtly visible on ceiling.
        The scene conveys connected hospitality and seamless guest experience. Shot with 35mm f/2.0 lens,
        warm color grading with soft ambient lighting. No text or logos in the image."""
    }
]

output_dir = "/home/circletel/public/images/products"
os.makedirs(output_dir, exist_ok=True)

for product in products:
    print(f"Generating image for {product['name']}...")

    response = client.models.generate_content(
        model="gemini-3.1-flash-image-preview",
        contents=[product["prompt"]],
        config=types.GenerateContentConfig(
            response_modalities=['TEXT', 'IMAGE'],
            image_config=types.ImageConfig(
                aspect_ratio="16:9",
                image_size="2K"
            ),
        ),
    )

    for part in response.parts:
        if part.text:
            print(f"  Model response: {part.text}")
        elif part.inline_data:
            image = part.as_image()
            output_path = f"{output_dir}/{product['name']}-hero.jpg"
            image.save(output_path)
            print(f"  Saved: {output_path}")

print("\nAll images generated successfully!")
