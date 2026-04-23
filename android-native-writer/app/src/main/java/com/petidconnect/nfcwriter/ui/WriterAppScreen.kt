package com.petidconnect.nfcwriter.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Nfc
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.TouchApp
import androidx.compose.material.icons.filled.WavingHand
import androidx.compose.material.icons.outlined.Cloud
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WriterAppScreen(
    status: String,
    draftUid: String,
    draftUrl: String,
    draftHandoff: String,
    onDraftUid: (String) -> Unit,
    onDraftUrl: (String) -> Unit,
    onDraftHandoff: (String) -> Unit,
    onFillProfileUrl: () -> Unit,
    awaitingTag: Boolean,
    busy: Boolean,
    showServerFields: Boolean,
    onToggleServerFields: (Boolean) -> Unit,
    serverBaseInput: String,
    serverKeyInput: String,
    profileSiteInput: String,
    onServerBase: (String) -> Unit,
    onServerKey: (String) -> Unit,
    onProfileSite: (String) -> Unit,
    onSaveServer: () -> Unit,
    onPrepareWrite: () -> Unit,
    onOpenNfcSettings: () -> Unit
) {
    val scroll = rememberScrollState()
    val tone = statusToneFor(status, awaitingTag, busy)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.surface)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(
                        listOf(
                            Color(0xFF0D9488),
                            Color(0xFF0F766E)
                        )
                    )
                )
                .padding(24.dp, 20.dp, 24.dp, 20.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.Nfc,
                        contentDescription = null,
                        modifier = Modifier.size(28.dp),
                        tint = Color.White
                    )
                }
                Column(Modifier.padding(start = 16.dp)) {
                    Text(
                        "Link-U",
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "Tag Writer",
                        style = MaterialTheme.typography.labelLarge,
                        color = Color.White.copy(0.95f),
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "펫·가족·기억(메모리)·아이·수하물… 웹에서 만든 링크를 태그에",
                        style = MaterialTheme.typography.labelMedium,
                        color = Color.White.copy(0.88f)
                    )
                }
            }
        }

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(scroll)
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            StepChipsRow(
                hasDraft = draftUid.isNotBlank() && draftUrl.isNotBlank() && draftHandoff.isNotBlank(),
                awaiting = awaitingTag
            )

            Text(
                "① Link-U 웹에서 [앱으로 태그 주소 기록] 등 기록 흐름을 쓰면 이 앱이 자동으로 불러옵니다.\n" +
                    "② [태그에 쓰기]를 누른 뒤, 휴대폰 뒤에 태그를 가깝게 대 주세요.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.88f),
                lineHeight = 22.sp
            )

            if (status.isNotBlank()) {
                StatusMessageCard(message = status, tone = tone)
            }

            Text(
                "필수 입력",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.ExtraBold
            )

            OutlinedTextField(
                value = draftUid,
                onValueChange = onDraftUid,
                label = { Text("태그·제품 ID") },
                leadingIcon = {
                    Icon(
                        Icons.Filled.Fingerprint,
                        contentDescription = null
                    )
                },
                singleLine = true,
                enabled = !busy,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(
                    capitalization = KeyboardCapitalization.Characters
                )
            )
            OutlinedTextField(
                value = draftUrl,
                onValueChange = onDraftUrl,
                label = { Text("스캔 시 열릴 링크(URL)") },
                leadingIcon = {
                    Icon(
                        Icons.Filled.Link,
                        contentDescription = null
                    )
                },
                minLines = 2,
                enabled = !busy,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            )
            FilledTonalButton(
                onClick = onFillProfileUrl,
                enabled = !busy,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    Icons.Filled.TouchApp,
                    contentDescription = null,
                    modifier = Modifier
                        .padding(end = 8.dp)
                        .size(20.dp)
                )
                Text("번호만 넣고 주소 자동으로 만들기")
            }
            OutlinedTextField(
                value = draftHandoff,
                onValueChange = onDraftHandoff,
                label = { Text("웹에서 받은 한번용 인증") },
                leadingIcon = {
                    Icon(
                        Icons.Filled.Key,
                        contentDescription = null
                    )
                },
                supportingText = {
                    Text("웹에 나온 긴 문장을 그대로 복사해 붙여 넣어 주세요.")
                },
                minLines = 2,
                enabled = !busy,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            )

            TextButton(
                onClick = { onToggleServerFields(!showServerFields) },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    Icons.Filled.Settings,
                    contentDescription = null,
                    modifier = Modifier
                        .padding(end = 8.dp)
                        .size(20.dp)
                )
                Text(
                    if (showServerFields) "Link-U 서비스에 기록(선택) · 닫기" else "Link-U 서비스에 기록(선택) · 열기"
                )
            }

            AnimatedVisibility(
                visible = showServerFields,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceContainerHighest
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(verticalAlignment = Alignment.Top) {
                            Icon(
                                Icons.Outlined.Cloud,
                                contentDescription = null,
                                modifier = Modifier.padding(4.dp, 2.dp, 8.dp, 0.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                "태그에 URL만 써도 사용할 수 있어요. " +
                                    "Link-U 대시보드에 ‘기록 완료’도 남기려면, 쓰는 모드(펫·기억·캐리 등)에 맞게 관리자·안내에 나온 서비스 주소·암호를 넣고 저장하세요.",
                                style = MaterialTheme.typography.bodySmall,
                                lineHeight = 20.sp
                            )
                        }
                        OutlinedTextField(
                            value = serverBaseInput,
                            onValueChange = onServerBase,
                            label = { Text("Link-U 서비스 주소 (https://…)") },
                            singleLine = true,
                            leadingIcon = {
                                Icon(Icons.Filled.PhoneAndroid, contentDescription = null)
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                        OutlinedTextField(
                            value = serverKeyInput,
                            onValueChange = onServerKey,
                            label = { Text("연결 암호 (관리자 안내)" ) },
                            singleLine = true,
                            visualTransformation = PasswordVisualTransformation(),
                            leadingIcon = {
                                Icon(Icons.Filled.Key, contentDescription = null)
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                        OutlinedTextField(
                            value = profileSiteInput,
                            onValueChange = onProfileSite,
                            label = { Text("“주소 자동”에 쓸 사이트 (없으면 위 주소)") },
                            minLines = 1,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                        Button(
                            onClick = onSaveServer,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp)
                        ) { Text("저장") }
                    }
                }
            }

            Spacer(Modifier.height(4.dp))
            Button(
                onClick = onPrepareWrite,
                enabled = !busy,
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                when {
                    busy && awaitingTag -> {
                        CircularProgressIndicator(
                            modifier = Modifier
                                .padding(end = 10.dp)
                                .size(24.dp),
                            color = Color.White,
                            strokeWidth = 2.dp
                        )
                        Text(
                            "태그에 쓰는 중…",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    busy -> {
                        CircularProgressIndicator(
                            modifier = Modifier
                                .padding(end = 10.dp)
                                .size(24.dp),
                            color = Color.White,
                            strokeWidth = 2.dp
                        )
                        Text("잠시만요…", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                    else -> {
                        val icon: ImageVector = if (awaitingTag) Icons.Filled.Nfc else Icons.Filled.PhoneAndroid
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            modifier = Modifier
                                .padding(end = 10.dp)
                                .size(24.dp)
                        )
                        Text(
                            if (awaitingTag) "휴대폰 뒤에 태그를 대 주세요" else "태그에 쓰기",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
            FilledTonalButton(
                onClick = onOpenNfcSettings,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(
                    Icons.Filled.PhoneAndroid,
                    contentDescription = null,
                    modifier = Modifier
                        .padding(end = 8.dp)
                        .size(22.dp)
                )
                Text("NFC 켜기(휴대폰 설정)")
            }
        }
    }
}

@Composable
private fun StepChipsRow(hasDraft: Boolean, awaiting: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        StepPill(1, "확인", done = hasDraft, active = !hasDraft)
        StepPill(2, "담기", done = false, active = awaiting)
    }
}

@Composable
private fun StepPill(num: Int, label: String, active: Boolean, done: Boolean) {
    val bg = when {
        done && !active -> Color(0xFF0D9488)
        active -> Color(0xFF14B8A6)
        else -> MaterialTheme.colorScheme.surfaceContainerHighest
    }
    val fg = when {
        done || active -> Color.White
        else -> MaterialTheme.colorScheme.onSurface.copy(0.55f)
    }
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(bg)
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Text(
            "$num",
            color = fg,
            fontWeight = FontWeight.Black,
            fontSize = 12.sp
        )
        Spacer(Modifier.width(6.dp))
        Text(
            label,
            color = fg,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = if (active || done) FontWeight.Bold else FontWeight.Medium
        )
    }
}

private enum class StatusTone { Info, Good, Partial, Error, Active }

private fun statusToneFor(status: String, awaiting: Boolean, busy: Boolean): StatusTone = when {
    status.contains("실패") && !status.contains("건너", ignoreCase = true) -> StatusTone.Error
    status.contains("꺼져", ignoreCase = true) && status.contains("NFC", ignoreCase = true) -> StatusTone.Error
    (busy && awaiting) || status.contains("쓰는 중", ignoreCase = true) || status.contains("담는 중", ignoreCase = true) || (status.contains("옮기", ignoreCase = true) && busy) -> StatusTone.Active
    status.contains("담았고", ignoreCase = true) && (status.contains("Link-U", ignoreCase = true) || status.contains("서비스", ignoreCase = true) || status.contains("가족", ignoreCase = true)) -> StatusTone.Good
    status.contains("완료", ignoreCase = true) && status.contains("태그", ignoreCase = true) && status.contains("건너", ignoreCase = true) -> StatusTone.Partial
    status.contains("완료", ignoreCase = true) && status.contains("인식표", ignoreCase = true) && status.contains("건너", ignoreCase = true) -> StatusTone.Partial
    status.contains("완료", ignoreCase = true) || status.contains("끝났", ignoreCase = true) -> {
        if (status.contains("건너", ignoreCase = true) || (status.contains("가족", ignoreCase = true) && status.contains("아래", ignoreCase = true))) StatusTone.Partial
        else StatusTone.Good
    }
    status.contains("건너", ignoreCase = true) && status.contains("담", ignoreCase = true) -> StatusTone.Partial
    awaiting && !busy && !status.contains("꺼져", ignoreCase = true) -> StatusTone.Active
    else -> StatusTone.Info
}

@Composable
private fun StatusMessageCard(message: String, tone: StatusTone) {
    val container = when (tone) {
        StatusTone.Good -> MaterialTheme.colorScheme.primaryContainer
        StatusTone.Partial -> MaterialTheme.colorScheme.surfaceContainerHigh
        StatusTone.Error -> MaterialTheme.colorScheme.errorContainer
        StatusTone.Active -> MaterialTheme.colorScheme.primaryContainer
        StatusTone.Info -> MaterialTheme.colorScheme.surfaceContainerHigh
    }
    val icon: ImageVector = when (tone) {
        StatusTone.Good -> Icons.Filled.WavingHand
        StatusTone.Partial -> Icons.Filled.Info
        StatusTone.Error -> Icons.Filled.ErrorOutline
        StatusTone.Active -> Icons.Filled.Nfc
        StatusTone.Info -> Icons.Filled.WavingHand
    }
    val iconTint = when (tone) {
        StatusTone.Good, StatusTone.Partial, StatusTone.Active, StatusTone.Info -> MaterialTheme.colorScheme.onPrimaryContainer
        StatusTone.Error -> MaterialTheme.colorScheme.onErrorContainer
    }
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = container),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.padding(end = 12.dp).size(26.dp),
                tint = iconTint
            )
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                lineHeight = 22.sp,
                textAlign = TextAlign.Start
            )
        }
    }
}
