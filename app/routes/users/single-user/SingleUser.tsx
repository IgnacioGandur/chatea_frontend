import Popover from "~/components/popover/Popover";
import type { User } from "../../../../generated/prisma/client";
import styles from "./SingleUser.module.css";
import { NavLink, useRouteLoaderData } from "react-router";
import SendMessageForm from "./send-message-form/SendMessageForm";

interface SingleUserProps {
    isYou: boolean;
    user: Omit<User, "password">;
}

export default function SingleUser({ user, isYou }: SingleUserProps) {
    const rootData = useRouteLoaderData("root") as User;

    const linkToProfile = (
        <NavLink
            to={`/users/${user.username}`}
            className={styles.data}
        >
            {({ isPending }) => {
                return isPending ? (
                    <div>Loaing...</div>
                ) : (
                    <>
                        <img
                            className={styles.ppf}
                            src={user.profilePictureUrl}
                            alt={`${user.firstName} ${user.lastName}`}
                        />
                        <h2 className={styles.name}>
                            {user.firstName} {user.lastName}
                        </h2>
                        <p className={styles.username}>@{user.username}</p>
                    </>
                );
            }}
        </NavLink>
    );

    const sendMessagePopover = isYou ? (
        <p className={styles.you}>You</p>
    ) : (
        <Popover
            popoverTarget={`user-${user.id}`}
            anchorName={`--user-${user.id}`}
            buttonContent={"send message"}
        >
            {
                <SendMessageForm
                    formAction="/send-message"
                    userBId={user.id}
                />
            }
        </Popover>
    );

    return (
        <article className={styles.user}>
            {rootData ? (
                <>
                    {linkToProfile}
                    {sendMessagePopover}
                </>
            ) : (
                <>{linkToProfile}</>
            )}
        </article>
    );
}
