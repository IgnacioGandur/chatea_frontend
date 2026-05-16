import styles from "./home.module.css";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Welcome to Chateá!" },
        { name: "description", content: "Welcome to React Router!" },
    ];
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
