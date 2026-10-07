import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllRolesAction } from "@/redux/actions/roleActions";
import type { RootState, AppDispatch } from "@/redux";

export function useRoles() {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);
  const rolesState = useSelector((state: RootState) => state.roles);
  const user = auth.userInfo;

  useEffect(() => {
    if (!user) return;
    if (rolesState.roles.length === 0 && !rolesState.isLoading) {
      dispatch(getAllRolesAction());
    }
  }, [dispatch, user, rolesState.roles.length, rolesState.isLoading]);

  return rolesState;
}
