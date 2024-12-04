import React, { useState, useEffect, useContext } from "react";
import PopUpContainer from "../../../../UI/PopUpContainer/PopUpContainer";
import styles from "./EditNomenclature.module.scss";
import { GetOneNomenclatures, UpdateNomenclatures, GetAllCategories } from "../../../../API/API";
import DataContext from "../../../../context";
import ListInputTOForm from "../../../../UI/ListInputTOForm/ListInputTOForm";

function EditNomenclature() {
  const [categories, setCategories] = useState([]); // Данные для выпадающего списка
  const { context } = useContext(DataContext); // Контекст для управления попапами и обновления данных
  const [idSelectNomenclature, setIdSelectNomenclature] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    comment: "",
    categoryId: "",
  });

  const [activeDropdown, setActiveDropdown] = useState(null); // Управление выпадающим списком

  useEffect(() => {
    setIdSelectNomenclature(context.selectedTr);
    // Загружаем категории для выпадающего списка
    GetAllCategories().then((res) => {
      if (res?.status === 200) {
        setCategories(res.data);
      }
    });

    // Загружаем данные номенклатуры для редактирования
    GetOneNomenclatures(context.selectedTr).then((res) => {
      if (res?.status === 200) {
        console.log("res", res);
        setFormData({
          name: res.data.name || "",
          comment: res.data.comment || "",
          categoryId: res.data.category || "",
        });
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
    if (name === "categoryId") {
      setFormData((prevData) => ({
        ...prevData,
        categoryId: value,
      }));
    }
  };

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const handleSubmit = () => {
    const { name, categoryId } = formData;
  
    // Проверяем, заполнены ли обязательные поля
    if (!name || !categoryId) {
      console.log("Заполните обязательные поля!");
      return;
    }
  
    // Ищем категорию по названию и получаем её ID
    const selectedCategory = categories.find((cat) => cat.name === categoryId || cat.id === categoryId);
    console.log("categories", categories)
    if (!selectedCategory) {
      console.log("Категория не найдена!");
      return;
    }
  
    // Подготавливаем данные для отправки с использованием ID категории
    const dataToSubmit = {
      ...formData,
      categoryId: selectedCategory.id, // Используем ID вместо названия
    };
  
    // Отправляем данные на сервер
    UpdateNomenclatures(idSelectNomenclature, dataToSubmit).then((res) => {
      if (res?.status === 200) {
        context.UpdateDataNomenclature(); // Обновляем данные после успешного редактирования
        context.setPopUp("PopUpGoodMessage");
        context.setPopupGoodText("Номенклатура успешно обновлена!");
      } else {
        console.log("Ошибка при обновлении номенклатуры");
      }
    });
  };
  

  return (
    <div className={styles.EditNomenclature}>
      <PopUpContainer title={"Редактирование номенклатуры"} mT={300}>
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
          </div>
          {/* Кнопка для сохранения изменений */}
          <div className={styles.buttonSubmitBlock}>
            <button className={styles.buttonSubmit} onClick={handleSubmit}>
              Сохранить изменения
            </button>
          </div>
        </div>
      </PopUpContainer>
    </div>
  );
}

export default EditNomenclature;
