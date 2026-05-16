import styles from "./Login.module.css";
import {
    redirect,
    useFetcher,
    useSearchParams,
    type ActionFunctionArgs,
} from "react-router";
import type { Route } from "./+types/Login";
import CustomInput from "~/components/custom-input/CustomInput";
import CustomButton from "~/components/custom-button/CustomButton";
import InputErrors from "~/components/input-errors/InputErrors";
import type { User } from "~/types/user";
import type { GenericApiResponse } from "~/types/GenericApiResponse";
import type { Error } from "~/types/error";

interface LoginApiResponse extends GenericApiResponse {
    user?: User;
    errors?: Error[];
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

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const fields = Object.fromEntries(formData); // 'Username' and 'Password' fields.
    const endpoint = import.meta.env.VITE_API_URL + "/auth/login";
    const options: RequestInit = {
        method: "post",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(fields),
    };

    const response = await fetch(endpoint, options);
    const result: LoginApiResponse = await response.json();

    console.log("The content of result is: ", result);

    if (result.success) {
        throw redirect("/dashboard");
    }

    return result;
}

export default function Login() {
    const [searchParams] = useSearchParams();
    const fetcher = useFetcher<LoginApiResponse>();
    const message = searchParams.get("message");

    const responseHasinputErrors = fetcher.data && !fetcher.data?.success;
    const inputErrorsMessage = fetcher.data?.message;
    const inputErrors = fetcher.data?.errors;

    return (
        <main className={styles.login}>
            <h1>login page</h1>
            {message ? <p className={styles.message}>{message}</p> : null}
            {responseHasinputErrors && inputErrors && inputErrorsMessage ? (
                <InputErrors
                    message={inputErrorsMessage}
                    errors={inputErrors}
                />
            ) : null}
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
                />
                <CustomInput
                    required={true}
                    type="password"
                    labelText="password"
                    icon="key"
                    id="password"
                    name="password"
                    placeholder=""
                />
                <CustomButton
                    text="Login"
                    type="submit"
                />
            </fetcher.Form>
        </main>
    );
}
