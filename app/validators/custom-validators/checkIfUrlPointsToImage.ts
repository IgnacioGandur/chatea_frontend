export async function checkIfUrlPointsToImage(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, { method: "HEAD" });

        if (!response) {
            return false;
        }

        const contentType = response.headers.get("Content-Type");

        return contentType ? contentType.startsWith("image/") : false;
    } catch (error) {
        console.error("Network or CORS error fetching image headers: ", error);
        return false;
    }
}
