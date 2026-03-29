import SwiftUI

struct SplashView: View {
    var body: some View {
        ZStack {
            Color.appBackground
                .ignoresSafeArea()

            Text("Listwell")
                .font(.display(size: Typography.pageTitle, weight: .bold))
                .foregroundStyle(Color.appForeground)
        }
    }
}

#Preview {
    SplashView()
}
