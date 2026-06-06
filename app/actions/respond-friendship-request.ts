import { getSession } from "~/session.server";
import type { Route } from "./+types/respond-friendship-request";
import { data } from "react-router";
import friendshipModel from "~/db/friendship.model";
import { validateFriendshipRequestResponse } from "~/validators/validateFriendshipRequestResponse";

type FormValues = {
    friendshipId: string;
    response: "accept" | "reject";
};

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        throw data("Unauthorized.", {
            status: 401,
            statusText: "This route is only for logged users.",
        });
    }

    const formData = await request.formData();
    const values = Object.fromEntries(formData) as FormValues;

    const validation = await validateFriendshipRequestResponse(
        Number(userId),
        Number(values.friendshipId),
        values.response,
    );

    if (!validation.success) {
        return {
            success: false,
            message: "Friendship response failed.",
            errors: validation.error.issues,
        };
    }

    const message = await friendshipModel.handleFriendshipRequest(
        validation.data.response,
        validation.data.friendshipId,
    );

    return {
        success: true,
        message,
    };
}
