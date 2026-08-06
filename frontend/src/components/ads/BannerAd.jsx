import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import {
  AdMob,
  BannerAdSize,
  BannerAdPosition,
} from "@capacitor-community/admob";

import { ADMOB_CONFIG } from "../../monetization/config";

export default function BannerAd() {

  useEffect(() => {

    async function loadBanner() {

      if (!Capacitor.isNativePlatform()) {
        return;
      }

      try {

        await AdMob.showBanner({
          adId: ADMOB_CONFIG.TEST_BANNER_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
        });

        console.log("✅ Banner ad displayed");

      } catch (error) {

        console.error(
          "❌ Banner ad failed:",
          error
        );

      }

    }

    loadBanner();


    return () => {

      AdMob.hideBanner();

    };

  }, []);


  return null;
}
