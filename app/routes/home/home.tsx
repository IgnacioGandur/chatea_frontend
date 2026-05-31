import styles from "./home.module.css";
import type { Route } from "./+types/home";
import React from "react";
import { Await } from "react-router";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Welcome to Chateá!" },
        { name: "description", content: "Welcome to React Router!" },
    ];
}

export function loader({}: Route.LoaderArgs) {
    const promise = new Promise((res) =>
        setTimeout(() => res("Data from the promise"), 5000),
    );

    return { promise };
}

export default function Home({ loaderData }: Route.ComponentProps) {
    const loader = <div className={styles.loader}>Loading data...</div>;

    return (
        <main className={styles.home}>
            <h1 className={styles.title}>Chateá!</h1>
            <p className={styles.para}>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolores
                dolore tempora fugit praesentium, cum corrupti maxime id
                impedit, architecto amet obcaecati sapiente et, ipsam modi
                voluptates. Sint aliquid voluptas temporibus.
            </p>
            <React.Suspense fallback={loader}>
                <Await resolve={loaderData.promise}>
                    {(value) => (
                        <h1>This is the content of the promise: {value}</h1>
                    )}
                </Await>
            </React.Suspense>
        </main>
    );
}
