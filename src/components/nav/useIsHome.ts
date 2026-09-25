import { useLocation } from "react-router-dom";

/** True on the home page, the only route whose sections the nav links to. */
export function useIsHome() {
  return useLocation().pathname === "/";
}

export default useIsHome;
