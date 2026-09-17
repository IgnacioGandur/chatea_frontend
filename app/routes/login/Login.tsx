import styles from "./Login.module.css";
import registerStyles from "../register/register.module.css";
import classes from "~/css/classes.module.css";

// Packages
import {
    data,
    NavLink,
    redirect,
    useFetcher,
    useSearchParams,
} from "react-router";
import { useState, type ChangeEvent } from "react";

// Types
import type { Route } from "./+types/Login";
import type { $ZodIssue } from "zod/v4/core";

// Components
import CustomInput from "~/components/custom-input/CustomInput";
import validateUserLogin from "~/validators/validateUserLogin";
import ValidationErrors from "~/components/validation-errors/ValidationErrors";
import { AnimatePresence, motion } from "motion/react";

// Validators
import { commitSession, getSession } from "~/session.server";

// Db
import userModel from "~/db/user.model";
import { checkForValidationErrors } from "~/utils/checkForValidationErrors";
import Blob from "~/components/blob/Blob";
import GradientButton from "~/components/gradient-button/GradientButton";
import { SubmittingLoader } from "../register/register";

interface LoginActionResponse {
    success: boolean;
    message: string;
    errors: $ZodIssue[];
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

type FormValues = {
    username: string;
    password: string;
};

export async function action({ request }: Route.ActionArgs) {
    await new Promise((r) => setTimeout(r, 3000));

    const session = await getSession(request.headers.get("Cookie"));

    const form = await request.formData();
    const values = Object.fromEntries(form) as FormValues;
    const { username, password } = values;

    const validation = await validateUserLogin(username, password);

    if (!validation.success) {
        return {
            success: false,
            message: "There's something wrong with your credentials:",
            errors: validation.error.issues,
        };
    }

    const user = await userModel.get(values.username);

    session.set("userId", String(user!.id));

    return redirect("/conversations", {
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

    const hasValidationErrors = checkForValidationErrors(fetcher);

    const isSubmitting = fetcher.state === "submitting";

    return (
        <main
            className={`
            ${registerStyles.login}
            ${classes.flexRowCenter}
            `}
        >
            <div
                className={`
            ${registerStyles.content}
            ${classes.flexRow}
        `}
            >
                <div
                    className={`
                    ${registerStyles.leftSide}
                    ${classes.flexColumnStartCenter}
                    `}
                >
                    <h1
                        className={`
                        ${registerStyles.title}
                        ${classes.textWithMainColorsGradient}
                        ${classes.textSlimCenterSecondaryFont}
                        `}
                    >
                        Welcome back!
                    </h1>
                    <div className={registerStyles.blobWrapper}>
                        <Blob />
                    </div>
                </div>
                <div
                    className={`
                    ${registerStyles.verticalSeparator}
                    ${classes.radialGradientWithMainColors}
                `}
                ></div>
                <div
                    className={`
                    ${classes.flexColumn}
                    ${registerStyles.rightSide}
                `}
                >
                    <AnimatePresence mode="wait">
                        {isSubmitting ? (
                            <motion.div
                                key="loader-wrapper"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={registerStyles.loaderWrapper}
                            >
                                <SubmittingLoader
                                    mainText="Logging in..."
                                    secondaryText="Checking username and password."
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form-wrapper"
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: 1,
                                    transition: { duration: 1 },
                                }}
                                exit={{ opacity: 0 }}
                                className={`
                                    ${classes.flexColumn}
                                    ${registerStyles.formWrapper}
                                `}
                            >
                                {hasValidationErrors ? (
                                    <ValidationErrors
                                        roundBorders
                                        title={fetcher.data!.message}
                                        errors={fetcher.data!.errors}
                                    />
                                ) : null}
                                <fetcher.Form
                                    className={`
                                        ${classes.flexColumn}
                                        ${registerStyles.loginForm}
                                    `}
                                    method="post"
                                >
                                    <h2
                                        className={`
                                    ${styles.formTitle}
                                    ${classes.textSlimCenterSecondaryFont}
                                `}
                                    >
                                        Enter your username and password
                                    </h2>
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
                                    <GradientButton
                                        className={
                                            registerStyles.loginFormButton
                                        }
                                        type="submit"
                                        glow
                                    >
                                        Login
                                    </GradientButton>
                                </fetcher.Form>
                                <div
                                    className={
                                        registerStyles.horizontalSeparator
                                    }
                                >
                                    <span
                                        className={`
                                            ${registerStyles.text}
                                            ${classes.textSmallSecondary}
                                        `}
                                    >
                                        Or
                                    </span>
                                </div>
                                <NavLink
                                    className={`
                                        ${classes.textSmallSecondary}
                                        ${classes.textAlignCenter}
                                        ${registerStyles.registerLink}
                                        `}
                                    to="/register"
                                >
                                    Register if you don't have an account yet.
                                </NavLink>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}
