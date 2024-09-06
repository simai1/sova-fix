import { mapObjectKeys } from '../utils/mapper';

const statuses = {
    NEW_REQUEST: 1,
    AT_WORK: 2,
    DONE: 3,
    IRRELEVANT: 4,
};

export default statuses;

export const statusesRuLocale = {
    1: 'новая заявка',
    2: 'в работе',
    3: 'выполнена',
    4: 'неактуальна',
};

export const mapStatuses = mapObjectKeys(statuses);
