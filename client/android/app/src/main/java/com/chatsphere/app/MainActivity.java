package com.chatsphere.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * The web app (Chat.jsx / Call.jsx / CallScreen.jsx / AudioRecorder.jsx /
 * LocationPicker.jsx) calls standard browser APIs: getUserMedia() for
 * calls and voice messages, and navigator.geolocation for location
 * sharing. A plain Android WebView does not automatically turn those JS
 * calls into real OS permission prompts - this bridging code is what
 * makes that happen. No JS/React code changes were needed for this; it
 * is purely native-side plumbing.
 */
public class MainActivity extends BridgeActivity {

    private static final int MEDIA_PERMISSION_REQUEST_CODE = 6001;
    private static final int LOCATION_PERMISSION_REQUEST_CODE = 6002;

    private PermissionRequest pendingMediaRequest;
    private GeolocationPermissions.Callback pendingGeoCallback;
    private String pendingGeoOrigin;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = this.bridge.getWebView();
        final WebChromeClient defaultClient = webView.getWebChromeClient();

        webView.setWebChromeClient(new WebChromeClient() {

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    List<String> resources = Arrays.asList(request.getResources());
                    List<String> androidPermissions = new ArrayList<>();

                    if (resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                        androidPermissions.add(Manifest.permission.CAMERA);
                    }
                    if (resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                        androidPermissions.add(Manifest.permission.RECORD_AUDIO);
                    }

                    if (androidPermissions.isEmpty()) {
                        request.grant(request.getResources());
                        return;
                    }

                    List<String> toRequest = new ArrayList<>();
                    for (String permission : androidPermissions) {
                        if (ContextCompat.checkSelfPermission(MainActivity.this, permission)
                                != PackageManager.PERMISSION_GRANTED) {
                            toRequest.add(permission);
                        }
                    }

                    if (toRequest.isEmpty()) {
                        request.grant(request.getResources());
                    } else {
                        pendingMediaRequest = request;
                        ActivityCompat.requestPermissions(
                                MainActivity.this,
                                toRequest.toArray(new String[0]),
                                MEDIA_PERMISSION_REQUEST_CODE
                        );
                    }
                });
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                boolean fineGranted = ContextCompat.checkSelfPermission(MainActivity.this,
                        Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
                boolean coarseGranted = ContextCompat.checkSelfPermission(MainActivity.this,
                        Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;

                if (fineGranted || coarseGranted) {
                    callback.invoke(origin, true, false);
                } else {
                    pendingGeoCallback = callback;
                    pendingGeoOrigin = origin;
                    ActivityCompat.requestPermissions(
                            MainActivity.this,
                            new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION},
                            LOCATION_PERMISSION_REQUEST_CODE
                    );
                }
            }

            // Keep Capacitor's built-in file chooser handling so the existing
            // FileUpload.jsx / ImageUpload.jsx <input type="file"> pickers keep working.
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                              FileChooserParams fileChooserParams) {
                if (defaultClient != null) {
                    return defaultClient.onShowFileChooser(webView, filePathCallback, fileChooserParams);
                }
                return super.onShowFileChooser(webView, filePathCallback, fileChooserParams);
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == MEDIA_PERMISSION_REQUEST_CODE && pendingMediaRequest != null) {
            boolean allGranted = grantResults.length > 0;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            if (allGranted) {
                pendingMediaRequest.grant(pendingMediaRequest.getResources());
            } else {
                pendingMediaRequest.deny();
            }
            pendingMediaRequest = null;

        } else if (requestCode == LOCATION_PERMISSION_REQUEST_CODE && pendingGeoCallback != null) {
            boolean granted = false;
            for (int result : grantResults) {
                if (result == PackageManager.PERMISSION_GRANTED) {
                    granted = true;
                    break;
                }
            }
            pendingGeoCallback.invoke(pendingGeoOrigin, granted, false);
            pendingGeoCallback = null;
            pendingGeoOrigin = null;
        }
    }
}
