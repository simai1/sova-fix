import { useContext, useEffect, useState } from "react";
import PopUpContainer from "../../../../UI/PopUpContainer/PopUpContainer";
import styles from "./PopUpEditTOCategory.module.scss";
import { GetOneCategories, UpdateCategories } from "../../../../API/API";
import DataContext from "../../../../context";

function PopUpEditTOCategory() {
  const [dataCategory, setDataCategory] = useState({
    name: "",
    comment: "",
  });
  const [selectId, setSelectId] = useState(null);
  const { context } = useContext(DataContext);

  useEffect(() => {
    // Загружаем данные категории при монтировании компонента
    setSelectId(context.selectedTr);
    GetOneCategories(context.selectedTr).then((res) => {
      if (res?.status === 200) {
        setDataCategory({
          name: res?.data?.name || "",
          comment: res?.data?.comment || "",
        });
      }
    });
  }, []);

  // Функция для обновления категории
  const handleUpdateCategory = () => {
    UpdateCategories(selectId, dataCategory).then((res) => {
      if (res?.status === 200) {
        context.setPopUp("PopUpGoodMessage");
        context.setPopupGoodText("Категория успешно обновлена!");
        context.UpdateDataCategory(); // Обновляем данные в родительском контексте
      }
    });
  };

  return (
    <div className={styles.PopUpEditTOCategory}>
      <PopUpContainer title={"Редактирование категории"} mT={300}>
        <div className={styles.PopUpNewTOCategory}>
          <div className={styles.pupUpFirstContainer}>
            {/* Поле для редактирования названия категории */}
            <div className={styles.pupUpFirstContainerInfo}>
              <div className={styles.pupContainerInfoTitle}>
                <p>Название категории:</p>
              </div>
              <input
                placeholder="Название"
                value={dataCategory.name} // Устанавливаем значение из состояния
                className={styles.commentBlockInput}
                onChange={(e) =>
                  setDataCategory({ ...dataCategory, name: e.target.value })
                }
              />
            </div>
            {/* Поле для редактирования комментария */}
            <div className={styles.pupUpFirstContainerInfo}>
              <div className={styles.pupContainerInfoTitle}>
                <p>Комментарий к категории:</p>
              </div>
              <input
                placeholder="Комментарий"
                value={dataCategory.comment} // Устанавливаем значение из состояния
                className={styles.commentBlockInput}
                onChange={(e) =>
                  setDataCategory({ ...dataCategory, comment: e.target.value })
                }
              />
            </div>
          </div>
          {/* Кнопка для сохранения изменений */}
          <div className={styles.buttonSubmitBlock}>
            <button
              className={styles.buttonSubmit}
              onClick={handleUpdateCategory} // Вызываем функцию обновления
            >
              Сохранить изменения
            </button>
          </div>
        </div>
      </PopUpContainer>
    </div>
  );
}

export default PopUpEditTOCategory;
