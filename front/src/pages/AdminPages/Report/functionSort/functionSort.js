export const sortDataTable = (valueName, tableDataIndicators, dateFrom, dateTo, nameViborka) => {
    let filteredData = [];
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));
   
        switch (valueName) {
            case "Все время":
                
                const start = new Date(dateFrom);
                const end = new Date(dateTo);
                // Проверка, что start не больше end
                if(dateFrom === undefined || dateTo=== undefined){
                    return tableDataIndicators
                }
                if(dateFrom === new Date().toISOString().slice(0, 10) && dateTo=== new Date().toISOString().slice(0, 10)){
                    return tableDataIndicators
                }else if (start > end) {
                    return []; // Возвращаем пустой массив, если даты некорректны
                }
                filteredData = tableDataIndicators.filter(el => {
                    var createdAt;
                    nameViborka === "Дата выполнения" ?  createdAt = new Date(el.completeDateRaw) : createdAt = new Date(el.createdAtRaw);
                    return createdAt >= start && createdAt <= end;
                });
                return filteredData; // Возвращаем отфильтрованные данные
            
               
                break;
            case "Сегодня":
                filteredData = tableDataIndicators.filter(el => {
                    var createdAt;
                    nameViborka === "Дата выполнения" ?  createdAt = new Date(el.completeDateRaw) : createdAt = new Date(el.createdAtRaw);
                    return createdAt >= startOfToday && createdAt <= endOfToday;
                });
                break;
            case "Вчера":
                const startOfYesterday = new Date(startOfToday);
                startOfYesterday.setDate(startOfYesterday.getDate() - 1);
                const endOfYesterday = new Date(endOfToday);
                endOfYesterday.setDate(endOfYesterday.getDate() - 1);
                filteredData = tableDataIndicators.filter(el => {
                    var createdAt;
                    nameViborka === "Дата выполнения" ?  createdAt = new Date(el.completeDateRaw) : createdAt = new Date(el.createdAtRaw);
                    return createdAt >= startOfYesterday && createdAt <= endOfYesterday;
                });
                break;
            case "Текущая неделя":
                const startOfWeek = new Date();
                startOfWeek.setDate(today.getDate() - today.getDay());
                filteredData = tableDataIndicators.filter(el => {
                    var createdAt;
                    nameViborka === "Дата выполнения" ?  createdAt = new Date(el.completeDateRaw) : createdAt = new Date(el.createdAtRaw);
                    return createdAt >= startOfWeek && createdAt <= endOfToday;
                });
                break;
            case "Текущий месяц":
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                filteredData = tableDataIndicators.filter(el => {
                    var createdAt;
                    nameViborka === "Дата выполнения" ?  createdAt = new Date(el.completeDateRaw) : createdAt = new Date(el.createdAtRaw);
                    return createdAt >= startOfMonth && createdAt <= endOfToday;
                });
                break;
            case "Текущий год":
                const startOfYear = new Date(today.getFullYear(), 0, 1);
                filteredData = tableDataIndicators.filter(el => {
                    var createdAt;
                    nameViborka === "Дата выполнения" ?  createdAt = new Date(el.completeDateRaw) : createdAt = new Date(el.createdAtRaw);

                    return createdAt >= startOfYear && createdAt <= endOfToday;
                });
                break;
            case "Прошлая неделя":
                const startOfLastWeek = new Date();
                startOfLastWeek.setDate(today.getDate() - today.getDay() - 6);
                const endOfLastWeek = new Date();
                endOfLastWeek.setDate(today.getDate() - today.getDay());
                filteredData = tableDataIndicators.filter(el => {
                    var createdAt;
                    nameViborka === "Дата выполнения" ?  createdAt = new Date(el.completeDateRaw) : createdAt = new Date(el.createdAtRaw);

                    return createdAt >= startOfLastWeek && createdAt <= endOfLastWeek;
                });
                break;
            case "Прошлый месяц":
                const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                filteredData = tableDataIndicators.filter(el => {
                    var createdAt;
                    nameViborka === "Дата выполнения" ?  createdAt = new Date(el.completeDateRaw) : createdAt = new Date(el.createdAtRaw);
                    return createdAt >= startOfLastMonth && createdAt <= endOfLastMonth;
                });
                break;
            case "Прошлый год":
                const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
                const endOfLastYear = new Date(today.getFullYear(), 0, 0);
                filteredData = tableDataIndicators.filter(el => {
                    var createdAt;
                    nameViborka === "Дата выполнения" ?  createdAt = new Date(el.completeDateRaw) : createdAt = new Date(el.createdAtRaw);
                    return createdAt >= startOfLastYear && createdAt <= endOfLastYear;
                });
                break;
            default:
                filteredData = tableDataIndicators; // No filtering
        }
    

    return filteredData;
};