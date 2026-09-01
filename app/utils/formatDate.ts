import { format } from "date-fns";

export function customFormatDate(date: Date): string {
    return format(date, "MMMM do, yyyy 'at' hh:mmaa");
}

export function formatMessageDate(date: Date): string {
    return format(date, "EEEE, LLLL do yyyy 'at' hh:mmaa");
}
