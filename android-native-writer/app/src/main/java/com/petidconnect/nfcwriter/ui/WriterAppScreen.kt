package com.petidconnect.nfcwriter.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Nfc
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.Contacts
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.TouchApp
import androidx.compose.material.icons.filled.Sms
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material.icons.filled.WavingHand
import androidx.compose.material.icons.outlined.RadioButtonUnchecked
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.IconButton
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import android.net.Uri
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WriterAppScreen(
    appMode: String,
    entryFromDeepLink: Boolean,
    onSelectLinkU: () -> Unit,
    onSelectTools: () -> Unit,
    onBackToLanding: () -> Unit,
    onApplyToolTemplate: (String) -> Unit,
    toolsTemplate: String,
    wifiSsid: String,
    wifiPassword: String,
    wifiSecurity: String,
    bluetoothMac: String,
    readOnlyMode: Boolean,
    onWifiSsid: (String) -> Unit,
    onWifiPassword: (String) -> Unit,
    onWifiSecurity: (String) -> Unit,
    onBluetoothMac: (String) -> Unit,
    onToggleReadOnly: (Boolean) -> Unit,
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
    /** 태그 NDEF 쓰기에 성공한 뒤(서버 기록은 성공/스킵/실패와 무관하게 태그 쓰기 OK일 때) */
    tagWriteSuccess: Boolean = false,
    onPrepareWrite: () -> Unit,
    onOpenNfcSettings: () -> Unit
) {
    if (appMode == "Landing") {
        LandingModeScreen(
            onSelectLinkU = onSelectLinkU,
            onSelectTools = onSelectTools
        )
        return
    }

    val isLinkUMode = appMode == "LinkU"
    val modeTitle = if (isLinkUMode) "Link-U 모드" else "일반 NFC 도구 모드"
    val modeDescription = if (isLinkUMode) {
        "Link-U 웹/태그와 바로 연결되는 기록 흐름"
    } else {
        "누구나 NFC 읽기·쓰기 도구로 시작"
    }
    val scroll = rememberScrollState()
    val tone = statusToneFor(status, awaitingTag, busy)
    var showTechnicalDetails by remember { mutableStateOf(false) }
    var activeTemplateEditor by remember { mutableStateOf<String?>(null) }
    val hasUid = draftUid.isNotBlank()
    val hasUrl = draftUrl.isNotBlank()
    val hasHandoff = draftHandoff.isNotBlank()
    val allReady = hasUid && hasUrl && hasHandoff
    val showTemplateInputPage = !isLinkUMode && activeTemplateEditor != null

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.surface)
            .imePadding()
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
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
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
                        if (isLinkUMode) "Link-U" else "NFC Tools",
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        modeTitle,
                        style = MaterialTheme.typography.labelLarge,
                        color = Color.White.copy(0.95f),
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        modeDescription,
                        style = MaterialTheme.typography.labelMedium,
                        color = Color.White.copy(0.88f)
                    )
                }
                Spacer(Modifier.weight(1f))
                if (!entryFromDeepLink) {
                    IconButton(
                        onClick = onBackToLanding,
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White.copy(alpha = 0.18f))
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Home,
                            contentDescription = "모드 선택으로 돌아가기",
                            tint = Color.White,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }
            }
        }

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(scroll)
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (showTemplateInputPage) {
                UnifiedTemplateInputPage(
                    template = activeTemplateEditor!!,
                    draftUrl = draftUrl,
                    wifiSsid = wifiSsid,
                    wifiPassword = wifiPassword,
                    wifiSecurity = wifiSecurity,
                    bluetoothMac = bluetoothMac,
                    readOnlyMode = readOnlyMode,
                    onToggleReadOnly = onToggleReadOnly,
                    onClose = { activeTemplateEditor = null },
                    onApply = { value ->
                        when (value.template) {
                            "url" -> onDraftUrl(value.urlInput.trim())
                            "phone" -> {
                                onDraftUrl(
                                    buildBusinessCardPayload(
                                        format = value.contactFormatInput,
                                        name = value.contactNameInput,
                                        phone = value.phoneOrSmsInput,
                                        email = value.contactEmailInput,
                                        org = value.contactCompanyInput
                                    )
                                )
                            }
                            "sms" -> onDraftUrl("sms:${value.phoneOrSmsInput.trim()}")
                            "video" -> onDraftUrl(value.videoInput.trim())
                            "wifi" -> {
                                onWifiSecurity(value.wifiSecurityInput)
                                onWifiSsid(value.wifiSsidInput)
                                onWifiPassword(value.wifiPasswordInput)
                                onDraftUrl(
                                    "WIFI:T:${value.wifiSecurityInput};S:${value.wifiSsidInput.trim()};P:${value.wifiPasswordInput.trim()};;"
                                )
                            }
                            "bluetooth" -> {
                                onBluetoothMac(value.bluetoothMacInput.trim())
                                onDraftUrl("BT:MAC:${value.bluetoothMacInput.trim()};")
                            }
                        }
                        activeTemplateEditor = null
                        showTechnicalDetails = false
                    }
                )
            } else {
                if (isLinkUMode) {
                    CurrentStepFlowRow(
                        hasDraft = draftUid.isNotBlank() && draftUrl.isNotBlank() && draftHandoff.isNotBlank(),
                        awaiting = awaitingTag,
                        writeSuccess = tagWriteSuccess
                    )
                    QuickStartStepsCard(isLinkUMode = true)
                } else {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceContainerHigh
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.TouchApp,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                "아이콘 선택 → 정보 입력 → 태그에 쓰기 순서로 진행하세요.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.82f)
                            )
                        }
                    }
                }

                if (!isLinkUMode) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f)
                        )
                    ) {
                        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text(
                                "일반 모드 도구형 대시보드",
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.ExtraBold
                            )
                            Text(
                                "아이콘을 눌러 바로 입력 템플릿을 불러오세요.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f)
                            )
                            SquareToolGrid(
                                onTap = { key ->
                                    onApplyToolTemplate(key)
                                    activeTemplateEditor = key
                                },
                                selectedKey = toolsTemplate
                            )
                            Text(
                                "각 기능 아이콘을 눌러 열린 창에서 읽기/쓰기 모드를 선택할 수 있습니다.",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.72f)
                            )
                        }
                    }
                }
            }

            if (status.isNotBlank()) {
                StatusMessageCard(message = status, tone = tone)
            }

            if (!showTemplateInputPage && isLinkUMode) {
                Text(
                    "준비하기",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.ExtraBold
                )

                if (!showTechnicalDetails) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f)
                        )
                    ) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            if (allReady) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        Icons.Filled.Check,
                                        null,
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(22.dp)
                                    )
                                    Spacer(Modifier.width(10.dp))
                                    Text(
                                        "웹에서 보내 준 값이 모두 들어왔어요.\n[태그에 쓰기]만 누른 뒤 태그를 대시면 됩니다.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        lineHeight = 20.sp,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                            } else {
                                Text(
                                    if (isLinkUMode) {
                                        "웹(Link-U)에서 ‘앱으로 기록’을 쓰면 대부분 자동으로 넣겠습니다. " +
                                            "빈 항목이 있으면 아래 [상세]에서 직접 붙여 넣을 수 있어요."
                                    } else {
                                        "일반 모드는 자동 연동을 쓰지 않습니다. " +
                                            "아래 [상세]에서 링크/정보를 직접 입력해 주세요."
                                    },
                                    style = MaterialTheme.typography.bodySmall,
                                    lineHeight = 20.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.85f)
                                )
                            }
                            DraftStatusRow(
                                ok = hasUid,
                                title = "태그·제품",
                                shortLine = if (hasUid) summarizeUidForDisplay(draftUid) else "아직 없음"
                            )
                            DraftStatusRow(
                                ok = hasUrl,
                                title = "열릴 링크",
                                shortLine = if (hasUrl) summarizeUrlForDisplay(draftUrl) else "아직 없음"
                            )
                            if (isLinkUMode) {
                                DraftStatusRow(
                                    ok = hasHandoff,
                                    title = "한번 쓰는 인증",
                                    shortLine = if (hasHandoff) summarizeHandoffForDisplay(draftHandoff) else "아직 없음"
                                )
                            }
                        }
                    }
                }

                TextButton(
                    onClick = { showTechnicalDetails = !showTechnicalDetails },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(
                        if (showTechnicalDetails) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore,
                        contentDescription = null,
                        modifier = Modifier
                            .padding(end = 8.dp)
                            .size(20.dp)
                    )
                    Text(if (showTechnicalDetails) "요약 화면만 보기" else "상세보기 · 직접 붙여넣기 (고급)")
                }

                AnimatedVisibility(
                    visible = showTechnicalDetails,
                    enter = expandVertically() + fadeIn(),
                    exit = shrinkVertically() + fadeOut()
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
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
                    if (isLinkUMode) {
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
                    }
                    if (isLinkUMode) {
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
                            minLines = 3,
                            maxLines = 6,
                            enabled = !busy,
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
                }
            }

            Spacer(Modifier.height(4.dp))
            Button(
                onClick = onPrepareWrite,
                enabled = !busy && !tagWriteSuccess,
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .defaultMinSize(minHeight = 56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (tagWriteSuccess) {
                        Color(0xFF0F766E)
                    } else {
                        MaterialTheme.colorScheme.primary
                    }
                )
            ) {
                when {
                    tagWriteSuccess && !busy -> {
                        Icon(
                            imageVector = Icons.Filled.Check,
                            contentDescription = null,
                            modifier = Modifier
                                .padding(end = 10.dp)
                                .size(24.dp)
                        )
                        Text(
                            "쓰기가 정상적으로 완료되었습니다",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                    }
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

            if (isLinkUMode) {
                Text(
                    "고급 (운영·개발)",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 12.dp)
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
                            .size(18.dp),
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                    Text(
                        if (showServerFields) {
                            "Link-U 서버에 기록하는 설정 · 닫기"
                        } else {
                            "Link-U 서버에 기록하는 설정 · 열기 (대부분 생략)"
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f)
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
                            Text(
                                "· 태그에 링크만 쓰면 스캔·연락은 됩니다. 꼭 필요한 경우에만 이 설정을 쓰세요.\n" +
                                    "· 앱을 배포할 때 서버 주소·암호를 이미 넣어 둔 경우, 쓰기가 끝난 뒤 Link-U에 자동으로 보고될 수 있어 대부분 이 화면을 열지 않아도 됩니다.\n" +
                                    "· 관리자 안내로 직접 넣으라는 경우, 또는 개발·테스트로 다른 서버를 쓸 때만 아래에 입력·저장하세요.",
                                style = MaterialTheme.typography.bodySmall,
                                lineHeight = 20.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.88f)
                            )
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
                                label = { Text("연결 암호 (관리자 안내)") },
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
            }

            // 하단 내비·제스처 영역을 넘겨도 스크롤로 충분히 읽을 수 있도록
            Spacer(Modifier.height(32.dp))
        }
    }

}

private data class ToolTileItem(
    val key: String,
    val title: String,
    val icon: ImageVector,
    val enabled: Boolean = true
)

@Composable
private fun SquareToolGrid(
    onTap: (String) -> Unit,
    selectedKey: String
) {
    val tiles = listOf(
        ToolTileItem("url", "모바일웹 링크", Icons.Filled.Language, true),
        ToolTileItem("phone", "명함(전화)", Icons.Filled.Contacts, true),
        ToolTileItem("sms", "문자 공유", Icons.Filled.Sms, true),
        ToolTileItem("video", "영상 공유", Icons.Filled.PlayArrow, true),
        ToolTileItem("wifi", "Wi-Fi 연결", Icons.Filled.Wifi, true),
        ToolTileItem("bluetooth", "블루투스 연결", Icons.Filled.Bluetooth, true),
    )

    Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
        tiles.chunked(2).forEach { rowTiles ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                rowTiles.forEach { item ->
                    SquareToolTile(
                        modifier = Modifier.weight(1f),
                        item = item,
                        selected = item.key == selectedKey,
                        onClick = { onTap(item.key) }
                    )
                }
                if (rowTiles.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun SquareToolTile(
    modifier: Modifier = Modifier,
    item: ToolTileItem,
    selected: Boolean,
    onClick: () -> Unit
) {
    val alpha = if (item.enabled) 1f else 0.5f
    val tileBg = if (selected) Color(0xFFEECB2B) else Color(0xFFF5D54A)
    val borderColor = if (selected) Color(0xFFD4A808) else Color(0x00000000)

    OutlinedButton(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(18.dp),
        border = androidx.compose.foundation.BorderStroke(2.dp, borderColor),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = tileBg,
            contentColor = Color.White
        ),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(
            horizontal = 10.dp,
            vertical = 14.dp
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .defaultMinSize(minHeight = 86.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.White.copy(alpha = 0.22f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = item.icon,
                    contentDescription = item.title,
                    tint = Color.White.copy(alpha),
                    modifier = Modifier.size(22.dp)
                )
            }
            Text(
                text = item.title,
                style = MaterialTheme.typography.labelMedium,
                color = Color(0xFF5A4C00).copy(if (item.enabled) 1f else 0.6f),
                fontWeight = FontWeight.ExtraBold,
                textAlign = TextAlign.Center
            )
        }
    } 
}

private data class TemplateDialogResult(
    val template: String,
    val urlInput: String = "",
    val phoneOrSmsInput: String = "",
    val videoInput: String = "",
    val contactFormatInput: String = "vcard3",
    val contactNameInput: String = "",
    val contactEmailInput: String = "",
    val contactCompanyInput: String = "",
    val wifiSsidInput: String = "",
    val wifiPasswordInput: String = "",
    val wifiSecurityInput: String = "WPA",
    val bluetoothMacInput: String = ""
)

@Composable
private fun UnifiedTemplateInputPage(
    template: String,
    draftUrl: String,
    wifiSsid: String,
    wifiPassword: String,
    wifiSecurity: String,
    bluetoothMac: String,
    readOnlyMode: Boolean,
    onToggleReadOnly: (Boolean) -> Unit,
    onClose: () -> Unit,
    onApply: (TemplateDialogResult) -> Unit
) {
    var urlInput by remember(template, draftUrl) {
        mutableStateOf(if (template == "url") draftUrl else "https://")
    }
    var phoneOrSmsInput by remember(template, draftUrl) {
        mutableStateOf(
            when (template) {
                "phone" -> draftUrl.removePrefix("tel:")
                "sms" -> draftUrl.removePrefix("sms:")
                else -> ""
            }
        )
    }
    var videoInput by remember(template, draftUrl) {
        mutableStateOf(
            if (template == "video") draftUrl else "https://www.youtube.com/watch?v="
        )
    }
    var contactFormatInput by remember(template) { mutableStateOf("vcard3") }
    var contactNameInput by remember(template) { mutableStateOf("") }
    var contactEmailInput by remember(template) { mutableStateOf("") }
    var contactCompanyInput by remember(template) { mutableStateOf("") }
    var wifiSsidInput by remember(template, wifiSsid) { mutableStateOf(wifiSsid) }
    var wifiPasswordInput by remember(template, wifiPassword) { mutableStateOf(wifiPassword) }
    var wifiSecurityInput by remember(template, wifiSecurity) { mutableStateOf(wifiSecurity.ifBlank { "WPA" }) }
    var bluetoothMacInput by remember(template, bluetoothMac) {
        mutableStateOf(if (bluetoothMac.isBlank()) "AA:BB:CC:DD:EE:FF" else bluetoothMac)
    }

    val (title, icon) = when (template) {
        "url" -> "모바일 웹 링크" to Icons.Filled.Language
        "phone" -> "명함 (전화)" to Icons.Filled.Contacts
        "sms" -> "문자 공유" to Icons.Filled.Sms
        "video" -> "영상 공유" to Icons.Filled.PlayArrow
        "wifi" -> "Wi-Fi 연결" to Icons.Filled.Wifi
        "bluetooth" -> "블루투스 연결" to Icons.Filled.Bluetooth
        else -> "입력" to Icons.Filled.Info
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFFFFFEF8))
            .padding(vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onClose,
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color(0xFFF3F3F3))
            ) {
                Icon(
                    imageVector = Icons.Filled.Home,
                    contentDescription = "입력 페이지 닫기",
                    tint = Color(0xFF9A9A9A)
                )
            }
            Text(
                title,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.ExtraBold,
                color = Color(0xFF8E8E8E),
                textAlign = TextAlign.Center,
                modifier = Modifier.weight(1f)
            )
            Spacer(Modifier.size(36.dp))
        }
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(3.dp)
                .background(Color(0xFFF5D54A))
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFECECEC))
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(icon, contentDescription = null, tint = Color(0xFFD4A808), modifier = Modifier.size(20.dp))
                    Text(
                        "정보 입력",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color(0xFF6B5A00),
                        modifier = Modifier.padding(start = 8.dp)
                    )
                }

                when (template) {
                    "url" -> {
                        OutlinedTextField(
                            value = urlInput,
                            onValueChange = { urlInput = it },
                            label = { Text("모바일웹 주소를 입력해 주세요.") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    "phone" -> {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilledTonalButton(
                                onClick = { contactFormatInput = "mecard" },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = if (contactFormatInput == "mecard") {
                                    ButtonDefaults.filledTonalButtonColors(
                                        containerColor = Color(0xFFF5D54A),
                                        contentColor = Color(0xFF4F4300)
                                    )
                                } else {
                                    ButtonDefaults.filledTonalButtonColors(
                                        containerColor = Color(0xFFF7F7F7),
                                        contentColor = Color(0xFF666666)
                                    )
                                }
                            ) {
                                Text("MECARD")
                            }
                            FilledTonalButton(
                                onClick = { contactFormatInput = "vcard3" },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = if (contactFormatInput == "vcard3") {
                                    ButtonDefaults.filledTonalButtonColors(
                                        containerColor = Color(0xFFF5D54A),
                                        contentColor = Color(0xFF4F4300)
                                    )
                                } else {
                                    ButtonDefaults.filledTonalButtonColors(
                                        containerColor = Color(0xFFF7F7F7),
                                        contentColor = Color(0xFF666666)
                                    )
                                }
                            ) {
                                Text("vCard 3.0")
                            }
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilledTonalButton(
                                onClick = { contactFormatInput = "vcard4" },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp),
                                colors = if (contactFormatInput == "vcard4") {
                                    ButtonDefaults.filledTonalButtonColors(
                                        containerColor = Color(0xFFF5D54A),
                                        contentColor = Color(0xFF4F4300)
                                    )
                                } else {
                                    ButtonDefaults.filledTonalButtonColors(
                                        containerColor = Color(0xFFF7F7F7),
                                        contentColor = Color(0xFF666666)
                                    )
                                }
                            ) {
                                Text("vCard 4.0")
                            }
                        }
                        Text(
                            when (contactFormatInput) {
                                "vcard4" -> "vCard 4.0으로 저장됩니다. 최신 표준 기반으로 공유됩니다."
                                "vcard3" -> "vCard 3.0으로 저장됩니다. 연락처 앱 호환성이 높습니다."
                                else ->
                                "MECARD 포맷으로 저장됩니다. 간단한 명함 정보에 적합합니다."
                            },
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF8E8E8E)
                        )
                        OutlinedTextField(
                            value = contactNameInput,
                            onValueChange = { contactNameInput = it },
                            label = { Text("이름") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = phoneOrSmsInput,
                            onValueChange = { phoneOrSmsInput = it },
                            label = { Text("휴대폰 번호") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = contactEmailInput,
                            onValueChange = { contactEmailInput = it },
                            label = { Text("이메일") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = contactCompanyInput,
                            onValueChange = { contactCompanyInput = it },
                            label = { Text("회사명") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    "sms" -> {
                        OutlinedTextField(
                            value = phoneOrSmsInput,
                            onValueChange = { phoneOrSmsInput = it },
                            label = { Text("문자 받을 번호") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    "video" -> {
                        OutlinedTextField(
                            value = videoInput,
                            onValueChange = { videoInput = it },
                            label = { Text("영상 URL (YouTube 등)") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                        Text(
                            "예: https://www.youtube.com/watch?v=...",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF8E8E8E)
                        )
                    }
                    "wifi" -> {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                            listOf("WPA", "WEP", "nopass").forEach { sec ->
                                FilledTonalButton(
                                    onClick = { wifiSecurityInput = sec },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(10.dp),
                                    colors = if (wifiSecurityInput.equals(sec, ignoreCase = true)) {
                                        ButtonDefaults.filledTonalButtonColors(
                                            containerColor = Color(0xFFF5D54A),
                                            contentColor = Color(0xFF4F4300)
                                        )
                                    } else {
                                        ButtonDefaults.filledTonalButtonColors(
                                            containerColor = Color(0xFFF7F7F7),
                                            contentColor = Color(0xFF666666)
                                        )
                                    }
                                ) { Text(sec) }
                            }
                        }
                        OutlinedTextField(
                            value = wifiSsidInput,
                            onValueChange = { wifiSsidInput = it },
                            label = { Text("SSID") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = wifiPasswordInput,
                            onValueChange = { wifiPasswordInput = it },
                            label = { Text("비밀번호") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    "bluetooth" -> {
                        OutlinedTextField(
                            value = bluetoothMacInput,
                            onValueChange = { bluetoothMacInput = it },
                            label = { Text("MAC address (AA:BB:CC:DD:EE:FF)") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }

        Button(
            onClick = {
                onApply(
                    TemplateDialogResult(
                        template = template,
                        urlInput = urlInput,
                        phoneOrSmsInput = phoneOrSmsInput,
                        videoInput = videoInput,
                        contactFormatInput = contactFormatInput,
                        contactNameInput = contactNameInput,
                        contactEmailInput = contactEmailInput,
                        contactCompanyInput = contactCompanyInput,
                        wifiSsidInput = wifiSsidInput,
                        wifiPasswordInput = wifiPasswordInput,
                        wifiSecurityInput = wifiSecurityInput,
                        bluetoothMacInput = bluetoothMacInput
                    )
                )
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFFF5D54A),
                contentColor = Color(0xFF4F4300)
            )
        ) { Text("확인", fontWeight = FontWeight.ExtraBold) }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            ModeSelectOption(
                modifier = Modifier.weight(1f),
                title = "읽기/쓰기 모드",
                subtitle = "태그 내용 읽기 + 기록",
                icon = Icons.Filled.Nfc,
                selected = !readOnlyMode,
                onSelect = { onToggleReadOnly(false) }
            )
            ModeSelectOption(
                modifier = Modifier.weight(1f),
                title = "읽기 전용 모드",
                subtitle = "읽기만 가능, 기록 잠금",
                icon = Icons.Filled.Key,
                selected = readOnlyMode,
                onSelect = { onToggleReadOnly(true) }
            )
        }
        Text(
            "읽기 전용 모드로 만든 태그는 데이터 수정이 불가능할 수 있습니다.",
            style = MaterialTheme.typography.labelSmall,
            color = Color(0xFF8E8E8E),
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun ModeSelectOption(
    modifier: Modifier = Modifier,
    title: String,
    subtitle: String,
    icon: ImageVector,
    selected: Boolean,
    onSelect: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()
    val haptics = LocalHapticFeedback.current
    val animatedScale by animateFloatAsState(
        targetValue = if (pressed) 0.98f else 1f,
        label = "mode-card-press-scale"
    )
    val animatedBorder by animateColorAsState(
        targetValue = if (selected) Color(0xFFF5D54A) else Color(0xFFE5E7EB),
        label = "mode-card-border"
    )
    val animatedBg by animateColorAsState(
        targetValue = if (selected) Color(0xFFFFF8D5) else Color.White,
        label = "mode-card-bg"
    )

    Card(
        modifier = modifier
            .graphicsLayer {
                scaleX = animatedScale
                scaleY = animatedScale
            }
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = {
                    haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                    onSelect()
                }
            ),
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(
            2.dp,
            animatedBorder
        ),
        colors = CardDefaults.cardColors(
            containerColor = animatedBg
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (selected) 3.dp else 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (selected) Color(0xFFF5D54A) else Color(0xFFF3F4F6)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (selected) Icons.Filled.Check else icon,
                        contentDescription = null,
                        tint = if (selected) Color.White else Color(0xFF6B7280),
                        modifier = Modifier.size(16.dp)
                    )
                }
                Text(
                    title,
                    style = MaterialTheme.typography.labelLarge,
                    color = if (selected) Color(0xFF5A4C00) else Color(0xFF4B5563),
                    fontWeight = FontWeight.ExtraBold
                )
            }
            Text(
                subtitle,
                style = MaterialTheme.typography.labelSmall,
                color = if (selected) Color(0xFF7C6500) else Color(0xFF9CA3AF),
                lineHeight = 15.sp
            )
        }
    }
}

@Composable
private fun LandingModeScreen(
    onSelectLinkU: () -> Unit,
    onSelectTools: () -> Unit
) {
    val landingScroll = rememberScrollState()
    val brandYellow = Color(0xFFF5D54A)
    val brandYellowSoft = Color(0xFFFFF8D5)
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFFFFEF6))
            .verticalScroll(landingScroll)
            .navigationBarsPadding()
            .padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Card(
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 22.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(brandYellowSoft),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Nfc,
                            contentDescription = null,
                            modifier = Modifier.size(30.dp),
                            tint = Color(0xFFD4A808)
                        )
                    }
                    Column(Modifier.padding(start = 12.dp)) {
                        Text(
                            "NFC Writer",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF6B5A00)
                        )
                        Text(
                            "Link-U + 일반 도구 듀얼 시작",
                            style = MaterialTheme.typography.labelMedium,
                            color = Color(0xFF8A7A2D),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                Text(
                    "태그(딥링크)로 들어오면 Link-U 모드로 자동 연동됩니다.\n일반 실행은 아래에서 모드를 선택해 시작하세요.",
                    style = MaterialTheme.typography.bodyMedium,
                    lineHeight = 22.sp,
                    color = Color(0xFF5F5A46)
                )
            }
        }

        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(brandYellowSoft),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.Link, contentDescription = null, tint = Color(0xFFD4A808), modifier = Modifier.size(18.dp))
                    }
                    Text(
                        "Link-U 모드",
                        fontWeight = FontWeight.ExtraBold,
                        color = Color(0xFF6B5A00),
                        modifier = Modifier.padding(start = 8.dp)
                    )
                }
                Text(
                    "우리 프로그램 태그/웹과 바로 연동되는 기록 흐름",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF5F5A46)
                )
                Button(
                    onClick = onSelectLinkU,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = brandYellow,
                        contentColor = Color(0xFF4F4300)
                    )
                ) {
                    Icon(
                        Icons.Filled.TouchApp,
                        contentDescription = null,
                        modifier = Modifier
                            .padding(end = 8.dp)
                            .size(18.dp)
                    )
                    Text("Link-U로 시작", fontWeight = FontWeight.ExtraBold)
                }
            }
        }

        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(brandYellowSoft),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.Settings, contentDescription = null, tint = Color(0xFFD4A808), modifier = Modifier.size(18.dp))
                    }
                    Text(
                        "일반 NFC 도구 모드",
                        fontWeight = FontWeight.ExtraBold,
                        color = Color(0xFF6B5A00),
                        modifier = Modifier.padding(start = 8.dp)
                    )
                }
                Text(
                    "누구나 URL/텍스트 NFC 읽기·쓰기 도구로 시작",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF5F5A46)
                )
                FilledTonalButton(
                    onClick = onSelectTools,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.filledTonalButtonColors(
                        containerColor = brandYellowSoft,
                        contentColor = Color(0xFF5A4C00)
                    )
                ) {
                    Icon(
                        Icons.Filled.PhoneAndroid,
                        contentDescription = null,
                        modifier = Modifier
                            .padding(end = 8.dp)
                            .size(18.dp)
                    )
                    Text("일반 도구로 시작", fontWeight = FontWeight.ExtraBold)
                }
            }
        }

        Text(
            "Tip: NFC가 꺼져 있으면 모드 진입 후 [NFC 켜기] 버튼으로 바로 설정을 열 수 있어요.",
            style = MaterialTheme.typography.labelMedium,
            color = Color(0xFF8A7A2D),
            lineHeight = 20.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

private fun buildBusinessCardPayload(
    format: String,
    name: String,
    phone: String,
    email: String,
    org: String
): String {
    val rawName = name.trim()
    val rawPhone = phone.trim()
    val rawEmail = email.trim()
    val rawOrg = org.trim()
    val selected = format.lowercase()

    if (selected == "vcard3" || selected == "vcard4") {
        val version = if (selected == "vcard4") "4.0" else "3.0"
        val lines = buildList {
            add("BEGIN:VCARD")
            add("VERSION:$version")
            if (rawName.isNotEmpty()) add("FN:${rawName.escapeVcard()}")
            if (rawPhone.isNotEmpty()) add("TEL;TYPE=CELL:${rawPhone.escapeVcard()}")
            if (rawEmail.isNotEmpty()) add("EMAIL:${rawEmail.escapeVcard()}")
            if (rawOrg.isNotEmpty()) add("ORG:${rawOrg.escapeVcard()}")
            add("END:VCARD")
        }
        return lines.joinToString("\n")
    }

    val n = rawName.escapeMecard()
    val t = rawPhone.escapeMecard()
    val e = rawEmail.escapeMecard()
    val o = rawOrg.escapeMecard()
    val mecardBody = buildString {
        if (n.isNotEmpty()) append("N:$n;")
        if (t.isNotEmpty()) append("TEL:$t;")
        if (e.isNotEmpty()) append("EMAIL:$e;")
        if (o.isNotEmpty()) append("ORG:$o;")
    }
    return if (mecardBody.isBlank()) {
        if (rawPhone.isNotEmpty()) "tel:$rawPhone" else "tel:010"
    } else {
        "MECARD:$mecardBody;"
    }
}

private fun String.escapeMecard(): String =
    replace("\\", "\\\\").replace(";", "\\;").replace(":", "\\:").replace(",", "\\,")

private fun String.escapeVcard(): String =
    replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", " ")

@Composable
private fun DraftStatusRow(
    ok: Boolean,
    title: String,
    shortLine: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = if (ok) Icons.Filled.Check else Icons.Outlined.RadioButtonUnchecked,
            contentDescription = null,
            modifier = Modifier.size(20.dp),
            tint = if (ok) {
                MaterialTheme.colorScheme.primary
            } else {
                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.35f)
            }
        )
        Spacer(Modifier.width(10.dp))
        Column(Modifier.weight(1f)) {
            Text(
                title,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
            )
            Text(
                shortLine,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.9f)
            )
        }
    }
}

@Composable
private fun QuickStartStepsCard(isLinkUMode: Boolean) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Filled.TouchApp,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
                Text(
                    "빠른 시작",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.ExtraBold,
                    modifier = Modifier.padding(start = 8.dp)
                )
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StepMiniCard(
                    modifier = Modifier.weight(1f),
                    icon = if (isLinkUMode) Icons.Filled.Link else Icons.Filled.Fingerprint,
                    title = if (isLinkUMode) "1. 자동 불러오기" else "1. 직접 입력",
                    desc = if (isLinkUMode) "웹에서 값 수신" else "태그 ID + 링크"
                )
                StepMiniCard(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Filled.Nfc,
                    title = "2. 태그에 쓰기",
                    desc = "버튼 후 휴대폰 뒤 태그 접촉"
                )
            }
        }
    }
}

@Composable
private fun StepMiniCard(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    title: String,
    desc: String
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(18.dp)
            )
            Text(
                title,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.ExtraBold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                desc,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                lineHeight = 16.sp
            )
        }
    }
}

private fun summarizeUidForDisplay(uid: String): String {
    val t = uid.trim()
    if (t.isEmpty()) return "—"
    if (t.length <= 18) return t
    return t.take(10) + "…" + t.takeLast(8)
}

private fun summarizeUrlForDisplay(url: String): String {
    val t = url.trim()
    if (t.isEmpty()) return "—"
    return try {
        val u = Uri.parse(t)
        val host = u.host ?: return "웹 링크"
        val seg = u.path?.trim('/')?.split('/')?.filter { it.isNotEmpty() }?.firstOrNull().orEmpty()
        if (seg.isNotEmpty()) "$host · /$seg…" else host
    } catch (_: Exception) {
        "웹 링크"
    }
}

private fun summarizeHandoffForDisplay(handoff: String): String {
    val t = handoff.trim()
    if (t.isEmpty()) return "—"
    val n = t.length
    return "안전하게 보관됨 · ${n}자"
}

/** “현재 단계: 정보확인 → 저장완료” 앱 안의 진행 흐름(메뉴 아님) */
@Composable
private fun CurrentStepFlowRow(
    hasDraft: Boolean,
    awaiting: Boolean,
    writeSuccess: Boolean
) {
    val step1Done = hasDraft
    val step1Active = !hasDraft
    val step2Done = writeSuccess
    val step2Active = awaiting && !writeSuccess

    Column(Modifier.fillMaxWidth()) {
        Text(
            "현재 단계",
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.ExtraBold
        )
        Spacer(Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            StepPill(
                label = "정보확인",
                done = step1Done,
                active = step1Active
            )
            Text(
                " → ",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.45f),
                fontWeight = FontWeight.Bold
            )
            StepPill(
                label = "저장완료",
                done = step2Done,
                active = step2Active
            )
        }
    }
}

@Composable
private fun StepPill(label: String, active: Boolean, done: Boolean) {
    val bg = when {
        done && !active -> Color(0xFF0D9488)
        active -> Color(0xFF14B8A6)
        else -> MaterialTheme.colorScheme.surfaceContainerHighest
    }
    val fg = when {
        done || active -> Color.White
        else -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
    }
    Text(
        text = label,
        color = fg,
        style = MaterialTheme.typography.labelLarge,
        fontWeight = if (active || (done && !active)) FontWeight.Bold else FontWeight.Medium,
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(bg)
            .padding(horizontal = 14.dp, vertical = 10.dp)
    )
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
