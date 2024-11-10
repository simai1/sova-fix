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
      status: status[item?.status] || "___",
      number: item?.number || "___",
      object: item?.object || "___",
      builder: item?.builder || "___",
      unit: item?.unit || "___",
      problemDescription: item?.problemDescription || "___",
      photo: item?.photo || "___",
      itineraryOrder: item?.itineraryOrder || "___",
      urgency: item?.urgency || "___",
      createdAt: item?.createdAt || "___",
      planCompleteDate: item?.planCompleteDate || "___",
      daysAtWork: item?.daysAtWork === 0 ? 0 : item?.daysAtWork || "___",
      completeDate: item?.completeDate || "___",
      repairPrice: item?.repairPrice || "___",
      comment: item?.comment || "___",
      legalEntity: item?.legalEntity || "___",
      checkPhoto: item?.checkPhoto || "___",
    };
  });
}


