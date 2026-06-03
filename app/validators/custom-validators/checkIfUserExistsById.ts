import userModel from "~/db/user.model";

export default async function checkIfUserExistsById(userId: number | string) {
    const user = await userModel.getById(userId, true);

    if (!user) {
        return false;
    }

    return true;
}
