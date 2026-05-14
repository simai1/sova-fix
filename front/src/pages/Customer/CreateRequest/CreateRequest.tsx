import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  useCreateRequestMutation,
  useGetMeQuery,
  useGetMyObjectsQuery,
  useGetSettingByNameQuery,
  useGetUrgenciesQuery,
} from '@/API/rtkQuery/lk.api';
import LkEmpty from '@/components/Lk/LkEmpty';
import LkSelect, { LkSelectOption } from '@/components/Lk/LkSelect';
import LkSpinner from '@/components/Lk/LkSpinner';
import PhotoUploader from '@/components/Lk/PhotoUploader';
import { showToast } from '@/components/Lk/toastBus';
import { IS_PHOTO_REQUIRED } from '@/constants/settings.constants';
import { getErrorMessage } from '@/utils/getErrorMessage';

const MIN_DESCRIPTION_LEN = 10;

const CustomerCreateRequest = (): JSX.Element => {
  const navigate = useNavigate();
  const { data: me, isLoading: meLoading } = useGetMeQuery();
  const { data: urgencies = [], isLoading: urgLoading } = useGetUrgenciesQuery();
  const { data: myObjects = [], isLoading: objLoading } = useGetMyObjectsQuery();
  // Если сеттинг ещё не загрузился или эндпоинт упал — считаем фото обязательным
  // (это безопасный дефолт, совпадающий с прежним поведением и с seedSettings).
  const { data: photoSetting } = useGetSettingByNameQuery(IS_PHOTO_REQUIRED);
  const isPhotoRequired = photoSetting?.value ?? true;
  const [createRequest, { isLoading: creating }] = useCreateRequestMutation();

  const [objectId, setObjectId] = useState('');
  const [description, setDescription] = useState('');
  const [urgencyId, setUrgencyId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (meLoading || urgLoading || objLoading) return <LkSpinner />;
  if (!me) return <LkEmpty text="Не удалось загрузить профиль" />;

  if (myObjects.length === 0) {
    return <LkEmpty text="У вас нет назначенных объектов. Обратитесь к менеджеру." />;
  }

  const objectOptions: LkSelectOption[] = myObjects.map((o) => ({ value: o.id, label: o.name }));
  const urgencyOptions: LkSelectOption[] = urgencies.map((u) => ({ value: u.id, label: u.name }));

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!objectId) next.objectId = 'Выберите объект';
    if (description.trim().length < MIN_DESCRIPTION_LEN) {
      next.description = `Опишите проблему (минимум ${MIN_DESCRIPTION_LEN} символов)`;
    }
    if (!urgencyId) next.urgencyId = 'Выберите срочность';
    if (isPhotoRequired && files.length === 0) next.files = 'Добавьте хотя бы одно фото';
    if (files.length > 10) next.files = 'Не более 10 фото';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;
    const fd = new FormData();
    fd.append('objectId', objectId);
    fd.append('problemDescription', description.trim());
    fd.append('urgencyId', urgencyId);
    files.forEach((f) => fd.append('files', f));

    try {
      const created = await createRequest(fd).unwrap();
      showToast('success', 'Заявка создана');
      if (created?.id) {
        navigate(`/customer/requests/${created.id}`);
      } else {
        navigate('/customer/requests');
      }
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  return (
    <form className="lk-card" onSubmit={handleSubmit}>
      <h2 className="lk-card__title">Новая заявка</h2>

      <div className="lk-row">
        <div className="lk-col-12 lk-col-ml-6">
          <div className="lk-field">
            <label className="lk-field__label" htmlFor="lk-create-object">
              Объект
            </label>
            <LkSelect
              id="lk-create-object"
              value={objectId}
              onChange={setObjectId}
              options={objectOptions}
              placeholder="Выберите объект"
            />
            {errors.objectId ? <div className="lk-field__error">{errors.objectId}</div> : null}
          </div>
        </div>

        <div className="lk-col-12 lk-col-ml-6">
          <div className="lk-field">
            <label className="lk-field__label" htmlFor="lk-create-urgency">
              Срочность
            </label>
            <LkSelect
              id="lk-create-urgency"
              value={urgencyId}
              onChange={setUrgencyId}
              options={urgencyOptions}
              placeholder="Выберите срочность"
            />
            {errors.urgencyId ? <div className="lk-field__error">{errors.urgencyId}</div> : null}
          </div>
        </div>
      </div>

      <div className="lk-field">
        <label className="lk-field__label" htmlFor="lk-create-desc">
          Описание проблемы
        </label>
        <textarea
          id="lk-create-desc"
          className="lk-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Опишите, что сломалось"
        />
        {errors.description ? <div className="lk-field__error">{errors.description}</div> : null}
      </div>

      <div className="lk-field">
        <label className="lk-field__label">
          {isPhotoRequired ? 'Фото (1–10)' : 'Фото (по желанию, до 10)'}
        </label>
        <PhotoUploader
          files={files}
          onChange={setFiles}
          maxFiles={10}
          hint="Снимите проблему с разных ракурсов. Форматы: JPG/JPEG или PNG, до 10 МБ."
        />
        {errors.files ? <div className="lk-field__error">{errors.files}</div> : null}
      </div>

      <button
        type="submit"
        className="lk-button lk-button--primary lk-button--block"
        disabled={creating}
      >
        {creating ? 'Создание...' : 'Создать заявку'}
      </button>
    </form>
  );
};

export default CustomerCreateRequest;
