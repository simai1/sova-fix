import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import CommentPreview from './CommentPreview';
import LkPhotoLightbox from './LkPhotoLightbox';
import LkSingleDatePicker from './LkSingleDatePicker';
import StatusChip from './StatusChip';
import { showToast } from './toastBus';
import UrgencyChip from './UrgencyChip';

import {
  MeDto,
  RequestDto,
  useAddPhotosMutation,
  useGetRequestCommentsQuery,
  useSetStatusMutation,
  useUpdateExitDateMutation,
  useUploadCheckPhotoMutation,
} from '@/API/rtkQuery/lk.api';
import { API_URL } from '@/constants/env.constant';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { MAX_UPLOAD_BYTES, formatBytesMB } from '@/utils/uploadLimits';

type Mode = 'contractor' | 'customer';

type Props = {
  request: RequestDto;
  mode: Mode;
  me?: MeDto;
};

const STATUS_NEW = 1;
const STATUS_IN_PROGRESS = 2;
const STATUS_DONE = 3;

const buildFileUrl = (fileName: string | null | undefined): string | null => {
  if (!fileName) return null;
  if (fileName.startsWith('http://') || fileName.startsWith('https://')) return fileName;
  if (fileName.startsWith('/uploads/')) return `${API_URL}${fileName}`;
  return `${API_URL}/uploads/${fileName}`;
};

const splitFileNames = (req: RequestDto): string[] => {
  if (Array.isArray(req.fileNames) && req.fileNames.length > 0) return req.fileNames;
  if (!req.fileName) return [];
  const raw = req.fileName.trim();
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((s: unknown) => String(s).trim()).filter(Boolean);
      }
    } catch {}
  }
  return [raw];
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const formatDateOnly = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const toDateValue = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const ymd = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
    return new Date(`${ymd}T00:00:00`);
  } catch {
    return null;
  }
};

const toYmd = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getStatusNumber = (req: RequestDto): number | null => {
  if (typeof req.status === 'number') return req.status;
  if (req.status && typeof req.status === 'object') return req.status.number ?? null;
  return req.Status?.number ?? null;
};

const getUrgencyObj = (req: RequestDto) => {
  if (req.Urgency) return req.Urgency;
  if (req.urgency && typeof req.urgency === 'object') return req.urgency;
  return null;
};

const getUrgencyName = (req: RequestDto): string | null => {
  if (typeof req.urgency === 'string') return req.urgency;
  return req.Urgency?.name ?? null;
};

const RequestCard = ({ request, mode, me }: Props): JSX.Element => {
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const checkPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const [addPhotos, addPhotosState] = useAddPhotosMutation();
  const [setStatus, setStatusState] = useSetStatusMutation();
  const [uploadCheckPhoto, uploadCheckPhotoState] = useUploadCheckPhotoMutation();
  const [updateExitDate, updateExitDateState] = useUpdateExitDateMutation();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [exitDateEditing, setExitDateEditing] = useState(false);
  const [exitDateDraft, setExitDateDraft] = useState<Date | null>(null);

  const { data: commentsData } = useGetRequestCommentsQuery(
    { requestId: request.id, limit: 1 },
    { skip: !request.id },
  );

  const statusNumber = getStatusNumber(request);
  const photos = splitFileNames(request);
  const photoUrls = photos.map(buildFileUrl).filter((u): u is string => Boolean(u));
  const checkPhotoUrl = buildFileUrl(request.checkPhoto);
  const lightboxPhotos = checkPhotoUrl ? [...photoUrls, checkPhotoUrl] : photoUrls;

  const isMyAssignedContractor = !!me?.contractor?.id && request.contractorId === me.contractor.id;
  const isMyCustomerRequest =
    mode === 'customer' && !!me?.user?.id && request.createdByUserId === me.user.id;
  const canAddPhotos = (mode === 'contractor' && isMyAssignedContractor) || isMyCustomerRequest;

  const chatPath =
    mode === 'contractor'
      ? `/contractor/requests/${request.id}/chat`
      : `/customer/requests/${request.id}/chat`;

  const handleAddPhotosClick = (): void => photoInputRef.current?.click();

  const handlePhotosPick = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    e.target.value = '';
    const oversized = files.filter((f) => f.size > MAX_UPLOAD_BYTES);
    const [firstOversized] = oversized;
    if (firstOversized) {
      const limit = formatBytesMB(MAX_UPLOAD_BYTES);
      const message =
        oversized.length === 1
          ? `«${firstOversized.name}» больше ${limit}. Уменьшите фото и попробуйте снова.`
          : `Пропущено ${oversized.length} файлов больше ${limit}. Уменьшите фото и попробуйте снова.`;
      showToast('error', message);
      return;
    }
    try {
      await addPhotos({ id: request.id, files }).unwrap();
      showToast('success', 'Фото добавлены');
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const handleCheckPhotoClick = (): void => checkPhotoInputRef.current?.click();

  const handleCheckPhotoPick = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      showToast(
        'error',
        `«${file.name}» больше ${formatBytesMB(MAX_UPLOAD_BYTES)}. Уменьшите фото и попробуйте снова.`,
      );
      return;
    }
    try {
      await uploadCheckPhoto({ id: request.id, file }).unwrap();
      showToast('success', 'Фото-подтверждение загружено');
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const handleTakeToWork = async (): Promise<void> => {
    try {
      await setStatus({ id: request.id, statusNumber: STATUS_IN_PROGRESS }).unwrap();
      showToast('success', 'Заявка взята в работу');
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const handleClose = async (): Promise<void> => {
    if (!window.confirm('Закрыть заявку как выполненную?')) return;
    try {
      await setStatus({ id: request.id, statusNumber: STATUS_DONE }).unwrap();
      showToast('success', 'Заявка закрыта');
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const closeDisabled = !checkPhotoUrl || statusNumber === STATUS_DONE;

  const showAssignedChip = mode === 'contractor' && request.isAssigned === true;
  const canEditExitDate =
    mode === 'contractor' && isMyAssignedContractor && statusNumber !== STATUS_DONE;

  const handleExitDateEdit = (): void => {
    setExitDateDraft(toDateValue(request.exitDate));
    setExitDateEditing(true);
  };

  const handleExitDateCancel = (): void => {
    setExitDateEditing(false);
    setExitDateDraft(null);
  };

  const handleExitDateSave = async (): Promise<void> => {
    let iso: string | null = null;
    if (exitDateDraft) {
      const local = new Date(`${toYmd(exitDateDraft)}T00:00:00+03:00`);
      if (Number.isNaN(local.getTime())) {
        showToast('error', 'Некорректная дата');
        return;
      }
      iso = local.toISOString();
    }
    try {
      await updateExitDate({ id: request.id, exitDate: iso }).unwrap();
      showToast('success', iso ? 'Дата выезда сохранена' : 'Дата выезда сброшена');
      setExitDateEditing(false);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  return (
    <div className="ui-card">
      <div className="ui-card__row">
        <h2 className="ui-card__title">Заявка № {request.number}</h2>
        <StatusChip statusNumber={statusNumber} />
        {showAssignedChip ? (
          <span className="ui-chip ui-chip--accent" aria-label="Заявка закреплена за вами">
            Закреплена за мной
          </span>
        ) : null}
      </div>

      <div className="ui-card__row" style={{ flexWrap: 'wrap', gap: 8 }}>
        <UrgencyChip urgency={getUrgencyObj(request)} fallbackName={getUrgencyName(request)} />
        <span className="ui-card__muted">{formatDate(request.createdAt)}</span>
      </div>

      {request.Object?.name || request.Unit?.name ? (
        <div className="ui-row">
          {request.Object?.name ? (
            <div className="ui-col-12 ui-col-ml-6">
              <div className="ui-field__label">Объект</div>
              <div>{request.Object.name}</div>
            </div>
          ) : null}

          {request.Unit?.name ? (
            <div className="ui-col-12 ui-col-ml-6">
              <div className="ui-field__label">Бизнес-юнит</div>
              <div>{request.Unit.name}</div>
            </div>
          ) : null}
        </div>
      ) : null}

      {request.Category?.name ||
      request.planCompleteDate ||
      request.exitDate ||
      typeof request.daysAtWork === 'number' ||
      request.completeDate ? (
        <div className="ui-row">
          {request.Category?.name ? (
            <div className="ui-col-12 ui-col-ml-6">
              <div className="ui-field__label">Категория</div>
              <div>{request.Category.name}</div>
            </div>
          ) : null}

          {request.planCompleteDate ? (
            <div className="ui-col-12 ui-col-ml-6">
              <div className="ui-field__label">Плановая дата выполнения</div>
              <div>{formatDateOnly(request.planCompleteDate)}</div>
            </div>
          ) : null}

          <div className="ui-col-12 ui-col-ml-6">
            <div className="ui-field__label">Дата выезда</div>
            {exitDateEditing ? (
              <div className="ui-exit-date-edit">
                <div className="ui-exit-date-edit__input">
                  <LkSingleDatePicker
                    value={exitDateDraft}
                    onChange={setExitDateDraft}
                    placeholder="дд.мм.гггг"
                    disabled={updateExitDateState.isLoading}
                  />
                </div>
                <div className="ui-exit-date-edit__actions">
                  <button
                    type="button"
                    className="ui-button ui-button--accent"
                    onClick={handleExitDateSave}
                    disabled={updateExitDateState.isLoading}
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    className="ui-button ui-button--ghost"
                    onClick={handleExitDateCancel}
                    disabled={updateExitDateState.isLoading}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="ui-exit-date-view">
                <span className="ui-exit-date-view__value">{formatDateOnly(request.exitDate)}</span>
                {canEditExitDate ? (
                  <button
                    type="button"
                    className="ui-button ui-button--ghost ui-exit-date-view__btn"
                    onClick={handleExitDateEdit}
                    aria-label="Изменить дату выезда"
                  >
                    {request.exitDate ? 'Изменить' : 'Указать'}
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {typeof request.daysAtWork === 'number' && request.daysAtWork > 0 ? (
            <div className="ui-col-12 ui-col-ml-6">
              <div className="ui-field__label">Дней в работе</div>
              <div>{request.daysAtWork}</div>
            </div>
          ) : null}

          {request.completeDate ? (
            <div className="ui-col-12 ui-col-ml-6">
              <div className="ui-field__label">Дата выполнения</div>
              <div>{formatDateOnly(request.completeDate)}</div>
            </div>
          ) : null}
        </div>
      ) : null}

      {request.problemDescription ? (
        <div>
          <div className="ui-field__label">Описание</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{request.problemDescription}</div>
        </div>
      ) : null}

      {photoUrls.length > 0 || canAddPhotos ? (
        <div className="ui-card__section">
          <h3 className="ui-card__section-title">Фото поломки</h3>
          <div className="ui-photo-grid">
            {photoUrls.map((url, i) => (
              <button
                key={url}
                type="button"
                className="ui-photo-grid__item"
                onClick={() => setLightboxIndex(i)}
                aria-label={`Открыть фото ${i + 1}`}
              >
                <img src={url} alt="Фото поломки" />
              </button>
            ))}
            {canAddPhotos ? (
              <button
                type="button"
                className="ui-photo-grid__add"
                onClick={handleAddPhotosClick}
                disabled={addPhotosState.isLoading}
                aria-label="Добавить фото"
              >
                <span aria-hidden="true">+</span>
                <span>Добавить фото</span>
              </button>
            ) : null}
          </div>
          {canAddPhotos ? (
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              style={{ display: 'none' }}
              onChange={handlePhotosPick}
            />
          ) : null}
        </div>
      ) : null}

      {checkPhotoUrl ? (
        <div className="ui-card__section">
          <h3 className="ui-card__section-title">Фото-подтверждение</h3>
          <div className="ui-photo-grid">
            <button
              type="button"
              className="ui-photo-grid__item"
              onClick={() => setLightboxIndex(photoUrls.length)}
              aria-label="Открыть фото-подтверждение"
            >
              <img src={checkPhotoUrl} alt="Фото-подтверждение" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="ui-card__section">
        <h3 className="ui-card__section-title">Переписка</h3>
        <CommentPreview
          messages={commentsData?.items ?? []}
          legacyComment={request.comment}
          onOpenChat={() => navigate(chatPath)}
        />
      </div>

      {mode === 'contractor' && isMyAssignedContractor ? (
        <div className="ui-card__section">
          <h3 className="ui-card__section-title">Действия</h3>
          <div className="ui-actions">
            {statusNumber === STATUS_NEW ? (
              <button
                type="button"
                className="ui-button ui-button--accent ui-button--block"
                disabled={setStatusState.isLoading}
                onClick={handleTakeToWork}
              >
                Взять в работу
              </button>
            ) : null}

            <button
              type="button"
              className="ui-button ui-button--ghost ui-button--block"
              onClick={handleCheckPhotoClick}
              disabled={uploadCheckPhotoState.isLoading}
            >
              {checkPhotoUrl ? 'Заменить фото-подтверждение' : 'Загрузить фото-подтверждение'}
            </button>
            <input
              ref={checkPhotoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleCheckPhotoPick}
            />
            <button
              type="button"
              className="ui-button ui-button--primary ui-button--block"
              disabled={closeDisabled || setStatusState.isLoading}
              title={
                closeDisabled && !checkPhotoUrl ? 'Сначала загрузите фото-подтверждение' : undefined
              }
              onClick={handleClose}
            >
              Закрыть заявку
            </button>
          </div>
        </div>
      ) : null}

      {lightboxIndex !== null && lightboxPhotos.length > 0 ? (
        <LkPhotoLightbox
          photos={lightboxPhotos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      ) : null}
    </div>
  );
};

export default RequestCard;
