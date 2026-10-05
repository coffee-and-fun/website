from pathlib import Path
from shutil import copy2
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

root = Path('/Users/robertjamesgabriel/Documents/Code/Coffee')
source = Path('/var/folders/rl/nx_mbj095rxbbkfrrm2z2tkh0000gn/T/codex-clipboard-dcdc45ef-318e-4129-a17c-d274788676ee.png')
asset = root / 'output/listing-photos/cat-tunnel-bed.png'
asset.parent.mkdir(parents=True, exist_ok=True)
if not asset.exists():
    copy2(source, asset)
out = root / 'output/pdf/cat-tunnel-bed-for-sale-flyer.pdf'
out.parent.mkdir(parents=True, exist_ok=True)
fonts = Path('/System/Library/Fonts/Supplemental')
pdfmetrics.registerFont(TTFont('FlyerBold', str(fonts / 'Arial Bold.ttf')))
pdfmetrics.registerFont(TTFont('FlyerRegular', str(fonts / 'Arial.ttf')))

c = canvas.Canvas(str(out), pagesize=(612, 792), pageCompression=1)
c.setTitle('Cat Tunnel Bed for Sale - $40')
c.setAuthor('')
c.setSubject('Light blue cat tunnel bed for sale. $40. Located in Forrest Hills. Contact (501) 293-6819.')
ink = HexColor('#171B1E')
muted = HexColor('#485158')
c.setFillColor(ink)
c.setStrokeColor(ink)
c.setFont('FlyerBold', 14)
c.drawString(36, 744, 'FOR SALE')
c.setLineWidth(1.2)
c.line(138, 749, 576, 749)
c.setFont('FlyerBold', 36)
c.drawString(36, 695, 'CAT TUNNEL BED')
c.setFont('FlyerRegular', 15)
c.setFillColor(muted)
c.drawString(36, 668, 'Donut-style design in light blue')

# Place the untouched transparent source so the visible product fills the photo area.
scale = 520 / 664
image_x = 46 - 70 * scale
image_y = 260 - (800 - 632) * scale
c.drawImage(str(asset), image_x, image_y, width=800 * scale,
            height=800 * scale, mask='auto', preserveAspectRatio=True)
c.setFillColor(ink)
c.setFont('FlyerBold', 67)
c.drawCentredString(306, 192, '$40')

c.setLineWidth(1)
c.line(36, 175, 576, 175)
c.setFont('FlyerBold', 22)
c.drawString(36, 139, 'Interested? Get in touch.')
c.setFont('FlyerRegular', 15)
c.drawString(36, 103, 'Contact:')
c.setFont('FlyerBold', 18)
c.drawString(111, 103, '(501) 293-6819')
c.setFillColor(muted)
c.setFont('FlyerRegular', 14)
c.drawString(36, 67, 'Located in Forrest Hills')
c.showPage()
c.save()

reader = PdfReader(str(out))
assert len(reader.pages) == 1
assert tuple(float(v) for v in reader.pages[0].mediabox) == (0, 0, 612, 792)
text = reader.pages[0].extract_text()
for value in ['CAT TUNNEL BED', '$40', '(501) 293-6819', 'Located in Forrest Hills']:
    assert value in text
assert '$250' not in text
print(out)
print(text)
