import React, { useContext, useEffect, useState } from 'react';
import styles from "./CountInfoBlock.module.scss";

function CountInfoBlock(props) {
    const [contNew, setContNew] = useState(0);
      useEffect(() => {
        let newCount = 0;
       switch (props?.keys) {
           case "count":
               setContNew(props?.dataCount?.length);
               break;
           case "status":
               setContNew(props?.totalCount);
               break;
           case "checkPhoto":
               props?.dataCount.forEach((el) => {
                   if (el.checkPhoto !== "___" && el.repairPrice) {
                       newCount++;
                   }
               });
               setContNew(newCount);
               break;
           default:
               break;
       }
       newCount = 0
    }, [ props?.dataCount, props?.totalCount]);
    
    return ( 
        <div>
            <div className={styles.CountInfoBlock} style={{backgroundColor: props?.color}}>
                <div className={styles.contNew}><p>{props?.name}: {contNew}</p></div>
            </div>    
        </div> 
    );
}

export default CountInfoBlock;