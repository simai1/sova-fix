import { mapObjectKeys } from '../utils/mapper';

const statuses = {
    NEW_REQUEST: 1,
    AT_WORK: 2,
    DONE: 3,
};

export default statuses;

export const mapStatuses = mapObjectKeys(statuses);
