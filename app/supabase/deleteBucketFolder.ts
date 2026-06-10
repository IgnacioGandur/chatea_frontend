import { supabaseAdmin } from "./supabase.server";

export async function deleteFolderFromSupabaseBucket(
    bucketName: string,
    folderPath: string,
) {
    const { data: files, error: listError } = await supabaseAdmin.storage
        .from(bucketName)
        .list(folderPath);

    if (listError) {
        throw new Error(
            "Failed to list files from folder  in Supabase bucket.",
        );
    }

    if (!files || files.length === 0) {
        return {
            success: true,
            message: "Folder is empty!",
        };
    }

    const pathsToDelete = files.map((f) => `${folderPath}/${f.name}`);

    const { error: deleteError } = await supabaseAdmin.storage
        .from(bucketName)
        .remove(pathsToDelete);

    if (deleteError) {
        throw new Error("Failed to delete contents of Supabase folder.");
    }

    return {
        success: true,
        message: "Files deleted from folder!",
    };
}
