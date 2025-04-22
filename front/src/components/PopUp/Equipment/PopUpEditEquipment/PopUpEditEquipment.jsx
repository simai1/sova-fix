import React, { useState, useEffect, useContext, useRef } from "react";
import PopUpContainer from "../../../../UI/PopUpContainer/PopUpContainer";
import styles from "./PopUpEditEquipment.module.scss";
import { UpdateEquipment, GetAllNomenclatures, GetAllСontractors, GetObjectsAll, GetextContractorsAll } from "../../../../API/API";
import ListInputTOForm from "../../../../UI/ListInputTOForm/ListInputTOForm";
import DataContext from "../../../../context";

function PopUpEditEquipment() {
  const { context } = useContext(DataContext);
  const fileInputRef = useRef(null); // Для управления выбором файла

  const [contractors, setContractors] = useState([]);
  const [objects, setObjects] = useState([]);
  const [nomenclatures, setNomenclatures] = useState([]);
  const [formData, setFormData] = useState({
    nomenclatureId: "",
    nomenclatureName: "",
    objectId: "",
    objectName: "",
    defaultCost: "",
    contractorId: "",
    contractorName: "",
    comment: "",
    supportFrequency: "",
    lastTO: "",
    nextTO: "",
  });

  useEffect(() => {
    if (context.selectEquipment && objects.length && contractors.length && nomenclatures.length) {
      const equipment = context.selectEquipment;
      const matchedObject = objects.find((obj) => obj.name === equipment.object);
      const matchedContractor = contractors.find((cont) => cont.name === equipment.contractor);
      const matchedNomenclature = nomenclatures.find((nom) => nom.name === equipment.name);
      console.log("equipment", equipment)
      setFormData({
        nomenclatureId: matchedNomenclature?.id || "",
        nomenclatureName: equipment?.name || "",
        objectId: matchedObject?.id || "",
        objectName: equipment?.object || "",
        contractorId: matchedContractor?.id || "",
        contractorName: equipment?.contractor || equipment?.extContractor || "",
        comment: equipment?.comment || "",
        supportFrequency: equipment?.supportFrequency || "",
        defaultCost: equipment?.defaultCost || "",
        lastTO: equipment?.lastTO?.split("T")[0] || "",
        nextTO: equipment?.nextTO?.split("T")[0] || "",
      });
    }
  }, [context.selectEquipment, objects, contractors, nomenclatures]);

  // Загрузка данных из API
  useEffect(() => {
    GetObjectsAll().then((response) => {
      if (response.status === 200) {
        setObjects(response.data);
      }
    });

    Promise.all([GetAllСontractors(), GetextContractorsAll()])
    .then(([response1, response2]) => {
      if (response1.status === 200 && response2.status === 200) {
        // Объединяем данные из обоих ответов
        const combinedData = [...response1.data, ...response2.data];
        setContractors(combinedData);
      }
    })
    .catch((error) => {
      console.error("Ошибка при получении данных:", error);
    });

    GetAllNomenclatures().then((response) => {
      if (response.status === 200) {
        console.log("nomenclatures", response.data)
        setNomenclatures(response.data);
      }
    });
  }, []);

  // Обработка изменений в текстовых полях
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => {
      const updatedData = { ...prevData, [name]: value };

      // Автоматическое вычисление даты следующего ТО
      if (name === "lastTO" || name === "supportFrequency") {
        if (updatedData.lastTO && updatedData.supportFrequency) {
          const nextDate = new Date(updatedData.lastTO);
          nextDate.setDate(nextDate.getDate() + parseInt(updatedData.supportFrequency, 10));
          updatedData.nextTO = nextDate.toISOString().split("T")[0];
        } else {
          updatedData.nextTO = "";
        }
      }

      return updatedData;
    });
  };

  // Обработка выбора в выпадающих списках
  const handleListData = (name, value) => {
    if (name === "objectId") {
      const selectedObject = objects.find((obj) => obj.id === value);
      setFormData((prevData) => ({
        ...prevData,
        objectId: value,
        objectName: selectedObject ? selectedObject.name : "",
      }));
    } else if (name === "nomenclatureId") {
      const selectedNomenclature = nomenclatures.find((nom) => nom.id === value);
      setFormData((prevData) => ({
        ...prevData,
        nomenclatureId: value,
        nomenclatureName: selectedNomenclature ? selectedNomenclature.name : "",
      }));
    } else if (name === "contractorId") {
      const selectedContractor = contractors.find((cont) => cont.id === value);
      setFormData((prevData) => ({
        ...prevData,
        contractorId: value,
        contractorName: selectedContractor ? selectedContractor.name : "",
      }));
    }
  };

  // Отправка данных на сервер
const handleSubmit = () => {
  const requiredFields = [
    "nomenclatureId",
    "objectId",
    // "contractorId",
    "supportFrequency",
    "lastTO",
  ];
  const isFormValid = requiredFields.every((field) => formData[field]);

  if (!isFormValid) {
    alert("Пожалуйста, заполните все обязательные поля.");
    return;
  }

  const { objectName, contractorName, nomenclatureName, ...dataToSubmit } = formData;

  const formDataToSend = new FormData();
  formDataToSend.append("data", JSON.stringify(dataToSubmit));

  UpdateEquipment(context.selectEquipment.id, dataToSubmit).then((response) => {
      if (response?.status === 200) {
        context.setPopUp("PopUpGoodMessage");
        context.setPopupGoodText("Оборудование успешно обновлено!");
        context.GetDataEquipment(context.selectEquipment.id);
      } else {
        console.log("Ошибка при обновлении оборудования");
      }
    })
    .catch((error) => {
      console.error("Ошибка запроса:", error);
    });
};


  const [activeDropdown, setActiveDropdown] = useState(null);
  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <PopUpContainer width={true} title={"Редактирование оборудования"} mT={150}>
      <div className={styles.PopUpEditEquipment}>
        <div className={styles.pupUpFirstContainer}>
          {/* Номенклатура */}
          <div className={styles.pupUpFirstContainerInfo}>
            <div className={styles.pupContainerInfoTitle}>
              <p>Номенклатура:</p>
            </div>
            <ListInputTOForm
              handleListData={handleListData}
              name="nomenclatureId"
              dataList={nomenclatures}
              value={formData.nomenclatureId}
              placeholder="Выберите номенклатуру"
              isActive={activeDropdown === "nomenclatureId"}
              toggleDropdown={() => toggleDropdown("nomenclatureId")}
            />
          </div>
           {/* Объект */}
           <div className={styles.pupUpFirstContainerInfo}>
            <div className={styles.pupContainerInfoTitle}>
              <p>Объект:</p>
            </div>
            <ListInputTOForm
              handleListData={handleListData}
              name="objectId"
              dataList={objects}
              value={formData.objectId}
              placeholder="Выберите объект"
              isActive={activeDropdown === "objectId"}
              toggleDropdown={() => toggleDropdown("objectId")}
            />
          </div>
          {/* Комментарий */}
          <div className={styles.commentBlock}>
            <div className={styles.commentBlockTitle}>
              <p>Комментарий:</p>
            </div>
            <input
              name="comment"
              className={styles.commentBlockInput}
              placeholder="Введите ваш комментарий к ТО"
              value={formData.comment}
              onChange={handleInputChange}
            />
          </div>
        </div>
        {/* Вторая часть */}
        <div className={styles.pupUpSecondContainer}>
          {/* Подрядчик */}
          <div className={styles.pupUpSecondContainerInfo}>
            <div className={styles.pupContainerInfoTitle}>
              <p>Обслуживающий подрядчик:</p>
            </div>
            <ListInputTOForm
              handleListData={handleListData}
              name="contractorId"
              dataList={contractors}
              value={formData.contractorId || formData?.contractorName}
              placeholder="Выберите подрядчика"
              isActive={activeDropdown === "contractorId"}
              toggleDropdown={() => toggleDropdown("contractorId")}
            />
          </div>
          {/* Период обслуживания */}
          <div className={styles.pupUpSecondContainerInfo}>
            <div className={styles.pupContainerInfoTitle}>
              <p>Период обслуживания:</p>
            </div>
            <input
              name="supportFrequency"
              className={styles.pupUpContainerInfoInput}
              placeholder="Укажите количество дней"
              value={formData.supportFrequency}
              onChange={handleInputChange}
              style={{ textAlign: "center", paddingLeft: "0px" }}
            />
          </div>
          {/* Даты ТО */}
          <div className={styles.pupUpSecondContainerInfo}>
            <div className={styles.pupContainerInfoTitle}>
              <p>Дата текущего ТО:</p>
            </div>
            <input
              name="lastTO"
              className={styles.pupUpContainerInfoInput}
              type="date"
              value={formData.lastTO}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.pupUpSecondContainerInfo}>
            <div className={styles.pupContainerInfoTitle}>
              <p>Дата следующего ТО:</p>
            </div>
            <input
              name="nextTO"
              className={styles.pupUpContainerInfoInput}
              type="date"
              value={formData.nextTO}
              disabled
            />
          </div>
          <div className={styles.pupUpSecondContainerInfo}>
            <div className={styles.pupContainerInfoTitle}>
              <p>Стоимость ТО:</p>
            </div>
            <input
              name="defaultCost"
              className={styles.pupUpContainerInfoInput}
              placeholder="Базовая стоимость"
              value={formData.defaultCost}
              onChange={handleInputChange}
              style={{ textAlign: "center", paddingLeft: "0px" }}
            />
          </div>

        </div>
      </div>
      {/* Кнопка */}
      <div className={styles.buttonSubmitBlock}>
        <button className={styles.buttonSubmit} onClick={handleSubmit}>
          Сохранить изменения
        </button>
      </div>
    </PopUpContainer>
  );
}

export default PopUpEditEquipment;
