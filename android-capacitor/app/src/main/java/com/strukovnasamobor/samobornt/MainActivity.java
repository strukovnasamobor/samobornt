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
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import androidx.activity.OnBackPressedCallback;
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
                        // the user to instead. Only honoured for the main frame:
                        // the scenes are shown in an iframe (see ArViewer.jsx),
                        // and loadUrl can only replace the whole app with the
                        // fallback, which is the very teardown-and-reload the
                        // iframe exists to avoid. There the button stays inert,
                        // as it does anywhere AR is unavailable.
                        String fallback = intent.getStringExtra("browser_fallback_url");
                        Log.w(TAG, "No app for " + intent.getPackage() + "; falling back to " + fallback);
                        if (fallback != null && request.isForMainFrame()) {
                            view.loadUrl(fallback);
                        }
                    }
                    return true;
                }

                // The app is served from server.url, so on the very first launch
                // with no network there is no service worker yet and nothing
                // cached to answer with - the WebView would otherwise show
                // Chrome's own "webpage not available" error. offline.html is
                // bundled in the APK: it silently retries into the app a few
                // times, which is what lets a cold start find the worker once it
                // has woken, and only shows its message when nothing is cached.
                // Subresource failures are ignored; only the main frame matters.
                @Override
                public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                    if (req != null && req.isForMainFrame()) {
                        Log.w(TAG, "Main frame failed (" + err.getErrorCode() + "), showing offline page");
                        view.loadUrl("file:///android_asset/public/offline.html");
                        return;
                    }
                    super.onReceivedError(view, req, err);
                }
            }
        );

        // System back walks the app's own history and only closes the app once
        // there is nothing left to go back to. Capacitor brings no back handling
        // of its own, so without this every back press quit the app outright.
        //
        // Through the dispatcher rather than onBackPressed(), which is not called
        // at all from Android 15 (targetSdk 35+) now that predictive back is on.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = MainActivity.this.bridge.getWebView();

                // Ask the page first. Moving between pages in the app pushes
                // state rather than loading a document, so the WebView's own
                // back-forward list never sees it and canGoBack() reads false
                // even several pages deep; only the router knows. It answers
                // "true" when it went back (see window.samobornt.goBack in
                // App.jsx), and anything else means it had nowhere to go.
                webView.evaluateJavascript(
                    "window.samobornt && window.samobornt.goBack ? window.samobornt.goBack() : false",
                    value -> {
                        if ("true".equals(value)) return;

                        // A page outside the app, the privacy policy say, is a
                        // real document and does show up in the WebView's history.
                        if (webView.canGoBack()) {
                            webView.goBack();
                            return;
                        }

                        // Nowhere left to go: let the system do what it would
                        // have done and close the app.
                        setEnabled(false);
                        getOnBackPressedDispatcher().onBackPressed();
                    }
                );
            }
        });

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
