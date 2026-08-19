import { useEffect } from "react";
import { useParams } from "react-router-dom";
import Loading from "../components/Loading";

/**
 * The AR scenes are plain static pages under public/ar, outside the React app,
 * so this page exists only to hand the browser over to one. replace() rather
 * than assign() keeps it out of the history: coming back from AR should return
 * to the sight, not bounce through here and forward again.
 */
export default function ArViewer() {
  const { id } = useParams();

  useEffect(() => {
    // absolute, so it resolves the same from /ar/:id as from anywhere else
    window.location.replace("/ar/" + id + "/index.html");
  }, [id]);

  return <Loading />;
}
