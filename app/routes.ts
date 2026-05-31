import {
    type RouteConfig,
    route,
    index,
    layout,
} from "@react-router/dev/routes";

export default [
    index("routes/home/home.tsx"),
    route("users", "./routes/users/Users.tsx"),
    route("users/:username", "./routes/user-profile/UserProfile.tsx"),
    route("register", "./routes/register/register.tsx"),
    route("login", "./routes/login/Login.tsx"),

    // Routes only for logged users.
    layout("./layouts/only-logged-users.tsx", [
        route("logout", "./routes/logout.tsx"),

        // Dashboard
        route("dashboard", "./routes/dashboard/dashboard.tsx", [
            index(
                "./routes/dashboard/outlets/dashboard-index/dashboardIndex.tsx",
            ),
            route(
                "settings",
                "./routes/dashboard/outlets/settings/settings.tsx",
            ),
        ]),

        // Conversations
        layout("./layouts/conversations-layout/conversations.layout.tsx", [
            route("conversations", "./routes/conversations/Conversations.tsx", [
                index(
                    "./routes/conversations/outlets/conversations-index/ConversationsIndex.tsx",
                ),
                route(
                    ":id",
                    "./routes/conversations/outlets/current-conversation/CurrentConversation.tsx",
                ),
            ]),
        ]),
    ]),

    // Actions
    route("send-message", "./actions/send-message.ts"),
] satisfies RouteConfig;
