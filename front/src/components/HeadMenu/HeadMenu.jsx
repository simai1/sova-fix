import React, { useContext, useEffect, useState } from "react";
import styles from "./HeadMenu.module.scss";
import { Link } from "react-router-dom";
import DataContext from "../../context";
function HeadMenu({ state }) {
  const { context } = useContext(DataContext);

  return (
    <>
      {context.selectedTable === "Заказы" && (
        <div className={styles.HeadMenu}>
          <button>
            <img src="./img/add.svg" alt="View" />
            Создать заказ
          </button>
            <Link to="./EditOrder">
              <button>
                <img src="./img/Edit.png" alt="View" />
                Редактировать
              </button>
            </Link>
          <button >
            <img src="./img/Trash.png" alt="View" />
            Удалить заказ
          </button>
        </div>
      )}
      </>
  );
}

export default HeadMenu;
