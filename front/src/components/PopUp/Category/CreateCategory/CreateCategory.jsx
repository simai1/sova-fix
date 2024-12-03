import { useContext, useState } from "react";
import PopUpContainer from "../../../../UI/PopUpContainer/PopUpContainer";
import styles from "./CreateCategory.module.scss"
import { CreateCategories } from "../../../../API/API";
import DataContext from "../../../../context";
function CreateCategory() {
    const [dataCategory, setDataCategory] = useState({
        name: "",
        comment: "",
    });
    const {context} = useContext(DataContext);

    const handleCreateCategory = () => {
        CreateCategories(dataCategory).then((res) => {
            if(res?.status === 200){
                context.setPopUp("PopUpGoodMessage")
                context.setPopupGoodText("Категория успешно добавлена!")
                context.UpdateDataCategory()
            } 
        })
    }
    return ( 
        <div className={styles.CreateCategory}>
            <PopUpContainer title={"Новая категория"} mT={300}>
            <div className={styles.PopUpNewTOCategory}>
                <div className={styles.pupUpFirstContainer}>
                    <div className={styles.pupUpFirstContainerInfo}>
                        <div className={styles.pupContainerInfoTitle}> <p>Название категории:</p></div>
                        <input placeholder="Название" className={styles.commentBlockInput} onChange={(e) => setDataCategory({...dataCategory, name: e.target.value})} />
                    </div>
                    <div className={styles.pupUpFirstContainerInfo}>
                        <div className={styles.pupContainerInfoTitle}> <p>Комментарий к категории:</p></div>
                        <input placeholder="Комментарий" className={styles.commentBlockInput} onChange={(e) => setDataCategory({...dataCategory, comment: e.target.value})}/>
                    </div>
                   
                </div>
                <div className={styles.buttonSubmitBlock}>
                    <button className={styles.buttonSubmit} onClick={() => handleCreateCategory()}>Добавить ТО категории</button>
                </div>
            </div>

            </PopUpContainer>
        </div>
     );
}

export default CreateCategory;