/// <reference types="vite/client" />

import type * as React from 'react';

// В @types/react 19 JSX перестал быть глобальным namespace по умолчанию,
// а в кодовой базе JSX используется и как namespace (`JSX.Element`,
// `JSX.IntrinsicElements`), и как имплицитный возвращаемый тип TSX-компонентов.
// Реэкспортируем React.JSX как глобальный JSX, чтобы tsc проходил без массовой
// правки сигнатур компонентов.
declare global {
  namespace JSX {
    type Element = React.JSX.Element;
    type ElementClass = React.JSX.ElementClass;
    type ElementAttributesProperty = React.JSX.ElementAttributesProperty;
    type ElementChildrenAttribute = React.JSX.ElementChildrenAttribute;
    type LibraryManagedAttributes<C, P> = React.JSX.LibraryManagedAttributes<C, P>;
    type IntrinsicAttributes = React.JSX.IntrinsicAttributes;
    type IntrinsicClassAttributes<T> = React.JSX.IntrinsicClassAttributes<T>;
    type IntrinsicElements = React.JSX.IntrinsicElements;
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WEB_URL: string;
  readonly VITE_OBJECTS_LIMIT: number | null;
  readonly VITE_UNITS_LIMIT: number | null;
  readonly VITE_PICTURE_NAME: string;
  readonly VITE_GLOBAL_OPEN_TO_BLOCK: string;
  readonly VITE_GLOBAL_OPEN_REPORT_BLOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
