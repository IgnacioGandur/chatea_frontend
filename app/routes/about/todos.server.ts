interface Todo {
    id: number | string;
    title: string;
    isPending?: boolean;
}

export const todos: Todo[] = [
    {
        id: 1,
        title: "Todo 1",
    },
    {
        id: 2,
        title: "Todo 2",
    },
];
