import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonGrid,
  IonPage,
  IonRow
} from '@ionic/react';
import { collection, onSnapshot } from 'firebase/firestore';
import { useContext, useEffect } from 'react';
import { db } from '../../firebase';
import CardsSearch from './../components/CardsSearch';
import { Context } from '../App';
import Loading from '../components/Loading';
import imagePath from '../utils/imagePath';

const Cards = () => {
  const { cardsData, setCardsData, cardsSearchInput, t, selectedLanguage, setDatabaseLanguage } = useContext(Context);

  useEffect(() => {    
      const unsubCollectionCards = onSnapshot(collection(db, "sights_" + selectedLanguage), (collection) => {
        const data = [];
        collection.forEach((doc) => {
          data[doc.id] = {
            id: doc.id,
            ...doc.data()
          };
        });
        console.log("Cards > data =", data);
        setCardsData(data);
        setDatabaseLanguage(selectedLanguage);
      });
      return () => {
        unsubCollectionCards();
      }
  }, [selectedLanguage]);

  if (cardsData.length == 0) {
    return (
      <Loading />
    );
  }

  return (
    <IonPage className="ion-padding">
      <IonRow className="center">
        <IonCol size="6" className="ion-text-start ion-hide-lg-down">
          <CardsSearch />
        </IonCol>
      </IonRow>
      <IonGrid className="full-width">
        <IonRow>
          {
            Object.entries(cardsData)
              ?.filter(([cardId, card]) =>
                card.name.toLowerCase().includes(cardsSearchInput.toLowerCase()) ||
                card.longDescription.toLowerCase().includes(cardsSearchInput.toLowerCase())
              )
              .map(([cardId, card]) => (
                <IonCol key={cardId} size="12" size-lg="6">
                  <IonCard routerLink={"/card/" + cardId}>
                    <img src={imagePath(card.imgUrl[0])} alt={card.name} />
                    <IonCardHeader>
                      <IonCardTitle>{card.name}</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>{card.shortDescription}</IonCardContent>
                  </IonCard>
                </IonCol>
              ))
          }
        </IonRow>
      </IonGrid>
    </IonPage>
  );
};

export default Cards;
