import styles from "./Login.module.css";

// Packages
import { data, redirect, useFetcher, useSearchParams } from "react-router";
import { useState, type ChangeEvent } from "react";

// Types
import type { Route } from "./+types/Login";
import type { $ZodIssue } from "zod/v4/core";

// Components
import CustomInput from "~/components/custom-input/CustomInput";
import CustomButton from "~/components/custom-button/CustomButton";
import validateUserLogin from "~/validators/validateUserLogin";
import ValidationErrors from "~/components/validation-errors/ValidationErrors";

// Validators
import throwValidationErrors from "~/validators/throwValidationErrors";
import { commitSession, getSession } from "~/session.server";

// Db
import userModel from "~/db/user";
import CustomLoader from "~/components/custom-loader/CustomLoader";

interface LoginActionResponse {
    success: boolean;
    message: string;
    errors?: $ZodIssue[];
}

export function meta({}: Route.MetaArgs) {
    return [
        {
            title: "Login | Welcome back to Chateá! ",
        },
        {
            name: "description",
            content: "Login to your Chateá! account to message your friends!",
        },
    ];
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

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));

    const form = await request.formData();
    const values = Object.fromEntries(form) as {
        username: string;
        password: string;
    };

    const validationResult = await validateUserLogin.safeParseAsync(values);

    if (!validationResult.success) {
        return throwValidationErrors(validationResult.error.issues);
    }

    const user = await userModel.get(values.username);

    session.set("userId", String(user!.id));

    return redirect("/dashboard", {
        headers: {
            "Set-Cookie": await commitSession(session),
        },
    });
}

export default function Login() {
    const fetcher = useFetcher<LoginActionResponse>();
    const [searchParams] = useSearchParams();
    const message = searchParams.get("message");
    const welcome = searchParams.get("welcome");

    const [inputs, setInputs] = useState({
        username: "",
        password: "",
    });

    function handleInputs(e: ChangeEvent<HTMLInputElement>) {
        setInputs((prevInputs) => ({
            ...prevInputs,
            [e.target.name]: e.target.value,
        }));
    }

    // Validation
    const responseHasinputErrors = fetcher.data && !fetcher.data?.success;
    const inputErrorsMessage = fetcher.data?.message;
    const inputErrors = fetcher.data?.errors;
    const showValidationErrors =
        responseHasinputErrors && inputErrorsMessage && inputErrors;

    const isSubmitting = fetcher.state === "submitting";

    return (
        <main className={styles.login}>
            {welcome ? (
                <p className={styles.welcomeMessage}>{welcome}</p>
            ) : null}
            <h1>login page</h1>
            {message ? <p className={styles.message}>{message}</p> : null}
            {showValidationErrors ? (
                <ValidationErrors
                    title={inputErrorsMessage}
                    errors={inputErrors}
                />
            ) : null}
            {isSubmitting ? (
                <CustomLoader message="Login, please wait..." />
            ) : (
                <fetcher.Form method="post">
                    <CustomInput
                        required={true}
                        type="text"
                        labelText="username"
                        icon="face"
                        id="username"
                        name="username"
                        placeholder="John_doe"
                        clarification="Should be between 3 and 30 characters long. Only alphanumeric characters, dots and hyphens ('-', '_')"
                        value={inputs.username}
                        onChange={handleInputs}
                    />
                    <CustomInput
                        required={true}
                        type="password"
                        labelText="password"
                        icon="key"
                        id="password"
                        name="password"
                        placeholder=""
                        value={inputs.password}
                        onChange={handleInputs}
                    />
                    <CustomButton
                        text="Login"
                        type="submit"
                    />
                </fetcher.Form>
            )}
        </main>
    );
}
