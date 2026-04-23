package com.petidconnect.nfcwriter.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

/** Link-U Tag Writer — 틸 톤(허브와 맞춤), 태그는 NFC·추후 BLE 등 확장 전제 */
private val Teal = Color(0xFF0D9488)
private val Slate = Color(0xFF0F172A)
private val LightBg = Color(0xFFFAFCFC)

private val Light = lightColorScheme(
    primary = Teal,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFCCFBF1),
    onPrimaryContainer = Color(0xFF042F2E),
    surface = LightBg,
    onSurface = Slate,
    surfaceContainerHigh = Color(0xFFE2E8F0),
    error = Color(0xFFDC2626),
    onError = Color.White
)

@Composable
fun PetIdNfcTheme(content: @Composable () -> Unit) {
    val dark = isSystemInDarkTheme()
    val colors = if (dark) {
        darkColorScheme(
            primary = Color(0xFF5EEAD4),
            onPrimary = Color(0xFF042A2A),
            surface = Color(0xFF0F172A),
            onSurface = Color(0xFFF1F5F9)
        )
    } else {
        Light
    }
    MaterialTheme(
        colorScheme = colors,
        content = content
    )
}
