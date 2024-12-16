import React, { useEffect, useState, useContext } from "react";
import styles from "./PageCardContractors.module.scss";
import DataContext from "../../../context";
import ContractorCard from "../../../UI/ContractorCard/ContractorCard";
import Table from "../../../components/Table/Table";
import FunctionTableTop from "../../../components/FunctionTableTop/FunctionTableTop";

function PageCardContractors() {
  const { context } = useContext(DataContext);

  const [namePodr, setNamePodr] = useState([]);
  const [namePodnoSorted, setNamePodnoSorted] = useState([]);
  const [contId, setContId] = useState("");
  useEffect(() => {
    const matchingNames = context?.dataApointment.filter(appointment => context?.dataContractors.some(contractor => contractor?.id === appointment.contractor?.id && appointment?.urgency === "Маршрут" && appointment?.status !== 4 && appointment?.status !== 3 )).map(appointment => appointment.contractor?.name);
   
    const uniqueMatchingNames = [...new Set(matchingNames)];
    setNamePodr(uniqueMatchingNames);
    setNamePodnoSorted(matchingNames);
  }, [context?.dataApointment, context?.dataContractors]);

  useEffect(() => {
    setContId(context.selectContructor)
  }, [context.selectContructor]);

  return (
    <>
      {contId === "" || contId === undefined ? (
        <div className={styles.PageCardContractors}>
          <div className={styles.container}>
            { namePodr.length === 0 &&
            <div className={styles.ConstructorTitle}>
              <h3>Маршруты отсутствуют</h3>
            </div>
            }
            <div className={styles.Constructor}>
              {namePodr.map((el, index) => {
                return (
                  <div key={index}>
                    <ContractorCard name={el} namePodnoSorted={namePodnoSorted} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          <FunctionTableTop />
          <div className={styles.Table}>
            <Table />
          </div>
        </>
      )}
    </>
  );
}

export default PageCardContractors;
