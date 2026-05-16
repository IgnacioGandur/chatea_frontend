import {
    Navigate,
    useLocation,
    useRouteLoaderData,
    Outlet,
} from "react-router";
import type { GenericApiResponse } from "~/types/GenericApiResponse";

export default function OnlyLoggedUsers() {
    const location = useLocation();
    const data = useRouteLoaderData("root") as GenericApiResponse;
    const to =
        `/login?message=` +
        encodeURIComponent(
            `The route: "${location.pathname}" is only for logged users.`,
        );

    if (data && !data.success) {
        return (
            <Navigate
                to={to}
                replace
            />
        );
    }

    return <Outlet />;
}
