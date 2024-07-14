import React  from "react";
import styles from "./PageCardContractors.module.scss";
import DataContext from "../../../context";
import ContractorCard from "../../../UI/ContractorCard/ContractorCard";

function PageCardContractors() {
  const { context } = React.useContext(DataContext);

  return (
    <div className={styles.PageCardContractors}>
        <div className={styles.container}>
            <div className={styles.ConstructorTitle}>
                <h3>Выберите подрядчика</h3>
            </div>
            <div className={styles.Constructor}>
                {context.dataContractors.map((el)=>{
                    return  <ContractorCard el={el}/>
                })}
            </div>
        </div>
    </div>
  );
}

export default PageCardContractors;
