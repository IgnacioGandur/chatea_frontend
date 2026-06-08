// Types
import type { User } from "../../../../generated/prisma/client";

// CSS
import styles from "./SingleUser.module.css";
import classes from "~/css/classes.module.css";

// Packages
import { NavLink, useNavigation, useRouteLoaderData } from "react-router";
import type React from "react";
import type { RootLoaderData } from "~/types/RootLoaderData";
import { FadeLoader, PuffLoader, ScaleLoader } from "react-spinners";
import NavLinkLoader from "~/components/navlink-loader/NavLinkLoader";

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
    const navigation = useNavigation();
    const { user: rootData } = useRouteLoaderData("root") as RootLoaderData;
    const name = `${user.firstName} ${user.lastName}`;
    const isNavigating = navigation.state === "loading";

    // const linkToProfile = (
    //     <NavLink
    //         title={`Go to ${name}'s profile.`}
    //         to={`/users/${user.username}`}
    //         className={styles.linkToProfile}
    //     >
    //         {({ isPending }) => {
    //             return isPending ? (
    //                 <NavLinkLoader
    //                     className={styles.loader}
    //                     message="Loading profile..."
    //                 />
    //             ) : (
    //                 <>
    //                     <img
    //                         className={styles.ppf}
    //                         src={user.profilePictureUrl}
    //                         alt={name}
    //                     />
    //                     <h2 className={styles.name}>{name}</h2>
    //                     <p className={styles.username}>@{user.username}</p>
    //                 </>
    //             );
    //         }}
    //     </NavLink>
    // );

    return (
        <li
            className={`
            ${styles.user}
            ${altClassName ? altClassName : ""}
        `}
        >
            <>
                <NavLink
                    title={`Go to ${name}'s profile.`}
                    to={`/users/${user.username}`}
                    className={({ isPending }) =>
                        isPending
                            ? `
                                ${styles.linkToProfile}
                                ${classes.disabledLink}
                                ${classes.flexRowStartCenter}
                            `
                            : styles.linkToProfile
                    }
                >
                    {({ isPending }) => {
                        return isPending ? (
                            <NavLinkLoader
                                className={styles.loader}
                                message="Loading profile..."
                            />
                        ) : (
                            <>
                                <img
                                    className={styles.ppf}
                                    src={user.profilePictureUrl}
                                    alt={name}
                                />
                                <h2 className={styles.name}>{name}</h2>
                                <p className={styles.username}>
                                    @{user.username}
                                </p>
                            </>
                        );
                    }}
                </NavLink>
                {rootData ? (
                    isYou ? (
                        <p className={styles.you}>(You)</p>
                    ) : isNavigating ? null : (
                        <>{children}</>
                    )
                ) : null}
            </>
        </li>
    );
}
