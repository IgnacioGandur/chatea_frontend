import styles from "./Friendships.module.css";
import type { Route } from "./+types/Friendships";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Friendships | Chateá!" },
        { name: "description", description: "All you friends in Chateá!" },
    ];
}

export function loader({}: Route.LoaderArgs) {}

export function action({}: Route.ActionArgs) {}

export default function Friendships({}: Route.ComponentProps) {
    return (
        <main className={styles.friendships}>
            <h1>Friendships page.</h1>
        </main>
    );
}
