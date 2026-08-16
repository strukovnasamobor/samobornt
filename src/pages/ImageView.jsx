import {
  IonPage,
  useIonViewWillEnter,
  useIonViewWillLeave
} from '@ionic/react';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Context } from '../App';
import imagePath from '../utils/imagePath';

const getOrientation = () => window.screen.orientation.type;

const ImageView = () => {
  const { setHideUI } = useContext(Context);
  const imgUrl = useParams()["url"];
  const src = imagePath(decodeURIComponent(imgUrl));
  const [imageSize, setImageSize] = useState(null);
  const [shouldRotate, setShouldRotate] = useState(false);
  const [orientation, setOrientation] = useState(getOrientation());

  const updateOrientation = () => {
    setOrientation(getOrientation());
  }

  useEffect(() => {
    window.addEventListener(
      'orientationchange',
      updateOrientation
    )
    return () => {
      window.removeEventListener(
        'orientationchange',
        updateOrientation
      )
    }
  }, [])

  useEffect(() => {
    // Get screen dimensions
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    console.log("screenWidth=", screenWidth);
    console.log("screenHeight =", screenHeight);

    // Create an image element to load the image
    const img = new Image();
    img.src = src;

    img.onload = () => {
      const { naturalWidth, naturalHeight } = img;

      // Determine if the image should be rotated
      if (naturalWidth > naturalHeight && screenWidth < screenHeight) {
        setShouldRotate(true);
      }
      else {
        setShouldRotate(false);
      }

      // Save image dimensions
      setImageSize({
        width: naturalWidth,
        height: naturalHeight,
      });
    };
  }, [imgUrl, orientation]);

  useIonViewWillEnter(() => {
    setHideUI(true);
  });

  useIonViewWillLeave(() => {
    setHideUI(false);
  });

  return (
    <IonPage className="ion-padding center fullscreen-height">
      {imageSize && (
        <img
          style={{
            position: 'absolute',
            width: shouldRotate ? '100vh' : '100vw',
            height: shouldRotate ? 'auto' : 'auto',
            transform: shouldRotate ? 'rotate(90deg)' : 'none',
            maxWidth: shouldRotate ? 'none' : '100%',
          }}
          src={src}
        />
      )}
    </IonPage>
  );
};

export default ImageView;