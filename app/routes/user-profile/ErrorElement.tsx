import { isRouteErrorResponse, useRouteError } from "react-router";
import UserProfileErrorElement from "./UserProfileErrorElement";

export default function ErrorBoundary() {
    const error = useRouteError();

    if (isRouteErrorResponse(error)) {
        return <UserProfileErrorElement errorType="error-boundary" />;
    }

    return <UserProfileErrorElement errorType="await-error" />;
}
