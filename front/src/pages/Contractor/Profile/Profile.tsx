import { useGetMeQuery, useGetMyObjectsQuery } from '@/API/rtkQuery/lk.api';
import LkEmpty from '@/components/Lk/LkEmpty';
import LkErrorBanner from '@/components/Lk/LkErrorBanner';
import LkSpinner from '@/components/Lk/LkSpinner';
import ProfilePushSection from '@/components/Lk/ProfilePushSection';
import ProfileTelegramSection from '@/components/Lk/ProfileTelegramSection';
import { ROLE_LABELS_BY_NAME } from '@/constants/roles.constant';

const ContractorProfile = (): JSX.Element => {
  const { data: me, isLoading, isError } = useGetMeQuery();
  const { data: myObjects = [] } = useGetMyObjectsQuery();

  if (isLoading) return <LkSpinner />;
  if (isError || !me) return <LkErrorBanner text="Не удалось загрузить профиль" />;

  return (
    <>
      <div className="ui-card">
        <div className="ui-row">
          <div className="ui-col-12 ui-col-ml-6">
            <div className="ui-field__label">Имя</div>
            <div>{me.user.name ?? '—'}</div>
          </div>
          <div className="ui-col-12 ui-col-ml-6">
            <div className="ui-field__label">Email / логин</div>
            <div>{me.user.login}</div>
          </div>
        </div>
        <div className="ui-field__label">Роль</div>
        <div>{ROLE_LABELS_BY_NAME[me.user.role]}</div>
      </div>

      <ProfileTelegramSection telegram={me.telegram ?? null} />

      <ProfilePushSection />

      <div className="ui-card">
        <h2 className="ui-card__title">Мои объекты</h2>
        {myObjects.length === 0 ? (
          <LkEmpty
            title="Нет назначенных объектов"
            text="Менеджер свяжется с вами для назначения."
          />
        ) : (
          myObjects.map((o) => (
            <div key={o.id} className="ui-card__row">
              <span>{o.name}</span>
              {o.unit?.name ? <span className="ui-card__muted">{o.unit.name}</span> : null}
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default ContractorProfile;
