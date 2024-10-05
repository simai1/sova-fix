//! функция фильтрующая данные
export function FilteredSample(data, isChecked, sesionName = "") {
  if (isChecked?.length === 0) {
    return [...data];
  } else {
    return data.filter(
      (item) => !isChecked?.some((el) => el.value === item[el.itemKey]) && item
    );
  }
}

//! функция замены преподавательского массива на его имя
export function funFixEducator(data) {
  const status = {
    1: "Новая заявка",
    2: "В работе",
    3: "Выполнена",
    4: "Неактуальна",
    5: "Принята",
  };
  return data.map((item) => {
    return {
      ...item,
      contractor: item?.contractor?.name || "___",
      status: status[item?.status],
    };
  });
}
