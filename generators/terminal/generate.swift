import AppKit
import Foundation

struct DesignTokens: Decodable {
    let variant_order: [String]
}

struct Variant: Decodable {
    let id: String
    let name: String
    let palette: [String: String]
}

enum GeneratorError: Error, CustomStringConvertible {
    case invalidColor(String)
    case invalidProfile(String)

    var description: String {
        switch self {
        case .invalidColor(let color):
            return "Invalid six-digit color: \(color)"
        case .invalidProfile(let reason):
            return "Generated Terminal profile failed validation: \(reason)"
        }
    }
}

func color(_ hex: String, alpha: CGFloat = 1) throws -> NSColor {
    guard hex.hasPrefix("#"), hex.count == 7,
          let value = UInt32(hex.dropFirst(), radix: 16) else {
        throw GeneratorError.invalidColor(hex)
    }

    return NSColor(
        srgbRed: CGFloat((value >> 16) & 0xff) / 255,
        green: CGFloat((value >> 8) & 0xff) / 255,
        blue: CGFloat(value & 0xff) / 255,
        alpha: alpha
    )
}

func paletteColor(_ palette: [String: String], _ key: String) throws -> String {
    guard let hex = palette[key] else {
        throw GeneratorError.invalidProfile("missing \(key)")
    }
    return hex
}

func archive(_ object: Any) throws -> Data {
    try NSKeyedArchiver.archivedData(withRootObject: object, requiringSecureCoding: false)
}

func main() throws {
    guard CommandLine.arguments.count == 2 else {
        throw GeneratorError.invalidProfile("usage: generate.swift <repository-root>")
    }

    let root = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
    let tokenURL = root.appendingPathComponent("design/tokens.json")
    let tokenData = try Data(contentsOf: tokenURL)
    let tokens = try JSONDecoder().decode(DesignTokens.self, from: tokenData)
    let output = root.appendingPathComponent("themes/terminal", isDirectory: true)
    try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)

    let ansiNames: [(String, String)] = [
        ("ANSIBlackColor", "ansi.black"),
        ("ANSIRedColor", "ansi.red"),
        ("ANSIGreenColor", "ansi.green"),
        ("ANSIYellowColor", "ansi.yellow"),
        ("ANSIBlueColor", "ansi.blue"),
        ("ANSIMagentaColor", "ansi.magenta"),
        ("ANSICyanColor", "ansi.cyan"),
        ("ANSIWhiteColor", "ansi.white"),
        ("ANSIBrightBlackColor", "ansi.bright_black"),
        ("ANSIBrightRedColor", "ansi.bright_red"),
        ("ANSIBrightGreenColor", "ansi.bright_green"),
        ("ANSIBrightYellowColor", "ansi.bright_yellow"),
        ("ANSIBrightBlueColor", "ansi.bright_blue"),
        ("ANSIBrightMagentaColor", "ansi.bright_magenta"),
        ("ANSIBrightCyanColor", "ansi.bright_cyan"),
        ("ANSIBrightWhiteColor", "ansi.bright_white"),
    ]

    for id in tokens.variant_order {
        let variantURL = root.appendingPathComponent("design/variants/\(id).json")
        let variant = try JSONDecoder().decode(Variant.self, from: Data(contentsOf: variantURL))
        let primaryBackground = try paletteColor(variant.palette, "background.primary")
        let primaryForeground = try paletteColor(variant.palette, "foreground.primary")
        let selection = try paletteColor(variant.palette, "selection.background")
        let cursor = try paletteColor(variant.palette, "syntax.type")
        var profile: [String: Any] = [
            "name": variant.name,
            "type": "Window Settings",
            "ProfileCurrentVersion": 2.01,
            "Font": try archive(NSFont.monospacedSystemFont(ofSize: 13, weight: .regular)),
            "FontAntialias": true,
            "FontWidthSpacing": 1.0,
            "columnCount": 100,
            "rowCount": 32,
            "BackgroundColor": try archive(color(primaryBackground)),
            "TextColor": try archive(color(primaryForeground)),
            "BoldTextColor": try archive(color(primaryForeground)),
            "SelectionColor": try archive(color(selection, alpha: 0.58)),
            "CursorColor": try archive(color(cursor)),
            "CursorTextColor": try archive(color(primaryBackground)),
        ]

        for (profileKey, paletteKey) in ansiNames {
            let hex = try paletteColor(variant.palette, paletteKey)
            profile[profileKey] = try archive(color(hex))
        }

        let data = try PropertyListSerialization.data(
            fromPropertyList: profile,
            format: .xml,
            options: 0
        )
        let url = output.appendingPathComponent("\(variant.name).terminal")
        try data.write(to: url, options: .atomic)

        let plist = try PropertyListSerialization.propertyList(from: data, options: [], format: nil)
        guard let decoded = plist as? [String: Any] else {
            throw GeneratorError.invalidProfile("profile root is not a dictionary")
        }
        for key in ansiNames.map(\.0) + [
            "BackgroundColor", "TextColor", "BoldTextColor",
            "SelectionColor", "CursorColor", "CursorTextColor", "Font",
        ] {
            guard let archived = decoded[key] as? Data else {
                throw GeneratorError.invalidProfile("missing archived value for \(key)")
            }
            if key == "Font" {
                guard try NSKeyedUnarchiver.unarchivedObject(ofClass: NSFont.self, from: archived) != nil else {
                    throw GeneratorError.invalidProfile("invalid archived font")
                }
            } else {
                guard try NSKeyedUnarchiver.unarchivedObject(ofClass: NSColor.self, from: archived) != nil else {
                    throw GeneratorError.invalidProfile("invalid archived color \(key)")
                }
            }
        }
        print("Generated and checked \(url.lastPathComponent)")
    }
}

do {
    try main()
} catch {
    fputs("Terminal profile generation failed: \(error)\n", stderr)
    exit(1)
}
