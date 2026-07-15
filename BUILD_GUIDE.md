# 📱 Guide de Configuration et d'Exportation APK - Assi Tontine & Market Pro

Ce guide vous explique étape par étape comment configurer, exporter et convertir cette application Web React en fichier **APK** installable sur votre téléphone Android.

Nous vous proposons deux approches professionnelles :
1. **CapacitorJS (Recommandé - Native Complète)** : Permet d'intégrer de vraies fonctionnalités système (notamment l'accès au capteur d'empreintes digitales et Face ID natifs).
2. **Google Bubblewrap (Solution PWA - Rapide)** : Génère un APK léger (TWA - Trusted Web Activity) basé directement sur le fichier manifest PWA que nous venons de configurer.

---

## 🛠️ Prérequis avant de commencer
Pour exécuter ces étapes, vous devez récupérer le code source de l'application sur votre ordinateur :
1. Dans Google AI Studio, ouvrez le menu de configuration/paramètres de l'application.
2. Cliquez sur **Exporter au format ZIP** (ou connectez un dépôt GitHub pour cloner le projet).
3. Extrayez l'archive ZIP sur votre ordinateur et ouvrez un terminal dans ce dossier.

---

## 📋 Étape 0 : Le Fichier Manifeste Configuré
Nous avons déjà créé et lié le fichier `/public/manifest.json` à votre application. Voici sa configuration essentielle :
```json
{
  "short_name": "AssiTontine",
  "name": "Assi Tontine & Market Pro",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#02569B",
  "theme_color": "#0175C2"
}
```
*Note : Le fichier `index.html` inclut désormais également la balise `<link rel="manifest" href="/manifest.json" />` pour que les plateformes détectent automatiquement le profil mobile.*

---

## 🚀 Méthode 1 : CapacitorJS (Recommandé pour builds hybrides natifs)

Capacitor de Ionic est l'outil moderne standard pour transformer une application React/Vite en application mobile native ultra-rapide.

### 1. Installation des dépendances Capacitor
Dans le terminal de votre projet local, exécutez :
```bash
# Installer Capacitor Core et CLI
npm install @capacitor/core @capacitor/cli

# Installer le module Android
npm install @capacitor/android
```

### 2. Initialisation de l'application mobile
Lancez l'assistant de configuration :
```bash
npx cap init "Assi Tontine" "com.assitontine.app" --web-dir=dist
```
*(Remplacez `com.assitontine.app` par l'identifiant unique souhaité pour votre application).*

### 3. Intégration du Plugin Biométrique (Empreinte / Face ID)
Puisque vous avez demandé l'authentification par empreinte digitale et reconnaissance faciale dans l'AppLockScreen, vous pouvez lier notre interface simulée au véritable capteur de votre téléphone en installant le plugin communautaire :
```bash
npm install @capacitor-community/native-biometric
npx cap update
```

### 4. Configuration des Permissions Android (`AndroidManifest.xml`)
Pour que le téléphone autorise l'utilisation de la biométrie, ouvrez le fichier généré dans `android/app/src/main/AndroidManifest.xml` et ajoutez ces permissions à l'intérieur de la balise `<manifest>` :
```xml
<!-- Permission d'utiliser le capteur d'empreintes digitales et la reconnaissance faciale -->
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
```

### 5. Compiler l'application et générer l'APK
Exécutez ensuite la suite de commandes suivantes pour compiler et ouvrir le projet dans Android Studio :
```bash
# 1. Compiler le code React
npm run build

# 2. Ajouter la plateforme Android au projet
npx cap add android

# 3. Synchroniser les fichiers web compilés vers le projet Android
npx cap sync

# 4. Ouvrir le projet dans Android Studio
npx cap open android
```

### 6. Génération de l'APK dans Android Studio
Une fois Android Studio ouvert :
1. Attendez que le projet termine de s'indexer (barre de chargement Gradle en bas à droite).
2. Allez dans le menu supérieur : **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Android Studio va compiler votre application. Une notification s'affichera à la fin avec un lien **"locate"** pour ouvrir le dossier contenant votre fichier `app-debug.apk` !
4. Transférez ce fichier sur votre téléphone (par WhatsApp, Email ou câble USB) pour l'installer et le tester !

---

## ⚡ Méthode 2 : Google Bubblewrap (PWA vers Google Play)

Bubblewrap est un outil en ligne de commande de Google qui transforme votre site Web (PWA) hébergé en un fichier APK de type Trusted Web Activity (TWA).

### 1. Déployer l'application sur le Web
Pour utiliser Bubblewrap, votre application doit être accessible en ligne sur une URL publique sécurisée (HTTPS).
*   Vous pouvez utiliser l'URL partagée d'AI Studio (**Shared App URL**).
*   Ou déployer l'application sur Vercel, Netlify, Firebase Hosting ou Cloud Run.

### 2. Installer Bubblewrap CLI
Installez l'outil globalement sur votre ordinateur :
```bash
npm install -g @bubblewrap/cli
```

### 3. Initialiser le projet APK
Dans un dossier vide, lancez l'initialisation en pointant sur le fichier manifest de votre application en ligne :
```bash
bubblewrap init --manifest https://votre-domaine-tontine.web.app/manifest.json
```
Bubblewrap va automatiquement télécharger les informations, configurer les icônes et vous demander de confirmer les détails de l'application (nom, couleurs, version du SDK).

### 4. Compiler l'APK
Une fois configuré, lancez simplement la commande de compilation :
```bash
bubblewrap build
```
L'outil va automatiquement télécharger les outils Android requis (si absents) et générer deux fichiers essentiels :
*   `app-release-signed.apk` (L'APK prêt à être installé ou publié).
*   `assetlinks.json` (Fichier à placer sur votre serveur web sous `.well-known/assetlinks.json` pour masquer la barre d'adresse du navigateur de l'APK et prouver que vous êtes le propriétaire du site).

---

## 🔒 Liaison Biométrique Réelle (Exemple de code Capacitor)
Si vous souhaitez lier notre interface visuelle d'empreinte digitale au capteur réel de votre téléphone plus tard dans votre code natif, voici le patron d'intégration à utiliser dans `/src/components/AppLockScreen.tsx` :

```typescript
import { BiometricAuth } from '@capacitor-community/native-biometric';

const handleRealBiometricAuth = async () => {
  try {
    const available = await BiometricAuth.isAvailable();
    if (available.has) {
      const result = await BiometricAuth.verify({
        reason: "Veuillez scanner votre empreinte pour déverrouiller Assi Tontine",
        title: "Authentification requise",
        subtitle: "Sécurité renforcée",
        description: "Touchez le capteur d'empreinte"
      });
      
      if (result.verified) {
        // Déverrouillage réussi !
        onUnlock();
      }
    }
  } catch (error) {
    console.error("Erreur biométrique réelle :", error);
  }
};
```

---

*Ce guide reste disponible à tout moment à la racine de votre projet sous le nom `BUILD_GUIDE.md`.*
