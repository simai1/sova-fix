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
  // Бэкенд отдаёт статикой /uploads/<fileName>; имена приходят либо «как есть», либо с префиксом
  if (fileName.startsWith('http://') || fileName.startsWith('https://')) return fileName;
  if (fileName.startsWith('/uploads/')) return `${API_URL}${fileName}`;
  return `${API_URL}/uploads/${fileName}`;
};

const splitFileNames = (req: RequestDto): string[] => {
  if (Array.isArray(req.fileNames) && req.fileNames.length > 0) return req.fileNames;
  if (!req.fileName) return [];
  // Бэк хранит либо одну строку, либо JSON.stringify(array). Симметрично api/src/utils/normalizeData.ts.
  const raw = req.fileName.trim();
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((s: unknown) => String(s).trim()).filter(Boolean);
      }
    } catch {
      // fallthrough — отдадим как одиночное имя
    }
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

// Только дата без времени — для planCompleteDate/exitDate/completeDate.
// Время в этих полях обычно либо 00:00 (в админке выставляют дату), либо точное —
// но в карточке исполнителя время не показываем для краткости.
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

// ISO → Date для LkSingleDatePicker (rdp хранит выбранный день как Date в
// локальной TZ браузера). Берём момент 00:00 в МСК — иначе исполнитель в МСК,
// у которого `exitDate` ровно «10.05», в UTC мог бы попасть в 09.05.
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

// Date (00:00 локального дня) → 'YYYY-MM-DD' для последующей сборки ISO в МСК.
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

  // Индекс фото в lightbox: null = закрыт, число = открыт на этом фото в общем массиве [...photos, checkPhoto].
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Inline-редактирование даты выезда. Открыто — показываем календарь LK +
  // Сохранить/Отмена. Черновик хранит Date (00:00 локального дня) либо null —
  // null = «сбросить exitDate» (бэкенд принимает явный null).
  const [exitDateEditing, setExitDateEditing] = useState(false);
  const [exitDateDraft, setExitDateDraft] = useState<Date | null>(null);

  // Тянем последнюю страницу комментариев для preview. limit=1 + cursor=null
  // → бэкенд возвращает hasMore + total в смежных полях; нам достаточно
  // первого элемента и nextCursor для счётчика. Если бэкенд ещё не отдаёт
  // /comments — fallback на legacy request.comment ниже.
  const { data: commentsData } = useGetRequestCommentsQuery(
    { requestId: request.id, limit: 1 },
    { skip: !request.id },
  );

  const statusNumber = getStatusNumber(request);
  const photos = splitFileNames(request);
  const photoUrls = photos.map(buildFileUrl).filter((u): u is string => Boolean(u));
  const checkPhotoUrl = buildFileUrl(request.checkPhoto);
  // Объединённый массив для lightbox: поломка → подтверждение. Один источник навигации ←/→.
  const lightboxPhotos = checkPhotoUrl ? [...photoUrls, checkPhotoUrl] : photoUrls;

  const isMyAssignedContractor = !!me?.contractor?.id && request.contractorId === me.contractor.id;
  // Customer-режим: показываем доп. фото только автору заявки. Это исключает
  // возможность для customer'а с доступом к объекту дозагружать чужие фото к чужой заявке.
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

  // «Закреплена за мной» — для контрактора используем server-side флаг
  // isAssigned (он точнее, чем сравнение contractorId === me.contractor.id,
  // на случай нескольких UserObject и т.п.). Customer-режим этого чипа не
  // показывает — для заказчика не имеет смысла «моя закреплённая заявка».
  const showAssignedChip = mode === 'contractor' && request.isAssigned === true;
  // Редактирование exitDate — только assigned-исполнитель и не-DONE заявки.
  // На DONE/IRRELEVANT/FALSE менять дату выезда задним числом не нужно.
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
    // null → сброс exitDate; Date → ISO с 00:00 МСК (совпадёт с тем, что
    // увидит админ в своей TZ-нейтральной таблице — все exitDate привязаны к МСК).
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
    <div className="lk-card">
      <div className="lk-card__row">
        <h2 className="lk-card__title">Заявка № {request.number}</h2>
        <StatusChip statusNumber={statusNumber} />
        {showAssignedChip ? (
          <span className="lk-chip lk-chip--accent" aria-label="Заявка закреплена за вами">
            Закреплена за мной
          </span>
        ) : null}
      </div>

      <div className="lk-card__row" style={{ flexWrap: 'wrap', gap: 8 }}>
        <UrgencyChip urgency={getUrgencyObj(request)} fallbackName={getUrgencyName(request)} />
        <span className="lk-card__muted">{formatDate(request.createdAt)}</span>
      </div>

      {request.Object?.name || request.Unit?.name ? (
        <div className="lk-row">
          {request.Object?.name ? (
            <div className="lk-col-12 lk-col-ml-6">
              <div className="lk-field__label">Объект</div>
              <div>{request.Object.name}</div>
            </div>
          ) : null}

          {request.Unit?.name ? (
            <div className="lk-col-12 lk-col-ml-6">
              <div className="lk-field__label">Бизнес-юнит</div>
              <div>{request.Unit.name}</div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Блок «Параметры» — показываем поля, которые ранее были только в админ-таблице:
          Категория, Плановая дата, Дата выезда (редактируемая для assigned), Дней в работе,
          Дата выполнения (для DONE). Скрываем целиком, если все поля пустые — лишний
          заголовок без данных шумит. */}
      {request.Category?.name ||
      request.planCompleteDate ||
      request.exitDate ||
      typeof request.daysAtWork === 'number' ||
      request.completeDate ? (
        <div className="lk-row">
          {request.Category?.name ? (
            <div className="lk-col-12 lk-col-ml-6">
              <div className="lk-field__label">Категория</div>
              <div>{request.Category.name}</div>
            </div>
          ) : null}

          {request.planCompleteDate ? (
            <div className="lk-col-12 lk-col-ml-6">
              <div className="lk-field__label">Плановая дата выполнения</div>
              <div>{formatDateOnly(request.planCompleteDate)}</div>
            </div>
          ) : null}

          <div className="lk-col-12 lk-col-ml-6">
            <div className="lk-field__label">Дата выезда</div>
            {exitDateEditing ? (
              <div className="lk-exit-date-edit">
                <div className="lk-exit-date-edit__input">
                  <LkSingleDatePicker
                    value={exitDateDraft}
                    onChange={setExitDateDraft}
                    placeholder="дд.мм.гггг"
                    disabled={updateExitDateState.isLoading}
                  />
                </div>
                <div className="lk-exit-date-edit__actions">
                  <button
                    type="button"
                    className="lk-button lk-button--accent"
                    onClick={handleExitDateSave}
                    disabled={updateExitDateState.isLoading}
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    className="lk-button lk-button--ghost"
                    onClick={handleExitDateCancel}
                    disabled={updateExitDateState.isLoading}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="lk-exit-date-view">
                <span className="lk-exit-date-view__value">{formatDateOnly(request.exitDate)}</span>
                {canEditExitDate ? (
                  <button
                    type="button"
                    className="lk-button lk-button--ghost lk-exit-date-view__btn"
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
            <div className="lk-col-12 lk-col-ml-6">
              <div className="lk-field__label">Дней в работе</div>
              <div>{request.daysAtWork}</div>
            </div>
          ) : null}

          {request.completeDate ? (
            <div className="lk-col-12 lk-col-ml-6">
              <div className="lk-field__label">Дата выполнения</div>
              <div>{formatDateOnly(request.completeDate)}</div>
            </div>
          ) : null}
        </div>
      ) : null}

      {request.problemDescription ? (
        <div>
          <div className="lk-field__label">Описание</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{request.problemDescription}</div>
        </div>
      ) : null}

      {photoUrls.length > 0 || canAddPhotos ? (
        <div className="lk-card__section">
          <h3 className="lk-card__section-title">Фото поломки</h3>
          <div className="lk-photo-grid">
            {photoUrls.map((url, i) => (
              <button
                key={url}
                type="button"
                className="lk-photo-grid__item"
                onClick={() => setLightboxIndex(i)}
                aria-label={`Открыть фото ${i + 1}`}
              >
                <img src={url} alt="Фото поломки" />
              </button>
            ))}
            {canAddPhotos ? (
              <button
                type="button"
                className="lk-photo-grid__add"
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
        <div className="lk-card__section">
          <h3 className="lk-card__section-title">Фото-подтверждение</h3>
          <div className="lk-photo-grid">
            <button
              type="button"
              className="lk-photo-grid__item"
              onClick={() => setLightboxIndex(photoUrls.length)}
              aria-label="Открыть фото-подтверждение"
            >
              <img src={checkPhotoUrl} alt="Фото-подтверждение" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="lk-card__section">
        <h3 className="lk-card__section-title">Переписка</h3>
        <CommentPreview
          messages={commentsData?.items ?? []}
          legacyComment={request.comment}
          onOpenChat={() => navigate(chatPath)}
        />
      </div>

      {mode === 'contractor' && isMyAssignedContractor ? (
        <div className="lk-card__section">
          <h3 className="lk-card__section-title">Действия</h3>
          <div className="lk-actions">
            {statusNumber === STATUS_NEW ? (
              <button
                type="button"
                className="lk-button lk-button--accent lk-button--block"
                disabled={setStatusState.isLoading}
                onClick={handleTakeToWork}
              >
                Взять в работу
              </button>
            ) : null}

            <button
              type="button"
              className="lk-button lk-button--ghost lk-button--block"
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
              className="lk-button lk-button--primary lk-button--block"
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
