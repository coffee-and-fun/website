from pathlib import Path
import argparse
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

parser = argparse.ArgumentParser()
parser.add_argument('--contact', default='')
args = parser.parse_args()
root = Path('/Users/robertjamesgabriel/Documents/Code/Coffee')
out = root / 'output/pdf/litter-box-for-sale-flyer.pdf'
out.parent.mkdir(parents=True, exist_ok=True)
fonts = Path('/System/Library/Fonts/Supplemental')
pdfmetrics.registerFont(TTFont('FlyerBold', str(fonts / 'Arial Bold.ttf')))
pdfmetrics.registerFont(TTFont('FlyerRegular', str(fonts / 'Arial.ttf')))
c = canvas.Canvas(str(out), pagesize=(612, 792), pageCompression=1)
c.setTitle('Automatic Litter Box for Sale - $250 or Best Offer')
c.setAuthor('')
c.setSubject('Forrest Hills. Well maintained; will be deep cleaned. All accessories included. $250 or best offer.')
ink = HexColor('#171B1E')
muted = HexColor('#485158')
c.setFillColor(ink)
c.setFont('FlyerBold', 14)
c.drawString(36, 744, 'FOR SALE')
c.setLineWidth(1.2)
c.line(138, 749, 576, 749)
c.setFont('FlyerBold', 33)
c.drawString(36, 695, 'AUTOMATIC LITTER BOX')
c.setFont('FlyerRegular', 15)
c.setFillColor(muted)
c.drawString(36, 668, 'Well maintained. Will be deep cleaned.')

# Both photos retain their complete frames and original portrait proportions.
c.drawImage(str(root / 'output/listing-photos/IMG_8909-cleaned.jpg'),
            36, 200, width=330, height=440, preserveAspectRatio=True)
c.setFillColor(ink)
c.setFont('FlyerBold', 67)
c.drawString(389, 583, '$250')
c.setFont('FlyerRegular', 17)
c.drawString(390, 556, 'or best offer')
c.setFont('FlyerBold', 18)
c.drawString(390, 517, 'All accessories')
c.drawString(390, 492, 'included.')
c.drawImage(str(root / 'output/listing-photos/IMG_8910-cleaned.jpg'),
            390, 200, width=186, height=248, preserveAspectRatio=True)

c.setStrokeColor(ink)
c.setLineWidth(1)
c.line(36, 175, 576, 175)
c.setFillColor(ink)
c.setFont('FlyerBold', 22)
c.drawString(36, 139, 'Interested? Get in touch.')
c.setFont('FlyerRegular', 15)
c.drawString(36, 103, 'Contact:')
if args.contact:
    contact_size = 18
    while pdfmetrics.stringWidth(args.contact, 'FlyerBold', contact_size) > 462:
        contact_size -= 0.5
    c.setFont('FlyerBold', contact_size)
    c.drawString(111, 103, args.contact)
else:
    c.setLineWidth(0.75)
    c.line(111, 99, 576, 99)

c.setFillColor(muted)
c.setFont('FlyerRegular', 14)
c.drawString(36, 67, 'Located in Forrest Hills')

c.showPage()
c.save()
reader = PdfReader(str(out))
assert len(reader.pages) == 1
assert tuple(float(v) for v in reader.pages[0].mediabox) == (0, 0, 612, 792)
text = reader.pages[0].extract_text()
for expected in ('AUTOMATIC LITTER BOX', '$250', 'or best offer', 'All accessories', 'included.', 'Well maintained. Will be deep cleaned.', 'Located in Forrest Hills'):
    assert expected in text
if args.contact:
    assert args.contact in text
print(out)
print(text)
