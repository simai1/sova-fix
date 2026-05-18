import React, { useState, useEffect, useContext } from "react";
import PopUpContainer from "../../../../UI/PopUpContainer/PopUpContainer";
import styles from "./EditNomenclature.module.scss";
import { GetOneNomenclatures, UpdateNomenclatures, GetAllCategories } from "../../../../API/API";
import DataContext from "../../../../context";
import ListInputTOForm from "../../../../UI/ListInputTOForm/ListInputTOForm";

function EditNomenclature() {
  const [categories, setCategories] = useState([]);
  const { context } = useContext(DataContext);
  const [idSelectNomenclature, setIdSelectNomenclature] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    comment: "",
    categoryId: "",
  });

  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    setIdSelectNomenclature(context.selectedTr);
    GetAllCategories().then((res) => {
      if (res?.status === 200) {
        setCategories(res.data);
      }
    });

    GetOneNomenclatures(context.selectedTr).then((res) => {
      if (res?.status === 200) {
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
  
    if (!name || !categoryId) {
      alert("Заполните обязательные поля!");
      return;
    }
  
    const selectedCategory = categories.find((cat) => cat.name === categoryId || cat.id === categoryId);
    if (!selectedCategory) {
      return;
    }
  
    const dataToSubmit = {
      ...formData,
      categoryId: selectedCategory.id,
    };

    UpdateNomenclatures(idSelectNomenclature, dataToSubmit).then((res) => {
      if (res?.status === 200) {
        context.UpdateDataNomenclature();
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
