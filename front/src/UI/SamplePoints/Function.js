//! функция фильтрующая данные
export function FilteredSample(data, isChecked, sesionName = "") {
  if (isChecked?.length === 0) {
    return [...data];
  }
  else {
    return data.filter(
      (item) => !isChecked?.some((el) => el.value === item[el.itemKey]) && item
    );
  }
}
