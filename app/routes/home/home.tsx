import styles from "./home.module.css";
import type { Route } from "./+types/home";
import { getSession } from "~/session.server";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Welcome to Chateá!" },
        { name: "description", content: "Welcome to React Router!" },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));

    const userId = session.get("userId");

    console.log("User id: ", userId);
}

export default function Home() {
    return (
        <main className={styles.home}>
            <h1 className={styles.title}>Chateá!</h1>
            <p className={styles.para}>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolores
                dolore tempora fugit praesentium, cum corrupti maxime id
                impedit, architecto amet obcaecati sapiente et, ipsam modi
                voluptates. Sint aliquid voluptas temporibus.
            </p>
        </main>
    );
}
