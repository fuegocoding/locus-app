allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}

subprojects {
    afterEvaluate {
        if (project.hasProperty("android")) {
            val android = project.extensions.findByName("android")
            if (android is com.android.build.gradle.BaseExtension) {
                val currentSdkStr = android.compileSdkVersion
                var currentSdkVersion = 0
                if (currentSdkStr != null) {
                    val cleanStr = currentSdkStr.toString().replace("android-", "").trim()
                    try {
                        currentSdkVersion = cleanStr.toInt()
                    } catch (e: Exception) {
                        // ignore
                    }
                }
                // Upgrade only if it's lower than 34
                if (currentSdkVersion > 0 && currentSdkVersion < 34) {
                    android.compileSdkVersion(34)
                    println("Upgraded compileSdkVersion from $currentSdkVersion to 34 for subproject: ${project.name}")
                }
            }
        }
    }
}

// subprojects {
//     project.evaluationDependsOn(":app")
// }

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
