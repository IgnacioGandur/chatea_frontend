import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
    index("routes/home/home.tsx"),
    route("register", "./routes/register/register.tsx"),
] satisfies RouteConfig;
