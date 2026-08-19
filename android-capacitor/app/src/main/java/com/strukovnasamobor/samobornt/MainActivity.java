package com.strukovnasamobor.samobornt;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
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

        // Android 15+ (targetSdk >= 35) forces edge-to-edge. Pad the app's own
        // layout rather than the content root, so the strips behind the system
        // bars stay clear of the WebView: the navigation bar then shows the
        // theme's window background, i.e. whatever the system would use anyway.
        final ViewGroup content = findViewById(android.R.id.content);
        final View appLayout = content.getChildAt(0);

        // The status bar strip is the one exception, painted in the header's own
        // colour. It is a view rather than a window attribute because
        // setStatusBarColor() is ignored from API 35, and windowBackground would
        // take the navigation bar with it.
        final View statusBarStrip = new View(this);
        statusBarStrip.setBackgroundColor(ContextCompat.getColor(this, R.color.statusBar));
        content.addView(
            statusBarStrip,
            new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, 0, Gravity.TOP)
        );

        ViewCompat.setOnApplyWindowInsetsListener(
            content,
            (v, insets) -> {
                Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
                appLayout.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                statusBarStrip.getLayoutParams().height = bars.top;
                statusBarStrip.requestLayout();
                return WindowInsetsCompat.CONSUMED;
            }
        );

        applyStatusBarIcons();

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

    /**
     * White status bar icons, to read against the dark red strip behind them.
     * Capacitor's built-in SystemBars plugin sets this from the system theme
     * when it loads and again on every configuration change, so this has to run
     * after both - and it only touches the status bar, leaving the navigation
     * bar's icons to the system.
     */
    private void applyStatusBarIcons() {
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView()).setAppearanceLightStatusBars(false);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        applyStatusBarIcons();
    }
}
