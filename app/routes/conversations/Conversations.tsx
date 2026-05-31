import { Outlet } from "react-router";
import type { Route } from "./+types/Conversations";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Your Conversations | Chateá!" },
        {
            name: "description",
            content: "All your conversations with your friends in Chateá!",
        },
    ];
}

export default function Conversations() {
    return <Outlet />;
}
