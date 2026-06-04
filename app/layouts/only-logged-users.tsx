import {
    Navigate,
    useLocation,
    useRouteLoaderData,
    Outlet,
} from "react-router";
import type { RootLoaderData } from "~/types/RootLoaderData";

export default function OnlyLoggedUsers() {
    const location = useLocation();
    const { user: data } = useRouteLoaderData("root") as RootLoaderData;

    const to =
        `/login?message=` +
        encodeURIComponent(
            `The route: "${location.pathname}" is only for logged users.`,
        );

    if (!data) {
        return (
            <Navigate
                to={to}
                replace
            />
        );
    }

    return <Outlet />;
}
