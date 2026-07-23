import { Capacitor } from "@capacitor/core";
import { AdMob } from "@capacitor-community/admob";

export async function initializeAdMob() {
  // Only initialize AdMob on Android/iOS
  if (!Capacitor.isNativePlatform()) {
    console.log("Running on web - AdMob skipped.");
    return;
  }

  try {
    await AdMob.initialize({
      initializeForTesting: true,
    });

    console.log("✅ AdMob initialized");
  } catch (error) {
    console.error("❌ AdMob initialization failed:", error);
  }
}
