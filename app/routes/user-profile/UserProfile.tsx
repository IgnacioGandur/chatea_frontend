import styles from "./UserProfile.module.css";
import type { Route } from "./+types/UserProfile";
import userModel from "~/db/user";
import { data } from "react-router";
import { CustomErrorBoundary } from "~/components/custom-error-boundary/CustomErrorBoundary";

export function meta({ loaderData }: Route.MetaArgs) {
    if (!loaderData) {
        return [
            { title: "404 - User Not found | Chateá!" },
            {
                meta: "description",
                content: "The user you are looking for doesn't exist.",
            },
        ];
    }

    return [
        {
            title: `${loaderData.firstName} ${loaderData.lastName} profile in Chateá!`,
        },
        {
            meta: "description",
            content: `Get in touch with ${loaderData.firstName} ${loaderData.lastName} in Chateá!`,
        },
    ];
}

export async function loader({ params }: Route.LoaderArgs) {
    const { username } = params;

    const user = await userModel.get(username);

    if (!user) {
        throw data("Not Found.", {
            status: 404,
            statusText: "User not found.",
        });
    }

    return user;
}

export default function UserProfile({ loaderData }: Route.ComponentProps) {
    const ppf = loaderData?.profilePictureUrl;
    const name = `${loaderData?.firstName} ${loaderData?.lastName}`;

    return (
        <main className={styles.userProfile}>
            <h1>{name}</h1>
            <p className={styles.username}>@{loaderData?.username}</p>
            <img
                src={ppf}
                alt={name}
                className={styles.ppf}
            />
        </main>
    );
}

export const ErrorBoundary = CustomErrorBoundary;
