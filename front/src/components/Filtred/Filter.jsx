import React from "react";
import styles from "./Filter.module.scss";
import DataContext from "../../context";

function Filter(props) {
  const { context } = React.useContext(DataContext);

  return (
    <>
      {/* {context.dataFilter.length > 0 ? (
        <div className={styles.mainFilter}> 
        {context.dataFilter
                .filter((el, index, self) => 
                    index === self.findIndex((t) => (
                    t.name === el.name
                    ))
                )
                .map((el, index) => {
                    return (
                    <div key={index} className={styles.Filter}>
                        <p>{el.name}</p>
                    </div>
                    );
                })
                }

        </div>
      ) : (
        <div className={styles.mainFilter}>
          <p>Нет данных</p>
        </div>
      )} */}
    </>
  );
}

export default Filter;
