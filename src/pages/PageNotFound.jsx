import "./PageNotFound.css";
import PageLayout from "../components/PageLayout";

// Through PageLayout like every other page, so it carries the header - the
// navigation bar on wide screens - and the footer with it.
export default function PageNotFound() {
    return (
        <PageLayout name="page-not-found">
            <p>Page Not Found</p>
        </PageLayout>
    );
}
