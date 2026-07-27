package com.petidconnect.companion.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Teal = Color(0xFF0D9488)
private val Slate900 = Color(0xFF0F172A)

private val LightColors = lightColorScheme(
    primary = Teal,
    onPrimary = Color.White,
    background = Color(0xFFF8FAFC),
    onBackground = Slate900,
    surface = Color.White,
    onSurface = Slate900,
)

private val DarkColors = darkColorScheme(
    primary = Teal,
    onPrimary = Color.White,
)

@Composable
fun PetIdCompanionTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (isSystemInDarkTheme()) DarkColors else LightColors,
        content = content,
    )
}
