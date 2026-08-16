import { IonPage } from '@ionic/react';
import React, { useEffect } from 'react';
import { useParams } from 'react-router';

const ARViewer = () => {
  const arSceneId = useParams()["id"];
  
  useEffect(() => {
    window.location.replace('ar/' + arSceneId + '/index.html');
  }, []);

  return (
    <IonPage className="ion-padding center">
    </IonPage>
  );
};

export default ARViewer;