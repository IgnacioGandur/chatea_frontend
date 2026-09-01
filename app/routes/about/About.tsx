import styles from "./About.module.css";
import classes from "~/css/classes.module.css";
import type { Route } from "./+types/About";
import { useFetcher } from "react-router";
import { todos } from "./todos.server";
import { id } from "zod/v4/locales";

export function loader({}: Route.LoaderArgs) {
    return {
        todos,
    };
}

type FormFields = {
    title: string;
    intent: "create-todo";
};

export async function action({ request }: Route.LoaderArgs) {
    await new Promise((r) => setTimeout(r, 3000));

    const formData = await request.formData();
    const values = Object.fromEntries(formData) as FormFields;
    const { title, intent } = values;

    switch (intent) {
        case "create-todo": {
            todos.push({ title, id: todos.length + 1 });

            return { success: true, message: "Todo added." };
        }
    }
}

export default function About({ loaderData }: Route.ComponentProps) {
    const { todos: initialTodos } = loaderData;
    const fetcher = useFetcher();
    const isCreatingTodo =
        fetcher.formData?.get("intent") === "create-todo" &&
        fetcher.state === "submitting";

    const optimisticTodo =
        fetcher.formData?.get("intent") === "create-todo"
            ? {
                  id: `temp-${Math.random()}`,
                  title: fetcher.formData.get("title") as string,
                  isPending: true,
              }
            : null;

    const displayedTodos = optimisticTodo
        ? [...initialTodos, optimisticTodo]
        : initialTodos;

    return (
        <main className={styles.about}>
            {isCreatingTodo && <p>Creating todo...</p>}
            <fetcher.Form method="post">
                <input
                    type="hidden"
                    name="intent"
                    value="create-todo"
                />
                <label htmlFor="title">Todo title</label>
                <input
                    type="text"
                    name="title"
                    id="title"
                />
                <button type="submit">Create</button>
            </fetcher.Form>
            <h1>About page</h1>
            <ul className={`${classes.flexColumn}`}>
                {displayedTodos.map((t) => {
                    return (
                        <li
                            style={{
                                backgroundColor: t.isPending
                                    ? "red"
                                    : "transparent",
                                opacity: t.isPending ? 0.5 : 1,
                                fontStyle: t.isPending ? "italic" : "normal",
                            }}
                            key={t.id}
                        >
                            {t.title}
                        </li>
                    );
                })}
            </ul>
        </main>
    );
}
