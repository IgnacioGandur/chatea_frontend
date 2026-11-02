import groupsModel from "~/db/groups.model";
import type { Route } from "./+types/route";
import { getLoggedUserId } from "~/utils/getLoggedUserId";

export async function loader({ request }: Route.LoaderArgs) {
    await new Promise((r) => setTimeout(r, 3000));

    const { loggedUserId } = await getLoggedUserId(request);
    const params = new URL(request.url).searchParams;
    const cursor = params.get("cursor");
    const title = params.get("title") ?? "";
    const filter = params.get("filter") ?? "";

    return await groupsModel.getGroupsPage(
        cursor ? Number(cursor) : undefined,
        title,
        filter,
        Number(loggedUserId),
    );
}
