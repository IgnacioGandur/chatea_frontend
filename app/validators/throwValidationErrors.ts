import type { $ZodIssue } from "zod/v4/core";

export default function throwValidationErrors(errors: $ZodIssue[]) {
    return {
        success: false,
        message:
            "There's something wrong with the inputs you provided, please correct them: ",
        errors,
    };
}
