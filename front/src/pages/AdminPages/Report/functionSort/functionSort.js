export const sortDataTable = (valueName, tableDataIndicators) => {
    console.log('valueName', valueName);
    let filteredData = [];

    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    switch (valueName) {
        case "Все время":
            return tableDataIndicators;
            break;
        case "Сегодня":
            filteredData = tableDataIndicators.filter(el => {
                const createdAt = new Date(el.createdAtRaw);
                return createdAt >= startOfToday && createdAt <= endOfToday;
            });
            break;
        case "Вчера":
            const startOfYesterday = new Date(startOfToday);
            startOfYesterday.setDate(startOfYesterday.getDate() - 1);
            const endOfYesterday = new Date(endOfToday);
            endOfYesterday.setDate(endOfYesterday.getDate() - 1);
            filteredData = tableDataIndicators.filter(el => {
                const createdAt = new Date(el.createdAtRaw);
                return createdAt >= startOfYesterday && createdAt <= endOfYesterday;
            });
            break;
        case "Текущая неделя":
            const startOfWeek = new Date();
            startOfWeek.setDate(today.getDate() - today.getDay());
            filteredData = tableDataIndicators.filter(el => {
                const createdAt = new Date(el.createdAtRaw);
                return createdAt >= startOfWeek && createdAt <= endOfToday;
            });
            break;
        case "Текущий месяц":
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            filteredData = tableDataIndicators.filter(el => {
                const createdAt = new Date(el.createdAtRaw);
                return createdAt >= startOfMonth && createdAt <= endOfToday;
            });
            break;
        case "Текущий год":
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            filteredData = tableDataIndicators.filter(el => {
                const createdAt = new Date(el.createdAtRaw);
                return createdAt >= startOfYear && createdAt <= endOfToday;
            });
            break;
        case "Прошлая неделя":
            const startOfLastWeek = new Date();
            startOfLastWeek.setDate(today.getDate() - today.getDay() - 6);
            const endOfLastWeek = new Date();
            endOfLastWeek.setDate(today.getDate() - today.getDay());
            filteredData = tableDataIndicators.filter(el => {
                const createdAt = new Date(el.createdAtRaw);
                return createdAt >= startOfLastWeek && createdAt <= endOfLastWeek;
            });
            break;
        case "Прошлый месяц":
            const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            filteredData = tableDataIndicators.filter(el => {
                const createdAt = new Date(el.createdAtRaw);
                return createdAt >= startOfLastMonth && createdAt <= endOfLastMonth;
            });
            break;
        case "Прошлый год":
            const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
            const endOfLastYear = new Date(today.getFullYear(), 0, 0);
            filteredData = tableDataIndicators.filter(el => {
                const createdAt = new Date(el.createdAtRaw);
                return createdAt >= startOfLastYear && createdAt <= endOfLastYear;
            });
            break;
        default:
            filteredData = tableDataIndicators; // No filtering
    }

    return filteredData;
};