import RequestComment from '../models/requestComment';
import { mapRoles } from '../config/roles';

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
