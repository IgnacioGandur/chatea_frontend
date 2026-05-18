import userModel from "../../db/user";

export default async function checkIfUsernameIsAvailable(
    username: string,
): Promise<boolean> {
    const user = await userModel.get(username);

    if (user) {
        return false;
    }

    return true;
}
