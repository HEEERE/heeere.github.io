package io.heeere.garden;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.view.WindowManager;
import android.webkit.*;
import android.widget.Toast;
import java.io.*;
import java.util.*;
import org.json.JSONObject;

/** Offline bundled garden. Only the app's HTTPS origin is allowed in this WebView. */
public final class GardenActivity extends Activity {
  private static final String HOST = "appassets.androidplatform.net";
  private static final String START = "https://" + HOST + "/vault/index.html";
  private WebView web;
  private ValueCallback<Uri[]> fileCallback;
  private byte[] exportBytes;
  private final ArrayDeque<String> shares = new ArrayDeque<>();
  private boolean documentPicker;
  private boolean wasBackgrounded;

  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
    getWindow().setStatusBarColor(Color.rgb(10, 14, 11));
    getWindow().setNavigationBarColor(Color.rgb(10, 14, 11));
    web = new WebView(this);
    web.setBackgroundColor(Color.rgb(10, 14, 11));
    setContentView(web);
    WebSettings settings = web.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(true);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    settings.setSupportMultipleWindows(false);
    CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
    web.addJavascriptInterface(new Bridge(), "GardenNative");
    web.setWebViewClient(new WebViewClient() {
      @Override public void onPageFinished(WebView view, String url) {
        view.evaluateJavascript("typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' && typeof crypto.subtle !== 'undefined'", value -> {
          if (!"true".equals(value)) new AlertDialog.Builder(GardenActivity.this).setTitle("请更新系统 WebView").setMessage("庭院需要较新版 Android System WebView 才能安全加密。请在手机应用商店更新 WebView 后重新打开。").setPositiveButton("知道了", (d,w) -> {}).show();
        });
      }
      @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        if (!HOST.equals(uri.getHost())) return null;
        if (!"https".equals(uri.getScheme())) return missing();
        String path = uri.getPath();
        if (path == null || path.contains("..") || path.contains("\\")) return missing();
        if (path.endsWith("/")) path += "index.html";
        try {
          String mime = path.endsWith(".js") ? "application/javascript" : path.endsWith(".css") ? "text/css" : path.endsWith(".html") ? "text/html" : path.endsWith(".png") ? "image/png" : path.endsWith(".woff2") ? "font/woff2" : "application/octet-stream";
          Map<String,String> headers = new HashMap<>();
          headers.put("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self'; connect-src 'self' blob: https://api.github.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'");
          headers.put("X-Content-Type-Options", "nosniff");
          return new WebResourceResponse(mime, "UTF-8", 200, "OK", headers, getAssets().open("www" + path));
        } catch (IOException error) { return missing(); }
      }
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        if (HOST.equals(uri.getHost()) && "https".equals(uri.getScheme()) && "/vault/index.html".equals(uri.getPath())) return false;
        if (HOST.equals(uri.getHost())) {
          if ("/".equals(uri.getPath())) openExternal(Uri.parse("https://heeere.github.io/"));
          return true;
        }
        if (request.isForMainFrame()) openExternal(uri);
        return true;
      }
    });
    web.setWebChromeClient(new WebChromeClient() {
      @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        fileCallback = callback;
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
        String[] types = params.getAcceptTypes();
        String[] mimeTypes = Arrays.stream(types).filter(type -> type.contains("/")).toArray(String[]::new);
        if (mimeTypes.length > 0) intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
        documentPicker = true;
        try { startActivityForResult(intent, 41); }
        catch (Exception error) { documentPicker = false; fileCallback.onReceiveValue(null); fileCallback = null; toast("无法打开文件选择器"); }
        return true;
      }
      @Override public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
        new AlertDialog.Builder(GardenActivity.this).setMessage(message).setPositiveButton("确定", (d,w) -> result.confirm()).setNegativeButton("取消", (d,w) -> result.cancel()).setOnCancelListener(d -> result.cancel()).show();
        return true;
      }
      @Override public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
        new AlertDialog.Builder(GardenActivity.this).setMessage(message).setPositiveButton("知道了", (d,w) -> result.confirm()).setOnCancelListener(d -> result.confirm()).show();
        return true;
      }
    });
    receiveShare(getIntent());
    web.loadUrl(START);
  }

  private WebResourceResponse missing() {
    return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
  }

  private void openExternal(Uri uri) {
    if (!Arrays.asList("https", "http", "mailto").contains(uri.getScheme())) return;
    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
    catch (Exception error) { toast("没有可打开此链接的应用"); }
  }

  private void toast(String message) { runOnUiThread(() -> Toast.makeText(this, message, Toast.LENGTH_LONG).show()); }
  private void event(String name) { web.evaluateJavascript("window.dispatchEvent(new Event('" + name + "'))", null); }

  private void receiveShare(Intent intent) {
    if (!Intent.ACTION_SEND.equals(intent.getAction()) || !"text/plain".equals(intent.getType())) return;
    CharSequence text = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
    if (text == null) return;
    try {
      JSONObject payload = new JSONObject();
      payload.put("title", intent.getStringExtra(Intent.EXTRA_SUBJECT));
      payload.put("text", text.toString().substring(0, Math.min(text.length(), 200000)));
      synchronized (shares) { shares.add(payload.toString()); }
    } catch (Exception ignored) { toast("无法读取分享内容"); }
    // Shared plaintext is held only in memory until the user saves an encrypted record.
    intent.removeExtra(Intent.EXTRA_TEXT);
    intent.removeExtra(Intent.EXTRA_SUBJECT);
  }

  @Override protected void onNewIntent(Intent intent) { super.onNewIntent(intent); setIntent(intent); receiveShare(intent); event("garden-share"); }
  @Override protected void onStop() {
    super.onStop();
    if (!documentPicker) { wasBackgrounded = true; event("garden-lock"); }
  }
  @Override protected void onResume() {
    super.onResume();
    if (web != null && wasBackgrounded) { event("garden-lock"); wasBackgrounded = false; }
  }
  @Override public void onBackPressed() { event("garden-back"); }

  @Override protected void onActivityResult(int code, int result, Intent data) {
    super.onActivityResult(code, result, data);
    documentPicker = false;
    if (code == 41 && fileCallback != null) {
      ArrayList<Uri> uris = new ArrayList<>();
      if (result == RESULT_OK && data != null) {
        if (data.getClipData() != null) for (int i = 0; i < data.getClipData().getItemCount(); i++) uris.add(data.getClipData().getItemAt(i).getUri());
        else if (data.getData() != null) uris.add(data.getData());
      }
      fileCallback.onReceiveValue(uris.isEmpty() ? null : uris.toArray(new Uri[0]));
      fileCallback = null;
    }
    if (code == 42) {
      byte[] bytes = exportBytes;
      exportBytes = null;
      if (result == RESULT_OK && data != null && data.getData() != null && bytes != null) {
        final Uri output = data.getData();
        new Thread(() -> {
          try (OutputStream stream = getContentResolver().openOutputStream(output)) {
            if (stream == null) throw new IOException("No output");
            stream.write(bytes);
            toast("文件已保存");
          } catch (Exception error) { toast("保存失败，请重新导出"); }
          finally { Arrays.fill(bytes, (byte)0); }
        }).start();
      } else { if (bytes != null) Arrays.fill(bytes, (byte)0); toast("已取消导出"); }
    }
  }

  private final class Bridge {
    @JavascriptInterface public String takeShare() {
      synchronized (shares) { String value = shares.poll(); return value == null ? "" : value; }
    }
    @JavascriptInterface public void minimize() { runOnUiThread(() -> moveTaskToBack(true)); }
    @JavascriptInterface public void copyText(String text) {
      runOnUiThread(() -> {
        ClipboardManager clipboard = (ClipboardManager)getSystemService(CLIPBOARD_SERVICE);
        clipboard.setPrimaryClip(ClipData.newPlainText("庭院记录", text));
      });
    }
    @JavascriptInterface public void saveFile(String name, String mime, String base64) {
      if (base64 == null || base64.length() > 100 * 1024 * 1024) { toast("文件过大，请改用电脑导出"); return; }
      runOnUiThread(() -> {
        if (exportBytes != null) { toast("请先完成当前导出"); return; }
        try {
          exportBytes = Base64.decode(base64, Base64.DEFAULT);
          Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime.split(";")[0]);
          intent.putExtra(Intent.EXTRA_TITLE, name.replaceAll("[/\\\\]", "_"));
          documentPicker = true;
          startActivityForResult(intent, 42);
        } catch (Exception error) { exportBytes = null; documentPicker = false; toast("无法导出文件"); }
      });
    }
  }
}
