// CSS
import styles from "./register.module.css";
import classes from "~/css/classes.module.css";

// Types
import type { Route } from "./+types/register";

// Packages
import {
    redirect,
    useFetcher,
    type ActionFunctionArgs,
    data,
    NavLink,
} from "react-router";
import { BarLoader } from "react-spinners";
import bcrypt from "bcryptjs";

// Components
import validateUserRegister from "~/validators/validateUserRegister";
import ValidationErrors from "~/components/validation-errors/ValidationErrors";
import CustomInput from "~/components/custom-input/CustomInput";
import { useState, type ChangeEvent } from "react";
import type { $ZodIssue } from "zod/v4/core";
import { getSession, commitSession } from "~/session.server";
import { AnimatePresence, motion } from "motion/react";

// Db
import userModel from "~/db/user.model";
import Blob from "~/components/blob/Blob";
import GradientButton from "~/components/gradient-button/GradientButton";

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
    await new Promise((r) => setTimeout(r, 3000));
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

interface SubmittingLoaderProps {
    mainText: string;
    secondaryText: string;
}

export function SubmittingLoader({
    mainText,
    secondaryText,
}: SubmittingLoaderProps) {
    return (
        <div
            className={`
            ${styles.submittingLoader}
            ${classes.flexColumnCenter}
        `}
        >
            <h2
                className={`
                ${styles.loaderTitle}
                ${classes.textSlimCenterSecondaryFont}
            `}
            >
                {mainText}
            </h2>
            <BarLoader color="var(--color-main)" />
            <p
                className={`
                ${styles.loaderPara}
                ${classes.smallText}
                `}
            >
                {secondaryText}
            </p>
        </div>
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
        <main
            className={`
                ${styles.register}
                ${classes.flexRowCenter}
            `}
        >
            <section
                className={`
                    ${styles.content}
                    ${classes.flexRow}
                `}
            >
                <section
                    className={`
                    ${classes.flexColumnStartCenter}
                    ${styles.leftSide}
                `}
                >
                    <h1
                        className={`
                        ${styles.title}
                        ${classes.textWithMainColorsGradient}
                        ${classes.textSlimCenterSecondaryFont}
                    `}
                    >
                        Create your account now!
                    </h1>
                    <div className={styles.blobWrapper}>
                        <Blob />
                    </div>
                </section>
                <div
                    className={`
                    ${styles.verticalSeparator}
                    ${classes.radialGradientWithMainColors}
                    `}
                ></div>
                <section
                    className={`
                    ${styles.rightSide}
                    ${classes.flexColumn}
                `}
                >
                    <AnimatePresence mode="wait">
                        {isSubmitting ? (
                            <motion.div
                                key="submitting-loader"
                                className={styles.loaderWrapper}
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: 1,
                                }}
                                exit={{
                                    opacity: 0,
                                }}
                            >
                                <SubmittingLoader
                                    mainText="Please wait..."
                                    secondaryText="We are creating your account..."
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form-wrapper"
                                className={`
                                    ${styles.formWrapper}
                                    ${classes.flexColumn}
                                `}
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: 1,
                                }}
                                exit={{
                                    opacity: 0,
                                }}
                            >
                                {showErrors ? (
                                    <ValidationErrors
                                        title={validationErrorsMessage}
                                        errors={validationErrors}
                                        roundBorders
                                    />
                                ) : null}
                                <fetcher.Form
                                    className={styles.form}
                                    method="post"
                                >
                                    <h2
                                        className={`
                                            ${styles.formTitle}
                                            ${classes.textSlimCenterSecondaryFont}
                                        `}
                                    >
                                        Complete your profile details below
                                    </h2>
                                    <CustomInput
                                        className={styles.firstName}
                                        type="text"
                                        labelText="first name"
                                        id="first-name"
                                        icon="badge"
                                        placeholder="John"
                                        clarification="First name must only contain letters and be 30 characters max."
                                        required
                                        name="firstName"
                                        value={inputs.firstName}
                                        onChange={handleInputs}
                                    />
                                    <CustomInput
                                        className={styles.lastName}
                                        type="text"
                                        labelText="last name"
                                        id="last-name"
                                        icon="signature"
                                        placeholder="Doe"
                                        clarification="Last name must only contain letters and be 30 characters max."
                                        required
                                        name="lastName"
                                        value={inputs.lastName}
                                        onChange={handleInputs}
                                    />
                                    <CustomInput
                                        className={styles.username}
                                        type="text"
                                        labelText="username"
                                        id="username"
                                        icon="face"
                                        placeholder="john_doe"
                                        clarification="Username must be between 3 and 30 characters, can only contain alphanumeric characters, dots and hyphens."
                                        required
                                        name="username"
                                        value={inputs.username}
                                        onChange={handleInputs}
                                    />
                                    <CustomInput
                                        className={styles.password}
                                        type="password"
                                        labelText="password"
                                        id="password"
                                        icon="lock"
                                        placeholder=""
                                        clarification="Choose a strong password."
                                        required
                                        name="password"
                                        value={inputs.password}
                                        onChange={handleInputs}
                                    />
                                    <CustomInput
                                        className={styles.confirmPassword}
                                        type="password"
                                        labelText="confirm password"
                                        id="confirm"
                                        icon="lock_reset"
                                        placeholder=""
                                        clarification="Repeat your password"
                                        required
                                        name="confirm"
                                        value={inputs.confirm}
                                        onChange={handleInputs}
                                    />
                                    {!passwordsAreEmpty ? (
                                        <p
                                            className={`
                                        ${classes.textMainDimmedItalic} 
                                        ${styles.passwordTester} 
                                        ${passwordsMatch ? styles.match : styles.dontMatch}
                                    `}
                                        >
                                            {passwordsMatch
                                                ? "The passwords match!"
                                                : "The passwords don't match."}
                                        </p>
                                    ) : null}
                                    <GradientButton
                                        className={`
                                    ${classes.outline1}
                                    ${styles.registerButton}
                                `}
                                        type="submit"
                                        glow
                                    >
                                        Register
                                    </GradientButton>
                                </fetcher.Form>
                                <div className={styles.horizontalSeparator}>
                                    <span
                                        className={`
                                            ${styles.text}
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
                                        ${styles.registerLink}
                                        `}
                                    to="/login"
                                >
                                    Login if you already have an account.
                                </NavLink>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            </section>
        </main>
    );
}
