import type { loader } from "~/root";
import { useRouteLoaderData } from "react-router";

export default function useRootData() {
    return useRouteLoaderData<typeof loader>("root");
}
