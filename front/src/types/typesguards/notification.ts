import { INotification } from "../notification.types";

export const isNotification = (unknown: any): unknown is INotification =>
    unknown &&
    typeof unknown === "object" &&
    unknown.statusCode &&
    unknown.message;
