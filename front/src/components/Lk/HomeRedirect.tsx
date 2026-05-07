import { Navigate } from 'react-router-dom';

import { getUserRole } from '@/utils/auth';

type Props = {
  children: JSX.Element;
};

const HomeRedirect = ({ children }: Props): JSX.Element => {
  const role = getUserRole();
  if (role === 'CONTRACTOR') return <Navigate to="/contractor/requests" replace />;
  if (role === 'CUSTOMER') return <Navigate to="/customer/requests" replace />;
  return children;
};

export default HomeRedirect;
