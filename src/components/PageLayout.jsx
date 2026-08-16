import { IonPage, IonContent } from "@ionic/react";
import Header from "./Header";  
import { useEffect, useRef, useState } from "react";

export default function PageLayout({ children, name, center = true }) {
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
        <div className="main">
          <div className={`${name}${center ? " center" : ""}`}>{children}</div>
        </div>
      </IonContent>
    </IonPage>
  );
}