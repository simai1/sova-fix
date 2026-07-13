import { FC, useContext, useEffect, useState } from 'react';

import { TAddRequestModalProps } from './types';
import { useCreateRequestMutation } from '../../API/rtkQuery/lk.api';
import { useGetAllUnitsQuery, useLazyGetAllObjectsQuery } from '../../API/rtkQuery/requests.api';
import { IS_PHOTO_REQUIRED } from '../../constants/settings.constants';
import DataContext from '../../context';
import { getErrorMessage } from '../../utils/getErrorMessage';
import LkSelect, { LkSelectOption } from '../Lk/LkSelect';
import PhotoUploader from '../Lk/PhotoUploader';
import { showToast } from '../Lk/toastBus';

import '../../styles/ui/index.scss';

const MIN_DESCRIPTION_LEN = 10;
const MAX_FILES = 10;

const AddRequestModal: FC<TAddRequestModalProps> = ({ handleClose }) => {
  const { context } = useContext(DataContext);
  const { urgencyList, directoryCategories, settingsList } = context;

  const isPhotoRequired = settingsList?.find((s) => s.setting === IS_PHOTO_REQUIRED)?.value ?? true;

  const [unitId, setUnitId] = useState('');
  const [objectId, setObjectId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [urgencyId, setUrgencyId] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: units } = useGetAllUnitsQuery();
  const [getObjects, { data: objects, isFetching: objectsLoading }] = useLazyGetAllObjectsQuery();
  const [createRequest, { isLoading: submitting }] = useCreateRequestMutation();

  useEffect(() => {
    const only = units?.length === 1 ? units[0] : undefined;
    if (only) setUnitId(only.id);
  }, [units]);

  useEffect(() => {
    const only = objects?.length === 1 ? objects[0] : undefined;
    if (only) setObjectId(only.id);
  }, [objects]);

  useEffect(() => {
    setObjectId('');
    if (unitId) getObjects({ scope: 'requests', unitId });
  }, [unitId, getObjects]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !submitting) handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleClose, submitting]);

  const unitOptions: LkSelectOption[] = (units ?? []).map((u) => ({ value: u.id, label: u.name }));
  const objectOptions: LkSelectOption[] = (objects ?? []).map((o) => ({
    value: o.id,
    label: o.name,
  }));
  const categoryOptions: LkSelectOption[] = (directoryCategories ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));
  const urgencyOptions: LkSelectOption[] = (urgencyList ?? []).map((u) => ({
    value: u.id,
    label: u.name,
    color: u.color,
  }));

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!unitId) next.unitId = 'Выберите подразделение';
    if (!objectId) next.objectId = 'Выберите объект';
    if (description.trim().length < MIN_DESCRIPTION_LEN) {
      next.description = `Опишите проблему (минимум ${MIN_DESCRIPTION_LEN} символов)`;
    }
    if (!urgencyId) next.urgencyId = 'Выберите срочность';
    if (isPhotoRequired && files.length === 0) next.files = 'Добавьте хотя бы одно фото';
    if (files.length > MAX_FILES) next.files = `Не более ${MAX_FILES} фото`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (): Promise<void> => {
    if (submitting) return;
    if (!validate()) return;

    const fd = new FormData();
    fd.append('objectId', objectId);
    fd.append('problemDescription', description.trim());
    fd.append('urgencyId', urgencyId);
    if (categoryId) fd.append('directoryCategoryId', categoryId);
    files.forEach((f) => fd.append('files', f));

    try {
      await createRequest(fd).unwrap();
      showToast('success', 'Заявка создана');
      handleClose();
      context.UpdateTableReguest();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  return (
    <div
      className="ui-modal__overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) handleClose();
      }}
    >
      <div
        className="ui-modal__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-request-title"
      >
        <h2 className="ui-modal__title" id="add-request-title">
          Создание заявки
        </h2>

        <div className="ui-field">
          <label className="ui-field__label" htmlFor="add-request-unit">
            Подразделение
          </label>
          <LkSelect
            id="add-request-unit"
            value={unitId}
            onChange={setUnitId}
            options={unitOptions}
            placeholder="Выберите подразделение"
          />
          {errors.unitId ? <div className="ui-field__error">{errors.unitId}</div> : null}
        </div>

        <div className="ui-field">
          <label className="ui-field__label" htmlFor="add-request-object">
            Объект
          </label>
          <LkSelect
            id="add-request-object"
            value={objectId}
            onChange={setObjectId}
            options={objectOptions}
            placeholder={objectsLoading ? 'Загрузка...' : 'Выберите объект'}
            disabled={!unitId || objectsLoading}
          />
          {errors.objectId ? <div className="ui-field__error">{errors.objectId}</div> : null}
        </div>

        <div className="ui-field">
          <label className="ui-field__label" htmlFor="add-request-category">
            Категория
          </label>
          <LkSelect
            id="add-request-category"
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions}
            placeholder="Выберите категорию"
          />
        </div>

        <div className="ui-field">
          <label className="ui-field__label" htmlFor="add-request-desc">
            Описание проблемы
          </label>
          <textarea
            id="add-request-desc"
            className="ui-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опишите, что сломалось"
          />
          {errors.description ? <div className="ui-field__error">{errors.description}</div> : null}
        </div>

        <div className="ui-field">
          <label className="ui-field__label" htmlFor="add-request-urgency">
            Срочность
          </label>
          <LkSelect
            id="add-request-urgency"
            value={urgencyId}
            onChange={setUrgencyId}
            options={urgencyOptions}
            placeholder="Выберите срочность"
          />
          {errors.urgencyId ? <div className="ui-field__error">{errors.urgencyId}</div> : null}
        </div>

        <div className="ui-field">
          <label className="ui-field__label">
            {isPhotoRequired ? 'Фотографии (1–10)' : 'Фотографии (по желанию, до 10)'}
          </label>
          <PhotoUploader
            files={files}
            onChange={setFiles}
            maxFiles={MAX_FILES}
            hint="Снимите проблему с разных ракурсов. Форматы: JPG/JPEG или PNG, до 10 МБ."
          />
          {errors.files ? <div className="ui-field__error">{errors.files}</div> : null}
        </div>

        <div className="ui-modal__actions">
          <button
            type="button"
            className="ui-button ui-button--ghost ui-button--block"
            onClick={handleClose}
            disabled={submitting}
          >
            Отмена
          </button>
          <button
            type="button"
            className="ui-button ui-button--accent ui-button--block"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRequestModal;
