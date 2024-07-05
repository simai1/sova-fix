import {mapObjectKeys} from "../utils/mapper";

const statuses = {
    NEW_REQUEST: 0,
    AT_WORK: 1,
    DONE: 2,
};

export default statuses;

export const mapStatuses = mapObjectKeys(statuses);
