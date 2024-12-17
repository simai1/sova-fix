import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

//! Функция генерации файла для скачивания с информацией об оборудовании и историей ТО
export const generateAndDownloadExcelEquipment = (equipmentData) => {
  const server = process.env.REACT_APP_API_URL;

  // Формируем данные для блока "Информация об оборудовании" в виде двух столбцов
  const equipmentInfo = [
    ["Номер", String(equipmentData.number)],
    ["Подразделение", equipmentData.unit],
    ["Объект", equipmentData.object],
    ["Категория", equipmentData.category],
    ["Название оборудования", equipmentData.name],
    ["Дата последнего ТО", equipmentData.lastTOHuman],
    ["Дата следующего ТО", equipmentData.nextTOHuman],
    ["Фото", `${server}/uploads/${equipmentData.photo}`],
    ["Подрядчик", equipmentData.contractor || equipmentData.extContractor],
    ["Частота ТО (дни)", String(equipmentData.supportFrequency)],
    ["Комментарий", equipmentData.comment],
  ];

  // Формируем данные для блока "История обслуживания ТО"
  const maintenanceHistory = equipmentData.history.map((entry) => ({
    "Дата обслуживания": entry.dateHuman,
    "Исполнитель": entry.contractor,
    "Количество оборудования": entry.countEquipment,
    "Стоимость (₽)": entry.sum,
    "Комментарий": entry.comment,
  }));

  // Создаем книгу Excel
  const workbook = XLSX.utils.book_new();

  // Лист с информацией об оборудовании
  const equipmentSheet = XLSX.utils.aoa_to_sheet(equipmentInfo);
  equipmentSheet["!cols"] = [
    { wch: 25 }, // Ширина колонки с названиями полей
    { wch: 70 }, // Ширина колонки со значениями
  ];
  XLSX.utils.book_append_sheet(workbook, equipmentSheet, "Оборудование");

  // Лист с историей обслуживания ТО
  const historySheet = XLSX.utils.json_to_sheet(maintenanceHistory);
  historySheet["!cols"] = Object.keys(maintenanceHistory[0]).map((key) => ({
    wch: key.length + 15,
  }));
  XLSX.utils.book_append_sheet(workbook, historySheet, "История ТО");

  // Генерация текущей даты для имени файла
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
    .replace(/(\d+)\.(\d+)\.(\d+), (\d+):(\d+)/, "$3.$2.$1_$4-$5");

  // Генерация и скачивание файла
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });
  const excelData = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(excelData, `Экспорт_Информации_Об_Оборудовании_${equipmentData?.name}.xlsx`);
};
