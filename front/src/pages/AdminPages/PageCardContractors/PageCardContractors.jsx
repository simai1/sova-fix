import React, { useEffect, useState }  from "react";
import styles from "./PageCardContractors.module.scss";
import DataContext from "../../../context";
import ContractorCard from "../../../UI/ContractorCard/ContractorCard";
import Table from "../../../components/Table/Table";
import FunctionTableTop from "../../../components/FunctionTableTop/FunctionTableTop";

function PageCardContractors() {
  const { context } = React.useContext(DataContext);

  const [namePodr, setNamePodr] = useState([]);
  const [namePodnoSorted, setNamePodnoSorted] = useState([]);
  useEffect(()=>{
    const matchingNames = context?.dataApointment.filter(appointment => context?.dataContractors.some(contractor => contractor?.id === appointment.contractor?.id && appointment?.urgency === "Маршрут")).map(appointment => appointment.contractor?.name);
    const unicleMatchingNames = [...new Set(matchingNames)]
    setNamePodr(unicleMatchingNames);
    setNamePodnoSorted(matchingNames)
},[])
  return (
    <>
    {context?.Dataitinerary.length <=0 ? 
      <>
       <div className={styles.PageCardContractors}>
        <div className={styles.container}>
                <div className={styles.ConstructorTitle}>
                    <h3>Выберите исполнителя</h3>
                </div>
                <div className={styles.Constructor}>
                    {namePodr.map((el , index)=>{
                        return  <div key={index}>
                                    <ContractorCard name={el} namePodnoSorted={namePodnoSorted}/>
                                </div>
                    })}
                </div>
            </div>
        </div>
      </>
       :
       <>
            <FunctionTableTop />
            <div className={styles.Table}>
            <Table />
            </div>
        </>
    }
    </>
  );
}

export default PageCardContractors;
