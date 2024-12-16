import React, { useState, useEffect, useContext } from "react";
import PopUpContainer from "../../../../UI/PopUpContainer/PopUpContainer";
import styles from "./CreateNomenclature.module.scss";
import { CreateNomenclatures, GetAllCategories } from "../../../../API/API";
import DataContext from "../../../../context";
import ListInputTOForm from "../../../../UI/ListInputTOForm/ListInputTOForm";

function CreateNomenclature() {
  const [categories, setCategories] = useState([]); // Данные для выпадающего списка
  const { context } = useContext(DataContext); // Контекст для управления попапами и обновления данных

  const [formData, setFormData] = useState({
    name: "",
    comment: "",
    categoryId: "",
  });

  useEffect(() => {
    // Получаем категории при загрузке
    GetAllCategories().then((res) => {
      if (res?.status === 200) {
        setCategories(res.data);
      }
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleListData = (name, value) => {
    // Сохраняем ID выбранной категории
    if (name === "categoryId") {
      setFormData((prevData) => ({
        ...prevData,
        categoryId: value,
      }));
    }
  };

  const handleSubmit = () => {
    const { name, comment, categoryId } = formData;

    if (!name || !categoryId) {
      console.log("Заполните обязательные поля!");
      return;
    }

    const dataToSubmit = { name, comment, categoryId };
    console.log("Отправка данных на сервер:", dataToSubmit);

    CreateNomenclatures(dataToSubmit).then((res) => {
      if (res?.status === 200) {
        context.UpdateDataNomenclature(); // Обновляем данные после успешного добавления
        context.setPopUp("PopUpGoodMessage");
        context.setPopupGoodText("Номенклатура успешно добавлена!");
      } else {
        console.log("Ошибка при создании номенклатуры");
      }
    });
  };

  const [activeDropdown, setActiveDropdown] = useState(null);
  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <div className={styles.CreateNomenclature}>
      <PopUpContainer title={"Новая номенклатура"} mT={300}>
        <div className={styles.PopUpNewTOCategory}>
          <div className={styles.pupUpFirstContainer}>
            {/* Поле для ввода названия */}
            <div className={styles.pupUpFirstContainerInfo}>
              <div className={styles.pupContainerInfoTitle}>
                <p>Название номенклатуры:</p>
              </div>
              <input
                name="name"
                placeholder="Название"
                className={styles.commentBlockInput}
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            {/* Выпадающий список для выбора категории */}
            <div className={styles.pupUpFirstContainerInfo}>
              <div className={styles.pupContainerInfoTitle}>
                <p>Категория:</p>
              </div>
              <ListInputTOForm
                handleListData={handleListData}
                name="categoryId"
                dataList={categories}
                value={formData.categoryId}
                placeholder="Выберите категорию"
                isActive={activeDropdown === "categoryId"}
                toggleDropdown={() => toggleDropdown("categoryId")}
                width="270px"
              />
            </div>
             {/* Поле для ввода комментария */}
             <div className={styles.pupUpFirstContainerInfo}>
              <div className={styles.pupContainerInfoTitle}>
                <p>Комментарий:</p>
              </div>
              <input
                name="comment"
                placeholder="Комментарий"
                className={styles.commentBlockInput}
                value={formData.comment}
                onChange={handleInputChange}
              />
            </div>
          </div>
          {/* Кнопка для отправки данных */}
          <div className={styles.buttonSubmitBlock}>
            <button className={styles.buttonSubmit} onClick={handleSubmit}>
              Добавить номенклатуру
            </button>
          </div>
        </div>
      </PopUpContainer>
    </div>
  );
}

export default CreateNomenclature;
