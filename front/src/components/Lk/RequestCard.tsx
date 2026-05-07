import { useRef, useState } from 'react';

import StatusChip from './StatusChip';
import { showToast } from './toastBus';
import UrgencyChip from './UrgencyChip';

import {
  MeDto,
  RequestDto,
  useAddCommentMutation,
  useAddPhotosMutation,
  useSetStatusMutation,
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
  // Иногда бэк хранит несколько имён через запятую
  return req.fileName
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
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
  const [commentText, setCommentText] = useState('');
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const checkPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const [addComment, addCommentState] = useAddCommentMutation();
  const [addPhotos, addPhotosState] = useAddPhotosMutation();
  const [setStatus, setStatusState] = useSetStatusMutation();
  const [uploadCheckPhoto, uploadCheckPhotoState] = useUploadCheckPhotoMutation();

  const statusNumber = getStatusNumber(request);
  const photos = splitFileNames(request);
  const checkPhotoUrl = buildFileUrl(request.checkPhoto);

  const isMyAssignedContractor = !!me?.contractor?.id && request.contractorId === me.contractor.id;
  // Customer-режим: показываем доп. фото только автору заявки. Это исключает
  // возможность для customer'а с доступом к объекту дозагружать чужие фото к чужой заявке.
  const isMyCustomerRequest =
    mode === 'customer' && !!me?.user?.id && request.createdByUserId === me.user.id;
  const canAddPhotos = (mode === 'contractor' && isMyAssignedContractor) || isMyCustomerRequest;

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

  const handleSendComment = async (): Promise<void> => {
    const text = commentText.trim();
    if (!text) {
      showToast('error', 'Введите текст комментария');
      return;
    }
    try {
      await addComment({
        id: request.id,
        text,
        file: commentFile ?? undefined,
      }).unwrap();
      setCommentText('');
      setCommentFile(null);
      showToast('success', 'Комментарий отправлен');
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const closeDisabled = !checkPhotoUrl || statusNumber === STATUS_DONE;

  return (
    <div className="lk-card">
      <div className="lk-card__row">
        <h2 className="lk-card__title">Заявка № {request.number}</h2>
        <StatusChip statusNumber={statusNumber} />
      </div>

      <div className="lk-card__row" style={{ flexWrap: 'wrap', gap: 8 }}>
        <UrgencyChip urgency={getUrgencyObj(request)} fallbackName={getUrgencyName(request)} />
        <span className="lk-card__muted">{formatDate(request.createdAt)}</span>
      </div>

      {request.Object?.name || request.Unit?.name ? (
        <div className="lk-row">
          {request.Object?.name ? (
            <div className="lk-col-12 lk-col-md-6">
              <div className="lk-field__label">Объект</div>
              <div>{request.Object.name}</div>
            </div>
          ) : null}

          {request.Unit?.name ? (
            <div className="lk-col-12 lk-col-md-6">
              <div className="lk-field__label">Бизнес-юнит</div>
              <div>{request.Unit.name}</div>
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

      {photos.length > 0 ? (
        <div className="lk-card__section">
          <h3 className="lk-card__section-title">Фото поломки</h3>
          <div className="lk-photo-grid">
            {photos.map((name) => {
              const url = buildFileUrl(name);
              if (!url) return null;
              return (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="lk-photo-grid__item"
                >
                  <img src={url} alt="Фото поломки" />
                </a>
              );
            })}
          </div>
        </div>
      ) : null}

      {checkPhotoUrl ? (
        <div className="lk-card__section">
          <h3 className="lk-card__section-title">Фото-подтверждение</h3>
          <div className="lk-photo-grid">
            <a
              href={checkPhotoUrl}
              target="_blank"
              rel="noreferrer"
              className="lk-photo-grid__item"
            >
              <img src={checkPhotoUrl} alt="Фото-подтверждение" />
            </a>
          </div>
        </div>
      ) : null}

      {request.comment ? (
        <div className="lk-card__section">
          <h3 className="lk-card__section-title">Комментарий</h3>
          <div className="lk-comment">{request.comment}</div>
        </div>
      ) : null}

      {mode === 'contractor' && isMyAssignedContractor ? (
        <div className="lk-card__section">
          <h3 className="lk-card__section-title">Действия</h3>
          <div className="lk-actions">
            {statusNumber === STATUS_NEW ? (
              <button
                type="button"
                className="lk-button lk-button--primary lk-button--block"
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

      {canAddPhotos ? (
        <div className="lk-card__section">
          <h3 className="lk-card__section-title">Фото</h3>
          <div className="lk-actions">
            <button
              type="button"
              className="lk-button lk-button--ghost lk-button--block"
              onClick={handleAddPhotosClick}
              disabled={addPhotosState.isLoading}
            >
              Добавить фото поломки
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              style={{ display: 'none' }}
              onChange={handlePhotosPick}
            />
          </div>
        </div>
      ) : null}

      <div className="lk-card__section">
        <h3 className="lk-card__section-title">Оставить комментарий</h3>
        <div className="lk-field">
          <textarea
            className="lk-textarea"
            placeholder="Текст комментария"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </div>
        <div className="lk-field">
          <label className="lk-field__label">Файл (опционально)</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setCommentFile(e.target.files?.[0] ?? null)}
          />
          {commentFile ? <div className="lk-field__hint">{commentFile.name}</div> : null}
        </div>
        <button
          type="button"
          className="lk-button lk-button--primary lk-button--block"
          disabled={addCommentState.isLoading}
          onClick={handleSendComment}
        >
          Отправить
        </button>
      </div>
    </div>
  );
};

export default RequestCard;
