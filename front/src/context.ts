import { createContext } from 'react';

import { FlexibleContextType } from './types/context';

const DataContext = createContext<FlexibleContextType>({
  context: {
    selectRowDirectory: '',
    statusList: [],
    urgencyList: [],
    dataContractors: [],
    selectedTr: '',
    directoryCategories: [],
    settingsList: [],
    UpdateTableReguest: () => {},
    UpdateForse: () => {},
  },
});

export default DataContext;
