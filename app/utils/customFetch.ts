import type { GenericApiResponse } from "~/types/GenericApiResponse";

export default async function customFetch(
    url: string,
    options: RequestInit,
): Promise<GenericApiResponse> {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            console.log("Response is not okay.");

            return {
                error: true,
                message:
                    "We were not able to connect with the backend, try again later...",
            };
        }

        const result = await response.json();

        return result;
    } catch (error) {
        return {
            error: true,
            message:
                "We were not able to connect with the backend, try again later...",
        };
    }
}
