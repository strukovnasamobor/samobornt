import UIKit
import Capacitor

/// The bridge auto-registers the plugins named in the synced config's
/// packageClassList, and with that list present registerPluginType is a
/// silent no-op - so the app-local QuickLook plugin has to be handed to the
/// bridge as an instance, from the one hook that runs right after the bridge
/// exists. SceneDelegate instantiates this class as the root view controller.
class AppViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(QuickLookPlugin())
    }
}
