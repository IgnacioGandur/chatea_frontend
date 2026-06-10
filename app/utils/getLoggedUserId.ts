import { getSession } from "~/session.server";

export async function getLoggedUserId(
    request: Request,
): Promise<{ loggedUserId: string | null }> {
    const session = await getSession(request.headers.get("Cookie"));
    const loggedUserId = session.get("userId");

    return {
        loggedUserId: loggedUserId ? loggedUserId : null,
    };
}
