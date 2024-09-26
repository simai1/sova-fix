import React, { useContext, useEffect, useState } from 'react';
import styles from "./CountInfoBlock.module.scss";
import DataContext from '../../context';



function CountInfoBlock(props) {
    const [contNew, setContNew] = useState(0);
    const { context } = useContext(DataContext);
    console.log("props", props)
      useEffect(() => {
        let newCount = 0;
        console.log("props.dataCount", props?.dataCount)
       switch (props?.keys) {
           case "count":
               setContNew(props?.dataCount?.length);
               break;
           case "status":
               props?.dataCount.forEach((el) => {
                   if (el.status === props?.value) {
                    console.log("el", el.status)
                       newCount++;
                   }

               })
               setContNew(newCount);
               break;
           case "checkPhoto":
               props?.dataCount.forEach((el) => {
                   if (el.checkPhoto && el.repairPrice) {
                       newCount++;
                   }
               });
               setContNew(newCount);
               break;
           default:
               break;
       }
       newCount = 0
    }, [ props?.dataCount]);
    
    return ( 
        <div>
            <div className={styles.CountInfoBlock} style={{backgroundColor: props?.color}}>
                <div className={styles.contNew}><p>{props?.name}: {contNew}</p></div>
            </div>    
        </div> 
    );
}

export default CountInfoBlock;