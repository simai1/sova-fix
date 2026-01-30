import React, { useEffect, useState } from 'react'
import styles from './FunctionTableTop.module.scss'
import Input from '../../UI/Input/Input'
import DataContext from '../../context'
import { useDispatch, useSelector } from 'react-redux'
import CountInfoBlock from '../../UI/CountInfoBlock/CountInfoBlock'
import EditColum from '../../UI/EditColum/EditColum'
import { filterRequestsWithoutCopiedId, generateAndDownloadExcel } from '../../function/function'
import { tableList } from '../Table/Data'
import {
  dropFilters,
  resetFilters,
  setChecked,
  setFilters,
} from '../../store/samplePoints/samplePoits'
import { notification } from 'antd'
import RequestEditModalContainer from '../RequestEditModal/RequestEditModal.container'

function FunctionTableTop(props) {
  const { context } = React.useContext(DataContext)
  const [dataTable, setDataTable] = useState([])
  const applicationStatuses = ['В работе', 'Выполнена', 'Новая заявка']
  const [isRequestEditModalOpen, setIsRequestEditModalOpen] = useState(false)

  const [apiNotification, contextHolder] = notification.useNotification()
  //!удаление заявки
  const deleteRequestFunc = () => {
    if (context.moreSelect.length === 1) {
      context.setPopUp('СonfirmDelete')
      return
    }
    apiNotification.warning({ title: 'Внимание!', message: 'Сначала выберите заявку!' })
  }

  const handleEditAppoint = () => {
    if (context.selectedTr != null) {
      setIsRequestEditModalOpen(true)
      return
    }

    apiNotification.warning({ title: 'Внимание!', message: 'Сначала выберите заявку!' })
  }

  const handleCloseRequestEditModal = () => {
    setIsRequestEditModalOpen(false)
  }

  const store = useSelector((state) => state.isSamplePoints['table9'].isChecked)
  useEffect(() => {
    if (context?.textSearchTableData || store.length !== 0) {
      setDataTable(context?.dataTableHomePage)
    } else {
      setDataTable(filterBasickData(context?.dataApointment, store))
    }
  }, [store, context?.dataApointment, context?.textSearchTableData, context?.dataTableHomePage])

  const dispatch = useDispatch()

  const goBackCurd = () => {
    context.setSelectPage('Card')
    context.setSelectContractor('')
    context.setextSearchTableData('')
    context.setSelectedTr(null)
    context.settableHeader(tableList)
    context.setSelectedTable('Card')
  }

  //! функция фильтрации
  function filterBasickData(data, chekeds) {
    let tb = [...data]
    let mass = []
    tb.filter((el) => {
      if (chekeds.find((it) => el[it.itemKey] === it.value)) {
        return
      } else {
        mass.push(el)
      }
    })
    return mass
  }
  const DropFilter = () => {
    context.setTotalCount(0)
    context.setOfset(0)
    context.setLoader(false)
    context.setDataTableHomePage([])
    context.UpdateForse()
    dispatch(resetFilters({ tableName: 'table9' }))
    dispatch(dropFilters({ tableName: 'table9' }))
  }

  // //!При обновлении обновляет только 1 запись
  // const UpdateRequest = (updatedRequest) => {
  //   const updatedDataTable = context.dataTableHomePage.map((item) =>
  //     item.id === updatedRequest.id ? updatedRequest : item
  //   );
  //   context.setDataTableHomePage(funFixEducator(updatedDataTable));
  // };

  // Фильтр по кнопкам с количеством заявок по статусу
  const filterTableApplication = async (status) => {
    const filterStatuses = applicationStatuses.filter((st) => st !== status)

    dispatch(
      setFilters({
        tableName: 'table9',
        filter: status,
        key: 'status',
      }),
    )

    const checkedValues = filterStatuses.map((stat) => ({
      itemKey: 'status',
      value: stat,
    }))

    dispatch(
      setChecked({
        tableName: 'table9',
        checked: checkedValues,
      }),
    )
  }
  return (
    <>
      {contextHolder}
      <div className={styles.FunctionTableTop}>
        <div className={styles.container}>
          <div className={styles.topList}>
            <div className={styles.searchForTable}>
              {context.selectedTable === 'Заявки' && (
                <>
                  <Input
                    placeholder={'Поиск...'}
                    settextSearchTableData={context.setextSearchTableData}
                  />
                  <img src="./img/Search_light.png" />
                  {context.selectedTable === 'Заявки' && context.selectPage === 'Main' && (
                    <div
                      className={styles.dropFilter}
                      onClick={() => DropFilter()}
                      title="нажмите для сброса фильтров"
                    >
                      <img src="./img/ClearFilter.svg" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {context.selectedTable === 'Заявки' && context.selectPage === 'Main' ? (
            <div className={styles.HeadMenuMain}>
              <EditColum />
              {JSON.parse(localStorage.getItem('userData'))?.user?.role !== 'OBSERVER' && (
                <>
                  <button
                    onClick={() => handleEditAppoint()}
                    disabled={context.moreSelect.length > 1}
                    style={{
                      opacity: context.moreSelect.length > 1 ? '0.5' : '1',
                      cursor: context.moreSelect.length > 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <img src="./img/Edit.svg" alt="View" />
                    Редактировать заявку
                  </button>
                  <button
                    onClick={() => deleteRequestFunc()}
                    disabled={context.moreSelect.length > 1}
                    style={{
                      opacity: context.moreSelect.length > 1 ? '0.5' : '1',
                      cursor: context.moreSelect.length > 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <img src="./img/Trash.svg" alt="View" />
                    Удалить заявку
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  const dataToExport =
                    context.moreSelect.length > 0
                      ? context.dataTableHomePage.filter((item) =>
                          context.moreSelect.includes(item.id),
                        )
                      : context.dataTableHomePage
                  generateAndDownloadExcel(dataToExport, 'Заявки')
                }}
              >
                Экспорт
              </button>
            </div>
          ) : sessionStorage.getItem('userData').user?.id === 1 ? (
            <div className={styles.ButtonBack}>
              <div>
                <button onClick={() => goBackCurd()}>Назад</button>
              </div>
              <div>
                <button
                  onClick={() =>
                    generateAndDownloadExcel(context?.filteredTableData, 'Маршрутный_лист')
                  }
                >
                  Экспорт
                </button>
              </div>
            </div>
          ) : (
            <></>
          )}
        </div>
        {context.selectedTable === 'Заявки' && context.selectPage === 'Main' && (
          <div className={styles.countInfoContainer}>
            <div className={styles.countInfo}>
              <button
                className={styles.countInfoButton}
                onClick={() => filterTableApplication('Новая заявка')}
              >
                <CountInfoBlock
                  dataCount={filterRequestsWithoutCopiedId(dataTable)}
                  keys="status"
                  value="1"
                  color="#d69a81"
                  name="Новых"
                />
              </button>
              <button
                className={styles.countInfoButton}
                onClick={() => filterTableApplication('В работе')}
              >
                <CountInfoBlock
                  dataCount={filterRequestsWithoutCopiedId(dataTable)}
                  keys="status"
                  value="2"
                  color="#ffe78f"
                  name="В работе"
                />
              </button>
              <button
                className={styles.countInfoButton}
                onClick={() => filterTableApplication('Выполнена')}
              >
                <CountInfoBlock
                  dataCount={filterRequestsWithoutCopiedId(dataTable)}
                  keys="status"
                  value="3"
                  color="#C5E384"
                  name="Выполнены"
                />
              </button>
            </div>
            <div className={styles.countSwitch}>
              <div className={styles.Switch}>
                <button className={styles.switchOne}>
                  <p
                    className={styles.active}
                    onClick={() => context.setEnabledTo(!context.enabledTo)}
                  >
                    {context.enabledTo ? 'Автозаявки' : 'Заявки'}
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {isRequestEditModalOpen && (
        <RequestEditModalContainer
          open={isRequestEditModalOpen}
          handleCloseModal={handleCloseRequestEditModal}
        />
      )}
    </>
  )
}

export default FunctionTableTop
