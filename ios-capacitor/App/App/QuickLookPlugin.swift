import Foundation
import Capacitor
import QuickLook
import ARKit
import UIKit

/// Presents USDZ models in Apple's AR Quick Look and keeps a local cache of
/// them so AR works offline. AR Quick Look cannot run inside the WKWebView
/// itself (WebKit's System Preview is only enabled in Safari), which is why
/// the web side hands the model URL to this plugin instead.
///
/// Registered from AppViewController.capacitorDidLoad(): autoRegisterPlugins
/// is on (the synced config carries a packageClassList), which turns
/// registerPluginType into a no-op - registerPluginInstance is the only
/// working path for an app-local plugin, and that requires CAPInstancePlugin.
@objc(QuickLookPlugin)
public class QuickLookPlugin: CAPInstancePlugin, CAPBridgedPlugin {
    public let identifier = "QuickLookPlugin"
    public let jsName = "QuickLook"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "prefetch", returnType: CAPPluginReturnPromise)
    ]

    // MARK: - Cache

    // Library/Caches/ar-usdz/<lastPathComponent>. The model filenames are
    // unique across scenes, so the filename alone is a sufficient key. Caches
    // may be purged by iOS under storage pressure; open() transparently
    // re-downloads and the JS prefetch re-fills missing files on next launch.
    private static func cacheDirectory() -> URL {
        let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        return caches.appendingPathComponent("ar-usdz", isDirectory: true)
    }

    private static func cachedFileURL(for remote: URL) -> URL {
        cacheDirectory().appendingPathComponent(remote.lastPathComponent)
    }

    /// Hands back the cached file, downloading it first when missing.
    /// The completion runs on an arbitrary queue.
    private func fetchIfNeeded(_ remote: URL, completion: @escaping (Result<URL, Error>) -> Void) {
        let destination = Self.cachedFileURL(for: remote)
        if FileManager.default.fileExists(atPath: destination.path) {
            completion(.success(destination))
            return
        }
        let task = URLSession.shared.downloadTask(with: remote) { tempURL, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let tempURL = tempURL,
                  let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                completion(.failure(URLError(.badServerResponse)))
                return
            }
            do {
                // The temp file is deleted when this closure returns, so it
                // has to be moved into place here and now.
                try FileManager.default.createDirectory(
                    at: Self.cacheDirectory(), withIntermediateDirectories: true)
                try? FileManager.default.removeItem(at: destination)
                try FileManager.default.moveItem(at: tempURL, to: destination)
                completion(.success(destination))
            } catch {
                completion(.failure(error))
            }
        }
        task.resume()
    }

    // MARK: - open(url, shareUrl)

    // QLPreviewController holds its dataSource and delegate weakly, so this
    // session object - and through it the preview item and the file URL - must
    // be strongly held by the plugin until the preview is dismissed. Dropping
    // it early leaves Quick Look showing an empty gray sheet.
    private class PreviewSession: NSObject, QLPreviewControllerDataSource, QLPreviewControllerDelegate {
        let item: ARQuickLookPreviewItem
        var onDismiss: (() -> Void)?

        init(fileURL: URL, shareURL: URL?) {
            let previewItem = ARQuickLookPreviewItem(fileAt: fileURL)
            // The share sheet inside Quick Look shares this page, not the
            // local file.
            previewItem.canonicalWebPageURL = shareURL
            self.item = previewItem
        }

        func numberOfPreviewItems(in controller: QLPreviewController) -> Int { 1 }

        func previewController(_ controller: QLPreviewController,
                               previewItemAt index: Int) -> QLPreviewItem { item }

        func previewControllerDidDismiss(_ controller: QLPreviewController) {
            onDismiss?()
        }
    }

    private var activeSession: PreviewSession?

    @objc func open(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"),
              let remote = URL(string: urlString),
              remote.scheme == "https" || remote.scheme == "http" else {
            call.reject("Must provide a valid http(s) url", "BAD_URL")
            return
        }
        let shareURL = call.getString("shareUrl").flatMap { URL(string: $0) }

        fetchIfNeeded(remote) { [weak self] result in
            switch result {
            case .success(let fileURL):
                self?.present(fileURL: fileURL, shareURL: shareURL, call: call)
            case .failure(let error):
                // fetchIfNeeded only fails when the file was not cached, so
                // this is a download failure - being offline is the expected
                // reason, and OFFLINE_UNCACHED is the code the web side can
                // branch on.
                let urlErrorCode = (error as? URLError)?.code
                if urlErrorCode == .notConnectedToInternet
                    || urlErrorCode == .networkConnectionLost
                    || urlErrorCode == .dataNotAllowed {
                    call.reject("Model is not cached and the device is offline", "OFFLINE_UNCACHED")
                } else {
                    call.reject("Could not download model: \(error.localizedDescription)", "DOWNLOAD_FAILED")
                }
            }
        }
    }

    private func present(fileURL: URL, shareURL: URL?, call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let host = self.bridge?.viewController else {
                call.reject("No view controller to present from", "NO_VIEW_CONTROLLER")
                return
            }
            let session = PreviewSession(fileURL: fileURL, shareURL: shareURL)
            session.onDismiss = { [weak self] in
                self?.activeSession = nil
            }
            self.activeSession = session

            let controller = QLPreviewController()
            controller.dataSource = session
            controller.delegate = session
            host.present(controller, animated: true) {
                // Resolved on presentation rather than dismissal, matching
                // Browser.open's semantics on the web side.
                call.resolve()
            }
        }
    }

    // MARK: - prefetch(urls)

    @objc func prefetch(_ call: CAPPluginCall) {
        guard let urlStrings = call.getArray("urls", String.self) else {
            call.reject("Must provide urls", "BAD_URL")
            return
        }
        let remotes = urlStrings.compactMap { URL(string: $0) }
            .filter { $0.scheme == "https" || $0.scheme == "http" }

        // Only what is actually missing counts: with everything cached this
        // resolves with total 0 and emits no events, which is what lets the
        // web side show its download toast only when bytes really move.
        let missing = remotes.filter {
            !FileManager.default.fileExists(atPath: Self.cachedFileURL(for: $0).path)
        }
        let total = missing.count
        guard total > 0 else {
            call.resolve(["completed": 0, "total": 0, "failed": 0])
            return
        }

        // Sequential rather than parallel: tens of MB through one connection
        // is kinder to whatever else is loading, and keeps "completed of
        // total" honest.
        var completed = 0
        var failed = 0

        func next(_ index: Int) {
            guard index < missing.count else {
                call.resolve(["completed": completed, "total": total, "failed": failed])
                return
            }
            fetchIfNeeded(missing[index]) { [weak self] result in
                switch result {
                case .success: completed += 1
                case .failure: failed += 1
                }
                self?.notifyListeners("prefetchProgress", data: [
                    "completed": completed + failed,
                    "total": total
                ])
                next(index + 1)
            }
        }
        next(0)
    }
}
