import RequestComment from '../models/requestComment';
import { mapRoles } from '../config/roles';

// DTO чат-сообщения. Имя автора резолвится через include `Author`,
// чтобы фронту не делать N+1-запросов. PII (email) не отдаём — это PII
// между несколькими акторами в чате.
export default class RequestCommentDto {
    id: string;
    requestId: string;
    text: string;
    attachment: string | null;
    createdAt: string;
    author: {
        id: string;
        name: string | null;
        role: number;
        roleName: string;
    };

    constructor(model: RequestComment) {
        this.id = model.id;
        this.requestId = model.requestId;
        this.text = model.text;
        this.attachment = model.attachment ?? null;
        this.createdAt = new Date(model.createdAt).toISOString();
        const author = (model as any).Author;
        this.author = {
            id: model.authorUserId,
            name: author?.name ?? null,
            role: model.authorRole,
            roleName: (mapRoles as Record<number, string>)[model.authorRole] || String(model.authorRole),
        };
    }
}
