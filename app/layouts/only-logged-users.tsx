import {
    Navigate,
    useLocation,
    useRouteLoaderData,
    Outlet,
} from "react-router";
import type { User } from "~/types/user";

export default function OnlyLoggedUsers() {
    const location = useLocation();
    const data = useRouteLoaderData("root") as {
        success: boolean;
        message: string;
        user: User;
    };

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
