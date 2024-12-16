import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

//! Функция генерации файла для скачивания с информацией об оборудовании и историей ТО
export const generateAndDownloadExcelEquipment = (equipmentData) => {
  const server = process.env.REACT_APP_API_URL;

  // Формируем данные для блока "Информация об оборудовании"
  const equipmentInfo = [
    {
      "Номер": equipmentData.number,
      "Название": equipmentData.name,
      "Категория": equipmentData.category,
      "Объект": equipmentData.object,
      "Подразделение": equipmentData.unit,
      "Исполнитель": equipmentData.contractor,
      "Частота ТО (дни)": equipmentData.supportFrequency,
      "Дата последнего ТО": equipmentData.lastTOHuman,
      "Дата следующего ТО": equipmentData.nextTOHuman,
      "Комментарий": equipmentData.comment,
      "Фото": `${server}/uploads/${equipmentData.photo}`,
      "QR-код": `${server}/uploads/${equipmentData.qr}`,
    },
  ];

  // Формируем данные для блока "История обслуживания ТО"
  const maintenanceHistory = equipmentData.history.map((entry) => ({
    "Дата обслуживания": entry.dateHuman,
    "Исполнитель": entry.contractor,
    "Количество оборудования": entry.countEquipment,
    "Стоимость (₽)": entry.sum,
    "Комментарий": entry.comment,
  }));

  // Создаем два листа для Excel
  const workbook = XLSX.utils.book_new();

  // Лист с информацией об оборудовании
  const equipmentSheet = XLSX.utils.json_to_sheet(equipmentInfo);
  equipmentSheet["!cols"] = Object.keys(equipmentInfo[0]).map((key) => ({ wch: key.length + 15 }));
  XLSX.utils.book_append_sheet(workbook, equipmentSheet, "Оборудование");

  // Лист с историей обслуживания ТО
  const historySheet = XLSX.utils.json_to_sheet(maintenanceHistory);
  historySheet["!cols"] = Object.keys(maintenanceHistory[0]).map((key) => ({ wch: key.length + 15 }));
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