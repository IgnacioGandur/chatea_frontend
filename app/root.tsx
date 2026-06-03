// CSS
import styles from "./root.module.css";

// General styles and variables
import "./css/app.css";
import "./css/variables.css";

// Google material symbols (icons)
import "material-symbols/rounded.css";

// Packages
import {
    isRouteErrorResponse,
    Links,
    Meta,
    NavLink,
    Outlet,
    Scripts,
    ScrollRestoration,
    useNavigate,
} from "react-router";
import { Toaster } from "react-hot-toast";

// Components
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import Sidebar from "./components/sidebar/Sidebar";

// Session
import { getSession } from "./session.server";

// Db
import userModel from "~/db/user.model";

// Types
import type { Route } from "./+types/root";

// Assets
import notFoundImage from "/images/404.svg";
import generic400Error from "/images/400.svg";

export async function loader({ request }: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) return null;

    const user = await userModel.getById(userId, true);

    return user;
}

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <Meta />
                <Links />
            </head>
            <body>
                <Toaster position="top-center" />
                <Navbar />
                {children}
                <Sidebar />
                <Footer />
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function App() {
    return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    const navigate = useNavigate();

    let title: string | number = "Oops!";
    let statusMessage: string | undefined;
    let details = "An unexpected error occurred.";
    let stack: string | undefined;
    let image: string | undefined;

    if (isRouteErrorResponse(error)) {
        title = error.status || "Error";
        // title = error.status === 404 ? "404" : "Error";
        statusMessage = error.status === 404 ? "Not Found." : "Server Error.";
        details =
            error.status === 404
                ? "The page you are looking for doesn't exist..."
                : error.statusText || details;
        image = error.status === 404 ? notFoundImage : generic400Error;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className={styles.errorBoundary}>
            <section className={styles.info}>
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.statusMessage}>{statusMessage}</p>
                <p className={styles.details}>{details}</p>
                {stack && (
                    <pre>
                        <code>{stack}</code>
                    </pre>
                )}
                <div className={styles.links}>
                    <NavLink
                        title="Go to home."
                        className={styles.link}
                        to="/"
                    >
                        Go home
                    </NavLink>
                    <button
                        title="Go to previous page."
                        className={styles.link}
                        onClick={() => navigate(-1)}
                    >
                        Go back
                    </button>
                </div>
            </section>
            <section className={styles.graphics}>
                <img
                    src={image}
                    alt="Not found"
                    className={styles.image}
                />
            </section>
        </main>
    );
}
