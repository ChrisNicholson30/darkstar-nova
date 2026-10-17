plugins {
    id("org.jetbrains.intellij.platform") version "2.19.0"
}

group = "com.darkstarnova"
version = "1.0.0"

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    intellijPlatform {
        intellijIdeaCommunity("2024.2.6")
        pluginVerifier()
    }
}

intellijPlatform {
    pluginConfiguration {
        name = "Darkstar Nova Themes"
        version = project.version.toString()
        ideaVersion {
            sinceBuild = "242"
        }
    }
}
