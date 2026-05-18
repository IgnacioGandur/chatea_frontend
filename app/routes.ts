import {
    type RouteConfig,
    route,
    index,
    layout,
} from "@react-router/dev/routes";

export default [
    index("routes/home/home.tsx"),
    route("users", "./routes/users/Users.tsx"),
    route("register", "./routes/register/register.tsx"),
    route("login", "./routes/login/Login.tsx"),
    route("logout", "./routes/logout.tsx"),
    layout("./layouts/only-logged-users.tsx", [
        route("dashboard", "./routes/dashboard/dashboard.tsx", [
            index(
                "./routes/dashboard/outlets/dashboard-index/dashboardIndex.tsx",
            ),
            route(
                "settings",
                "./routes/dashboard/outlets/settings/settings.tsx",
            ),
        ]),
    ]),
] satisfies RouteConfig;
