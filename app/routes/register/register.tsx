// CSS
import styles from "./register.module.css";

// Types
import type { Route } from "./+types/register";

// Packages
import {
    redirect,
    useFetcher,
    type ActionFunctionArgs,
    data,
} from "react-router";
import { MoonLoader } from "react-spinners";
import bcrypt from "bcryptjs";

// Components
import validateUserRegister from "~/validators/validateUserRegister";
import ValidationErrors from "~/components/validation-errors/ValidationErrors";
import CustomInput from "~/components/custom-input/CustomInput";
import { useState, type ChangeEvent } from "react";
import type { $ZodIssue } from "zod/v4/core";
import { getSession, commitSession } from "~/session.server";

// Db
import userModel from "~/db/user.model";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Create an account in Chateá!" },
        { name: "description", content: "Join us by creating a new account." },
    ];
}

interface RegisterActionResponse {
    success: boolean;
    message?: string;
    errors: $ZodIssue[];
}

export async function loader({ request }: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));

    if (session.has("userId")) {
        throw redirect("/dashboard");
    }

    return data(
        { error: session.get("error") },
        {
            headers: {
                "Set-Cookie": await commitSession(session),
            },
        },
    );
}

type FormValues = {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    confirm: string;
};

export async function action({ request }: ActionFunctionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    const formData = await request.formData();
    const values = Object.fromEntries(formData) as FormValues;
    const { firstName, lastName, username, password } = values;

    const validation = await validateUserRegister.safeParseAsync(values);

    if (!validation.success) {
        return {
            success: false,
            message:
                "There's something wrong with the inputs you provided, please correct them:",
            errors: validation.error.issues,
        };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create(
        firstName,
        lastName,
        username,
        hashedPassword,
    );

    session.set("userId", String(user.id));

    return redirect(
        `/dashboard?welcome=${encodeURIComponent("Welcome aboard " + user.username + "!")}`,
        {
            headers: {
                "Set-Cookie": await commitSession(session),
            },
        },
    );
}

export default function Register() {
    const fetcher = useFetcher<RegisterActionResponse>();
    const [inputs, setInputs] = useState({
        firstName: "",
        lastName: "",
        username: "",
        password: "",
        confirm: "",
    });

    function handleInputs(e: ChangeEvent<HTMLInputElement>) {
        setInputs((prevInputs) => ({
            ...prevInputs,
            [e.target.name]: e.target.value,
        }));
    }

    const isSubmitting = fetcher.state === "submitting";

    // Validation errors
    const hasValidationErrors = fetcher.data?.success === false;
    const validationErrors = fetcher.data?.errors;
    const validationErrorsMessage = fetcher.data?.message;
    const showErrors =
        hasValidationErrors &&
        validationErrors &&
        validationErrorsMessage &&
        !isSubmitting;

    // Passwords
    const passwordsAreEmpty = inputs.password === "" && inputs.confirm === "";
    const passwordsMatch = inputs.password === inputs.confirm;

    return (
        <main className={styles.register}>
            <h1>Register page</h1>
            {showErrors ? (
                <ValidationErrors
                    title={validationErrorsMessage}
                    errors={validationErrors}
                />
            ) : null}
            {isSubmitting ? (
                <div className="loader">
                    <h2>Submitting...</h2>
                    <MoonLoader
                        size="36px"
                        color="var(--color-main)"
                    />
                </div>
            ) : (
                <fetcher.Form
                    className={styles.form}
                    method="post"
                >
                    <CustomInput
                        type="text"
                        labelText="first name"
                        id="first-name"
                        icon="badge"
                        placeholder="John"
                        clarification="First name must only contain letters and be 30 characters max."
                        required={false}
                        name="firstName"
                        value={inputs.firstName}
                        onChange={handleInputs}
                    />
                    <CustomInput
                        type="text"
                        labelText="last name"
                        id="last-name"
                        icon="signature"
                        placeholder="Doe"
                        clarification="Last name must only contain letters and be 30 characters max."
                        required={false}
                        name="lastName"
                        value={inputs.lastName}
                        onChange={handleInputs}
                    />
                    <CustomInput
                        type="text"
                        labelText="username"
                        id="username"
                        icon="face"
                        placeholder="john_doe"
                        clarification="Username must be between 3 and 30 characters, can only contain alphanumeric characters, dots and hyphens."
                        required={false}
                        name="username"
                        value={inputs.username}
                        onChange={handleInputs}
                    />
                    <CustomInput
                        type="password"
                        labelText="password"
                        id="password"
                        icon="lock"
                        placeholder=""
                        clarification=""
                        required={false}
                        name="password"
                        value={inputs.password}
                        onChange={handleInputs}
                    />
                    <CustomInput
                        type="password"
                        labelText="confirm password"
                        id="confirm"
                        icon="lock_reset"
                        placeholder=""
                        clarification="Repeat your password"
                        required={false}
                        name="confirm"
                        value={inputs.confirm}
                        onChange={handleInputs}
                    />
                    {!passwordsAreEmpty ? (
                        <p
                            className={`${styles.password} ${passwordsMatch ? styles.match : styles.dontMatch}`}
                        >
                            {passwordsMatch
                                ? "The passwords match!"
                                : "The passwords don't match."}
                        </p>
                    ) : null}
                    <button
                        type="submit"
                        className={styles.registerButton}
                    >
                        Register
                    </button>
                </fetcher.Form>
            )}
        </main>
    );
}
