package com.curolia.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Render behind system bars; web content applies its own safe-area offsets.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);

        super.onCreate(savedInstanceState);
        installSafeAreaInsetsBridge();
    }

    private void installSafeAreaInsetsBridge() {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }

        View root = (View) getBridge().getWebView().getParent();
        if (root == null) {
            return;
        }

        ViewCompat.setOnApplyWindowInsetsListener(root, (view, insets) -> {
            Insets safe = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            injectSafeAreaCss(safe);
            return insets;
        });

        root.requestApplyInsets();
    }

    private void injectSafeAreaCss(Insets safe) {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }

        float density = getResources().getDisplayMetrics().density;
        int top = Math.round(safe.top / density);
        int right = Math.round(safe.right / density);
        int bottom = Math.round(safe.bottom / density);
        int left = Math.round(safe.left / density);

        String script =
            "try {" +
            "document.documentElement.style.setProperty('--safe-area-inset-top', '" + top + "px');" +
            "document.documentElement.style.setProperty('--safe-area-inset-right', '" + right + "px');" +
            "document.documentElement.style.setProperty('--safe-area-inset-bottom', '" + bottom + "px');" +
            "document.documentElement.style.setProperty('--safe-area-inset-left', '" + left + "px');" +
            "} catch (e) {}";

        getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(script, null));
    }
}
