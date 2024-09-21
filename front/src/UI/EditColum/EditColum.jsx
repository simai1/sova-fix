import React, { useEffect, useState, useRef } from 'react';
import styles from './EditColum.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { onCheckState, resetAllColumns } from '../../store/editColumTable/editColumTable.slice';

function EditColum() {
    const [openList, setOpenList] = useState(false);
    const store = useSelector(state => state.editColumTableSlice);
    const dispatch = useDispatch();
    const ref = useRef(null); // Create a ref for the component

    useEffect(() => {
        console.log("store", store.AllCheckbox);

        // Function to handle clicks outside the component
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpenList(false); // Close the list if clicked outside
            }
        };

        // Add event listener for clicks
        document.addEventListener('mousedown', handleClickOutside);
        
        // Cleanup the event listener on component unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [store]);
    console.log("store", store.AllCheckbox);
    // const
    // const checkFilterImg = () => {
    //     if(store.ActiveColumTable.map(el => el.isActive !== false)) {
    //         return true
    //     }else{
    //         return false
    //     }
    // }
    // useEffect(() => {
    //     checkFilterImg();
    // },[store.ActiveColumTable]);
    return ( 
        <div className={styles.EditColum} ref={ref}> {/* Attach ref to the main div */}
            <div>
                <button onClick={() => setOpenList(!openList)} style={{ borderRadius: !openList ? "8px" : "8px 8px 0 0" }}>
                    {!store.AllCheckbox && <img src='./img/filter.svg' alt=''/>}
                    Редактор полей
                    <img 
                        className={styles.EditColumImg}
                        style={{ transform: !openList ? "rotate(0deg)" : "rotate(180deg)" }} 
                        src='./img/arrow_bottom.svg' 
                        alt="Arrow Icon"
                    />
                   
                </button>
                {
                    openList && 
                    <div className={styles.Overlay}>
                        <ul>
                            <li>
                                <input type='checkbox' checked={store.AllCheckbox} readOnly onClick={() => dispatch(resetAllColumns())}/>
                                <span>Все</span>
                            </li>
                            {store.ActiveColumTable.map((el, index) => (
                                <li key={index}>
                                    <input type='checkbox' checked={el.isActive} readOnly onClick={() => dispatch(onCheckState({key: el.key, isActive: el.isActive}))}/>
                                    <span>{el.value}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                }
            </div>
        </div>
    );
}

export default EditColum;
