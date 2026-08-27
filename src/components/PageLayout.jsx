import { IonPage, IonContent } from "@ionic/react";
import Header from "./Header";
import Footer from "./Footer";
import { useEffect, useRef, useState } from "react";

export default function PageLayout({ children, name, center = true, footer = true }) {
  const contentRef = useRef(null);
  const [contentScrollY, setContentScrollY] = useState(false);

  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;
  
    let resizeObserver;
  
    const checkOverflow = async () => {
      const scrollEl = await contentEl.getScrollElement();
      if (!scrollEl) return;
      setContentScrollY(scrollEl.scrollHeight > scrollEl.clientHeight);
    };
  
    const mainEl = contentEl.querySelector('.main');
    if (mainEl) {
      checkOverflow();
  
      resizeObserver = new ResizeObserver(() => {
        checkOverflow();
      });
      resizeObserver.observe(mainEl);
    }
  
    window.addEventListener('resize', checkOverflow);
  
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, []); 

  return (
    <IonPage className={`${name}-page`}>
      <Header />
      <IonContent id={`${name}-ioncontent`} ref={contentRef} scrollY={contentScrollY}>
        <Header />
        {/* no-footer: the large-devices min-height in App.css reserves room
            for the footer, which a footerless page has to claim back or it
            ends 50px short of the bottom edge. */}
        <div className={`main${footer ? "" : " main-no-footer"}`}>
          <div className={`${name}${center ? " center" : ""}`}>{children}</div>
        </div>
        {/* Inside the content, after the page: it belongs to the end of the
            page and scrolls away with it, rather than being pinned to the
            bottom of the screen. */}
        {footer && <Footer />}
      </IonContent>
    </IonPage>
  );
}