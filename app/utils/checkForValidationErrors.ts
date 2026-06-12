import type { Fetcher } from "react-router";
import type { ValidationErrorsType } from "~/types/ValidationErrorsType";

export function checkForValidationErrors(
    fetcher: Fetcher<ValidationErrorsType>,
): boolean {
    const data = fetcher.data;

    const hasValidationErrors = data?.success === false;
    const validationErrorMessagee = data?.message;
    const validationErrors = data?.errors;

    const showValidationErrors =
        hasValidationErrors && validationErrorMessagee && validationErrors;

    return !!showValidationErrors;
}
