package com.petidconnect.companion

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.CookieManager
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.petidconnect.companion.ui.PetIdCompanionTheme

/**
 * 웹 `/login` — CookieManager에 Better Auth 세션을 남긴 뒤 닫기.
 */
class LoginWebViewActivity : ComponentActivity() {

    @OptIn(ExperimentalMaterial3Api::class)
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val base = CompanionPrefs.apiBase(this).ifBlank { BuildConfig.NATIVE_API_BASE_URL }
            .trimEnd('/')
        if (base.isBlank()) {
            Toast.makeText(this, "API base URL을 먼저 설정하세요", Toast.LENGTH_LONG).show()
            finish()
            return
        }
        CookieManager.getInstance().setAcceptCookie(true)

        setContent {
            PetIdCompanionTheme {
                Scaffold(
                    topBar = {
                        TopAppBar(
                            title = { Text(getString(R.string.login_title)) },
                            navigationIcon = {
                                IconButton(onClick = { finish() }) {
                                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "닫기")
                                }
                            },
                        )
                    },
                ) { pad ->
                    AndroidView(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(pad),
                        factory = { ctx ->
                            WebView(ctx).apply {
                                settings.javaScriptEnabled = true
                                settings.domStorageEnabled = true
                                CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
                                webViewClient = object : WebViewClient() {
                                    override fun shouldOverrideUrlLoading(
                                        view: WebView?,
                                        request: WebResourceRequest?,
                                    ): Boolean {
                                        val url = request?.url?.toString().orEmpty()
                                        if (looksLoggedIn(url, base)) {
                                            CookieManager.getInstance().flush()
                                            Toast.makeText(ctx, "로그인됨", Toast.LENGTH_SHORT).show()
                                            setResult(RESULT_OK)
                                            finish()
                                            return true
                                        }
                                        return false
                                    }

                                    override fun onPageFinished(view: WebView?, url: String?) {
                                        if (looksLoggedIn(url.orEmpty(), base)) {
                                            CookieManager.getInstance().flush()
                                            setResult(RESULT_OK)
                                            finish()
                                        }
                                    }
                                }
                                loadUrl("$base/login")
                            }
                        },
                    )
                }
            }
        }
    }

    private fun looksLoggedIn(url: String, base: String): Boolean {
        if (!url.startsWith(base)) return false
        return url.contains("/dashboard") || url.contains("/admin") ||
            (url.contains("/login").not() && url.removePrefix(base).let { it == "/" || it.isEmpty() })
    }
}
