import styles from "./Users.module.css";
import userModel from "~/db/user";
import type { Route } from "./+types/users";

export async function loader() {
    const users = await userModel.getAll();
    return users;
}

export default function Users({ loaderData }: Route.ComponentProps) {
    return <main className={styles.users}>Users page</main>;
}
