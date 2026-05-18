import { createCookieSessionStorage } from "react-router";

type SessionData = {
    userId: string;
};

type SessionFlashData = {
    error: string;
};

const { getSession, commitSession, destroySession } =
    createCookieSessionStorage<SessionData, SessionFlashData>({
        cookie: {
            name: "__session",
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7, // 7 Das6y cookie
            path: "/",
            sameSite: "lax",
            secrets: [import.meta.env.VITE_COOKIE_SECRET || "Default secret"],
            secure: true,
        },
    });

export { getSession, commitSession, destroySession };
