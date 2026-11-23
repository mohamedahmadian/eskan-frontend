import { createContext } from 'react'

/** True while rendering inside `AppModal` (for header padding under the close button). */
export const AppModalContext = createContext(false)
