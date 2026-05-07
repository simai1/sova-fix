import User from '../../src/models/user';
import Contractor from '../../src/models/contractor';
import UserObject from '../../src/models/userObject';
import ObjectDir from '../../src/models/object';
import Unit from '../../src/models/unit';
import LegalEntity from '../../src/models/legalEntity';
import Urgency from '../../src/models/urgency';
import RepairRequest from '../../src/models/repairRequest';
import jwtUtils from '../../src/utils/jwt';

export type TestAuth = {
    user: User;
    accessToken: string;
    refreshToken: string;
    cookie: string[];
    authHeader: string;
};

// Создаёт пользователя в БД, валидные access+refresh, refresh кладёт в TokenModel
// (нужно для verifyAnyRole, который ходит в БД через refreshToken).
export const createUserAuth = async (login: string, role: number, name = 'LK User'): Promise<TestAuth> => {
    await User.destroy({ where: { login }, force: true });
    const user = await User.create({ login, password: 'x', name, role, isActivated: true });
    const { accessToken, refreshToken } = jwtUtils.generate({ id: user.id, role });
    await jwtUtils.saveToken(user.id, refreshToken);
    return {
        user,
        accessToken,
        refreshToken,
        cookie: [`refreshToken=${refreshToken}`],
        authHeader: `Bearer ${accessToken}`,
    };
};

// Гарантирует наличие LegalEntity/Unit/Object для тестов — глобально.
// Возвращает уже существующие или создаёт новые.
export const ensureBaseRefs = async () => {
    // beforeCreate-хуки этих моделей пересчитывают `number`, но Sequelize-валидатор
    // отбрасывает запись ещё до хука — поэтому передаём заглушку `number: 0`.
    let legal = await LegalEntity.findOne({ where: { name: 'LK Test LE' } });
    if (!legal)
        legal = await LegalEntity.create({
            name: 'LK Test LE',
            legalForm: 'ООО',
            startCoop: new Date(),
            count: 0,
            number: 0,
        } as any);

    let unit = await Unit.findOne({ where: { name: 'LK Test Unit' } });
    if (!unit) unit = await Unit.create({ name: 'LK Test Unit', count: 0, number: 0 } as any);

    let urgency = await Urgency.findOne({ where: { name: 'LK Test Urgency' } });
    if (!urgency) urgency = await Urgency.create({ name: 'LK Test Urgency', color: '#fff', number: 0 } as any);

    return { legal, unit, urgency };
};

// Создаёт ObjectDir и привязывает его к user через UserObject.
export const createObjectFor = async (user: User, namePrefix = 'LK Obj'): Promise<ObjectDir> => {
    const { legal, unit } = await ensureBaseRefs();
    const obj = await ObjectDir.create({
        name: `${namePrefix}-${user.id.slice(0, 6)}`,
        unitId: unit.id,
        legalEntityId: legal.id,
        city: 'Москва',
        number: 0,
    } as any);
    await UserObject.create({ userId: user.id, objectId: obj.id });
    return obj;
};

// Создаёт Contractor.userId для пользователя (исполнитель).
export const createContractorFor = async (user: User, name = 'LK Contractor'): Promise<Contractor> => {
    return await Contractor.create({ name: `${name}-${user.id.slice(0, 6)}`, userId: user.id });
};

// Создаёт RepairRequest c минимальным набором полей.
export const createRequest = async (overrides: Partial<RepairRequest> = {}) => {
    const { legal, unit, urgency } = await ensureBaseRefs();
    return await RepairRequest.create({
        unitId: (overrides as any).unitId ?? unit.id,
        legalEntityId: (overrides as any).legalEntityId ?? legal.id,
        objectId: (overrides as any).objectId,
        urgency: urgency.name,
        urgencyId: urgency.id,
        status: 1,
        builder: 'Укажите подрядчика',
        daysAtWork: 0,
        number: 0,
        ...overrides,
    } as any);
};

export const cleanupByLogin = async (login: string) => {
    const user = await User.findOne({ where: { login } });
    if (!user) return;
    await UserObject.destroy({ where: { userId: user.id }, force: true });
    await Contractor.destroy({ where: { userId: user.id }, force: true });
    await User.destroy({ where: { id: user.id }, force: true });
};
