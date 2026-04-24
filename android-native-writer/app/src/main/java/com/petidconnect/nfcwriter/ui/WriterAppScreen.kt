package com.petidconnect.nfcwriter.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.offset
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
import androidx.compose.material.icons.filled.TouchApp
import androidx.compose.material.icons.filled.WavingHand
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Bluetooth
import androidx.compose.material.icons.outlined.Contacts
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.PlayArrow
import androidx.compose.material.icons.outlined.RadioButtonUnchecked
import androidx.compose.material.icons.outlined.Sms
import androidx.compose.material.icons.outlined.Wifi
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
import androidx.compose.ui.draw.shadow
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
import androidx.compose.ui.zIndex
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties

/**
 * NFC(태그 쓰기) 꺼짐·미지원 시 [NfcOffForWriteDialog]로 안내
 */
enum class NfcOffDialogKind {
    Hidden,
    NoHardware,
    NfcOffWhenTappingWrite,
    NfcOffWhileAwaitingTag
}

/**
 * Link-U / 일반 모드에서 상단에 보여주는 **소비자용** 휴대폰 NFC 상태(켜짐 / 꺼짐 / 지원 없음).
 */
enum class NfcUserBannerState {
    /** NFC 켜짐 — 태그 쓰기·읽기에 사용 가능 */
    On,
    /** NFC 꺼짐 */
    TurnedOff,
    /** 이 기기는 태그용 NFC 없음 */
    Unsupported
}

/**
 * [WriterAppScreen]에 넣던 NFC/성공/꺼짐 다이얼로그 인자를 한 객체로 묶어,
 * Composable 합성 메서드/기본인자가 ART에서 VerifyError 나는 것을 줄입니다.
 */
class WriterNfcUiProps(
    val nfcUserBanner: NfcUserBannerState,
    val tagWriteSuccess: Boolean,
    val onTagWriteSuccessGoToModeSelection: () -> Unit,
    val nfcOffDialogKind: NfcOffDialogKind,
    val onDismissNfcOffDialog: () -> Unit,
    val onOpenNfcSettingsFromDialog: () -> Unit,
    val onOpenNfcSettings: () -> Unit
)

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
    nfcUi: WriterNfcUiProps,
    /** null이면 Activity의 draft(링크)값 사용. 템플릿 [확인] 직후엔 방금 편집한 payload를 넣어 state 갱신 타이밍 이슈를 피합니다. */
    onPrepareWrite: (String?) -> Unit
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

    Box(Modifier.fillMaxSize()) {
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
                            Color(0xFF0F766E),
                            Color(0xFF0D9488)
                        )
                    )
                )
                .padding(horizontal = 16.dp, vertical = 16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.White.copy(0.15f))
                        .border(1.dp, Color.White.copy(0.2f), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.Nfc,
                        contentDescription = null,
                        modifier = Modifier.size(24.dp),
                        tint = Color.White
                    )
                }
                Column(Modifier.padding(start = 12.dp)) {
                    Text(
                        if (isLinkUMode) "Link-U" else "NFC Tools",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White.copy(0.7f),
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )
                    Text(
                        modeTitle,
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        letterSpacing = (-0.3).sp
                    )
                    Text(
                        modeDescription,
                        style = MaterialTheme.typography.labelSmall,
                        fontSize = 10.sp,
                        color = Color.White.copy(0.6f),
                        fontWeight = FontWeight.Medium
                    )
                }
                Spacer(Modifier.weight(1f))
                if (!entryFromDeepLink) {
                    IconButton(
                        onClick = onBackToLanding,
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(Color.White.copy(alpha = 0.12f))
                            .border(1.dp, Color.White.copy(0.15f), RoundedCornerShape(10.dp))
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Home,
                            contentDescription = "모드 선택으로 돌아가기",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }

        NfcUserEducationalBanner(
            state = nfcUi.nfcUserBanner,
            onOpenNfcSettings = nfcUi.onOpenNfcSettings
        )

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
                        val payload = when (value.template) {
                            "url" -> {
                                val u = value.urlInput.trim()
                                onDraftUrl(u)
                                u
                            }
                            "phone" -> {
                                val p = buildBusinessCardPayload(
                                    format = value.contactFormatInput,
                                    name = value.contactNameInput,
                                    phone = value.phoneOrSmsInput,
                                    email = value.contactEmailInput,
                                    org = value.contactCompanyInput
                                )
                                onDraftUrl(p)
                                p
                            }
                            "sms" -> {
                                val p = "sms:${value.phoneOrSmsInput.trim()}"
                                onDraftUrl(p)
                                p
                            }
                            "video" -> {
                                val p = value.videoInput.trim()
                                onDraftUrl(p)
                                p
                            }
                            "wifi" -> {
                                onWifiSecurity(value.wifiSecurityInput)
                                onWifiSsid(value.wifiSsidInput)
                                onWifiPassword(value.wifiPasswordInput)
                                val p =
                                    "WIFI:T:${value.wifiSecurityInput};S:${value.wifiSsidInput.trim()};P:${value.wifiPasswordInput.trim()};;"
                                onDraftUrl(p)
                                p
                            }
                            "bluetooth" -> {
                                onBluetoothMac(value.bluetoothMacInput.trim())
                                val p = "BT:MAC:${value.bluetoothMacInput.trim()};"
                                onDraftUrl(p)
                                p
                            }
                            else -> {
                                onDraftUrl(draftUrl)
                                draftUrl
                            }
                        }
                        onPrepareWrite(payload)
                    }
                )
            } else {
                if (isLinkUMode) {
                    CurrentStepFlowRow(
                        hasDraft = draftUid.isNotBlank() && draftUrl.isNotBlank() && draftHandoff.isNotBlank(),
                        awaiting = awaitingTag,
                        writeSuccess = nfcUi.tagWriteSuccess
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
                                "아이콘 선택 → 정보 입력 → 확인 후 태그 대기 순서로 진행하세요.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.82f)
                            )
                        }
                    }
                }

                if (!isLinkUMode) {
                    val glassDashBg = Brush.linearGradient(
                        listOf(
                            Color(0xFFBDDBD6),
                            Color(0xFFDEEFE9),
                            Color(0xFFAACCC6)
                        )
                    )
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = Color.Transparent
                        ),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            Color(0x99E8F2EF)
                        )
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(brush = glassDashBg, shape = RoundedCornerShape(20.dp))
                        ) {
                            Column(
                                modifier = Modifier.padding(14.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Text(
                                    "일반 모드 도구형 대시보드",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = Color(0xFF0A3D3A),
                                    fontWeight = FontWeight.ExtraBold
                                )
                                Text(
                                    "아이콘을 눌러 바로 입력 템플릿을 불러오세요.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color(0xFF2D5B56)
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
                                    color = Color(0xFF3A655F),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(end = 22.dp)
                                )
                            }
                            Icon(
                                imageVector = Icons.Outlined.AutoAwesome,
                                contentDescription = null,
                                modifier = Modifier
                                    .align(Alignment.BottomEnd)
                                    .padding(8.dp)
                                    .size(18.dp),
                                tint = Color(0x660A3D3A)
                            )
                        }
                    }
                }
            }

            // 템플릿 시트를 연 상태에서도 항상 상태를 보이게(이전: NFC·오류만 → 먼저 채우라는 안내가 숨겨짐)
            val shouldShowStatusInCurrentScreen = status.isNotBlank()

            if (shouldShowStatusInCurrentScreen) {
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

            if (!showTemplateInputPage) {
                Spacer(Modifier.height(4.dp))
                Button(
                    onClick = { onPrepareWrite(null) },
                    enabled = !busy && !nfcUi.tagWriteSuccess,
                    shape = RoundedCornerShape(18.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .defaultMinSize(minHeight = 56.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (nfcUi.tagWriteSuccess) {
                            Color(0xFF0F766E)
                        } else {
                            MaterialTheme.colorScheme.primary
                        }
                    )
                ) {
                    when {
                        nfcUi.tagWriteSuccess && !busy -> {
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
            }
            FilledTonalButton(
                onClick = nfcUi.onOpenNfcSettings,
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

        if (nfcUi.nfcOffDialogKind != NfcOffDialogKind.Hidden) {
            NfcOffForWriteDialog(
                kind = nfcUi.nfcOffDialogKind,
                onDismiss = nfcUi.onDismissNfcOffDialog,
                onOpenSettings = nfcUi.onOpenNfcSettingsFromDialog
            )
        }
        if (awaitingTag && !busy) {
            NfcTapGuideDialog()
        }
        if (nfcUi.tagWriteSuccess && !awaitingTag) {
            WriteSuccessOverlay(
                onConfirm = nfcUi.onTagWriteSuccessGoToModeSelection
            )
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
        ToolTileItem("url", "모바일 웹 링크", Icons.Outlined.Language, true),
        ToolTileItem("phone", "명함(전화)", Icons.Outlined.Contacts, true),
        ToolTileItem("sms", "문자 공유", Icons.Outlined.Sms, true),
        ToolTileItem("video", "영상 공유", Icons.Outlined.PlayArrow, true),
        ToolTileItem("wifi", "Wi-Fi 연결", Icons.Outlined.Wifi, true),
        ToolTileItem("bluetooth", "블루투스 연결", Icons.Outlined.Bluetooth, true),
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
    // 글라스 / 선택: 짙은 틸 + 내부 시안 보더(참고 목업)
    val darkTeal = Color(0xFF004D4D)
    val deepTextOnFrosted = Color(0xFF0A2F2C)
    val enableMul = if (item.enabled) 1f else 0.5f
    val tileShape = RoundedCornerShape(22.dp)
    val iconBoxShape = RoundedCornerShape(14.dp)
    val cyanEdge = Color(0xFF67E8F9)
    val tileBackground = if (selected) {
        darkTeal.copy(alpha = 0.92f * enableMul)
    } else {
        Color(0xC0FFFFFF)
    }
    val tileBorder = if (selected) {
        1.5.dp to Color(0x8C0A6B6B)
    } else {
        1.dp to Color(0x5EFFFFFF)
    }
    val iconBoxBorder = if (selected) 2.dp to cyanEdge else 1.dp to Color(0x330A3D3A)
    val iconBoxBg = if (selected) {
        Color(0x1EFFFFFF)
    } else {
        Color(0xD8FFFFFF)
    }
    val iconTint = if (selected) {
        Color.White.copy(alpha = enableMul)
    } else {
        deepTextOnFrosted.copy(alpha = enableMul)
    }
    val titleColor = if (selected) {
        Color(0xFFF0FFFC).copy(alpha = enableMul)
    } else {
        deepTextOnFrosted.copy(alpha = enableMul)
    }

    Column(
        modifier = modifier
            .defaultMinSize(minHeight = 118.dp)
            .clip(tileShape)
            .background(color = tileBackground, shape = tileShape)
            .border(width = tileBorder.first, color = tileBorder.second, shape = tileShape)
            .clickable(
                enabled = item.enabled,
                onClick = onClick
            )
            .padding(horizontal = 10.dp, vertical = 14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterVertically)
    ) {
        Box(
            modifier = Modifier
                .size(50.dp)
                .clip(iconBoxShape)
                .background(iconBoxBg, iconBoxShape)
                .border(iconBoxBorder.first, iconBoxBorder.second, iconBoxShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = item.icon,
                contentDescription = item.title,
                tint = iconTint,
                modifier = Modifier.size(26.dp)
            )
        }
        Text(
            text = item.title,
            style = MaterialTheme.typography.labelMedium,
            color = titleColor,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.Center
        )
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
        "url" -> "모바일 웹 링크" to Icons.Outlined.Language
        "phone" -> "명함 (전화)" to Icons.Outlined.Contacts
        "sms" -> "문자 공유" to Icons.Outlined.Sms
        "video" -> "영상 공유" to Icons.Outlined.PlayArrow
        "wifi" -> "Wi-Fi 연결" to Icons.Outlined.Wifi
        "bluetooth" -> "블루투스 연결" to Icons.Outlined.Bluetooth
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
    val brandTeal = Color(0xFF0D9488)
    val brandIndigo = Color(0xFF4338CA)
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFFF8FAFC), Color(0xFFF1F5F9))
                )
            )
    ) {
        // Decorative background elements (Scaled down)
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .offset(x = 40.dp, y = (-30).dp)
                .size(160.dp)
                .background(brandTeal.copy(alpha = 0.08f), CircleShape)
        )
        Box(
            modifier = Modifier
                .align(Alignment.CenterStart)
                .offset(x = (-50).dp, y = 70.dp)
                .size(200.dp)
                .background(brandIndigo.copy(alpha = 0.05f), CircleShape)
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(landingScroll)
                .navigationBarsPadding()
                .padding(horizontal = 14.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Header Section (70% Scaled)
            AnimatedVisibility(
                visible = true,
                enter = fadeIn() + expandVertically()
            ) {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                    border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(8.dp, RoundedCornerShape(22.dp), spotColor = brandTeal.copy(alpha = 0.15f))
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(
                                        Brush.linearGradient(
                                            listOf(Color(0xFF14B8A6), Color(0xFF0D9488))
                                        )
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.Nfc,
                                    contentDescription = null,
                                    modifier = Modifier.size(22.dp),
                                    tint = Color.White
                                )
                            }
                            Column(Modifier.padding(start = 12.dp)) {
                                Text(
                                    "NFC Writer",
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Black,
                                    color = Color(0xFF0F172A),
                                    letterSpacing = (-0.3).sp
                                )
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        Modifier
                                            .size(4.dp)
                                            .background(brandTeal, CircleShape)
                                    )
                                    Spacer(Modifier.width(4.dp))
                                    Text(
                                        "Smart Dual Gateway",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = brandTeal,
                                        fontWeight = FontWeight.ExtraBold,
                                        letterSpacing = 0.5.sp
                                    )
                                }
                            }
                        }
                        Text(
                            "태그(딥링크)로 들어오면 Link-U 모드로 자동 연동됩니다. 일반 실행은 아래에서 모드를 선택해 시작하세요.",
                            style = MaterialTheme.typography.bodySmall,
                            lineHeight = 16.sp,
                            color = Color(0xFF64748B),
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            Spacer(Modifier.height(2.dp))

            // Tools Mode Card (Moved to TOP, Scaled)
            LargeModeEntryCard(
                title = "일반 NFC 도구 모드",
                description = "누구나 URL/텍스트 NFC 읽기·쓰기 도구로 시작",
                buttonText = "일반 도구로 시작",
                icon = Icons.Filled.Settings,
                onClick = onSelectTools,
                primary = false
            )

            // Link-U Mode Card (Moved to BOTTOM, Scaled)
            LargeModeEntryCard(
                title = "Link-U 모드",
                description = "우리 프로그램 태그/웹과 바로 연동되는 기록 흐름",
                buttonText = "Link-U로 시작",
                icon = Icons.Filled.Link,
                onClick = onSelectLinkU,
                primary = true
            )

            Spacer(Modifier.height(4.dp))

            // Bottom Tip
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.White.copy(alpha = 0.5f))
                    .padding(12.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Tip: NFC가 꺼져 있으면 모드 진입 후 [NFC 켜기] 버튼으로 바로 설정을 열 수 있어요.",
                    style = MaterialTheme.typography.labelSmall,
                    fontSize = 10.sp,
                    color = Color(0xFF94A3B8),
                    lineHeight = 14.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
private fun LargeModeEntryCard(
    title: String,
    description: String,
    buttonText: String,
    icon: ImageVector,
    onClick: () -> Unit,
    primary: Boolean
) {
    val brandTeal = Color(0xFF0D9488)
    
    val bgGradient = if (primary) {
        Brush.linearGradient(listOf(Color(0xFFF0FDFA), Color(0xFFE6FFFA)))
    } else {
        Brush.linearGradient(listOf(Color(0xFFF8FAFC), Color(0xFFF1F5F9)))
    }
    
    val iconBg = if (primary) {
        Brush.linearGradient(listOf(Color(0xFF2DD4BF), Color(0xFF0D9488)))
    } else {
        Brush.linearGradient(listOf(Color(0xFF94A3B8), Color(0xFF475569)))
    }
    
    val buttonBg = if (primary) {
        Brush.linearGradient(listOf(brandTeal, Color(0xFF0F766E)))
    } else {
        Brush.linearGradient(listOf(Color(0xFF64748B), Color(0xFF334155)))
    }

    AnimatedVisibility(
        visible = true,
        enter = fadeIn() + expandVertically()
    ) {
        Card(
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
            modifier = Modifier
                .fillMaxWidth()
                .shadow(
                    elevation = if (primary) 10.dp else 6.dp,
                    shape = RoundedCornerShape(22.dp),
                    spotColor = if (primary) brandTeal.copy(alpha = 0.2f) else Color.Black.copy(alpha = 0.1f)
                )
                .background(bgGradient, RoundedCornerShape(22.dp))
                .border(1.dp, Color.White.copy(alpha = 0.6f), RoundedCornerShape(22.dp))
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(90.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color.White.copy(alpha = 0.4f)),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(iconBg),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(30.dp)
                        )
                    }
                }
                
                Column(modifier = Modifier.padding(horizontal = 2.dp)) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFF1E293B),
                        letterSpacing = (-0.3).sp
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = description,
                        style = MaterialTheme.typography.labelMedium,
                        color = Color(0xFF64748B),
                        fontWeight = FontWeight.Medium,
                        lineHeight = 16.sp
                    )
                }
                
                Button(
                    onClick = onClick,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(40.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(buttonBg),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = buttonText,
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Spacer(Modifier.width(6.dp))
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = null,
                                tint = Color.White.copy(alpha = 0.7f),
                                modifier = Modifier.size(14.dp)
                            )
                        }
                    }
                }
            }
        }
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
    status.contains("NFC", ignoreCase = true) && status.contains("켜 주세요", ignoreCase = true) -> StatusTone.Error
    status.contains("태그 쓰기", ignoreCase = true) && status.contains("할 수 없", ignoreCase = true) -> StatusTone.Error
    status.contains("NFC", ignoreCase = true) && status.contains("쓸 수 없", ignoreCase = true) -> StatusTone.Error
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

@Composable
private fun NfcUserEducationalBanner(
    state: NfcUserBannerState,
    onOpenNfcSettings: () -> Unit
) {
    when (state) {
        NfcUserBannerState.On -> {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFF0D9488).copy(alpha = 0.1f)
                )
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Filled.Check,
                        contentDescription = null,
                        modifier = Modifier.size(22.dp),
                        tint = Color(0xFF0F766E)
                    )
                    Text(
                        text = "휴대폰 NFC: 켜짐 · 태그 쓰기·읽기에 사용할 수 있어요",
                        modifier = Modifier.padding(start = 10.dp),
                        style = MaterialTheme.typography.bodySmall,
                        lineHeight = 20.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
        NfcUserBannerState.TurnedOff -> {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 10.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFF134E4A).copy(alpha = 0.12f)
                ),
                border = BorderStroke(1.dp, Color(0xFF0D9488).copy(alpha = 0.45f))
            ) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.PhoneAndroid,
                            contentDescription = null,
                            tint = Color(0xFF0F766E),
                            modifier = Modifier.size(28.dp)
                        )
                        Text(
                            text = "이 휴대폰의 NFC는 지금 꺼져 있어요",
                            modifier = Modifier.padding(start = 12.dp),
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    Text(
                        text = "태그를 쓰거나 읽을 때 반응이 없다면, 대부분 NFC가 꺼져 있어서예요. 설정에서 켜 주세요.",
                        style = MaterialTheme.typography.bodySmall,
                        lineHeight = 20.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    FilledTonalButton(
                        onClick = onOpenNfcSettings,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Settings,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("NFC 켜기 (설정 열기)")
                    }
                }
            }
        }
        NfcUserBannerState.Unsupported -> {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 10.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f)
                )
            ) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.ErrorOutline,
                        contentDescription = null,
                        modifier = Modifier.size(26.dp),
                        tint = MaterialTheme.colorScheme.onErrorContainer
                    )
                    Text(
                        text = "이 휴대폰은 태그용 NFC(근거리 무선)를 쓸 수 없어요. 태그 기록·읽기는 NFC가 있는 기기에서 이용해 주세요.",
                        modifier = Modifier.padding(start = 12.dp),
                        style = MaterialTheme.typography.bodySmall,
                        lineHeight = 20.sp,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }
        }
    }
}

@Composable
private fun NfcOffForWriteDialog(
    kind: NfcOffDialogKind,
    onDismiss: () -> Unit,
    onOpenSettings: () -> Unit
) {
    if (kind == NfcOffDialogKind.Hidden) return
    val title = when (kind) {
        NfcOffDialogKind.Hidden -> ""
        NfcOffDialogKind.NoHardware -> "NFC(태그 쓰기)를 쓸 수 없어요"
        NfcOffDialogKind.NfcOffWhenTappingWrite, NfcOffDialogKind.NfcOffWhileAwaitingTag ->
            "NFC(태그 쓰기)를 켜 주세요"
    }
    val body = when (kind) {
        NfcOffDialogKind.NoHardware ->
            "이 휴대폰은 NFC 하드웨어가 없어 태그에 쓸 수 없어요. NFC를 지원하는 기기에서 이용해 주세요."
        NfcOffDialogKind.NfcOffWhenTappingWrite ->
            "휴대폰에서 NFC가 꺼져 있어요. 켜야 태그에 쓸 수 있어요.\n" +
                "[NFC 설정 열기]를 누르면 [NFC 켜기(휴대폰 설정)]과 같이 휴대폰의 NFC 설정 화면으로 이동합니다."
        NfcOffDialogKind.NfcOffWhileAwaitingTag ->
            "태그 쓰기 대기 중에 NFC가 꺼졌어요. NFC를 켜면 이어서 태그에 쓸 수 있어요.\n" +
                "[NFC 설정 열기]로 동일한 설정 화면이 열립니다."
        NfcOffDialogKind.Hidden -> ""
    }
    // Material3 AlertDialog는 일부 기기/레이어에서 가려지거나 안 뜨는 사례가 있어,
    // 태그 대기(NfcTapGuide)와 동일한 ui.window.Dialog + 전면 딤으로 통일
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x8A0A1A18))
                .padding(20.dp),
            contentAlignment = Alignment.Center
        ) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFFF5FAF8)
                ),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFBBE0DB))
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        title,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color(0xFF0A2F2B)
                    )
                    Text(
                        body,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFF1E3D38)
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Spacer(Modifier.weight(1f))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            if (kind != NfcOffDialogKind.NoHardware) {
                                TextButton(onClick = onDismiss) { Text("닫기") }
                            }
                            if (kind == NfcOffDialogKind.NoHardware) {
                                TextButton(onClick = onDismiss) { Text("확인") }
                            } else {
                                Button(
                                    onClick = onOpenSettings,
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFF0F766E),
                                        contentColor = Color.White
                                    )
                                ) { Text("NFC 설정 열기", fontWeight = FontWeight.Bold) }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NfcTapGuideDialog() {
    val glassPanel = Brush.linearGradient(
        listOf(
            Color(0xE6C5E8E3),
            Color(0xE8E8F0EF),
            Color(0xDDB8D9D4)
        )
    )
    Dialog(
        onDismissRequest = { },
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0x640B1F1C))
                .padding(horizontal = 20.dp, vertical = 24.dp),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(26.dp))
                    .background(brush = glassPanel, shape = RoundedCornerShape(26.dp))
                    .border(1.5.dp, Color(0x9EFFFFFF), RoundedCornerShape(26.dp))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 22.dp, vertical = 26.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(RoundedCornerShape(16.dp))
                            // 뒤 그라데이션이 비치도록 유리 느낌만(거의 투명)
                            .background(
                                color = Color(0x0EFFFFFF),
                                shape = RoundedCornerShape(16.dp)
                            )
                            .border(
                                width = 1.5.dp,
                                brush = Brush.linearGradient(
                                    listOf(
                                        Color(0xD0FFFFFF),
                                        Color(0x7A67E8F9)
                                    )
                                ),
                                shape = RoundedCornerShape(16.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Nfc,
                            contentDescription = null,
                            tint = Color(0xFF0F766E),
                            modifier = Modifier.size(32.dp)
                        )
                    }
                    Text(
                        "NFC 태그에 쓰기 준비됨",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color(0xFF043330),
                        fontWeight = FontWeight.ExtraBold,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        "휴대폰 뒷면에 NFC 태그를 가까이 대주세요.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xD9093D3A),
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}

/**
 * `Dialog`는 별도 Window를 쓰므로, 성공 직후 [Landing]으로 전환할 때
 * 윈도 정리 충돌로 “계속 중단됨”이 나는 기기가 있어 동일 composable 트리 안에만 그립니다.
 */
@Composable
private fun WriteSuccessOverlay(
    onConfirm: () -> Unit
) {
    val successGlass = Brush.linearGradient(
        listOf(
            Color(0xE6C4E0D4),
            Color(0xE6ECF2EA),
            Color(0xD5C2DBCC)
        )
    )
    Box(
        modifier = Modifier
            .fillMaxSize()
            .zIndex(100f)
            .background(Color(0x5A0B2418))
            .imePadding()
            .navigationBarsPadding()
            .padding(horizontal = 20.dp, vertical = 24.dp),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(28.dp))
                .background(brush = successGlass, shape = RoundedCornerShape(28.dp))
                .border(
                    width = 1.5.dp,
                    brush = Brush.linearGradient(
                        listOf(
                            Color(0xDBFFFFFF),
                            Color(0x7A5EE9B4),
                            Color(0x5E2DD4A3)
                        )
                    ),
                    shape = RoundedCornerShape(28.dp)
                )
        ) {
            Box(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 30.dp)
                        .padding(end = 20.dp, bottom = 4.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(60.dp)
                            .clip(RoundedCornerShape(18.dp))
                            .background(Color(0x14FFFFFF), RoundedCornerShape(18.dp))
                            .border(
                                width = 1.5.dp,
                                brush = Brush.linearGradient(
                                    listOf(
                                        Color(0xDCFFFFFF),
                                        Color(0x7A3EE7B0)
                                    )
                                ),
                                shape = RoundedCornerShape(18.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(
                                    color = Color(0x1E059669),
                                    shape = CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Check,
                                contentDescription = null,
                                tint = Color(0xFF047857),
                                modifier = Modifier.size(30.dp)
                            )
                        }
                    }
                    Text(
                        "쓰기가 정상적으로 완료되었습니다.",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color(0xFF032A22),
                        fontWeight = FontWeight.ExtraBold,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        "NFC 태그에 기록이 반영됐어요.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xD9114C3B),
                        textAlign = TextAlign.Center
                    )
                    Button(
                        onClick = onConfirm,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF0F766E)
                        )
                    ) {
                        Text("일반 NFC 도구 모드로", fontWeight = FontWeight.ExtraBold)
                    }
                }
                Icon(
                    imageVector = Icons.Outlined.AutoAwesome,
                    contentDescription = null,
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(10.dp)
                        .size(18.dp),
                    tint = Color(0x48059669)
                )
            }
        }
    }
}
