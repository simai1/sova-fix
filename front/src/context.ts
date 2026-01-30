import { createContext } from 'react';

import { FlexibleContextType } from './types/context';

const DataContext = createContext<FlexibleContextType>({
  context: {
    selectRowDirectory: '',
    statusList: [],
    urgencyList: [],
    dataContractors: [],
    selectedTr: '',
    UpdateTableReguest: () => {},
  },
});

export default DataContext;
