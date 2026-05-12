import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
    index("routes/home/home.tsx"),
    route("register", "./routes/register/register.tsx"),
    route("dashboard", "./routes/dashboard/dashboard.tsx", [
        index("./routes/dashboard/outlets/dashboard-index/dashboardIndex.tsx"),
        route("settings", "./routes/dashboard/outlets/settings/settings.tsx"),
    ]),
] satisfies RouteConfig;
