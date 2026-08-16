import { useContext } from 'react';
import { Context } from '../App';
import { IonSearchbar } from '@ionic/react';
import { t } from 'i18next';

const CardsSearch = () => {
    const { cardsSearchInput, setCardsSearchInput } = useContext(Context);

    const handleSearchInput = (e) => {
        setCardsSearchInput(e.target.value);
    };

    return (
        <IonSearchbar
            debounce={1000}
            onIonInput={(e) => handleSearchInput(e)}
            value={cardsSearchInput}
            placeholder={t("search")}
        ></IonSearchbar>    );
};

export default CardsSearch;