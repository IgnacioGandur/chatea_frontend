import type { Route } from "./+types/register";
import styles from "./register.module.css";

import { redirect, useFetcher, type ActionFunctionArgs } from "react-router";
import { MoonLoader } from "react-spinners";
import type { RegisterResponse } from "~/types/RegisterResponse";
import InputErrors from "~/components/input-errors/InputErrors";
import { useEffect } from "react";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Create an account in Chateá!" },
        { name: "description", content: "Join us by creating a new account." },
    ];
}

export async function action({ request }: ActionFunctionArgs) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const formData = await request.formData();
    const fields = Object.fromEntries(formData);

    const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        {
            method: "post",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(fields),
        },
    );

    const result: RegisterResponse = await response.json();

    if (result.success) {
        return redirect("/dashboard");
    }

    return result;
}

export default function Register() {
    const fetcher = useFetcher<RegisterResponse>();
    const hasInputError = !fetcher.data?.success;
    const message = fetcher.data?.message;
    const errors = fetcher.data?.errors;

    return (
        <main className={styles.register}>
            <h1>Register page</h1>
            {hasInputError && message && errors ? (
                <InputErrors
                    message={message}
                    errors={errors}
                />
            ) : null}
            {fetcher.state === "submitting" ? (
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
                    <input
                        type="text"
                        name="username"
                        placeholder="username"
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="***"
                    />
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
