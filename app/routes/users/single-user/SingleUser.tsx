// Types
import type { User } from "../../../../generated/prisma/client";

// CSS
import styles from "./SingleUser.module.css";

// Packages
import { NavLink, useRouteLoaderData } from "react-router";
import type React from "react";
import type { RootLoaderData } from "~/types/RootLoaderData";

interface SingleUserProps {
    isYou: boolean;
    user: Omit<User, "password">;
    children?: React.ReactNode;
    altClassName?: string;
}

export default function SingleUser({
    user,
    isYou,
    altClassName,
    children,
}: SingleUserProps) {
    const { user: rootData } = useRouteLoaderData("root") as RootLoaderData;
    const name = `${user.firstName} ${user.lastName}`;

    const linkToProfile = (
        <NavLink
            title={`Go to ${name}'s profile.`}
            to={`/users/${user.username}`}
            className={styles.linkToProfile}
        >
            {({ isPending }) => {
                return isPending ? (
                    <div>Loaing...</div>
                ) : (
                    <>
                        <img
                            className={styles.ppf}
                            src={user.profilePictureUrl}
                            alt={name}
                        />
                        <h2 className={styles.name}>{name}</h2>
                        <p className={styles.username}>@{user.username}</p>
                    </>
                );
            }}
        </NavLink>
    );

    return (
        <li className={`${styles.user} ${altClassName}`}>
            {linkToProfile}{" "}
            {rootData ? (
                isYou ? (
                    <p className={styles.you}>(You)</p>
                ) : (
                    <>{children}</>
                )
            ) : null}
        </li>
    );
}
