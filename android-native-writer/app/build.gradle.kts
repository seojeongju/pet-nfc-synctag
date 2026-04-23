import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val localProperties = Properties().apply {
    val f = rootProject.file("local.properties")
    if (f.exists()) {
        f.inputStream().use { load(it) }
    }
}

fun prop(name: String): String {
    val fromGradle = (project.findProperty(name) as String?)?.trim().orEmpty()
    if (fromGradle.isNotEmpty()) return fromGradle
    return localProperties.getProperty(name, "").trim()
}

fun escapeForBuildConfig(s: String): String =
    s.replace("\\", "\\\\").replace("\"", "\\\"")

android {
    namespace = "com.petidconnect.nfcwriter"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.petidconnect.nfcwriter"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        val apiBase = escapeForBuildConfig(prop("NATIVE_API_BASE_URL"))
        val apiKey = escapeForBuildConfig(prop("NATIVE_APP_API_KEY"))
        val hmacCurrent = escapeForBuildConfig(prop("NATIVE_HMAC_SECRET_CURRENT"))
        val hmacNext = escapeForBuildConfig(prop("NATIVE_HMAC_SECRET_NEXT"))

        buildConfigField("String", "NATIVE_API_BASE_URL", "\"$apiBase\"")
        buildConfigField("String", "NATIVE_APP_API_KEY", "\"$apiKey\"")
        buildConfigField("String", "NATIVE_HMAC_SECRET_CURRENT", "\"$hmacCurrent\"")
        buildConfigField("String", "NATIVE_HMAC_SECRET_NEXT", "\"$hmacNext\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")
    implementation("androidx.activity:activity-compose:1.9.1")
    implementation("com.google.android.material:material:1.12.0")
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
