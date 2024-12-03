import React, { useState, useEffect } from "react";
import PopUpContainer from "../../../UI/PopUpContainer/PopUpContainer";
import styles from "./PopUpNewEquipment.module.scss";
import { CreateEquipment, GetAllNomenclatures, GetAllСontractors, GetObjectsAll } from "../../../API/API";
import ListInputTOForm from "../../../UI/ListInputTOForm/ListInputTOForm";
import { useContext } from "react";
import DataContext from "../../../context";

function PopUpNewEquipment() {
  const [contractors, setContractors] = useState([]);
  const [objects, setObjects] = useState([]);
  const [nomenclatures, setNomenclatures] = useState([]);
  const { context } = useContext(DataContext);
  const [formData, setFormData] = useState({
    nomenclatureId: "",
    nomenclatureName: "",
    objectId: "",
    objectName: "",
    contractorId: "",
    contractorName: "",
    comment: "",
    supportFrequency: "",
    lastTO: "",
    nextTO: "",
  });

  // Получение данных при загрузке
  const getData = () => {
    GetObjectsAll().then((response) => {
      if (response.status === 200) {
        setObjects(response.data);
      }
    });

    GetAllСontractors().then((response) => {
      if (response.status === 200) {
        setContractors(response.data);
      }
    });

    GetAllNomenclatures().then((response) => {
      if (response.status === 200) {
        setNomenclatures(response.data);
      }
    });
  };

  useEffect(() => {
    getData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => {
      const updatedData = { ...prevData, [name]: value };

      // Автоматически вычисляем дату следующего ТО
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

  const handleSubmit = () => {
    // Проверка на заполненность всех обязательных полей
    const requiredFields = [
      "nomenclatureId",
      "objectId",
      "contractorId",
      "supportFrequency",
      "lastTO",
    ];
    const isFormValid = requiredFields.every((field) => formData[field]);

    if (!isFormValid) {
      alert("Пожалуйста, заполните все обязательные поля.");
      return;
    }

    const { objectName, contractorName, ...dataToSubmit } = formData;

    CreateEquipment(dataToSubmit).then((response) => {
      if (response?.status === 200) {
        context.setPopUp("PopUpGoodMessage");
        context.setPopupGoodText("Оборудование успешно добавлено!");
        context.UpdateDataEquipment();
      } else {
        console.log("Ошибка при создании оборудования");
      }
    });
  };

  const [activeDropdown, setActiveDropdown] = useState(null);
  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <PopUpContainer width={true} title={"Новое оборудование"} mT={150}>
      <div className={styles.PopUpNewTOCategory}>
        <div className={styles.pupUpFirstContainer}>
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
        <div className={styles.pupUpSecondContainer}>
          <div className={styles.pupUpSecondContainerInfo}>
            <div className={styles.pupContainerInfoTitle}>
              <p>Обслуживающий подрядчик:</p>
            </div>
            <ListInputTOForm
              handleListData={handleListData}
              name="contractorId"
              dataList={contractors}
              value={formData.contractorId}
              placeholder="Выберите подрядчика"
              isActive={activeDropdown === "contractorId"}
              toggleDropdown={() => toggleDropdown("contractorId")}
            />
          </div>
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
            />
          </div>
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
        </div>
      </div>
      <div className={styles.buttonSubmitBlock}>
        <button className={styles.buttonSubmit} onClick={handleSubmit}>
          Добавить оборудование
        </button>
      </div>
    </PopUpContainer>
  );
}

export default PopUpNewEquipment;
