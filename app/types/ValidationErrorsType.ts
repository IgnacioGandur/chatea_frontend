import type { $ZodIssue } from "zod/v4/core";

export interface ValidationErrorsType {
    success: boolean;
    message: string;
    errors: $ZodIssue[];
}
