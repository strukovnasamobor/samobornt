import {
  IonCol,
  IonGrid,
  IonPage,
  IonRow,
  IonText,
} from '@ionic/react';
import { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination } from 'swiper/modules';
import { useSwipeable } from 'react-swipeable';
import Loading from '../components/Loading';
import { Context } from '../App';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import PageNotFound from './PageNotFound';
import imagePath from '../utils/imagePath';

const CardDetails = () => {
  const { cardsData, selectedLanguage, databaseLanguage } = useContext(Context);
  const [cardData, setCardData] = useState(null);
  const [allCardIds, setAllCardIds] = useState([]);

  const cardId = useParams()["id"];
  const history = useHistory();

  useEffect(() => {
    console.log("CardDetails > cardId =", cardId);
    if (cardsData.length === 0 || databaseLanguage !== selectedLanguage) {
      const cardDocRef = doc(db, "sights_" + selectedLanguage, cardId);
      const unsubCardDoc = onSnapshot(cardDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = { id: docSnapshot.id, ...docSnapshot.data() };
          console.log("CardDetail > data =", data);
          setCardData(data);
        } else {
          setCardData(undefined);
        }
      });

      // Fetch all card IDs
      const cardsCollectionRef = collection(db, "sights_" + selectedLanguage);
      const unsubCardsCollection = onSnapshot(cardsCollectionRef, (querySnapshot) => {
        const ids = querySnapshot.docs.map(doc => doc.id);
        setAllCardIds(ids);
      });

      return () => {
        unsubCardDoc();
        unsubCardsCollection();
      };
    } else {
      setCardData(cardsData[cardId]);
      setAllCardIds(Object.keys(cardsData));
    }
  }, [selectedLanguage, cardId]);

  const openImage = (imgUrl) => {
    history.push(`/image_view/${encodeURIComponent(imagePath(imgUrl))}`);
  };

  const navigateToCard = (direction) => {
    const currentIndex = allCardIds.indexOf(cardId);
    let newIndex;

    if (direction === 'left') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : allCardIds.length - 1;
    } else {
      newIndex = currentIndex < allCardIds.length - 1 ? currentIndex + 1 : 0;
    }

    history.push(`/card/${allCardIds[newIndex]}`);
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => navigateToCard('right'),
    onSwipedRight: () => navigateToCard('left'),
    trackMouse: true
  });

  if (cardData === null) {
    return <Loading />;
  } else if (cardData === undefined) {
    return <PageNotFound />;
  }

  return (
    <IonPage>
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={10}
        slidesPerView={1}
        pagination={{ clickable: true, dynamicBullets: true }}
        navigation
        loop={true}
        className="card-image-swiper"
        style={{ width: '100%', height: 'auto' }}
      >
        {cardData.imgUrl.map((url, index) => (
          <SwiperSlide key={index}>
            <img
              src={imagePath(url)}
              alt={`Slide ${index}`}
              style={{ width: '100%', height: 'auto', cursor: 'pointer' }}
              onClick={() => openImage(url)}
            />
          </SwiperSlide>
        ))}
      </Swiper>
      <IonGrid className="ion-padding" {...handlers}>
        <IonRow className="ion-text-center">
          <IonCol><IonText><h3>{cardData.name}</h3></IonText></IonCol>
        </IonRow>
        <IonRow>
          <IonCol>{cardData.longDescription}</IonCol>
        </IonRow>
      </IonGrid>
    </IonPage>
  );
};

export default CardDetails;