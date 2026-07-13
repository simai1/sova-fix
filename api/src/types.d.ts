declare namespace Express {
    export type Request = {
        user: any;
        file: any;
        actor?: import('./types/auth').AuthActor;
    };
    export type Response = {
        user: any;
    };
}
