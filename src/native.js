/* =====================================================================
   Ponte para plugins nativos do Capacitor.
   Gere js/native.js com:  npx esbuild src/native.js --bundle --format=iife --minify --outfile=js/native.js
   e inclua <script src="js/native.js"></script> ANTES de js/services.js no index.html.
   Os provedores em js/services.js detectam window.AdMob / window.Purchases automaticamente.
   ===================================================================== */
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

window.Capacitor = Capacitor;
window.AdMob = AdMob;
window.Purchases = Purchases;

if (Capacitor.isNativePlatform()) {
  // barra de status translúcida escura
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
  // vibração nativa mais agradável que navigator.vibrate
  navigator.vibrate = pattern => {
    const ms = Array.isArray(pattern) ? pattern[0] : pattern;
    Haptics.impact({ style: ms >= 40 ? ImpactStyle.Heavy : ms >= 20 ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});
    return true;
  };
  // trava retrato quando o plugin de orientação estiver instalado (@capacitor/screen-orientation)
  if (window.screen && window.screen.orientation && window.screen.orientation.lock) window.screen.orientation.lock('portrait').catch(() => {});
}
