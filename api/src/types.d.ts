declare namespace Express {
    type UserPayload = {
        id: string;
        role?: number | string;
        login?: string;
    };

    export type Request = {
        user: UserPayload;
        file: any;
        actor?: import('./types/auth').AuthActor;
        requestScope?: import('./services/request-access.service').RequestScope;
        repairRequest?: import('./models/repairRequest').default;
        scopedRequests?: import('./models/repairRequest').default[];
    };
    export type Response = {
        user: any;
    };
}
