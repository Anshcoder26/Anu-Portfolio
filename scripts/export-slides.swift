// Exports every page of the portfolio PDF to JPEGs for the web viewer.
// macOS only (uses the built-in PDFKit — no Poppler needed).
//
//   swift scripts/export-slides.swift source/portfolio.pdf
//
// Output:
//   public/slides/01.jpg … NN.jpg   (1920px wide)
//   public/textures/book-cover.jpg  (page 1, 1024px wide, used on the 3D book)
import AppKit
import PDFKit

func fail(_ msg: String) -> Never {
  FileHandle.standardError.write((msg + "\n").data(using: .utf8)!)
  exit(1)
}

guard CommandLine.arguments.count >= 2 else { fail("usage: swift scripts/export-slides.swift <file.pdf>") }
guard let doc = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1])) else {
  fail("could not open PDF")
}

let fm = FileManager.default
try? fm.createDirectory(atPath: "public/slides", withIntermediateDirectories: true)
try? fm.createDirectory(atPath: "public/textures", withIntermediateDirectories: true)

func render(_ page: PDFPage, width: CGFloat, quality: Double, to path: String) {
  let box = page.bounds(for: .mediaBox)
  let scale = width / box.width
  let w = Int(width.rounded())
  let h = Int((box.height * scale).rounded())
  guard let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h, bitsPerSample: 8,
    samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB,
    bytesPerRow: 0, bitsPerPixel: 0),
    let ctx = NSGraphicsContext(bitmapImageRep: rep)
  else { fail("could not allocate bitmap for \(path)") }

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = ctx
  let cg = ctx.cgContext
  cg.interpolationQuality = .high
  cg.setFillColor(NSColor.white.cgColor)
  cg.fill(CGRect(x: 0, y: 0, width: w, height: h))
  cg.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: cg)
  NSGraphicsContext.restoreGraphicsState()

  guard let data = rep.representation(using: .jpeg, properties: [.compressionFactor: quality]) else {
    fail("could not encode \(path)")
  }
  do { try data.write(to: URL(fileURLWithPath: path)) } catch { fail("write failed: \(path): \(error)") }
}

for i in 0..<doc.pageCount {
  guard let page = doc.page(at: i) else { fail("missing page \(i + 1)") }
  let path = String(format: "public/slides/%02d.jpg", i + 1)
  render(page, width: 1920, quality: 0.82, to: path)
  print("✓ \(path)")
}

if let cover = doc.page(at: 0) {
  render(cover, width: 1024, quality: 0.85, to: "public/textures/book-cover.jpg")
  print("✓ public/textures/book-cover.jpg")
}
