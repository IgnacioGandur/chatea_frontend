import { supabaseAdmin } from "./supabase.server";

export async function uploadConversationAttachment(
    bucketName: string,
    filePath: string,
    file: File,
): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(filePath, file);

    if (error) {
        throw new Error("Error while uploading file to Supabase.");
    }

    const { data: uploadUrl } = supabaseAdmin.storage
        .from(bucketName)
        .getPublicUrl(data.path);

    return uploadUrl.publicUrl;
}
