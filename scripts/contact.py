# Lembar kontak: gabungkan still QA per adegan menjadi kisi (untuk diperiksa cepat).
# Pemakaian: python3 scripts/contact.py out/qa out/sheets [kolom]
import sys
from pathlib import Path
from PIL import Image, ImageDraw

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
dst.mkdir(parents=True, exist_ok=True)
groups = {}
for f in sorted(src.glob('*.jpg')):
    key = '-'.join(f.stem.split('-')[:2])
    groups.setdefault(key, []).append(f)
for key, files in groups.items():
    for part in range(0, len(files), cols * 3):
        chunk = files[part : part + cols * 3]
        w, h = 640, 360
        rows = (len(chunk) + cols - 1) // cols
        sheet = Image.new('RGB', (cols * w, rows * h), (20, 20, 20))
        for i, f in enumerate(chunk):
            im = Image.open(f).resize((w, h))
            d = ImageDraw.Draw(im)
            d.text((6, 4), f.stem, fill=(255, 255, 0))
            sheet.paste(im, ((i % cols) * w, (i // cols) * h))
        sheet.save(dst / f'{key}-{part // (cols * 3)}.jpg', quality=82)
        print(dst / f'{key}-{part // (cols * 3)}.jpg')
