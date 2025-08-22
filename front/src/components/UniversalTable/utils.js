export const getStatusValue = (statusNumber, array) => {
    const statusFromDb = array.find(
        (status) => status.number === statusNumber
    );
    return statusFromDb;
};
