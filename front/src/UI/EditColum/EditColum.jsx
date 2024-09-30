import React, { useEffect, useState, useRef } from 'react';
import styles from './EditColum.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { onCheckState, resetAllColumns } from '../../store/editColumTable/editColumTable.slice';

function EditColum() {
    const [openList, setOpenList] = useState(false);
    const store = useSelector(state => state.editColumTableSlice);
    const dispatch = useDispatch();
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpenList(false); 
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [store]);
   

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
                            {store.ActiveColumTable.slice(3).map((el, index) => (
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
