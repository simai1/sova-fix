import RepairRequest from '../models/repairRequest';
import ObjectDir from '../models/object';
import Unit from '../models/unit';
import Status from '../models/status';
import Urgency from '../models/urgency';
import Contractor from '../models/contractor';

// DTO для веб-ЛК (Исполнитель/Заказчик).
// Отличается от админского RequestDto тем, что отдаёт:
//   - вложенные объекты (Object/Unit/Status/Urgency/Contractor) под именами моделей,
//   - даты в ISO (createdAt/completeDate), а не в '%d.%m.%y',
//   - явный contractorId и createdByUserId — фронту нужно для проверки «моя ли заявка».
// Админский DTO не трогаем, чтобы не сломать существующий UI.

type ObjectSlim = { id: string; name: string; number?: number; city?: string };
type UnitSlim = { id: string; name: string };
type StatusSlim = { id: string; name: string; number: number; color?: string };
type UrgencySlim = { id: string; name: string; number: number; color?: string };
type ContractorSlim = { id: string; name: string | null };

const slimObject = (o?: ObjectDir | null): ObjectSlim | null =>
    o ? { id: o.id, name: o.name, number: o.number, city: o.city } : null;
const slimUnit = (u?: Unit | null): UnitSlim | null => (u ? { id: u.id, name: u.name } : null);
const slimStatus = (s?: Status | null): StatusSlim | null =>
    s ? { id: s.id, name: s.name, number: s.number, color: s.color } : null;
const slimUrgency = (u?: Urgency | null): UrgencySlim | null =>
    u ? { id: u.id, name: u.name, number: u.number, color: u.color } : null;
const slimContractor = (c?: Contractor | null): ContractorSlim | null =>
    c ? { id: c.id, name: c.name ?? null } : null;

export default class LkRequestDto {
    id!: string;
    number!: number;
    status!: number;
    statusId: string | null;
    objectId: string | null;
    contractorId: string | null;
    createdByUserId: string | null;
    problemDescription: string | null;
    urgency: string | null;
    urgencyId: string | null;
    fileName: string | null;
    checkPhoto: string | null;
    comment: string | null;
    commentAttachment: string | null;
    createdAt: string | null;
    completeDate: string | null;
    Object: ObjectSlim | null;
    Unit: UnitSlim | null;
    Status: StatusSlim | null;
    Urgency: UrgencySlim | null;
    Contractor: ContractorSlim | null;

    constructor(model: RepairRequest) {
        this.id = model.id;
        this.number = model.number;
        this.status = model.status;
        this.statusId = model.statusId ?? null;
        this.objectId = model.objectId ?? null;
        this.contractorId = model.contractorId ?? null;
        this.createdByUserId = model.createdByUserId ?? null;
        this.problemDescription = model.problemDescription ?? null;
        this.urgency = model.urgency ?? null;
        this.urgencyId = model.urgencyId ?? null;
        this.fileName = (model.fileName as unknown as string) ?? null;
        this.checkPhoto = model.checkPhoto ?? null;
        this.comment = model.comment ?? null;
        this.commentAttachment = model.commentAttachment ?? null;
        this.createdAt = model.createdAt ? new Date(model.createdAt).toISOString() : null;
        this.completeDate = model.completeDate ? new Date(model.completeDate).toISOString() : null;
        this.Object = slimObject(model.Object);
        this.Unit = slimUnit(model.Unit);
        this.Status = slimStatus((model as any).Status);
        this.Urgency = slimUrgency((model as any).Urgency);
        this.Contractor = slimContractor(model.Contractor);
    }
}
