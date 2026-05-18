import React, { useContext, useEffect, useState } from "react";
import styles from "./EquipmentContextMenu.module.css";
import DataContext from "../../context";
import PopUpContainer from "../PopUpContainer/PopUpContainer";

function EquipmentContextMenu(props) {
    const [cordX, setCordX] = useState(props?.X);
    const [cordY, setCordY] = useState(props?.Y);
    const { context } = useContext(DataContext);

    useEffect(() => {
        convertCoord(props?.X, props?.Y);
    }, [props.X, props.Y]);

    const convertCoord = (X, Y) => {
        const menuWidth = 150;
        const menuHeight = 35;
        const SizeX = window.innerWidth;
        const SizeY = window.innerHeight;

        let newX = X;
        let newY = Y;

        if (SizeX - X < menuWidth) {
            newX = X - menuWidth;
        }

        if (SizeY - Y < menuHeight) {
            newY = Y - menuHeight;
        }

        setCordX(newX);
        setCordY(newY);
    };

    const handleOpenCopyModal = () => {
        if (context.selectRowDirectory !== null) {
            context.setPopUp("PopUpToCopy");
        } else {
            context.setPopupErrorText("Сначала выберите оборудование!");
            context.setPopUp("PopUpError");
        }

        handleCloseContext()
    };

    const handleCloseContext = () => {
        props.setContextMenuOpen(false)
    }

    return (
        <div
            className={styles.EquipmentContextMenu}
            style={{ top: cordY, left: cordX }}
        >
            <button onClick={() => handleOpenCopyModal()}>Создать копию</button>
        </div>
    );
}

export default EquipmentContextMenu;
