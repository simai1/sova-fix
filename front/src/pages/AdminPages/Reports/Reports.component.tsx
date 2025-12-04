import { Flex, Form, List, Popover } from 'antd';
import { FC } from 'react';

import AdditionalParametrs from './AdditionalParametrs/AdditionalParametrs';
import { INDICATOR_LIST, PARAMETRS_LIST } from './constants';
import PopoverParametr from './PopoverParametr/PopoverParametr';
import ReportListElement from './ReportListElement/ReportListElement';
import ReportWorkZoneComponent from './ReportWorkZone/ReportWorkZone.component';
import styles from './styles.module.scss';
import { FilterDataI, ReportsComponentProps } from './types';
import Header from '../../../components/Header/Header.jsx';

const ReportsComponent: FC<ReportsComponentProps> = ({
  parametrsForm,
  indicatorsForm,
  isEmptyReport,
  isLoadingTableData,
  handleSetFilterDataValues,
  isDisabledIndicators,
  handleReloadTableData,
  handleResetFilters,
  onValuesParametersChange,
  onValuesIndicatorsChange,
}) => {
  return (
    <Flex className={styles.container} vertical align="center">
      <Header />
      <Flex gap={5} className={styles.content} vertical align="center">
        <Flex className={styles.additionalParametrs}>
          <AdditionalParametrs
            handleReloadTableData={handleReloadTableData}
            handleResetFilters={handleResetFilters}
          />
        </Flex>
        <div className={styles.workZoneContainer}>
          <Flex className={styles.column} vertical>
            <p className={styles.columnTitle}>Параметры</p>
            <Form form={parametrsForm} onValuesChange={onValuesParametersChange}>
              <List
                dataSource={PARAMETRS_LIST}
                className={styles.listContainer}
                renderItem={(item) => (
                  <Popover
                    arrow={false}
                    trigger="contextMenu"
                    content={
                      <PopoverParametr
                        handleSetFilterDataValues={handleSetFilterDataValues}
                        parametr={item.name as keyof FilterDataI}
                      />
                    }
                    placement="bottom"
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                  >
                    <div className={styles.parametrsContainer}>
                      <ReportListElement label={item.label} name={item.name} />
                    </div>
                  </Popover>
                )}
              />
            </Form>
          </Flex>
          <ReportWorkZoneComponent
            isLoadingTableData={isLoadingTableData}
            isEmptyReport={isEmptyReport}
          />
          <Flex className={styles.column} vertical>
            <p className={styles.columnTitle}>Показатели</p>
            <Form form={indicatorsForm} onValuesChange={onValuesIndicatorsChange}>
              <List
                dataSource={INDICATOR_LIST}
                className={styles.listContainer}
                renderItem={(item) => (
                  <ReportListElement
                    label={item.label}
                    name={item.name}
                    disabled={isDisabledIndicators(item.name)}
                  />
                )}
              />
            </Form>
          </Flex>
        </div>
      </Flex>
    </Flex>
  );
};

export default ReportsComponent;
