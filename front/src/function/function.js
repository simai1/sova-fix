import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

//! Функция генерации файла для скачивания
export const generateAndDownloadExcel = (data, nameTable, expenseSum) => {
  let transformedData = {};
  const server = process.env.REACT_APP_API_URL;

  if (nameTable === 'Финансы') {
    transformedData = data.map(({ ...item }) => ({
      Номер_заявки: item?.number,
      Объект: item?.object,
      Описание_проблемы: item?.problemDescription,
      Исполнитель: item?.contractor,
      Бюджет_ремонта: item?.repairPrice,
      Статус_заявки: item?.status,
    }));
  }else if(nameTable === 'Заявки' || nameTable === 'Показатели'){
    transformedData = data.map(({ ...item }) => ({
      Номер_заявки: item?.number,
      Исполнитель: item?.contractor,
      Подрядчик: item?.builder,
      Статус_заявки: item?.status,
      Подразделение: item?.unit,
      Фото: `${server}/uploads/${item?.fileName}`,
      Объект: item?.object,
      Описание_проблемы: item?.problemDescription,
      Срочность: item?.urgency,
      Дата_создания_заявки: item?.createdAt,
      Дней_в_работе: item?.daysAtWork,
      Дата_выполнения: item?.completeDate,
      Бюджет_ремонта: item?.repairPrice,
      Комментарий: item?.comment,
      Юр_Лицо: item?.legalEntity,
      Порядок_маршрута: item?.itineraryOrder,
    }));
  }
  const worksheet = XLSX.utils.json_to_sheet(transformedData);

  // Установка ширины столбцов
  const columnWidths = transformedData.reduce((widths, row) => {
    Object.keys(row).forEach((key, index) => {
      const value = row[key] ? row[key].toString() : "";
      widths[index] = Math.max(widths[index] || 10, value.length);
    });
    return widths;
  }, []);

  worksheet["!cols"] = columnWidths.map((width) => ({ wch: width + 10 })); // Добавляем немного запаса

  // Добавление строки с суммой расходов
  if(expenseSum){
    const summaryRow = [
        { Бюджет_ремонта: expenseSum }
      ];
    
      // Вставляем строку с суммой расходов
      XLSX.utils.sheet_add_json(worksheet, summaryRow, { skipHeader: true, origin: { r: transformedData.length + 1, c: 4 } });    
  }
 
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const currentDate = new Date();
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Moscow",
  };
  const formattedDate = currentDate
    .toLocaleString("ru-RU", options)
    .replace(/(\d+)\.(\d+)\.(\d+), (\d+):(\d+)/, "$3.$2.$1_$4:$5");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });
  const excelData = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(excelData, `Экспорт_Таблицы_${nameTable}_${formattedDate}.xlsx`);
};
