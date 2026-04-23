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
import androidx.compose.material.icons.outlined.RadioButtonUnchecked
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
    val hasUid = draftUid.isNotBlank()
    val hasUrl = draftUrl.isNotBlank()
    val hasHandoff = draftHandoff.isNotBlank()
    val allReady = hasUid && hasUrl && hasHandoff

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
            CurrentStepFlowRow(
                hasDraft = draftUid.isNotBlank() && draftUrl.isNotBlank() && draftHandoff.isNotBlank(),
                awaiting = awaitingTag,
                writeSuccess = tagWriteSuccess
            )

            Text(
                if (isLinkUMode) {
                    "① Link-U 웹에서 [앱으로 태그 주소 기록] 흐름을 쓰면 이 앱이 자동으로 불러옵니다.\n" +
                        "② [태그에 쓰기]를 누른 뒤, 휴대폰 뒤에 태그를 가깝게 대 주세요."
                } else {
                    "① 태그·제품 ID와 URL(또는 텍스트 링크)을 입력해 주세요.\n" +
                        "② [태그에 쓰기]를 누른 뒤, 휴대폰 뒤에 태그를 가깝게 대 주세요."
                },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.88f),
                lineHeight = 22.sp
            )

            if (!entryFromDeepLink) {
                TextButton(
                    onClick = onBackToLanding,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("모드 선택으로 돌아가기")
                }
            }

            if (status.isNotBlank()) {
                StatusMessageCard(message = status, tone = tone)
            }

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
                                "웹(Link-U)에서 ‘앱으로 기록’을 쓰면 대부분 자동으로 넣겠습니다. " +
                                    "빈 항목이 있으면 아래 [상세]에서 직접 붙여 넣을 수 있어요.",
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

@Composable
private fun LandingModeScreen(
    onSelectLinkU: () -> Unit,
    onSelectTools: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.surface)
            .padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            "Link-U Tag Writer",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.ExtraBold,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            "태그(딥링크)로 들어오면 Link-U 모드로 자동 연동됩니다.\n일반 실행은 아래에서 모드를 선택해 시작하세요.",
            style = MaterialTheme.typography.bodyMedium,
            lineHeight = 22.sp,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
        )

        Card(shape = RoundedCornerShape(20.dp), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Link-U 모드", fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.primary)
                Text(
                    "우리 프로그램 태그/웹과 바로 연동되는 기록 흐름",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f)
                )
                Button(onClick = onSelectLinkU, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp)) {
                    Text("Link-U로 시작")
                }
            }
        }

        Card(shape = RoundedCornerShape(20.dp), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("일반 NFC 도구 모드", fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.primary)
                Text(
                    "누구나 URL/텍스트 NFC 읽기·쓰기 도구로 사용",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f)
                )
                FilledTonalButton(
                    onClick = onSelectTools,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text("일반 도구로 시작")
                }
            }
        }
    }
}

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
