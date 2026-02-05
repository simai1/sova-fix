import React, { useEffect, useState } from 'react'
import {
  GetAllTgUsers,
  GetObjectsAll,
  GetTgUserObjects,
  CreateTgUserObject,
  DeleteTgUserObject,
} from '../../../../API/API'
import styles from './TgUserObjects.module.scss'
import { useSearchParams } from 'react-router-dom'

export default function TgUserObjects() {
  const [tgUsers, setTgUsers] = useState([])
  const [objects, setObjects] = useState([])
  const [userObjects, setUserObjects] = useState({})
  const [selectedTgUser, setSelectedTgUser] = useState(null)
  const [selectedObject, setSelectedObject] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('userId')

  const showNotification = (type, title, message) => {
    setNotification({ type, title, message })

    setTimeout(() => {
      setNotification(null)
    }, 5000)
  }

  const hideNotification = () => {
    setNotification(null)
  }

  const renderNotification = () => {
    if (!notification) return null

    return (
      <div className={`${styles.notification} ${styles[notification.type]}`}>
        <button className={styles['notification-close']} onClick={hideNotification}>
          ×
        </button>
        <h4 className={styles['notification-title']}>{notification.title}</h4>
        <p className={styles['notification-message']}>{notification.message}</p>
      </div>
    )
  }

  useEffect(() => {
    fetchTgUsers()
    fetchObjects()
  }, [])

  useEffect(() => {
    if (userId && tgUsers.length > 0) {
      const tgUser = tgUsers.find((user) => user.userId === userId)
      if (tgUser) {
        handleSelectTgUser(tgUser)
      } else {
        const tgUserById = tgUsers.find((user) => user.id === userId)
        if (tgUserById) {
          handleSelectTgUser(tgUserById)
        }
      }
    }
  }, [userId, tgUsers])

  const fetchTgUsers = async () => {
    try {
      const response = await GetAllTgUsers()
      if (response && response.data) {
        setTgUsers(response.data)
      }
    } catch (error) {
      console.error('Error fetching TgUsers:', error)
    }
  }

  const fetchObjects = async () => {
    try {
      const response = await GetObjectsAll()
      if (response && response.data) {
        setObjects(response.data)
      }
    } catch (error) {
      console.error('Error fetching Objects:', error)
    }
  }
  const fetchUserObjects = async (tgUserId) => {
    try {
      setLoading(true)
      const response = await GetTgUserObjects(tgUserId)
      if (response && response.data) {
        const objectsArray = response.data.objects || []

        setUserObjects((prevObjects) => ({
          ...prevObjects,
          [tgUserId]: objectsArray,
        }))
      }
    } catch (error) {
      console.error('Error fetching user objects:', error)
      showNotification('error', 'Ошибка', 'Не удалось загрузить объекты пользователя')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTgUser = (tgUser) => {
    setSelectedTgUser(tgUser)
    fetchUserObjects(tgUser.id)
  }

  const handleSelectObject = (object) => {
    setSelectedObject(object)
  }

  const createRelation = async () => {
    if (!selectedTgUser || !selectedObject) {
      showNotification('error', 'Ошибка', 'Пожалуйста, выберите пользователя и объект')
      return
    }

    try {
      setLoading(true)
      const response = await CreateTgUserObject(selectedTgUser.id, selectedObject.id)

      if (response && response.data) {
        if (response.data.success === false) {
          showNotification('error', 'Ошибка', response.data.message || 'Ошибка при создании связи')
          return
        }

        if (response.data.objects) {
          setUserObjects((prevState) => ({
            ...prevState,
            [selectedTgUser.id]: response.data.objects,
          }))

          showNotification('success', 'Успех', response.data.message || 'Связь успешно создана')
        } else {
          await fetchUserObjects(selectedTgUser.id)

          showNotification('success', 'Успех', 'Объект успешно добавлен пользователю')
        }
      } else {
        console.error('No response data received')
        showNotification('error', 'Ошибка', 'Ошибка при создании связи: нет данных в ответе')

        await fetchUserObjects(selectedTgUser.id)
      }
    } catch (error) {
      console.error('Error creating relation:', error)

      let errorMessage = 'Ошибка при создании связи'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }

      showNotification('error', 'Ошибка', errorMessage)

      await fetchUserObjects(selectedTgUser.id)
    } finally {
      setLoading(false)
    }
  }

  const deleteRelation = async (tgUserId, objectId) => {
    try {
      setLoading(true)
      const response = await DeleteTgUserObject(tgUserId, objectId)

      if (response && response.data) {
        if (response.data.objects) {
          setUserObjects((prevState) => ({
            ...prevState,
            [tgUserId]: response.data.objects,
          }))

          showNotification('success', 'Успех', response.data.message || 'Связь успешно удалена')
        } else {
          await fetchUserObjects(tgUserId)
          showNotification('success', 'Успех', 'Объект успешно удален у пользователя')
        }
      } else {
        await fetchUserObjects(tgUserId)
        showNotification('success', 'Успех', 'Связь удалена')
      }
    } catch (error) {
      console.error('Error deleting relation:', error)

      let errorMessage = 'Ошибка при удалении связи'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }

      showNotification('error', 'Ошибка', errorMessage)

      fetchUserObjects(tgUserId)
    } finally {
      setLoading(false)
    }
  }

  const renderUserObjects = () => {
    if (!selectedTgUser) return null

    const tgUserId = selectedTgUser.id
    const userObjectsList = userObjects[tgUserId] || []

    if (loading) return <div className={styles.loading}>Загрузка...</div>

    if (!userObjectsList || userObjectsList.length === 0) {
      return <div className={styles.noObjects}>У пользователя нет доступных объектов</div>
    }

    const filteredObjects = userObjectsList.filter((obj) => obj && obj.id && obj.name)

    if (filteredObjects.length === 0) {
      return <div className={styles.noObjects}>У пользователя нет доступных объектов</div>
    }

    return (
      <div className={styles.userObjectsList}>
        {selectedTgUser.role === 'ADMIN' ? (
          <div className={styles.adminMessage}>Пользователю доступы все объекты</div>
        ) : (
          <>
            <h3>Объекты пользователя {selectedTgUser.name}</h3>
            <p>Всего объектов: {filteredObjects.length}</p>

            <div className={styles.objectsTable}>
              <div className={styles.tableHead}>
                <div className={styles.tableHeaderCell}>Наименование объекта</div>
                <div className={styles.tableHeaderCell}>Действия</div>
              </div>
              <div className={styles.tableBody}>
                {filteredObjects.map((obj) => (
                  <div key={obj.id} className={styles.tableRow}>
                    <div className={styles.tableCell}>{obj.name}</div>
                    <div className={styles.tableCell}>
                      <button
                        className={styles.deleteButton}
                        onClick={() => deleteRelation(tgUserId, obj.id)}
                        disabled={loading}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={styles.tgUserObjectsContainer}>
      <h2>Доступ к объектам</h2>

      <div className={styles.tgUserObjectsContent}>
        <div className={styles.selectionSection}>
          <div className={styles.tgUsersSelection}>
            <h3>Пользователи</h3>
            <div className={styles.listContainer}>
              {tgUsers.map((user) => (
                <div
                  key={user.id}
                  className={`${styles.listItem} ${selectedTgUser?.id === user.id ? styles.selected : ''}`}
                  onClick={() => handleSelectTgUser(user)}
                >
                  <span>{user.name}</span>
                  <span className={styles.itemInfo}>Роль: {user.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.objectsSelection}>
            <h3>Объекты</h3>
            <div className={styles.listContainer}>
              {objects.map((object) => (
                <div
                  key={object.id}
                  className={`${styles.listItem} ${selectedObject?.id === object.id ? styles.selected : ''}`}
                  onClick={() => handleSelectObject(object)}
                >
                  <span>{object.name}</span>
                  <span className={styles.itemInfo}>Город: {object.city}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.actionSection}>
          <button
            className={styles.createRelationButton}
            onClick={createRelation}
            disabled={!selectedTgUser || !selectedObject || loading || selectedTgUser.role === 'ADMIN'}
          >
            {loading ? 'Загрузка...' : 'Добавить объект пользователю'}
          </button>

          {renderUserObjects()}
        </div>
      </div>

      {renderNotification()}
    </div>
  )
}
