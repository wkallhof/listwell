import SwiftUI

struct ScanLineOverlay: View {
    let isActive: Bool

    @State private var offset: CGFloat = -1

    var body: some View {
        if isActive {
            GeometryReader { geo in
                ZStack {
                    Color.black.opacity(0.2)

                    LinearGradient(
                        colors: [
                            .clear,
                            Color.accentColor.opacity(0.3),
                            .clear,
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: geo.size.height * 0.33)
                    .offset(y: offset * geo.size.height)

                    Text("Enhancing...")
                        .font(.bodyFont(size: Typography.body, weight: .medium))
                        .foregroundStyle(.white)
                        .padding(.horizontal, Spacing.lg)
                        .padding(.vertical, Spacing.sm)
                        .background(.black.opacity(0.6))
                        .clipShape(Capsule())
                }
            }
            .allowsHitTesting(false)
            .transition(.opacity)
            .onAppear {
                withAnimation(
                    .easeInOut(duration: 2)
                    .repeatForever(autoreverses: false)
                ) {
                    offset = 1.5
                }
            }
        }
    }
}
