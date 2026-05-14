import { Modal } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import styles from './UserObjectsAssign.module.scss';

import {
  useGetAllObjectsQuery,
  useGetUserObjectsQuery,
  useSetUserObjectsMutation,
  type UserObjectsObject,
} from '@/API/rtkQuery/userObjects.api';
import { showToast } from '@/components/Lk/toastBus';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = {
  open: boolean;
  userId: string | null;
  userName?: string | null;
  onClose: () => void;
};

type OptionGroup = {
  key: string;
  label: string;
  options: { label: string; value: string; meta?: string }[];
};

const UserObjectsAssign = ({ open, userId, userName, onClose }: Props): JSX.Element => {
  // Контроллер `/objects` требует `?userId=<id>` — без него возвращает []. Берём id
  // текущего админа из sessionStorage: для роли ADMIN контроллер отдаёт все объекты.
  const adminUserId: string | undefined = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('userData') ?? '{}')?.user?.id;
    } catch {
      return undefined;
    }
  })();

  const { data: allObjects = [], isLoading: objLoading } = useGetAllObjectsQuery(
    adminUserId ?? '',
    {
      skip: !open || !adminUserId,
    },
  );
  const { data: userObjects, isLoading: prefillLoading } = useGetUserObjectsQuery(userId ?? '', {
    skip: !open || !userId,
  });
  const [setUserObjects, { isLoading: saving }] = useSetUserObjectsMutation();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open && userObjects) {
      setSelected(new Set(userObjects));
    }
    if (!open) {
      setSelected(new Set());
      setQuery('');
    }
  }, [open, userObjects]);

  const grouped = useMemo<OptionGroup[]>(() => {
    const map = new Map<string, OptionGroup>();
    allObjects.forEach((o: UserObjectsObject) => {
      const key = o.unit?.id ?? '__nounit';
      const label = o.unit?.name ?? 'Без бизнес-юнита';
      if (!map.has(key)) map.set(key, { key, label, options: [] });
      map.get(key)!.options.push({
        label: o.name,
        value: o.id,
        meta: o.city ?? undefined,
      });
    });
    // Сортировка: «Без бизнес-юнита» — в самый низ, остальное — по алфавиту.
    return Array.from(map.values()).sort((a, b) => {
      if (a.key === '__nounit') return 1;
      if (b.key === '__nounit') return -1;
      return a.label.localeCompare(b.label, 'ru');
    });
  }, [allObjects]);

  const filteredGroups = useMemo<OptionGroup[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return grouped;
    return grouped
      .map((g) => ({
        ...g,
        options: g.options.filter(
          (opt) =>
            opt.label.toLowerCase().includes(q) || (opt.meta ?? '').toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.options.length > 0);
  }, [grouped, query]);

  const totalCount = allObjects.length;
  const visibleCount = useMemo(
    () => filteredGroups.reduce((acc, g) => acc + g.options.length, 0),
    [filteredGroups],
  );
  const selectedCount = selected.size;

  const visibleIds = useMemo(
    () => filteredGroups.flatMap((g) => g.options.map((o) => o.value)),
    [filteredGroups],
  );
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggleOne = (id: string): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = (): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const resetAll = (): void => setSelected(new Set());

  const handleSave = async (): Promise<void> => {
    if (!userId) return;
    try {
      await setUserObjects({ userId, objectIds: Array.from(selected) }).unwrap();
      showToast('success', 'Объекты назначены');
      onClose();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const isLoading = objLoading || prefillLoading;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      destroyOnClose
      centered
      width={720}
      maskClosable={!saving}
      className={styles.modal}
    >
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <span className={styles.label}>Назначение объектов</span>
            <h2 className={styles.title}>{userName || 'Пользователь'}</h2>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Закрыть"
            disabled={saving}
          >
            ×
          </button>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.search}>
            <span className={styles.searchIcon} aria-hidden>
              ⌕
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию или городу"
              aria-label="Поиск объектов"
            />
            {query && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => setQuery('')}
                aria-label="Очистить поиск"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="button"
            className={styles.selectAll}
            onClick={toggleAllVisible}
            disabled={visibleIds.length === 0}
          >
            {allVisibleSelected ? 'Снять выделение' : 'Выбрать все'}
          </button>
        </div>

        <div className={styles.counterBar}>
          <span>
            Выбрано <span className={styles.counterStrong}>{selectedCount}</span> из{' '}
            <span className={styles.counterStrong}>{totalCount}</span>
            {query && (
              <>
                {' '}
                · показано <span className={styles.counterStrong}>{visibleCount}</span>
              </>
            )}
          </span>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={resetAll}
            disabled={selectedCount === 0}
          >
            Сбросить
          </button>
        </div>

        <div className={styles.listWrap}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <span className={styles.spinner} aria-hidden />
              <span>Загрузка объектов…</span>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon} aria-hidden>
                ∅
              </span>
              <span>
                {query
                  ? 'Ничего не найдено — попробуйте другой запрос'
                  : 'Объекты пока не добавлены'}
              </span>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <section key={group.key} className={styles.group}>
                <div className={styles.groupHeader}>
                  <span className={styles.groupLabel}>{group.label}</span>
                  <span className={styles.groupCount}>{group.options.length}</span>
                </div>
                {group.options.map((opt) => {
                  const checked = selected.has(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`${styles.row} ${checked ? styles.rowSelected : ''}`}
                    >
                      <span className={styles.checkbox} aria-hidden>
                        <span className={styles.checkmark}>✓</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(opt.value)}
                        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                      />
                      <span className={styles.rowText}>
                        <span className={styles.rowName}>{opt.label}</span>
                        {opt.meta && <span className={styles.rowMeta}>{opt.meta}</span>}
                      </span>
                    </label>
                  );
                })}
              </section>
            ))
          )}
        </div>

        <footer className={styles.footer}>
          <span className={styles.footerHint}>Изменения применятся после сохранения</span>
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={onClose}
              disabled={saving}
            >
              Отмена
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleSave}
              disabled={saving || isLoading}
            >
              {saving && <span className={styles.spinner} aria-hidden />}
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </footer>
      </div>
    </Modal>
  );
};

export default UserObjectsAssign;
