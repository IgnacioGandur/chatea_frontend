import PageHeader from "~/components/page-header/PageHeader";
import styles from "./Dashboard.module.css";
import classes from "~/css/classes.module.css";
import type { Route } from "./+types/Dashboard";
import { getLoggedUserId } from "~/utils/getLoggedUserId";
import userModel from "~/db/user.model";
import { Suspense, useId, type ReactNode } from "react";
import { Await, useFetcher } from "react-router";
import { customFormatDate } from "~/utils/formatDate";
import validateUserUpdate from "~/validators/validateUserUpdate";
import { useFetcherToast } from "~/hooks/useFetcherToast";
import { checkForValidationErrors } from "~/utils/checkForValidationErrors";
import ValidationErrors from "~/components/validation-errors/ValidationErrors";
import CustomInput from "~/components/custom-input/CustomInput";
import type { MaterialSymbols } from "material-design-icons-literal-types";
import { supabaseAdmin } from "~/supabase/supabase.server";
import { deleteFolderFromSupabaseBucket } from "~/supabase/deleteBucketFolder";
import { validateProfilePictureUpload } from "~/validators/validateProfilePictureUpload";
import validatePasswordUpdate from "~/validators/validatePasswordUpdate";
import bcrypt from "bcryptjs";

export async function loader({ request }: Route.LoaderArgs) {
    const { loggedUserId } = await getLoggedUserId(request);
    const id = Number(loggedUserId);

    const profileStatsPromise = new Promise((r, _) => {
        setTimeout(() => {
            r(userModel.getUserProfileStats(id));
        }, 4000);
    });

    // const profileStatsPromise = userModel.getUserProfileStats(id);

    return {
        profileStatsPromise,
    };
}

const validIntents = [
    "update-profile-picture",
    "upload-profile-picture",
    "update-password",
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

        case "update-password": {
            const newPassword = formData.get("password") as string;
            const confirmPassword = formData.get("confirmPassword") as string;

            const validation = await validatePasswordUpdate(
                newPassword,
                confirmPassword,
            );

            if (!validation.success) {
                return {
                    success: false,
                    message: "Password update failed: ",
                    errors: validation.error.issues,
                };
            }

            const { password: validatedPassword } = validation.data;

            const hashedPassword = await bcrypt.hash(validatedPassword, 10);

            await userModel.updateUser(uId, "password", hashedPassword);

            return {
                success: true,
                message: "Password updated",
            };
        }
    }
}

function Skeleton() {
    const fakeStats: Stat[] = [
        {
            icon: "send",
            className: styles.sentMessages,
            number: 0,
            title: "Sent messages",
        },
        {
            icon: "diversity_2",
            className: styles.totalFriends,
            number: 0,
            title: "Friends",
        },
        {
            icon: "conversation",
            className: styles.conversations,
            number: 0,
            title: "Conversations",
        },
        {
            icon: "domino_mask",
            className: styles.privateConversations,
            number: 0,
            title: "Private conversations",
        },
        {
            icon: "groups_3",
            className: styles.groupConversations,
            number: 0,
            title: "Group conversations",
        },
        {
            icon: "graph_5",
            className: styles.ownedGroups,
            number: 0,
            title: "Your groups",
        },
    ];

    const fakeInput = (
        <div
            className={`
            ${styles.fakeInput}
            ${classes.flexColumn}
        `}
        >
            <div
                className={`
                ${styles.title}
                ${classes.suspenseBackgroundAnimation}
            `}
            ></div>
            <div
                className={`
                ${styles.input}
                ${classes.suspenseBackgroundAnimation}
                `}
            ></div>
            <div
                className={`
                ${styles.clarification}
                ${classes.suspenseBackgroundAnimation}
                `}
            ></div>
        </div>
    );

    return (
        <main className={styles.skeleton}>
            <title>Dashboard | Chateá!</title>
            <div className={styles.profile}>
                <div
                    className={`
                    ${styles.user}
                    ${classes.flexColumn}
                `}
                >
                    <PageHeader
                        icon="account_circle"
                        title="Current Profile"
                    />
                    <div
                        className={`
                            ${styles.info}
                            ${classes.flexColumnCenter}
                        `}
                    >
                        <h1
                            className={`
                            ${styles.titleMain}
                            ${classes.suspenseBackgroundAnimation}
                        `}
                        ></h1>
                        <div
                            className={`
                                ${styles.ppfWrapper}
                                ${classes.profilePictureRound}
                                ${classes.pictureGiant}
                                ${classes.flexRowAlignCenterJustifyCenter}
                            `}
                        >
                            <div
                                style={{ border: "none" }}
                                className={`
                                    ${classes.profilePictureRound}
                                    ${classes.pictureGiant}
                                    ${classes.suspenseBackgroundAnimation}
                                `}
                            ></div>
                        </div>
                        <p
                            className={`
                                    ${styles.username}
                                    ${classes.subText}
                                    ${classes.suspenseBackgroundAnimation}
                                `}
                        ></p>
                        <p
                            className={`
                            ${styles.joinDate}
                            ${classes.textMainDimmedItalic}
                            ${classes.suspenseBackgroundAnimation}
                        `}
                        ></p>
                    </div>
                </div>
                <div
                    className={`
                    ${styles.stats}
                    ${classes.flexColumn}
                `}
                >
                    <PageHeader
                        icon="bar_chart_4_bars"
                        title="Stats"
                    />
                    <div
                        className={`
                            ${classes.flexRow}
                            ${styles.statsContainer}
                        `}
                    >
                        {fakeStats.map((s, i) => {
                            return (
                                <section
                                    key={i}
                                    className={`
                                        ${styles.stat}
                                        ${classes.flexColumn}
                                        ${s.className}
                                    `}
                                >
                                    <header
                                        className={`
                                            ${classes.flexRowStartCenter}
                                            ${styles.header}
                                        `}
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
                                    <div className={styles.numberWrapper}>
                                        <p
                                            style={{
                                                color: "transparent",
                                            }}
                                            className={`
                                                ${styles.number}
                                                ${classes.suspenseBackgroundAnimation}
                                            `}
                                        >
                                            {s.number}
                                        </p>
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                </div>
                <div
                    className={`
                    ${styles.password}
                    ${classes.flexColumn}
                `}
                >
                    <PageHeader
                        icon="key"
                        title="Password"
                    />
                    <div
                        className={`
                            ${styles.updatePasswordForm}
                            ${classes.flexColumn}
                        `}
                    >
                        {fakeInput}
                        {fakeInput}
                        <div
                            className={`
                            ${styles.fakeButton}
                            ${classes.suspenseBackgroundAnimation}
                        `}
                        ></div>
                    </div>
                </div>
            </div>
        </main>
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

interface UpdatePpfPopoverProps {
    title?: string;
    className?: string;
    buttonIcon: MaterialSymbols;
    children: ReactNode;
}

function UpdatePpfPopover({
    title = "Open form",
    className,
    buttonIcon,
    children,
}: UpdatePpfPopoverProps) {
    const id = useId();
    const anchorName = `--${id}`;

    return (
        <div
            className={`
            ${className ?? ""}
            ${styles.updatePpfPopover}
        `}
        >
            <button
                title={title}
                popoverTarget={id}
                style={{
                    anchorName,
                }}
                className={`
                    ${styles.button}
                `}
            >
                <span
                    className={`
                        ${styles.icon}
                        material-symbols-rounded
                    `}
                >
                    {buttonIcon}
                </span>
            </button>
            <div
                id={id}
                popover="auto"
                style={{
                    positionAnchor: anchorName,
                }}
                className={styles.childrenContainer}
            >
                {children}
            </div>
        </div>
    );
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
    const fetcher = useFetcher();
    const { profileStatsPromise } = loaderData;

    const setToastData = useFetcherToast(fetcher);

    function onUpdateProfilePictureSubmit() {
        setToastData({
            failMessage: "Error while updating profile picture.",
            loadingMessage: "Updating profile, please wait...",
            toastId: "update-profile",
        });
    }

    function onUpdatePasswordSubmit() {
        setToastData({
            failMessage: "Error while updating your password.",
            loadingMessage: "Updating password, please wait...",
            toastId: "update-password",
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

                        const pageTitle = `${name}'s Dashboard | Chateá!`;
                        const updateProfilePictureHeader = (
                            <h4>Update your profile picture</h4>
                        );
                        const submitProfilePictureUpdateFormButton = (
                            <button
                                className={`
                                    ${styles.updateButton}
                                    ${classes.outline1}
                                    ${classes.hoverBackgroundMainColorWithBorder}
                                `}
                                type="submit"
                            >
                                Update
                            </button>
                        );

                        const formHorizontalSeparator = (
                            <div
                                className={`
                                    ${styles.horizontalSeparator}
                                    ${classes.radialGradientWithMainColors}
                                `}
                            ></div>
                        );

                        return (
                            <div className={styles.profile}>
                                <title>{pageTitle}</title>
                                <article
                                    className={`
                                        ${styles.user}
                                        ${classes.flexColumn}
                                    `}
                                >
                                    <PageHeader
                                        icon="account_circle"
                                        title="Current Profile"
                                    />
                                    <div
                                        className={`
                                            ${styles.info}
                                            ${classes.flexColumnCenter}
                                        `}
                                    >
                                        <h1
                                            className={`
                                            ${classes.titleMain}
                                        `}
                                        >
                                            {name}
                                        </h1>
                                        <div
                                            className={`
                                                ${styles.ppfWrapper}
                                                ${classes.profilePictureRound}
                                                ${classes.pictureGiant}
                                                ${classes.flexRowAlignCenterJustifyCenter}
                                            `}
                                        >
                                            {isUpdatingProfilePicture ||
                                            isUploadingProfilePicture ? (
                                                <div
                                                    className={`
                                                        ${classes.profilePictureRound}
                                                        ${classes.pictureGiant}
                                                        ${classes.suspenseBackgroundAnimation}
                                                    `}
                                                ></div>
                                            ) : (
                                                <>
                                                    <img
                                                        className={`
                                                            ${classes.profilePictureRound}
                                                            ${classes.pictureGiant}
                                                            ${styles.ppf}
                                                        `}
                                                        src={profilePictureUrl}
                                                        alt={name}
                                                    />
                                                    <UpdatePpfPopover
                                                        title="Update your profile picture by uploading an image file"
                                                        className={`
                                                            ${classes.gridCenter}
                                                            ${styles.updatePpfButton}
                                                            ${styles.uploadFileImage}
                                                        `}
                                                        buttonIcon="person_edit"
                                                    >
                                                        <fetcher.Form
                                                            onSubmit={
                                                                onUpdateProfilePictureSubmit
                                                            }
                                                            encType="multipart/form-data"
                                                            method="post"
                                                            className={`
                                                                ${styles.updateProfilePictureForm}
                                                                ${classes.flexColumn}
                                                            `}
                                                        >
                                                            {
                                                                updateProfilePictureHeader
                                                            }
                                                            {
                                                                formHorizontalSeparator
                                                            }
                                                            <input
                                                                type="hidden"
                                                                name="intent"
                                                                value="upload-profile-picture"
                                                            />
                                                            <label htmlFor="profile-picture-file">
                                                                Upload a profile
                                                                picture
                                                            </label>
                                                            <input
                                                                className={
                                                                    styles.fileInput
                                                                }
                                                                type="file"
                                                                accept="image/*"
                                                                name="file"
                                                                id="profile-picture-file"
                                                            />
                                                            <p
                                                                className={
                                                                    styles.clarification
                                                                }
                                                            ></p>
                                                            {
                                                                submitProfilePictureUpdateFormButton
                                                            }
                                                        </fetcher.Form>
                                                    </UpdatePpfPopover>
                                                    <UpdatePpfPopover
                                                        title="Update your profile picture by using an image link"
                                                        className={`
                                                            ${classes.gridCenter}
                                                            ${styles.updatePpfButton}
                                                            ${styles.useLinkImage}
                                                        `}
                                                        buttonIcon="image_arrow_up"
                                                    >
                                                        <fetcher.Form
                                                            onSubmit={
                                                                onUpdateProfilePictureSubmit
                                                            }
                                                            method="post"
                                                            className={`
                                                                ${styles.updateProfilePictureForm}
                                                                ${classes.flexColumn}
                                                            `}
                                                        >
                                                            {
                                                                updateProfilePictureHeader
                                                            }
                                                            {
                                                                formHorizontalSeparator
                                                            }
                                                            <input
                                                                type="hidden"
                                                                name="intent"
                                                                value="update-profile-picture"
                                                            />
                                                            <CustomInput
                                                                type="text"
                                                                labelText="Image URL"
                                                                id="image-url"
                                                                icon="link_2"
                                                                placeholder="https://www.images.com/sample.png"
                                                                clarification="The URL should point to an image."
                                                                required
                                                                name="profilePictureUrl"
                                                            />
                                                            {
                                                                submitProfilePictureUpdateFormButton
                                                            }
                                                        </fetcher.Form>
                                                    </UpdatePpfPopover>
                                                </>
                                            )}
                                        </div>
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
                                    className={`
                                        ${styles.stats}
                                        ${classes.flexColumn}
                                    `}
                                >
                                    <PageHeader
                                        icon="bar_chart_4_bars"
                                        title="Stats"
                                    />
                                    <div
                                        className={`
                                            ${classes.flexRow}
                                            ${styles.statsContainer}
                                        `}
                                    >
                                        {stats.map((s, i) => {
                                            return (
                                                <section
                                                    key={i}
                                                    className={`
                                                        ${styles.stat}
                                                        ${classes.flexColumn}
                                                        ${s.className}
                                                    `}
                                                >
                                                    <header
                                                        className={`
                                                            ${classes.flexRowStartCenter}
                                                            ${styles.header}
                                                        `}
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
                                                    <div
                                                        className={
                                                            styles.numberWrapper
                                                        }
                                                    >
                                                        <p
                                                            className={`
                                                                ${styles.number}
                                                            `}
                                                        >
                                                            {s.number}
                                                        </p>
                                                    </div>
                                                </section>
                                            );
                                        })}
                                    </div>
                                </div>
                                <section
                                    className={`
                                        ${styles.password}
                                        ${classes.flexColumn}
                                    `}
                                >
                                    <PageHeader
                                        icon="key"
                                        title="Password"
                                    />
                                    <fetcher.Form
                                        onSubmit={onUpdatePasswordSubmit}
                                        method="post"
                                        className={`
                                            ${styles.updatePasswordForm}
                                            ${classes.flexColumn}
                                        `}
                                    >
                                        <input
                                            type="hidden"
                                            name="intent"
                                            value="update-password"
                                        />
                                        <CustomInput
                                            type="password"
                                            labelText="Update your password"
                                            id="password"
                                            icon="lock"
                                            clarification="Use a strong password."
                                            required
                                            name="password"
                                            placeholder="******"
                                        />
                                        <CustomInput
                                            type="password"
                                            labelText="Confirm your password"
                                            id="confirm-password"
                                            icon="lock_reset"
                                            clarification="Repeat your password."
                                            required
                                            name="confirmPassword"
                                            placeholder="******"
                                        />
                                        <button
                                            type="submit"
                                            className={`
                                                ${styles.updatePasswordButton}
                                                ${classes.outline1}
                                                ${classes.buttonHoverStyleMainColor}
                                            `}
                                        >
                                            Update password
                                        </button>
                                    </fetcher.Form>
                                </section>
                            </div>
                        );
                    }}
                </Await>
            </Suspense>
        </main>
    );
}
