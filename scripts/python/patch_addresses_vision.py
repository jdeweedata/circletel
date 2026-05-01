import json, re, glob, os, io
from google.cloud import vision
from pdf2image import convert_from_path

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/circletel/circletel-drive-9afdd33bd927.json'
client = vision.ImageAnnotatorClient()

with open('/home/circletel/contracts_extracted.json') as f:
    data = json.load(f)

pdf_map = {os.path.basename(p): p for p in glob.glob('/home/circletel/contracts/*.pdf')}

def ocr_pdf_pages(pdf_path, pages=[7, 4]):
    images = convert_from_path(pdf_path, dpi=200)
    full_text = ''
    for i in pages:
        if i < len(images):
            buf = io.BytesIO()
            images[i].save(buf, format='PNG')
            image = vision.Image(content=buf.getvalue())
            response = client.document_text_detection(image=image)
            full_text += response.full_text_annotation.text + '\n'
    return full_text

def extract_address_and_gps(text):
    address = None
    gps = None
    m = re.search(r'Physical address[:\s]*\n(.+?)\n(.+?)\n(\d{4})', text, re.IGNORECASE)
    if m:
        address = f"{m.group(1).strip()}, {m.group(2).strip()}, {m.group(3).strip()}"
    if not address:
        m = re.search(r'Address[:\s]*\n(.+?)\n(.+?)\n(\d{4})', text, re.IGNORECASE)
        if m:
            address = f"{m.group(1).strip()}, {m.group(2).strip()}, {m.group(3).strip()}"
    m = re.search(r'(-\d{1,3}\.\d+),\s*(\d{1,3}\.\d+)', text)
    if m:
        gps = f"{m.group(1)}, {m.group(2)}"
    return address, gps

patched = 0
errors = 0
for i, rec in enumerate(data):
    fname = rec.get('source_filename', '')
    if fname not in pdf_map:
        continue
    try:
        text = ocr_pdf_pages(pdf_map[fname])
        address, gps = extract_address_and_gps(text)
        if address:
            rec['physical_address'] = address
            patched += 1
        if gps:
            rec['gps_coordinates'] = gps
        if i % 50 == 0:
            print(f"Progress: {i}/{len(data)} | Patched so far: {patched}")
    except Exception as e:
        errors += 1
        print(f"Error on {fname}: {e}")

with open('/home/circletel/contracts_extracted.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"\n✅ Patched: {patched}/{len(data)}")
print(f"❌ Errors: {errors}")
