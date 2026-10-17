import SwiftUI

@MainActor
protocol AccountLoading {
    associatedtype Value: Identifiable
    func load() async throws -> Value
}

struct AccountView<Model: AccountLoading>: View {
    @State private var account: Model.Value?
    @State private var message = "Awaiting account"

    let loader: Model

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(account?.id.description ?? message)
                .font(.headline)
            Button("Refresh") {
                Task {
                    do {
                        account = try await loader.load()
                    } catch {
                        message = "Unable to load: \(error.localizedDescription)"
                    }
                }
            }
        }
    }
}
