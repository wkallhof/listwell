import SwiftUI
import PhotosUI

struct CaptureView: View {
    @Bindable var viewModel: NewListingViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var showCamera = false
    @State private var showPhotoPicker = false
    @State private var capturedImage: UIImage?
    @State private var selectedPhotos: [PhotosPickerItem] = []

    var onNext: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: Spacing.xl) {
                    PhotoGridView(
                        images: viewModel.selectedImages,
                        canAddMore: viewModel.canAddMore,
                        onRemove: { viewModel.removeImage(at: $0) },
                        onAddTapped: { showPhotoPicker = true }
                    )

                    captureButtons

                    Text("Add 3-5 photos from different angles for best results")
                        .font(.system(size: Typography.caption))
                        .foregroundStyle(Color.mutedForeground)
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, Sizing.pagePadding)
                .padding(.vertical, Spacing.lg)
            }

            bottomBar
        }
        .navigationTitle("Add Photos")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button { dismiss() } label: {
                    Image(systemName: "chevron.left")
                        .foregroundStyle(Color.appForeground)
                }
            }
        }
        .sheet(isPresented: $showCamera) {
            CameraView(capturedImage: $capturedImage)
                .ignoresSafeArea()
        }
        .photosPicker(
            isPresented: $showPhotoPicker,
            selection: $selectedPhotos,
            maxSelectionCount: max(0, APIConfig.maxPhotos - viewModel.selectedImages.count),
            matching: .images
        )
        .sensoryFeedback(.selection, trigger: viewModel.selectedImages.count)
        .onChange(of: capturedImage) { _, newImage in
            if let image = newImage {
                viewModel.addImage(image)
                capturedImage = nil
            }
        }
        .onChange(of: selectedPhotos) { _, newItems in
            Task {
                for item in newItems {
                    if let data = try? await item.loadTransferable(type: Data.self),
                       let image = UIImage(data: data) {
                        viewModel.addImage(image)
                    }
                }
                selectedPhotos = []
            }
        }
    }

    // MARK: - Capture Buttons

    private var captureButtons: some View {
        HStack(spacing: Spacing.md) {
            Button {
                showCamera = true
            } label: {
                Label("Take Photo", systemImage: "camera")
                    .font(.system(size: Typography.body, weight: .medium))
                    .frame(maxWidth: .infinity)
                    .frame(height: Sizing.minTapTarget)
                    .background(Color.secondaryBackground)
                    .foregroundStyle(Color.secondaryForeground)
                    .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
            }

            Button {
                showPhotoPicker = true
            } label: {
                Label("Choose from Library", systemImage: "photo.badge.plus")
                    .font(.system(size: Typography.body, weight: .medium))
                    .frame(maxWidth: .infinity)
                    .frame(height: Sizing.minTapTarget)
                    .background(Color.secondaryBackground)
                    .foregroundStyle(Color.secondaryForeground)
                    .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
            }
        }
    }

    // MARK: - Bottom Bar

    private var bottomBar: some View {
        VStack(spacing: 0) {
            Divider()
            Button {
                onNext()
            } label: {
                Text("Next — \(viewModel.selectedImages.count) photo\(viewModel.selectedImages.count == 1 ? "" : "s")")
                    .font(.system(size: Typography.body, weight: .semibold))
                    .frame(maxWidth: .infinity)
                    .frame(height: Sizing.minTapTarget)
                    .background(viewModel.canProceed ? Color.accentColor : Color.mutedBackground)
                    .foregroundStyle(viewModel.canProceed ? .white : Color.mutedForeground)
                    .clipShape(RoundedRectangle(cornerRadius: CornerRadius.default))
            }
            .disabled(!viewModel.canProceed)
            .padding(.horizontal, Sizing.pagePadding)
            .padding(.vertical, Spacing.md)
        }
        .background(Color.appBackground.opacity(0.8))
    }
}
