import Header from "../components/Header";
import { SiteProviders } from "./providers";
import { CartClient } from "./cart-client";
import CartToast from "../components/CartToast";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteProviders>
      <Header />
      {children}
      <CartClient />
      <CartToast />
    </SiteProviders>
  );
}