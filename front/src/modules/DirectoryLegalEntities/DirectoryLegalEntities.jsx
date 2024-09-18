import { useEffect, useState } from "react";
import { GetlegalEntitiesAll } from "../../API/API";
import { tableLagealEntries } from "./DirectoryLegalEntitiesData";
import UniversalTable from "../../components/UniversalTable/UniversalTable";
import styles from "./DirectoryLegalEntities.module.scss";
function DirectoryLegalEntities() {
    const [tableDataEnries, setTableDataEnries] = useState([]);
    useEffect(() => {
        GetlegalEntitiesAll().then((response) => {
            setTableDataEnries(response.data);
        })
    },[])

    return ( 
       <div className={styles.DirectoryLegalEntities}>
            <div className={styles.DirectoryLegalEntitiesTop}>
                <div>
                    <h2>подразделения</h2>
                </div>
                <div className={styles.DirectoryLegalEntitiesTopButton}>
                    <button>Добавить подразделение</button>
                    <button>Удалить подразделение</button>
                </div>
            </div>
          <UniversalTable tableHeader={tableLagealEntries} tableBody={tableDataEnries}/>
       </div>
     );
}

export default DirectoryLegalEntities;