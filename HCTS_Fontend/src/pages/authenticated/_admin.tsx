import { checkIsAdmin } from "@/lib/admin/is-admin.functions";
import { Outlet } from "react-router-dom";

export const Route = ({
  ssr: false,
  beforeLoad: async () => {
    const { isAdmin } = await checkIsAdmin();
    if (!isAdmin) throw redirect({ to: "/dashboard" });
    return { isAdmin };
  },
  component: () => <Outlet />,
});
