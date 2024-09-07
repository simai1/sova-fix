import React, { useContext, useEffect, useState } from 'react';
import styles from "./CountInfoBlock.module.scss";
import DataContext from '../../context';



function CountInfoBlock(props) {
    const [contNew, setContNew] = useState(0);
    const [contWorked, setContWorked] = useState(0);
    const [contComplete, setContComplete] = useState(0);
    const { context } = useContext(DataContext);

      useEffect(() => {
        let newCount = 0;
        let workedCount = 0;
        let completeCount = 0;
    
        context?.filteredTableData.forEach((el) => {
            if (el.status === "Новая заявка") {
                newCount++;
            }
            if (el.status === "В работе") {
                workedCount++;
            }
            if (el.status === "Выполнена") {
                completeCount++;
            }
        });
    
        setContNew(newCount);
        setContWorked(workedCount);
        setContComplete(completeCount);
    }, [context?.filteredTableData]);
    


   
    return ( 
        <div>
            <div className={styles.CountInfoBlock}>
                <div className={styles.contNew}><p>Новых: {contNew}</p></div>
                <div className={styles.contWork}><p>В работе: {contWorked}</p></div>
                <div className={styles.contComplete}><p>Выполнено: {contComplete}</p></div>
            </div>    
        </div> 
    );
}

export default CountInfoBlock;