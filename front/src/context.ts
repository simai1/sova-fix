import React from "react";

interface BaseContextType {
  selectRowDirectory: string;
}
type FlexibleContextType = BaseContextType & Record<string, any>;

const DataContext = React.createContext<FlexibleContextType>({
  selectRowDirectory: "",
});

export default DataContext;