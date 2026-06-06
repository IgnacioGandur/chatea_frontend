import { useFetcher, type FetcherWithComponents } from "react-router";
import styles from "./SendMessageForm.module.css";
import { useState } from "react";
import CustomInput from "~/components/custom-input/CustomInput";
import CustomLoader from "~/components/custom-loader/CustomLoader";
import type { $ZodIssue } from "zod/v4/core";
import PillButton from "~/components/pill-button/PillButton";
import { checkForValidationErrors } from "~/utils/checkForValidationErrors";
import ValidationErrors from "~/components/validation-errors/ValidationErrors";

interface ActionResponse {
    success: boolean;
    message: string;
    errors: $ZodIssue[];
    isSendingMessage: boolean;
}

interface SendMessageFormProps {
    altFetcher?: FetcherWithComponents<ActionResponse>;
    formAction?: string;
    userBId: number;
}

export default function SendMessageForm({
    altFetcher,
    formAction,
    userBId,
}: SendMessageFormProps) {
    const fetcher = altFetcher ?? useFetcher<ActionResponse>();
    const isNotIdle = fetcher.state !== "idle";
    const [message, setMessage] = useState({
        message: "",
    });

    const showValidationErrors =
        checkForValidationErrors(fetcher) && fetcher.data?.isSendingMessage;

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
            <input
                type="hidden"
                name="intent"
                value="send-message"
            />
            {showValidationErrors ? (
                <ValidationErrors
                    title={fetcher.data!.message}
                    errors={fetcher.data!.errors}
                />
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
                    name="message"
                    value={message.message}
                    onChange={handleMessage}
                    required
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
