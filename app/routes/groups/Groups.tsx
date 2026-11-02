// CSS
import styles from "./Groups.module.css";
import classes from "~/css/classes.module.css";

// Packages
import * as z from "zod";
import { Suspense, useRef, useEffect } from "react";
import {
    Await,
    data,
    redirect,
    useFetcher,
    Form,
    useSubmit,
    NavLink,
} from "react-router";

// Types
import type { MaterialSymbol } from "material-symbols";
import type { Route } from "./+types/Groups";
import type { $ZodIssue } from "zod/v4/core";

// Components
import PageHeader from "~/components/page-header/PageHeader";
import CustomPageLoader from "~/components/custom-page-loader/CustomPageLoader";
import LoaderErrorElement from "~/components/loader-error-element/LoaderErrorElement";
import EmptySection from "~/components/empty-section/EmptySection";
import Popover from "~/components/popover/Popover";
// import CustomInput from "~/components/custom-input/CustomInput";
// import PillButton from "~/components/pill-button/PillButton";
import ValidationErrors from "~/components/validation-errors/ValidationErrors";

// DB
import groupsModel from "~/db/groups.model";

// Session
import { getSession } from "~/session.server";

// Validators
import { validateGroupCreation } from "~/validators/validateGroupCreation";

// Utiliites
import { checkForValidationErrors } from "~/utils/checkForValidationErrors";

// Hooks
// import { useFetcherToast } from "~/hooks/useFetcherToast";
import validateLeavingOrJoiningGroup from "~/validators/validateLeavingOrJoiningGroup";
import GroupsGrid from "./GroupsGrid";
import { getLoggedUserId } from "~/utils/getLoggedUserId";
import { groupFilters, type GroupFilter } from "~/db/groupFilters";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Groups | Chateá!" },
        {
            name: "description",
            content:
                "Find and join groups to chat with people who share interests with you in Chateá!",
        },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    const { loggedUserId } = await getLoggedUserId(request);
    const params = new URL(request.url).searchParams;
    const title = params.get("title") ?? "";
    const rawFilter = params.get("filter");
    const uId = Number(loggedUserId);

    let filter: GroupFilter | undefined = undefined;

    if (rawFilter && groupFilters.includes(rawFilter)) {
        filter = rawFilter;
    }

    return {
        title,
        filter,
        groupsPagePromise: filter
            ? groupsModel.getGroupsPage(undefined, title, filter, uId)
            : groupsModel.getGroupsPage(undefined, title),
    };
}

const validIntents = ["create-group", "join-group", "leave-group"] as const;

type ValidIntent = (typeof validIntents)[number];

type FormValues = {
    intent: ValidIntent;
    title: string;
    description: string;
    conversationId: string;
};

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");

    if (!userId) {
        return data("Unauthorized.", {
            status: 401,
            statusText: "This route is for logged users only.",
        });
    }

    await new Promise((r) => setTimeout(r, 3000));

    const formData = await request.formData();
    const values = Object.fromEntries(formData) as FormValues;
    const validationErrorMessage =
        "Unable to create group, please check the following: ";

    const intentValidation = z
        .object({
            intent: z.enum(validIntents, {
                error: (issue) =>
                    `Invlid intent value. Received: '${issue.input}'.`,
            }),
        })
        .safeParse({ intent: values.intent });

    if (!intentValidation.success) {
        return {
            success: false,
            message: validationErrorMessage,
            errors: intentValidation.error.issues,
        };
    }

    switch (values.intent) {
        case "create-group": {
            const validation = await validateGroupCreation.safeParseAsync({
                title: values.title,
                description: values.description,
            });

            if (!validation.success) {
                return {
                    success: false,
                    message: validationErrorMessage,
                    errors: validation.error.issues,
                };
            }

            await groupsModel.create(
                validation.data.title,
                validation.data.description,
                userId,
            );

            return {
                success: true,
                message: "Group created!",
            };
        }

        case "join-group": {
            const conversationId = Number(values.conversationId);

            const validation = await validateLeavingOrJoiningGroup(
                conversationId,
                Number(userId),
                false,
            );

            if (!validation.success) {
                return {
                    success: false,
                    message: "Not able to join group.",
                    errors: validation.error.issues,
                };
            }

            await groupsModel.addParticipantToGroup(
                conversationId,
                Number(userId),
            );

            return redirect(`/conversations/${validation.data.conversationId}`);
        }

        case "leave-group": {
            const conversationId = Number(values.conversationId);

            const validation = await validateLeavingOrJoiningGroup(
                conversationId,
                Number(userId),
                true,
            );

            if (!validation.success) {
                return {
                    success: false,
                    message: "Error while trying to leave group:",
                    errors: validation.error.issues,
                };
            }

            await groupsModel.leaveGroup(conversationId, Number(userId));

            return {
                success: true,
                message: "You left the group!",
            };
        }
    }
}

interface ActionResponse {
    success: boolean;
    message: string;
    errors?: $ZodIssue[];
}

interface FilterOption {
    icon: MaterialSymbol;
    text: string;
    value: string;
}

export default function Groups({ loaderData }: Route.ComponentProps) {
    const { groupsPagePromise, title, filter } = loaderData;

    const fetcher = useFetcher<ActionResponse>({ key: "groups" });
    const inputRef = useRef<HTMLInputElement>(null);

    const submit = useSubmit();
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);

    // Validation errors
    const hasValidationErrors = checkForValidationErrors(fetcher);

    // const setToastData = useFetcherToast(fetcher);

    const filterOptions: FilterOption[] = [
        {
            icon: "person_raised_hand",
            text: "joined groups",
            value: "joined-groups",
        },
        {
            icon: "hub",
            text: "owned groups",
            value: "owned-groups",
        },
        {
            icon: "clock_arrow_up",
            text: "older groups",
            value: "asc",
        },
        {
            icon: "clock_arrow_down",
            text: "newer groups",
            value: "desc",
        },
    ];

    const showFilteringByText =
        title || (filter && groupFilters.includes(filter));

    let filteringByText: string | undefined = undefined;

    if (filter || title) {
        if (title) {
            filteringByText = `Filtering groups by title: "${title}".`;
        }

        if (filter === "asc" || filter === "desc") {
            filteringByText = `Filtering groups by creation date: ${filter === "asc" ? "older first" : "newest first"}.`;
        }

        if (filter === "owned-groups" || filter === "joined-groups") {
            filteringByText = `Filtering groups by ${filter === "owned-groups" ? "groups you own" : "groups you joined"}.`;
        }
    }

    useEffect(() => {
        if (title === "" && inputRef.current) {
            inputRef.current.value = "";
        }
    }, [title]);

    return (
        <main
            className={`
                ${styles.groups}
                ${classes.flexColumn}
            `}
        >
            <PageHeader
                icon="groups_3"
                title="Groups"
            />
            {hasValidationErrors ? (
                <ValidationErrors
                    title={fetcher.data!.message}
                    errors={fetcher.data!.errors || []}
                />
            ) : null}
            <section
                className={`
                    ${styles.filteringSection}
                    ${classes.flexRowAlignCenterJustifyBetween}
                `}
            >
                <Form
                    className={`
                        ${styles.searchForm}
                        ${classes.flexColumn}
                    `}
                    method="get"
                >
                    <div
                        className={`
                            ${styles.inputWrapper}
                            ${classes.flexRowCenter}
                        `}
                    >
                        <span
                            className={`
                                material-symbols-rounded
                                ${styles.icon}
                            `}
                        >
                            search
                        </span>
                        <input
                            ref={inputRef}
                            className={styles.input}
                            id="title"
                            type="search"
                            name="title"
                            defaultValue={title}
                            placeholder="Search groups by title..."
                            onChange={(e) => {
                                const form = e.currentTarget.form;

                                if (timeout.current)
                                    clearTimeout(timeout.current);

                                timeout.current = setTimeout(
                                    () => submit(form, { replace: true }),
                                    300,
                                );
                            }}
                        />
                    </div>
                </Form>
                <Popover
                    anchorName="--filter-groups"
                    popoverTarget="filter-options"
                    buttonContent={
                        <span className="material-symbols-rounded">
                            filter_alt
                        </span>
                    }
                    anchorButtonAriaLabel="Open filter options"
                    anchorButtonClass={`
                        ${classes.roundDefaultButton}
                        ${classes.gridCenter}
                    `}
                    altPopoverClass={styles.filterPopover}
                >
                    <Form
                        method="get"
                        className={`
                            ${styles.dropdown}
                            ${classes.flexColumn}
                            `}
                    >
                        <label
                            className={classes.textSmallSecondary}
                            htmlFor="filter"
                        >
                            Filter conversations by:
                        </label>
                        <div className={styles.options}>
                            {filterOptions.map((o) => {
                                return (
                                    <button
                                        className={`
                                        ${styles.option}
                                        ${classes.flexRowStartCenter}
                                        ${filter && filter === o.value ? styles.selected : ""}
                                    `}
                                        key={o.value}
                                        type="submit"
                                        name="filter"
                                        value={o.value}
                                    >
                                        <span
                                            className={`
                                        material-symbols-rounded
                                        ${styles.icon}
                                    `}
                                        >
                                            {o.icon}
                                        </span>
                                        <div className={styles.separator}></div>
                                        <span className={styles.text}>
                                            {o.text}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </Form>
                </Popover>
            </section>
            {showFilteringByText ? (
                <div
                    className={`
                        ${styles.filteringText}
                        ${classes.flexRowAlignCenterJustifyBetween}
                    `}
                >
                    <p className={classes.textSmallSecondary}>
                        {filteringByText}
                    </p>
                    <NavLink
                        to="/groups"
                        className={`
                            ${styles.clearFiltersButton}
                            ${classes.gridCenter}
                        `}
                    >
                        Clear filter
                    </NavLink>
                </div>
            ) : null}
            <Suspense
                fallback={<CustomPageLoader message="Getting groups..." />}
            >
                <Await
                    resolve={groupsPagePromise}
                    errorElement={
                        <LoaderErrorElement
                            icon="bomb"
                            title="Unable to get groups."
                        />
                    }
                >
                    {({ groups, nextCursor }) => {
                        return groups.length === 0 ? (
                            <EmptySection
                                icon={title ? "search_off" : "group_off"}
                                message={
                                    title
                                        ? `No groups match: ${title}.`
                                        : "Nobody has created a group yet."
                                }
                            />
                        ) : (
                            <GroupsGrid
                                key={`${title}-${groups[0]?.id}`}
                                initialPage={{
                                    groups,
                                    nextCursor,
                                }}
                                searchTitle={title}
                                filter={filter}
                            />
                        );
                    }}
                </Await>
            </Suspense>
        </main>
    );
}
