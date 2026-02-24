import SwiftUI

struct UserAvatarView: View {
    let name: String?
    let size: CGFloat

    init(name: String?, size: CGFloat = 32) {
        self.name = name
        self.size = size
    }

    private var initial: String {
        guard let name, let first = name.first else { return "?" }
        return String(first).uppercased()
    }

    var body: some View {
        Text(initial)
            .font(.bodyFont(size: size * 0.44, weight: .medium))
            .foregroundStyle(Color.appBackground)
            .frame(width: size, height: size)
            .background(Color.accentColor)
            .clipShape(Circle())
    }
}
