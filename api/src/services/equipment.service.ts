import Equipment from '../models/equipment';
import Category from '../models/category';
import Contractor from '../models/contractor';
import ExtContractor from '../models/externalContractor';
import ObjectDir from '../models/object';
import Unit from '../models/unit';
import EquipmentDto from '../dtos/equipment.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import Nomenclature from '../models/nomenclature';
import TechService from '../models/techService';
import TechServiceDto from '../dtos/techService';
import QRCode from 'qrcode-generator';
import fs from 'node:fs';
import { v4 } from 'uuid';

const create = async (
    supportFrequency: number | undefined,
    lastTO: Date | undefined,
    nextTO: Date | undefined,
    objectId: string,
    contractorId: string | undefined,
    photo: string | undefined,
    nomenclatureId: string,
    count: number | undefined,
    cost: number | undefined
) => {
    const nomenclature = await Nomenclature.findByPk(nomenclatureId, { include: [{ model: Category }] });
    if (!nomenclature) throw new ApiError(httpStatus.BAD_REQUEST, 'No nomenclature with id ' + nomenclatureId);
    const object = await ObjectDir.findByPk(objectId, { include: [{ model: Unit }] });
    if (!object) throw new ApiError(httpStatus.BAD_REQUEST, 'No object with id ' + objectId);
    let contractor, extContractor, extContractorId;
    if (contractorId) {
        contractor = await Contractor.findByPk(contractorId);
        if (!contractor) {
            contractor = undefined;
            extContractor = await ExtContractor.findByPk(contractorId);
            if (!extContractor) throw new ApiError(httpStatus.BAD_REQUEST, 'No contractors with id ' + contractorId);
            contractorId = undefined;
            extContractorId = extContractor.id;
        }
    }
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    const equipment = await Equipment.create({
        number: 0,
        name: nomenclature.name,
        supportFrequency,
        lastTO,
        nextTO: nextTO || now,
        comment: nomenclature.comment,
        photo,
        categoryId: nomenclature.Category?.id,
        unitId: object.Unit?.id,
        objectId,
        contractorId,
        extContractorId,
        nomenclatureId,
        count,
        cost,
    });
    equipment.ExtContractor = extContractor;
    equipment.Contractor = contractor;
    equipment.Object = object;
    equipment.Nomenclature = nomenclature;
    return new EquipmentDto(equipment);
};

const getAll = async (pagination: any) => {
    const equipment = await Equipment.findAll({
        include: [
            { model: Nomenclature, include: [{ model: Category }] },
            { model: Contractor },
            { model: ExtContractor },
            { model: ObjectDir, include: [{ model: Unit }] },
        ],
        limit: pagination.limit,
        offset: pagination.offset,
        order: [['number', 'ASC']],
    });
    return equipment.map(e => new EquipmentDto(e));
};

const getOne = async (equipmentId: string) => {
    const equipment = await Equipment.findByPk(equipmentId, {
        include: [
            { model: Nomenclature, include: [{ model: Category }] },
            { model: Contractor },
            { model: ExtContractor },
            { model: ObjectDir, include: [{ model: Unit }] },
            { model: TechService, include: [{ model: ExtContractor }, { model: Contractor }] },
        ],
    });
    if (!equipment) throw new ApiError(httpStatus.BAD_REQUEST, 'No equipment with id ' + equipmentId);
    return new EquipmentDto(equipment);
};

const destroy = async (equipmentId: string) => {
    const equipment = await Equipment.findByPk(equipmentId);
    if (!equipment) throw new ApiError(httpStatus.BAD_REQUEST, 'No equipment with id ' + equipmentId);
    await equipment.destroy({ force: true });
};

const update = async (
    equipmentId: string,
    supportFrequency: number | undefined,
    lastTO: Date | undefined,
    nextTO: Date | undefined,
    photo: string | undefined,
    objectId: string | undefined,
    contractorId: string | undefined,
    nomenclatureId: string | undefined,
    count: number | undefined,
    cost: number | undefined
) => {
    const equipment = await Equipment.findByPk(equipmentId);
    if (!equipment) throw new ApiError(httpStatus.BAD_REQUEST, 'No equipment with id ' + equipmentId);
    if (objectId) {
        const object = await ObjectDir.findByPk(objectId);
        if (!object) throw new ApiError(httpStatus.BAD_REQUEST, 'No object with id ' + objectId);
    }
    let contractor, extContractor, extContractorId;
    if (contractorId) {
        contractor = await Contractor.findByPk(contractorId);
        if (!contractor) {
            extContractor = await ExtContractor.findByPk(contractorId);
            if (!extContractor) throw new ApiError(httpStatus.BAD_REQUEST, 'No contractors with id ' + contractorId);
            contractorId = undefined;
            extContractorId = extContractor.id;
        }
    }
    if (nomenclatureId) {
        const nomenclature = await Nomenclature.findByPk(nomenclatureId);
        if (!nomenclature) throw new ApiError(httpStatus.BAD_REQUEST, 'No nomenclature with id ' + nomenclatureId);
    }

    await equipment.update({
        supportFrequency,
        lastTO,
        nextTO,
        photo,
        objectId,
        nomenclatureId,
        cost,
        count,
        contractorId: contractorId || extContractorId ? (contractorId ? contractorId : null) : undefined,
        extContractorId: contractorId || extContractorId ? (extContractorId ? extContractorId : null) : undefined,
    });
};

const techServiceDo = async (
    equipmentId: string,
    date: Date,
    contractorId: string | undefined,
    cost: number,
    comment: string | undefined
) => {
    const equipment = await Equipment.findByPk(equipmentId);
    if (!equipment) throw new ApiError(httpStatus.BAD_REQUEST, 'No equipment with id ' + equipmentId);
    let contractor, extContractor, extContractorId;
    if (contractorId) {
        contractor = await Contractor.findByPk(contractorId);
        if (!contractor) {
            contractor = undefined;
            extContractor = await ExtContractor.findByPk(contractorId);
            if (!extContractor) throw new ApiError(httpStatus.BAD_REQUEST, 'No contractors with id ' + contractorId);
            contractorId = undefined;
            extContractorId = extContractor.id;
        }
    }
    const techService = await TechService.create({
        equipmentId,
        date,
        contractorId,
        extContractorId,
        sum: cost,
        countEquipment: equipment.count,
        comment,
    });
    date.setDate(date.getDate() + equipment.supportFrequency);
    const techServices = await TechService.findAll({ where: { equipmentId: equipment.id } });
    await update(
        equipmentId,
        undefined,
        techService.date,
        date,
        undefined,
        undefined,
        undefined,
        undefined,
        techServices.length,
        techServices.reduce((acc, ts) => acc + ts.sum, 0)
    );

    if (contractorId) techService.Contractor = contractor;
    if (extContractorId) techService.ExtContractor = extContractor;
    return new TechServiceDto(techService);
};

const getOrGenerateQrCode = async (equipmentId: string) => {
    const equipment = await Equipment.findByPk(equipmentId);
    if (!equipment) throw new ApiError(httpStatus.BAD_REQUEST, 'No equipment with id ' + equipmentId);
    if (equipment.qr) return equipment.qr;
    else {
        const url = `${process.env.API_URL}/Equipment/EquipmentInfo?idEquipment=${equipmentId}`;
        const qr = QRCode(6, 'L');
        qr.addData(url);
        qr.make();
        const fileName = `${v4()}.svg`;
        fs.writeFile(`./uploads/${fileName}`, qr.createSvgTag(), err => {
            if (err) {
                console.error('Ошибка записи файла:', err);
                return;
            }
            console.log(`SVG QR-код успешно сохранен в файл: ${fileName}`);
        });
        await equipment.update({ qr: fileName });
        return equipment.qr;
    }
};

export default {
    create,
    getAll,
    getOne,
    destroy,
    update,
    techServiceDo,
    getOrGenerateQrCode,
};
