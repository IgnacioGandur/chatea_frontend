import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Create an account in Chateá!" },
        { name: "description", content: "Join us by creating a new account." },
    ];
}

export default function Home() {
    return (
        <main>
            <h1>Register page</h1>
        </main>
    );
}
