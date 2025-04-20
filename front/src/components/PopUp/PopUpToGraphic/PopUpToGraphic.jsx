import PopUpContainer from "../../../UI/PopUpContainer/PopUpContainer";
import React, { useContext, useEffect, useState } from "react";
import styles from "./PopUpToGraphic.module.scss";
import DataContext from "../../../context";
import ListInputTOForm from "../../../UI/ListInputTOForm/ListInputTOForm";
import { GetAllСontractors, GetOneEquipment, GetextContractorsAll, TOEquipment } from "../../../API/API";

function PopUpToGraphic() {
  const { context } = useContext(DataContext);
  const [contractors, setContractors] = useState([]);
  const [idSelectEquipment, setIdSelectEquipment] = useState("");
  const [dataEquipment, setDataEquipment] = useState(null);
  const [formData, setFormData] = useState({
    comment: "",
    date: "",
    cost: "",
    contractorId: "",
    contractorName: "",
  });
  useEffect(() => {
    setIdSelectEquipment(context.selectedTr) 
  },[])
  useEffect(() => {
    GetOneEquipment(idSelectEquipment).then((res) => {
        if(res?.status === 200){
            setDataEquipment(res.data)
            setFormData({
                ...formData,
                cost: res?.data?.defaultCost
            })
        }
    })
  },[idSelectEquipment])

 

    // Загрузка данных из API
    useEffect(() => {
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
    }, []);


  // Обработчик изменения инпутов
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Обработчик отправки данных
  const handleSubmit = () => {
    const data = {
        equipmentld: idSelectEquipment,
        date: new Date(formData.date),
        contractorId: formData.contractorId,
        cost: formData.cost,
        comment: formData.comment
    }
    TOEquipment(idSelectEquipment, data).then((response) => {
        if (response?.status === 200) {
            context.setPopUp("PopUpGoodMessage");
            context.setPopupGoodText("Техническое обслуживание успешно создано!");
            context.UpdateDataEquipment()
        }
    })
  };

  const handleListData = (name, value) => {
      const selectedContractor = contractors.find((cont) => cont.id === value);
      setFormData((prevData) => ({
        ...prevData,
        contractorId: value,
        contractorName: selectedContractor ? selectedContractor.name : "",
      }));
  };
      const [activeDropdown, setActiveDropdown] = useState(null);
      const toggleDropdown = (name) => {
        setActiveDropdown(activeDropdown === name ? null : name);
      };
    
  return (
    <PopUpContainer width={true}  title={"Новое техническое обслуживание"} mT={150} >
      <div className={styles.PopUpNewTO}>
        <div className={styles.pupUpFirstContainer}>
          <div className={styles.pupUpFirstContainerInfo}>
            <div className={styles.pupContainerInfoTitle}>
              <p>Категория:</p>
            </div>
            <div className={styles.pupUpContainerInfoSubtitle}>
              <p>{dataEquipment?.category}</p>
            </div>
          </div>
          <div className={styles.pupUpFirstContainerInfo}>
            <div className={styles.pupContainerInfoTitle}>
              <p>Название:</p>
            </div>
            <div className={styles.pupUpContainerInfoSubtitle}>
              <p>{dataEquipment?.name}</p>
            </div>
          </div>
          <div className={styles.pupUpFirstContainerInfo}>
            <div className={styles.pupContainerInfoTitle}>
              <p>Объект:</p>
            </div>
            <div className={styles.pupUpContainerInfoSubtitle}>
              <p>{dataEquipment?.object}</p>
            </div>
          </div>
          <div className={styles.commentBlock}>
            <div className={styles.commentBlockTitle}>
              <p>Комментарий:</p>
            </div>
            <input
              name="comment"
              placeholder="Введите ваш комментарий к ТО"
              className={styles.commentBlockInput}
              value={formData.comment}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className={styles.pupUpSecondContainer}>
          <div className={styles.pupUpSecondContainerInfo}>
            <div className={styles.pupContainerInfoTitle}>
              <p>Дата проведения ТО:</p>
            </div>
            <input
              name="date"
              className={styles.pupUpContainerInfoInput}
              type="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>
        {/* Подрядчик */}
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
              <p>Стоимость проведенного ТО:</p>
            </div>
            <input
              name="cost"
              className={styles.pupUpContainerInfoInput}
              placeholder="Стоимость ТО"
              value={formData.cost}
              style={{ textAlign: "center" }}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
      <div className={styles.buttonSubmitBlock}>
        <button className={styles.buttonSubmit} onClick={handleSubmit}>
          Добавить Запись
        </button>
      </div>
    </PopUpContainer>
  );
}

export default PopUpToGraphic;
