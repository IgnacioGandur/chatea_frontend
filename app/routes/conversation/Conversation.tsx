import conversationModel from "~/db/conversation.model";
import type { Route } from "./+types/Conversation";
import styles from "./Conversation.module.css";

export function meta({ loaderData }: Route.MetaArgs) {
    return [
        {
            title: ``,
        },
        {
            name: "",
            content: "",
        },
    ];
}

export function action({ request }: Route.ActionArgs) {}

export async function loader({ params }: Route.LoaderArgs) {
    return await conversationModel.get(params.id);
}

export default function Conversation({ loaderData }: Route.ComponentProps) {
    return <main className={styles.conversation}>Conversation</main>;
}
