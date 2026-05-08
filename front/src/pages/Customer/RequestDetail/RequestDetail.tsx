import { useParams } from 'react-router-dom';

import { useGetMeQuery, useGetMyRequestQuery } from '@/API/rtkQuery/lk.api';
import LkEmpty from '@/components/Lk/LkEmpty';
import LkSpinner from '@/components/Lk/LkSpinner';
import RequestCard from '@/components/Lk/RequestCard';
import { useRequestSubscription } from '@/hooks/useRequestSubscription';

const CustomerRequestDetail = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const { data: me } = useGetMeQuery();
  const { data, isLoading, isError } = useGetMyRequestQuery(id!, { skip: !id });
  useRequestSubscription(id);

  if (isLoading) return <LkSpinner />;
  if (isError || !data) return <LkEmpty text="Заявка не найдена" />;

  return <RequestCard request={data} mode="customer" me={me} />;
};

export default CustomerRequestDetail;
