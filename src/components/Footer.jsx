import "./Footer.css";
import { IonFooter } from "@ionic/react";

// Only from the width where the tab bar is hidden, so the two never share the
// bottom of the screen. PageLayout renders it; the map and the AR redirect opt
// out through its footer prop.
export default function Footer() {
  return <IonFooter className="app-footer ion-hide-xl-down">SAMOBOR N&T</IonFooter>;
}
