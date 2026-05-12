import type { Error } from "./error";
import type { GenericApiResponse } from "./GenericApiResponse";
import type { User } from "./user";

export interface RegisterResponse extends GenericApiResponse {
    errors?: Error[];
    user?: User;
}
