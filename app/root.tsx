// General styles and variables
import "./css/app.css";
import "./css/variables.css";

// Google material symbols (icons)
import "material-symbols/rounded.css";

import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useRouteLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import Sidebar from "./components/sidebar/Sidebar";
import ServerError from "./components/server-error/ServerError";

import type { GenericApiResponse } from "./types/GenericApiResponse";

export async function loader(): Promise<GenericApiResponse> {
    const endpoint = import.meta.env.VITE_API_URL + "/auth/me";
    const options: RequestInit = {
        method: "get",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    };

    const response = await fetch(endpoint, options);
    const result = await response.json();
    console.log("The content of result is: ", result);
    return result;
}

export function Layout({ children }: { children: React.ReactNode }) {
    const loaderData = useRouteLoaderData<GenericApiResponse>("root");

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
                <Navbar />
                {loaderData?.error ? <ServerError /> : null}
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
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className="pt-16 p-4 container mx-auto">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto">
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    );
}
