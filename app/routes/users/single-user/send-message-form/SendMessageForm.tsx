import { useFetcher } from "react-router";
import styles from "./SendMessageForm.module.css";
import { useState } from "react";
import CustomInput from "~/components/custom-input/CustomInput";
import CustomLoader from "~/components/custom-loader/CustomLoader";
import type { $ZodIssue } from "zod/v4/core";
import PillButton from "~/components/pill-button/PillButton";

interface SendMessageFormProps {
    formAction?: string;
    userBId: number;
}

interface ActionResponse {
    success: boolean;
    message: string;
    errors: $ZodIssue[];
}

export default function SendMessageForm({
    formAction,
    userBId,
}: SendMessageFormProps) {
    const fetcher = useFetcher<ActionResponse>();
    const isNotIdle = fetcher.state !== "idle";
    const [message, setMessage] = useState({
        message: "",
    });

    // Validation errors
    const hasValidationErrors = fetcher.data?.success === false;
    const validationErrorsMessage = fetcher.data?.message;
    const validationErrors = fetcher.data?.errors;

    const showValidationErrors =
        hasValidationErrors && validationErrorsMessage && validationErrors;

    function handleMessage(e: React.ChangeEvent<HTMLInputElement>) {
        setMessage((prevMessage) => ({
            ...prevMessage,
            [e.target.name]: e.target.value,
        }));
    }

    return isNotIdle ? (
        <CustomLoader message="Sending message, please wait..." />
    ) : (
        <fetcher.Form
            action={formAction}
            method="post"
            className={styles.sendMessageForm}
        >
            {showValidationErrors ? (
                <section className={styles.validationErrors}>
                    <h3 className={styles.title}>{validationErrorsMessage}</h3>
                    <ul className={styles.errors}>
                        {validationErrors.map((error, index) => {
                            return (
                                <li
                                    key={index}
                                    className={styles.error}
                                >
                                    {error.message}
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ) : null}
            <div className={styles.inputsWrapper}>
                <input
                    type="hidden"
                    name="userBId"
                    value={userBId}
                />
                <CustomInput
                    type="text"
                    labelText={`Send a message!`}
                    id="message"
                    icon="comic_bubble"
                    placeholder={`Hi! Nice to meet you!`}
                    clarification="Be nice."
                    required={true}
                    name="message"
                    value={message.message}
                    onChange={handleMessage}
                />
                <PillButton
                    buttonAriaLabel="Send the message."
                    buttonTitle="Send a message to this user."
                    includeEmptySpace={true}
                    includeIcon={true}
                    icon="upload"
                    type="submit"
                    buttonText="Send"
                />
            </div>
        </fetcher.Form>
    );
}
