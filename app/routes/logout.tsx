import { destroySession, getSession } from "~/session.server";
import type { Route } from "./login/+types/Login";
import { redirect } from "react-router";

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));

    return redirect(
        `/login?message=${encodeURIComponent("Successfully logout.")}`,
        {
            headers: {
                "Set-Cookie": await destroySession(session),
            },
        },
    );
}
