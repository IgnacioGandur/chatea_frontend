import styles from "./home.module.css";
import type { Route } from "../+types/home";
import type { GenericApiResponse } from "~/types/GenericApiResponse";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Welcome to Chateá!" },
        { name: "description", content: "Welcome to React Router!" },
    ];
}

export async function loader() {
    const response = await fetch(import.meta.env.VITE_API_URL);
    const result: GenericApiResponse = await response.json();
    return result;
}

export default function Home({ loaderData }: Route.ComponentProps) {
    console.log(loaderData);
    return (
        <main className={styles.home}>
            <h1>Home page</h1>
        </main>
    );
}
