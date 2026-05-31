import userModel from "~/db/user";
import type { Route } from "./+types/Users";
import styles from "./Users.module.css";
import SingleUser from "./single-user/SingleUser";
import { useFetcher, useRouteLoaderData } from "react-router";
import type { User } from "../../../generated/prisma/client";

export function meta({}: Route.MetaArgs) {
    return [
        {
            title: "Users | Chateá!",
        },
        {
            name: "description",
            content: "Meet new friends in Chateá!",
        },
    ];
}

export async function loader() {
    const users = await userModel.getAll();
    return users;
}

export default function Users({ loaderData }: Route.ComponentProps) {
    const rootData = useRouteLoaderData("root") as Omit<User, "password">;
    const fetcher = useFetcher();

    const isSendingMessage = fetcher.state !== "idle";

    return (
        <main className={styles.users}>
            <h1 className={styles.title}>Users title</h1>
            {loaderData.length === 1 ? (
                <div className={styles.emptyUsers}>
                    <h1>You are the only user in the platform :(</h1>
                </div>
            ) : (
                <ul className={styles.usersContainer}>
                    {loaderData.map((user) => {
                        const isYou = user.id === rootData.id;
                        const name = user.firstName + " " + user.lastName;

                        return (
                            <SingleUser
                                key={user.id}
                                isYou={isYou}
                                user={user}
                            />
                        );

                        return (
                            <li
                                key={user.id}
                                className={styles.user}
                            >
                                <div className={styles.info}>
                                    <img
                                        src={user.profilePictureUrl}
                                        alt={name}
                                        className={styles.ppf}
                                    />
                                    <h4 className={styles.name}>{name}</h4>
                                    <p className={styles.username}>
                                        @{user.username}
                                    </p>
                                </div>
                                {isYou ? (
                                    <p className={styles.you}>You</p>
                                ) : isSendingMessage ? (
                                    <p>Sending...</p>
                                ) : (
                                    <fetcher.Form
                                        method="post"
                                        action="/send-message"
                                    >
                                        <input
                                            type="hidden"
                                            name="userBId"
                                            value={user.id}
                                        />
                                        <input
                                            type="text"
                                            name="message"
                                        />
                                        <button type="submit">Send</button>
                                    </fetcher.Form>
                                )}
                            </li>
                        );
                    })}
                </ul>
                // <div className={styles.usersContainer}>
                //     {loaderData.map((user) => {
                //         const isYou = user.id === rootData?.id;
                //         return isYou ? null : (
                //             <SingleUser
                //                 key={user.id}
                //                 user={user}
                //                 isYou={isYou}
                //             />
                //         );
                //     })}
                // </div>
            )}
        </main>
    );
}
