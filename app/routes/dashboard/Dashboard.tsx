import PageHeader from "~/components/page-header/PageHeader";
import styles from "./Dashboard.module.css";
import classes from "~/css/classes.module.css";
import type { Route } from "./+types/Dashboard";
import { getLoggedUserId } from "~/utils/getLoggedUserId";
import userModel from "~/db/user.model";
import { Suspense } from "react";
import { Await, useFetcher } from "react-router";
import { customFormatDate } from "~/utils/formatDate";
import EditFieldButton from "~/components/edit-field-button/EditFieldButton";
import validateUserUpdate from "~/validators/validateUserUpdate";
import { useFetcherToast } from "~/hooks/useFetcherToast";
import { checkForValidationErrors } from "~/utils/checkForValidationErrors";
import ValidationErrors from "~/components/validation-errors/ValidationErrors";
import CustomInput from "~/components/custom-input/CustomInput";
import type { MaterialSymbols } from "material-design-icons-literal-types";
import { supabaseAdmin } from "~/supabase/supabase.server";
import { deleteFolderFromSupabaseBucket } from "~/supabase/deleteBucketFolder";
import { validateProfilePictureUpload } from "~/validators/validateProfilePictureUpload";
import AltPopover from "~/components/alt-popover/AltPopover";

export async function loader({ request }: Route.LoaderArgs) {
    const { loggedUserId } = await getLoggedUserId(request);
    const id = Number(loggedUserId);

    // const profileStatsPromise = new Promise((r, _) => {
    //     setTimeout(() => {
    //         r(userModel.getUserProfileStats(id));
    //     }, 4000);
    // });

    const profileStatsPromise = userModel.getUserProfileStats(id);

    return {
        profileStatsPromise,
    };
}

const validIntents = [
    "update-profile-picture",
    "upload-profile-picture",
] as const;

type ValidIntent = (typeof validIntents)[number];

export async function action({ request }: Route.ActionArgs) {
    const { loggedUserId } = await getLoggedUserId(request);
    const uId = Number(loggedUserId);
    const formData = await request.formData();
    const intent = formData.get("intent") as ValidIntent;

    switch (intent) {
        case "update-profile-picture": {
            const profilePictureUrl = formData.get(
                "profilePictureUrl",
            ) as string;

            const validation = await validateUserUpdate(uId, profilePictureUrl);

            if (!validation.success) {
                return {
                    success: false,
                    message:
                        "Error while trying to update your profile picture:",
                    errors: validation.error.issues,
                };
            }

            await userModel.updateUser(
                uId,
                "profilePictureUrl",
                validation.data.profilePictureUrl,
            );

            return {
                success: true,
                message: "User profile updated!",
            };
        }

        case "upload-profile-picture": {
            const file = formData.get("file") as File;
            const uId = Number(loggedUserId);
            const validation = await validateProfilePictureUpload(uId, file);

            if (!validation.success) {
                return {
                    success: false,
                    message: "Profile picture update failed.",
                    errors: validation.error.issues,
                };
            }

            try {
                await deleteFolderFromSupabaseBucket(
                    "profile_pictures",
                    String(loggedUserId),
                );
            } catch (e: any) {
                console.error(
                    "Error while trying to delete files from Supabase bucket folder.",
                    e,
                );

                return {
                    success: false,
                    message: e.message,
                };
            }

            const filePath = `${uId}/${Date.now()}-${validation.data.file.sanitizedName}`;

            const { data: uploadData, error: uploadError } =
                await supabaseAdmin.storage
                    .from("profile_pictures")
                    .upload(filePath, file);

            if (uploadError) {
                console.error("Supabase upload error: ", uploadError);
                return {
                    success: false,
                    message:
                        "Profile picture upload failed. Try again later...",
                };
            }

            const { data } = supabaseAdmin.storage
                .from("profile_pictures")
                .getPublicUrl(uploadData.path);

            await userModel.updateUser(
                uId,
                "profilePictureUrl",
                data.publicUrl,
            );

            return {
                success: true,
                message: "Profile picture updated.",
            };
        }
    }
}

function Skeleton() {
    return (
        <article className={styles.skeleton}>
            <p>loading...</p>
        </article>
    );
}

function ErrorElement() {
    return (
        <article className={styles.errorElement}>
            <h1>Error Page</h1>
        </article>
    );
}

interface Stat {
    icon: MaterialSymbols;
    title: string;
    number: number;
    className: string;
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
    const fetcher = useFetcher();
    const { profileStatsPromise } = loaderData;

    const setToastData = useFetcherToast(fetcher);

    function onSubmit() {
        setToastData({
            failMessage: "Error while updating profile picture.",
            loadingMessage: "Updating profile, please wait...",
            toastId: "update-profile",
        });
    }

    const hasValidationErrors = checkForValidationErrors(fetcher);

    return (
        <main className={styles.dashboard}>
            {hasValidationErrors ? (
                <ValidationErrors
                    errors={fetcher.data!.errors}
                    title={fetcher.data.message}
                />
            ) : null}
            <PageHeader
                icon="dashboard"
                title="Dashboard"
            />
            <Suspense fallback={<Skeleton />}>
                <Await
                    resolve={profileStatsPromise}
                    errorElement={<ErrorElement />}
                >
                    {(profile) => {
                        if (!profile) {
                            return <p>Error</p>;
                        }

                        const {
                            user: {
                                username,
                                profilePictureUrl,
                                firstName,
                                lastName,
                                joinedOn,
                            },
                            sentMessagesCount,
                            friendshipsCount,
                            totalConversationsCount,
                            privateConversationsCount,
                            groupConversationsCount,
                            ownedGroupsCount,
                        } = profile;

                        const name = `${firstName} ${lastName}`;
                        const joinedOnHumanReadable =
                            customFormatDate(joinedOn);

                        const isNotIdle = fetcher.state !== "idle";

                        const isUpdatingProfilePicture =
                            isNotIdle &&
                            fetcher.formData?.get("profilePictureUrl");

                        const isUploadingProfilePicture =
                            isNotIdle && fetcher.formData?.get("file");

                        const stats: Stat[] = [
                            {
                                icon: "send",
                                className: styles.sentMessages,
                                number: sentMessagesCount,
                                title: "Sent messages",
                            },
                            {
                                icon: "diversity_2",
                                className: styles.totalFriends,
                                number: friendshipsCount,
                                title: "Friends",
                            },
                            {
                                icon: "conversation",
                                className: styles.conversations,
                                number: totalConversationsCount,
                                title: "Conversations",
                            },
                            {
                                icon: "domino_mask",
                                className: styles.privateConversations,
                                number: privateConversationsCount,
                                title: "Private conversations",
                            },
                            {
                                icon: "groups_3",
                                className: styles.groupConversations,
                                number: groupConversationsCount,
                                title: "Group conversations",
                            },
                            {
                                icon: "graph_5",
                                className: styles.ownedGroups,
                                number: ownedGroupsCount,
                                title: "Your groups",
                            },
                        ];

                        return (
                            <div className={styles.profile}>
                                <article
                                    className={`${styles.user} ${classes.flexColumn}`}
                                >
                                    <PageHeader
                                        icon="account_circle"
                                        title="Current Profile"
                                    />
                                    <div
                                        className={`${styles.info} ${classes.flexColumnCenter}`}
                                    >
                                        <div
                                            className={`${styles.ppfWrapper} ${classes.profilePictureRound} ${classes.pictureGiant}`}
                                        >
                                            {isUpdatingProfilePicture ||
                                            isUploadingProfilePicture ? (
                                                <div
                                                    className={`${classes.profilePictureRound} ${classes.pictureGiant} ${classes.suspenseBackgroundAnimation}`}
                                                ></div>
                                            ) : (
                                                <>
                                                    <img
                                                        className={`${classes.profilePictureRound} ${classes.pictureGiant} ${styles.ppf}`}
                                                        src={profilePictureUrl}
                                                        alt={name}
                                                    />
                                                    <EditFieldButton
                                                        anchorButtonClass={
                                                            styles.editButton
                                                        }
                                                        fetcher={fetcher}
                                                        fieldId="update-ppf"
                                                        labelText="Update profile picture URL"
                                                        inputIcon="edit"
                                                        buttonIcon="edit"
                                                        placeholder="https://placehold.co/600x400.png"
                                                        inputName="profilePictureUrl"
                                                        intentValue="update-profile-picture"
                                                        inputClarification="The URL should point to an image."
                                                        onSubmit={onSubmit}
                                                    />
                                                    <AltPopover
                                                        className={
                                                            styles.uploadPpf
                                                        }
                                                        icon="upload"
                                                        popoverPosition="bottom"
                                                    >
                                                        <fetcher.Form
                                                            onSubmit={onSubmit}
                                                            method="post"
                                                            encType="multipart/form-data"
                                                        >
                                                            <input
                                                                type="hidden"
                                                                name="intent"
                                                                value="upload-profile-picture"
                                                            />
                                                            <input
                                                                type="file"
                                                                name="file"
                                                                accept="image/*"
                                                                required
                                                            />
                                                            <button type="submit">
                                                                Update
                                                            </button>
                                                        </fetcher.Form>
                                                    </AltPopover>
                                                </>
                                            )}
                                        </div>
                                        <h1 className={`${classes.titleMain}`}>
                                            {name}
                                        </h1>
                                        <p
                                            className={`${styles.username} ${classes.subText} `}
                                        >
                                            @{username}
                                        </p>
                                        <time
                                            className={`${classes.textMainDimmedItalic}`}
                                        >
                                            Account created on{" "}
                                            {joinedOnHumanReadable}
                                        </time>
                                    </div>
                                </article>
                                <div
                                    className={`${styles.stats} ${classes.flexColumn}`}
                                >
                                    <PageHeader
                                        icon="bar_chart_4_bars"
                                        title="Stats"
                                    />
                                    <div
                                        className={`${classes.flexRow} ${styles.statsContainer}`}
                                    >
                                        {stats.map((s, i) => {
                                            return (
                                                <section
                                                    key={i}
                                                    className={`${styles.stat} ${s.className}`}
                                                >
                                                    <header
                                                        className={`${classes.flexRowStartCenter} ${styles.header}`}
                                                    >
                                                        <span
                                                            className={`${classes.iconWithGradientColors} ${styles.icon} material-symbols-rounded`}
                                                        >
                                                            {s.icon}
                                                        </span>
                                                        <div
                                                            className={`${classes.ballSeparator} ${styles.ballSeparator}`}
                                                        ></div>
                                                        <h2
                                                            className={`${classes.titleSmallMainFont}`}
                                                        >
                                                            {s.title}
                                                        </h2>
                                                    </header>
                                                    <p
                                                        className={
                                                            styles.number
                                                        }
                                                    >
                                                        {s.number}
                                                    </p>
                                                </section>
                                            );
                                        })}
                                    </div>
                                </div>
                                <section className={styles.password}>
                                    <PageHeader
                                        icon="key"
                                        title="Password"
                                    />
                                    <CustomInput
                                        labelText="Update your password"
                                        id="password"
                                        icon="lock"
                                        clarification="Use a strong password."
                                        required
                                        name="password"
                                        placeholder="******"
                                    />
                                    <CustomInput
                                        labelText="Confirm your password"
                                        id="confirm-password"
                                        icon="lock_reset"
                                        clarification="Repeat your password."
                                        required
                                        name="confirmPassword"
                                        placeholder="******"
                                    />
                                </section>
                            </div>
                        );
                    }}
                </Await>
            </Suspense>
        </main>
    );
}
