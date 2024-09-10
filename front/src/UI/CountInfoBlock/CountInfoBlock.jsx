import React, { useContext, useEffect, useState } from 'react';
import styles from "./CountInfoBlock.module.scss";
import DataContext from '../../context';



function CountInfoBlock(props) {
    const [contNew, setContNew] = useState(0);
    const { context } = useContext(DataContext);

      useEffect(() => {
        if(props?.keys !== "count"){
            let newCount = 0;
            props?.dataCount.forEach((el) => {
                if (el.status === props?.value) {
                    newCount++;
                }
            });
        
            setContNew(newCount);
        }else if(props?.keys === "count"){
            setContNew(props?.dataCount?.length);
        }else if(props?.keys === "checkPhoto"){
            let newCount = 0;
            props?.dataCount.forEach((el) => {
                if (el.checkPhoto !== null) {
                    newCount++;
                }
            });
            setContNew(newCount);
        }
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