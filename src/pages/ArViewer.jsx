import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Loading from "../components/Loading";

/**
 * The AR scenes are plain static pages under public/ar, outside the React app,
 * so this page exists only to hand the browser over to one. replace() rather
 * than assign() keeps it out of the history: coming back from AR should return
 * to the sight, not bounce through here and forward again.
 */
export default function ArViewer() {
  const { id } = useParams();
  const { i18n } = useTranslation();

  useEffect(() => {
    // The scene is a plain page with its own copy of the one label it shows, so
    // it is told which language to use. Absolute, so the path resolves the same
    // from /ar/:id as from anywhere else.
    const language = i18n.resolvedLanguage ?? i18n.language;
    window.location.replace(`/ar/${id}/index.html?lang=${language}`);
  }, [id, i18n.resolvedLanguage, i18n.language]);

  return <Loading />;
}
