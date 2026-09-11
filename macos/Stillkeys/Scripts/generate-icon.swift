import AppKit
import Foundation

// Original vector artwork, rasterized at each size for the macOS asset catalog.
let output = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
let sizes = [(16, 1), (16, 2), (32, 1), (32, 2), (128, 1), (128, 2), (256, 1), (256, 2), (512, 1), (512, 2)]
var entries: [[String: String]] = []
for (points, scale) in sizes {
    let pixels = points * scale
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: pixels, pixelsHigh: pixels, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    let context = NSGraphicsContext(bitmapImageRep: rep)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = context
    context.cgContext.scaleBy(x: CGFloat(pixels)/1024, y: CGFloat(pixels)/1024)
    let plate = NSBezierPath(roundedRect: NSRect(x: 100, y: 100, width: 824, height: 824), xRadius: 190, yRadius: 190)
    NSGraphicsContext.saveGraphicsState()
    let shadow = NSShadow(); shadow.shadowColor = NSColor.black.withAlphaComponent(0.22); shadow.shadowBlurRadius = 24; shadow.shadowOffset = NSSize(width: 0, height: -12); shadow.set()
    NSColor(calibratedRed: 0.67, green: 0.60, blue: 0.90, alpha: 1).setFill(); plate.fill()
    NSGraphicsContext.restoreGraphicsState()
    NSGradient(starting: NSColor(calibratedRed: 0.68, green: 0.60, blue: 0.91, alpha: 1), ending: NSColor(calibratedRed: 0.88, green: 0.84, blue: 1, alpha: 1))!.draw(in: plate, angle: 85)
    NSColor.white.withAlphaComponent(0.45).setStroke(); plate.lineWidth = 3; plate.stroke()
    let cap = NSBezierPath(roundedRect: NSRect(x: 245, y: 255, width: 520, height: 510), xRadius: 110, yRadius: 110)
    NSGraphicsContext.saveGraphicsState()
    let capShadow = NSShadow(); capShadow.shadowColor = NSColor(calibratedRed: 0.24, green: 0.13, blue: 0.48, alpha: 0.22); capShadow.shadowBlurRadius = 25; capShadow.shadowOffset = NSSize(width: 0, height: -14); capShadow.set()
    NSColor(calibratedRed: 0.94, green: 0.92, blue: 1, alpha: 1).setFill(); cap.fill()
    NSGraphicsContext.restoreGraphicsState()
    NSColor.white.withAlphaComponent(0.8).setStroke(); cap.lineWidth = 4; cap.stroke()
    NSColor(calibratedRed: 0.36, green: 0.25, blue: 0.61, alpha: 1).setFill()
    for x in [395, 535] { NSBezierPath(roundedRect: NSRect(x: x, y: 385, width: 84, height: 240), xRadius: 26, yRadius: 26).fill() }
    let star = NSBezierPath()
    star.move(to: NSPoint(x: 770, y: 880))
    star.curve(to: NSPoint(x: 890, y: 760), controlPoint1: NSPoint(x: 790, y: 785), controlPoint2: NSPoint(x: 795, y: 780))
    star.curve(to: NSPoint(x: 770, y: 640), controlPoint1: NSPoint(x: 795, y: 740), controlPoint2: NSPoint(x: 790, y: 735))
    star.curve(to: NSPoint(x: 650, y: 760), controlPoint1: NSPoint(x: 750, y: 735), controlPoint2: NSPoint(x: 745, y: 740))
    star.curve(to: NSPoint(x: 770, y: 880), controlPoint1: NSPoint(x: 745, y: 780), controlPoint2: NSPoint(x: 750, y: 785))
    NSColor(calibratedRed: 0.32, green: 0.22, blue: 0.55, alpha: 1).setFill(); star.fill()
    NSGraphicsContext.restoreGraphicsState()
    let file = "icon_\(points)x\(points)@\(scale)x.png"
    try rep.representation(using: .png, properties: [:])!.write(to: output.appendingPathComponent(file))
    entries.append(["filename": file, "idiom": "mac", "scale": "\(scale)x", "size": "\(points)x\(points)"])
}
let catalog: [String: Any] = ["images": entries, "info": ["author": "xcode", "version": 1]]
try JSONSerialization.data(withJSONObject: catalog, options: [.prettyPrinted, .sortedKeys]).write(to: output.appendingPathComponent("Contents.json"))
