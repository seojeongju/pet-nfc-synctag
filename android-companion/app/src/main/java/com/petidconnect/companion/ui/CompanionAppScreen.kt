package com.petidconnect.companion.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun CompanionAppScreen(
    apiBase: String,
    onApiBaseChange: (String) -> Unit,
    kind: String,
    petId: String,
    onPetIdChange: (String) -> Unit,
    mac: String,
    onMacChange: (String) -> Unit,
    tagId: String,
    onTagIdChange: (String) -> Unit,
    sessionOk: Boolean,
    scanning: Boolean,
    statusText: String,
    logs: List<String>,
    onLogin: () -> Unit,
    onToggleScan: () -> Unit,
    onClearLogs: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            text = "Link-U BLE",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Black,
        )
        Text(
            text = "보호자 동행 · 근접/이탈",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
        )

        OutlinedTextField(
            value = apiBase,
            onValueChange = onApiBaseChange,
            label = { Text("API base") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(
                text = if (sessionOk) "세션 OK" else "로그인 필요",
                modifier = Modifier.weight(1f),
                fontWeight = FontWeight.Bold,
                color = if (sessionOk) MaterialTheme.colorScheme.primary
                else MaterialTheme.colorScheme.error,
            )
            OutlinedButton(onClick = onLogin) {
                Text("웹 로그인")
            }
        }

        OutlinedTextField(
            value = petId,
            onValueChange = onPetIdChange,
            label = { Text("pet_id") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = mac,
            onValueChange = onMacChange,
            label = { Text("BLE MAC") },
            placeholder = { Text("AA:BB:CC:DD:EE:FF") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = tagId,
            onValueChange = onTagIdChange,
            label = { Text("tag_id (선택)") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        if (kind.isNotBlank()) {
            Text(
                text = "모드 · $kind",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
            )
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(
                text = "동행 모드",
                fontWeight = FontWeight.Black,
                modifier = Modifier.weight(1f),
            )
            Switch(checked = scanning, onCheckedChange = { onToggleScan() })
        }

        Button(
            onClick = onToggleScan,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
        ) {
            Text(if (scanning) "스캔 중지" else "스캔 시작", fontWeight = FontWeight.Bold)
        }

        if (statusText.isNotBlank()) {
            Text(
                text = statusText,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f),
            )
        }

        Spacer(Modifier = Modifier.height(4.dp))
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(
                text = "최근 전송",
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f),
            )
            TextButton(onClick = onClearLogs) { Text("지우기") }
        }
        if (logs.isEmpty()) {
            Text("—", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
        } else {
            logs.forEach { line ->
                Text(
                    text = line,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                )
            }
        }
    }
}
