package com.strukovnasamobor.samobornt;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.net.URISyntaxException;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "SamoborNT";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Disable Android's auto-applied translucent scrim on the system bars,
        // otherwise the nav bar area looks grey even though windowBackground is
        // black. Requires API 29+ (Android 10+).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
            getWindow().setStatusBarContrastEnforced(false);
        }

        // Android 15+ (targetSdk >= 35) forces edge-to-edge. Pad the WebView so it
        // doesn't draw under system bars; the bar areas then show the activity
        // theme's window background instead of overlaying our content with a scrim.
        ViewCompat.setOnApplyWindowInsetsListener(
            findViewById(android.R.id.content),
            (v, insets) -> {
                Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return WindowInsetsCompat.CONSUMED;
            }
        );

        // <model-viewer> launches AR by navigating to an intent:// URL for Scene
        // Viewer. Capacitor's own client sends every off-origin navigation to
        // `new Intent(ACTION_VIEW, url)`, which cannot express an intent:// URL:
        // no activity matches it, the ActivityNotFoundException is swallowed, and
        // the AR button does nothing but log "Attempting to present in AR with
        // Scene Viewer...". Parse those URLs properly and start what they name.
        this.bridge.setWebViewClient(
            new BridgeWebViewClient(this.bridge) {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    String url = request.getUrl().toString();
                    if (!url.startsWith("intent://")) {
                        return super.shouldOverrideUrlLoading(view, request);
                    }

                    Intent intent;
                    try {
                        intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                    } catch (URISyntaxException e) {
                        Log.w(TAG, "Unparseable intent URL: " + url, e);
                        return true;
                    }

                    try {
                        startActivity(intent);
                    } catch (ActivityNotFoundException e) {
                        // Scene Viewer missing (no Play services for AR, or a
                        // device without it): the intent carries the page to send
                        // the user to instead.
                        String fallback = intent.getStringExtra("browser_fallback_url");
                        Log.w(TAG, "No app for " + intent.getPackage() + "; falling back to " + fallback);
                        if (fallback != null) {
                            view.loadUrl(fallback);
                        }
                    }
                    return true;
                }
            }
        );

        // Force-dark OFF so Samsung Internet / Android WebView cannot auto-invert.
        WebSettings s = this.bridge.getWebView().getSettings();
        if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
            WebSettingsCompat.setForceDark(s, WebSettingsCompat.FORCE_DARK_OFF);
        }
        if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK_STRATEGY)) {
            WebSettingsCompat.setForceDarkStrategy(
                s, WebSettingsCompat.DARK_STRATEGY_WEB_THEME_DARKENING_ONLY
            );
        }
    }
}
