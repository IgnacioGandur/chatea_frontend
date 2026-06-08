import { format } from "date-fns";

export function customFormatDate(date: Date): string {
    return format(date, "MMMM do, yyyy 'at' hh:mmaa");
}
