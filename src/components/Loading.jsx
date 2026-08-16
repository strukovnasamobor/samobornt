import PageLayout from "../components/PageLayout";
import {
    IonCol,
    IonGrid,
    IonRow,
    IonSpinner,
    IonText
} from '@ionic/react';
import { useTranslation } from 'react-i18next';

export default function Loading() {
    const { t } = useTranslation();

    return (
        <PageLayout name="loading">
            <IonGrid>
                <IonRow className="ion-text-center">
                    <IonCol>
                        <IonSpinner name="crescent" />
                    </IonCol>
                </IonRow>
                <IonRow className="ion-text-center">
                    <IonCol>
                        <IonText>{t("loading")}</IonText>
                    </IonCol>
                </IonRow>
            </IonGrid>
        </PageLayout>
    );
};